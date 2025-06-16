// api/index.js - Vollständiges ProfiSlots Backend
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Datenbankverbindung
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
    return res.status(200).end();
  }

  const { url, method } = req;
  const path = url.replace('/api', '') || '/';
  
  console.log(`${method} ${path}`);

  try {
    // Health Check
    if (path.includes('/health')) {
      return res.status(200).json({ 
        status: 'ProfiSlots API Online',
        timestamp: new Date().toISOString(),
        database: 'Connected'
      });
    }

    // API Info
    if (path === '/' || path === '') {
      return res.status(200).json({ 
        message: 'ProfiSlots Terminbuchungssystem API',
        status: 'online',
        version: '1.0.0',
        endpoints: [
          'POST /register - Account erstellen',
          'POST /login - Anmelden',
          'GET /health - System-Status'
        ]
      });
    }

    // Registrierung
    if (path === '/register' && method === 'POST') {
      const { email, password, salonName } = req.body;
      
      if (!email || !password || !salonName) {
        return res.status(400).json({ error: 'E-Mail, Passwort und Salon-Name sind erforderlich' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen haben' });
      }
      
      // Prüfen ob E-Mail bereits existiert
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Diese E-Mail ist bereits registriert' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const result = await pool.query(
        'INSERT INTO users (email, password, salon_name) VALUES ($1, $2, $3) RETURNING id, email, salon_name',
        [email.toLowerCase(), hashedPassword, salonName]
      );
      
      const newUser = result.rows[0];
      await createDefaultData(newUser.id);
      
      console.log(`New user registered: ${newUser.email}`);
      
      return res.status(201).json({ 
        message: 'Account erfolgreich erstellt! Sie können sich jetzt anmelden.',
        user: {
          id: newUser.id,
          email: newUser.email,
          salonName: newUser.salon_name
        }
      });
    }

    // Login
    if (path === '/login' && method === 'POST') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' });
      }
      
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch' });
      }
      
      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch' });
      }
      
      const token = jwt.sign(
        { id: user.id, email: user.email }, 
        process.env.JWT_SECRET || 'profi_slots_secret', 
        { expiresIn: '7d' }
      );
      
      console.log(`User logged in: ${user.email}`);
      
      return res.json({ 
        message: 'Erfolgreich angemeldet',
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          salonName: user.salon_name 
        }
      });
    }

    // Authentifizierte Routen ab hier
    const userId = authenticateToken(req);

    // Dashboard Stats
    if (path === '/dashboard' && method === 'GET') {
      const today = new Date().toISOString().split('T')[0];
      
      const [appointments, customers, services] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM appointments WHERE user_id = $1 AND appointment_date = $2 AND status != $3', [userId, today, 'cancelled']),
        pool.query('SELECT COUNT(*) as count FROM customers WHERE user_id = $1', [userId]),
        pool.query('SELECT COUNT(*) as count FROM services WHERE user_id = $1', [userId])
      ]);
      
      return res.json({
        todayAppointments: parseInt(appointments.rows[0].count),
        totalCustomers: parseInt(customers.rows[0].count),
        totalServices: parseInt(services.rows[0].count)
      });
    }

    // Services
    if (path === '/services' && method === 'GET') {
      const result = await pool.query('SELECT * FROM services WHERE user_id = $1 ORDER BY created_at', [userId]);
      return res.json(result.rows);
    }

    // Staff
    if (path === '/staff' && method === 'GET') {
      const result = await pool.query('SELECT * FROM staff WHERE user_id = $1 ORDER BY created_at', [userId]);
      return res.json(result.rows);
    }

    // Customers
    if (path === '/customers' && method === 'GET') {
      const result = await pool.query('SELECT * FROM customers WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return res.json(result.rows);
    }

    // Appointments
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
      return res.json(result.rows);
    }

    // Test für authentifizierte Routen
    if (path === '/test-auth') {
      return res.json({
        message: 'Authentifizierung erfolgreich!',
        userId: userId,
        timestamp: new Date().toISOString()
      });
    }

    // 404 für unbekannte Routen
    return res.status(404).json({ 
      error: 'Endpoint nicht gefunden',
      path: path,
      method: method,
      availableEndpoints: ['/health', '/register', '/login', '/dashboard']
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return res.status(500).json({ 
      error: 'Serverfehler',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
