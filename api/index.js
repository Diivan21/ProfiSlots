// api/index.js - ProfiSlots Backend API
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Datenbankverbindung (PostgreSQL/Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper Functions
const authenticateToken = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    throw new Error('Access Token erforderlich');
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'profi_slots_secret');
    return user.id;
  } catch (err) {
    throw new Error('Ungültiger Token');
  }
};

// CORS Headers
const setCORSHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Standard-Daten erstellen
async function createDefaultData(userId) {
  try {
    // Standard Services
    const defaultServices = [
      { name: 'Haarschnitt', duration: 60, price: 45.00, icon: 'Scissors' },
      { name: 'Färbung', duration: 120, price: 80.00, icon: 'Scissors' },
      { name: 'Massage (60 Min)', duration: 60, price: 65.00, icon: 'Heart' },
      { name: 'Beratung', duration: 30, price: 35.00, icon: 'MessageSquare' }
    ];
    
    for (let service of defaultServices) {
      await pool.query(
        'INSERT INTO services (user_id, name, duration, price, icon) VALUES ($1, $2, $3, $4, $5)',
        [userId, service.name, service.duration, service.price, service.icon]
      );
    }
    
    // Standard Mitarbeiter
    await pool.query(
      'INSERT INTO staff (user_id, name, specialty, email, phone) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'Standard Mitarbeiter', 'Allgemein', '', '']
    );
    
    console.log(`Default data created for user ${userId}`);
  } catch (error) {
    console.error('Error creating default data:', error);
  }
}

// Main Handler
module.exports = async (req, res) => {
  setCORSHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  const path = url.replace('/api', '') || '/';

  console.log(`${method} ${path}`);

  try {
    // Health Check (öffentlich)
    if (path === '/health' && method === 'GET') {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
      return;
    }

    // API Info (öffentlich)
    if (path === '/' && method === 'GET') {
      res.json({ 
        message: 'ProfiSlots API v1.0',
        status: 'online',
        endpoints: [
          'POST /register - Account erstellen',
          'POST /login - Anmelden',
          'GET /health - Systemstatus'
        ]
      });
      return;
    }

    // Registrierung (öffentlich)
    if (path === '/register' && method === 'POST') {
      const { email, password, salonName } = req.body;
      
      if (!email || !password || !salonName) {
        res.status(400).json({ error: 'E-Mail, Passwort und Salon-Name sind erforderlich' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen haben' });
        return;
      }
      
      // Prüfen ob E-Mail bereits existiert
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existingUser.rows.length > 0) {
        res.status(400).json({ error: 'Diese E-Mail ist bereits registriert' });
        return;
      }
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const result = await pool.query(
        'INSERT INTO users (email, password, salon_name) VALUES ($1, $2, $3) RETURNING id, email, salon_name',
        [email.toLowerCase(), hashedPassword, salonName]
      );
      
      const newUser = result.rows[0];
      
      // Standard-Daten erstellen
      await createDefaultData(newUser.id);
      
      console.log(`New user registered: ${newUser.email}`);
      
      res.status(201).json({ 
        message: 'Account erfolgreich erstellt! Sie können sich jetzt anmelden.',
        user: {
          id: newUser.id,
          email: newUser.email,
          salonName: newUser.salon_name
        }
      });
      return;
    }

    // Login (öffentlich)
    if (path === '/login' && method === 'POST') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' });
        return;
      }
      
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      
      if (result.rows.length === 0) {
        res.status(401).json({ error: 'E-Mail oder Passwort ist falsch' });
        return;
      }
      
      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        res.status(401).json({ error: 'E-Mail oder Passwort ist falsch' });
        return;
      }
      
      const token = jwt.sign(
        { id: user.id, email: user.email }, 
        process.env.JWT_SECRET || 'profi_slots_secret', 
        { expiresIn: '7d' }
      );
      
      console.log(`User logged in: ${user.email}`);
      
      res.json({ 
        message: 'Erfolgreich angemeldet',
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          salonName: user.salon_name 
        }
      });
      return;
    }

    // Ab hier: Authentifizierte Routen
    const userId = authenticateToken(req);

    // Services
    if (path === '/services' && method === 'GET') {
      const result = await pool.query('SELECT * FROM services WHERE user_id = $1 ORDER BY created_at', [userId]);
      res.json(result.rows);
      return;
    }

    if (path === '/services' && method === 'POST') {
      const { name, duration, price, icon } = req.body;
      
      if (!name || !duration || !price) {
        res.status(400).json({ error: 'Name, Dauer und Preis sind erforderlich' });
        return;
      }
      
      const result = await pool.query(
        'INSERT INTO services (user_id, name, duration, price, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, name, parseInt(duration), parseFloat(price), icon || 'Scissors']
      );
      res.status(201).json(result.rows[0]);
      return;
    }

    // Staff (Mitarbeiter)
    if (path === '/staff' && method === 'GET') {
      const result = await pool.query('SELECT * FROM staff WHERE user_id = $1 ORDER BY created_at', [userId]);
      res.json(result.rows);
      return;
    }

    if (path === '/staff' && method === 'POST') {
      const { name, specialty, email, phone } = req.body;
      
      if (!name) {
        res.status(400).json({ error: 'Name ist erforderlich' });
        return;
      }
      
      const result = await pool.query(
        'INSERT INTO staff (user_id, name, specialty, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, name, specialty || '', email || '', phone || '']
      );
      res.status(201).json(result.rows[0]);
      return;
    }

    // Customers (Kunden)
    if (path === '/customers' && method === 'GET') {
      const result = await pool.query('SELECT * FROM customers WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      res.json(result.rows);
      return;
    }

    if (path === '/customers' && method === 'POST') {
      const { name, phone, email } = req.body;
      
      if (!name || !phone) {
        res.status(400).json({ error: 'Name und Telefon sind erforderlich' });
        return;
      }
      
      const result = await pool.query(
        'INSERT INTO customers (user_id, name, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, name, phone, email || '']
      );
      res.status(201).json(result.rows[0]);
      return;
    }

    // Appointments (Termine)
    if (path === '/appointments' && method === 'GET') {
      const result = await pool.query(`
        SELECT a.*, 
               c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
               s.name as staff_name, 
               sv.name as service_name, sv.price as service_price, sv.duration as service_duration
        FROM appointments a
        JOIN customers c ON a.customer_id = c.id
        JOIN staff s ON a.staff_id = s.id  
        JOIN services sv ON a.service_id = sv.id
        WHERE a.user_id = $1
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `, [userId]);
      res.json(result.rows);
      return;
    }

    if (path === '/appointments' && method === 'POST') {
      const { customerId, staffId, serviceId, date, time } = req.body;
      
      if (!customerId || !staffId || !serviceId || !date || !time) {
        res.status(400).json({ error: 'Alle Felder sind erforderlich' });
        return;
      }
      
      // Verfügbarkeit prüfen
      const existing = await pool.query(
        'SELECT id FROM appointments WHERE staff_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status != $4',
        [staffId, date, time, 'cancelled']
      );
      
      if (existing.rows.length > 0) {
        res.status(400).json({ error: 'Dieser Zeitslot ist bereits belegt' });
        return;
      }
      
      const result = await pool.query(
        'INSERT INTO appointments (user_id, customer_id, staff_id, service_id, appointment_date, appointment_time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [userId, customerId, staffId, serviceId, date, time]
      );
      
      // Kundenstatistik aktualisieren
      await pool.query(
        'UPDATE customers SET total_visits = total_visits + 1, last_visit = $1 WHERE id = $2',
        [date, customerId]
      );
      
      res.status(201).json({ 
        id: result.rows[0].id, 
        message: 'Termin erfolgreich gebucht',
        appointment: result.rows[0]
      });
      return;
    }

    // Dashboard Stats
    if (path === '/dashboard' && method === 'GET') {
      const today = new Date().toISOString().split('T')[0];
      
      const [appointments, customers, services] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM appointments WHERE user_id = $1 AND appointment_date = $2 AND status != $3', [userId, today, 'cancelled']),
        pool.query('SELECT COUNT(*) as count FROM customers WHERE user_id = $1', [userId]),
        pool.query('SELECT COUNT(*) as count FROM services WHERE user_id = $1', [userId])
      ]);
      
      res.json({
        todayAppointments: parseInt(appointments.rows[0].count),
        totalCustomers: parseInt(customers.rows[0].count),
        totalServices: parseInt(services.rows[0].count)
      });
      return;
    }

    // 404 für unbekannte Routen
    res.status(404).json({ 
      error: 'Endpoint nicht gefunden',
      path: path,
      method: method,
      message: 'Verfügbare Endpoints: /health, /register, /login'
    });

  } catch (error) {
    console.error('API Error:', error);
    
    res.status(500).json({ 
      error: 'Serverfehler',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
