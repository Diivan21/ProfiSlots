// api/index.js - Vollständiges ProfiSlots Backend mit allen CRUD-Operationen
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Datenbankverbindung
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// =============================================================================
// Helper Functions
// =============================================================================
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

const setCORSHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Parse request body for Vercel serverless functions
const parseBody = (req) => {
  return new Promise((resolve) => {
    if (req.body) {
      // Body is already parsed in Vercel
      resolve(req.body);
      return;
    }
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
  });
};

// =============================================================================
// Standard-Daten erstellen
// =============================================================================
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

// =============================================================================
// Route Handlers
// =============================================================================

// Services CRUD
const handleServices = async (req, res, userId, method, pathParts) => {
  const serviceId = pathParts[2]; // /services/{id}

  switch (method) {
    case 'GET':
      const services = await pool.query(
        'SELECT * FROM services WHERE user_id = $1 ORDER BY created_at',
        [userId]
      );
      return res.json(services.rows);

    case 'POST':
      const { name, duration, price, icon } = req.body;
      if (!name || !duration || !price) {
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

    // Route to specific handlers
    if (pathParts[0] === 'services') {
      return await handleServices(req, res, userId, method, pathParts);
    }

    if (pathParts[0] === 'staff') {
      return await handleStaff(req, res, userId, method, pathParts);
    }

    if (pathParts[0] === 'customers') {
      return await handleCustomers(req, res, userId, method, pathParts);
    }

    if (pathParts[0] === 'appointments') {
      return await handleAppointments(req, res, userId, method, pathParts);
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
      availableEndpoints: [
        '/health', '/register', '/login', '/dashboard', 
        '/services', '/staff', '/customers', '/appointments'
      ]
    });

  } catch (error) {
    console.error('API Error:', error);
    
    // JWT specific errors
    if (error.message.includes('Token') || error.message.includes('jwt')) {
      return res.status(401).json({ 
        error: 'Ungültige Authentifizierung',
        message: 'Bitte melden Sie sich erneut an'
      });
    }
    
    // Database connection errors
    if (error.code && error.code.startsWith('PG')) {
      console.error('Database error:', error.code, error.detail);
      return res.status(500).json({ 
        error: 'Datenbankfehler',
        message: 'Bitte versuchen Sie es später erneut'
      });
    }
    
    // Validation errors
    if (error.message.includes('erforderlich') || error.message.includes('invalid')) {
      return res.status(400).json({ 
        error: 'Ungültige Eingabe',
        message: error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'Serverfehler',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Ein unerwarteter Fehler ist aufgetreten',
      timestamp: new Date().toISOString()
    });
  }
};400).json({ error: 'Name, Dauer und Preis sind erforderlich' });
      }
      
      const newService = await pool.query(
        'INSERT INTO services (user_id, name, duration, price, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, name, parseInt(duration), parseFloat(price), icon || 'Scissors']
      );
      return res.status(201).json(newService.rows[0]);

    case 'PUT':
      if (!serviceId) {
        return res.status(400).json({ error: 'Service-ID erforderlich' });
      }
      
      const updateData = req.body;
      const updatedService = await pool.query(
        'UPDATE services SET name = $1, duration = $2, price = $3, icon = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
        [updateData.name, parseInt(updateData.duration), parseFloat(updateData.price), updateData.icon, serviceId, userId]
      );
      
      if (updatedService.rows.length === 0) {
        return res.status(404).json({ error: 'Service nicht gefunden' });
      }
      return res.json(updatedService.rows[0]);

    case 'DELETE':
      if (!serviceId) {
        return res.status(400).json({ error: 'Service-ID erforderlich' });
      }
      
      const deletedService = await pool.query(
        'DELETE FROM services WHERE id = $1 AND user_id = $2 RETURNING *',
        [serviceId, userId]
      );
      
      if (deletedService.rows.length === 0) {
        return res.status(404).json({ error: 'Service nicht gefunden' });
      }
      return res.json({ message: 'Service gelöscht', service: deletedService.rows[0] });

    default:
      return res.status(405).json({ error: 'Methode nicht unterstützt' });
  }
};

// Staff CRUD
const handleStaff = async (req, res, userId, method, pathParts) => {
  const staffId = pathParts[2];

  switch (method) {
    case 'GET':
      const staff = await pool.query(
        'SELECT * FROM staff WHERE user_id = $1 ORDER BY created_at',
        [userId]
      );
      return res.json(staff.rows);

    case 'POST':
      const { name, specialty, email, phone } = req.body;
      if (!name || !specialty) {
        return res.status(400).json({ error: 'Name und Fachbereich sind erforderlich' });
      }
      
      const newStaff = await pool.query(
        'INSERT INTO staff (user_id, name, specialty, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, name, specialty, email || '', phone || '']
      );
      return res.status(201).json(newStaff.rows[0]);

    case 'PUT':
      if (!staffId) {
        return res.status(400).json({ error: 'Mitarbeiter-ID erforderlich' });
      }
      
      const updateData = req.body;
      const updatedStaff = await pool.query(
        'UPDATE staff SET name = $1, specialty = $2, email = $3, phone = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
        [updateData.name, updateData.specialty, updateData.email || '', updateData.phone || '', staffId, userId]
      );
      
      if (updatedStaff.rows.length === 0) {
        return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' });
      }
      return res.json(updatedStaff.rows[0]);

    case 'DELETE':
      if (!staffId) {
        return res.status(400).json({ error: 'Mitarbeiter-ID erforderlich' });
      }
      
      // Cancel appointments for this staff member
      await pool.query(
        'UPDATE appointments SET status = $1 WHERE staff_id = $2 AND user_id = $3',
        ['cancelled', staffId, userId]
      );
      
      const deletedStaff = await pool.query(
        'DELETE FROM staff WHERE id = $1 AND user_id = $2 RETURNING *',
        [staffId, userId]
      );
      
      if (deletedStaff.rows.length === 0) {
        return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' });
      }
      return res.json({ message: 'Mitarbeiter gelöscht', staff: deletedStaff.rows[0] });

    default:
      return res.status(405).json({ error: 'Methode nicht unterstützt' });
  }
};

// Customers CRUD
const handleCustomers = async (req, res, userId, method, pathParts) => {
  const customerId = pathParts[2];

  switch (method) {
    case 'GET':
      const customers = await pool.query(
        'SELECT * FROM customers WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return res.json(customers.rows);

    case 'POST':
      const { name, phone, email } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ error: 'Name und Telefon sind erforderlich' });
      }
      
      const newCustomer = await pool.query(
        'INSERT INTO customers (user_id, name, phone, email, total_visits, last_visit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [userId, name, phone, email || '', 0, new Date().toISOString().split('T')[0]]
      );
      return res.status(201).json(newCustomer.rows[0]);

    case 'PUT':
      if (!customerId) {
        return res.status(400).json({ error: 'Kunden-ID erforderlich' });
      }
      
      const updateData = req.body;
      const updatedCustomer = await pool.query(
        'UPDATE customers SET name = $1, phone = $2, email = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
        [updateData.name, updateData.phone, updateData.email || '', customerId, userId]
      );
      
      if (updatedCustomer.rows.length === 0) {
        return res.status(404).json({ error: 'Kunde nicht gefunden' });
      }
      return res.json(updatedCustomer.rows[0]);

    case 'DELETE':
      if (!customerId) {
        return res.status(400).json({ error: 'Kunden-ID erforderlich' });
      }
      
      // Cancel appointments for this customer
      await pool.query(
        'UPDATE appointments SET status = $1 WHERE customer_id = $2 AND user_id = $3',
        ['cancelled', customerId, userId]
      );
      
      const deletedCustomer = await pool.query(
        'DELETE FROM customers WHERE id = $1 AND user_id = $2 RETURNING *',
        [customerId, userId]
      );
      
      if (deletedCustomer.rows.length === 0) {
        return res.status(404).json({ error: 'Kunde nicht gefunden' });
      }
      return res.json({ message: 'Kunde gelöscht', customer: deletedCustomer.rows[0] });

    default:
      return res.status(405).json({ error: 'Methode nicht unterstützt' });
  }
};

// Appointments CRUD
const handleAppointments = async (req, res, userId, method, pathParts) => {
  const appointmentId = pathParts[2];
  const action = pathParts[3]; // e.g., /appointments/{id}/cancel

  switch (method) {
    case 'GET':
      const appointments = await pool.query(`
        SELECT a.*, 
               c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
               s.name as staff_name, 
               sv.name as service_name, sv.price as service_price, sv.duration as service_duration, sv.icon as service_icon
        FROM appointments a
        JOIN customers c ON a.customer_id = c.id
        JOIN staff s ON a.staff_id = s.id  
        JOIN services sv ON a.service_id = sv.id
        WHERE a.user_id = $1
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `, [userId]);
      return res.json(appointments.rows);

    case 'POST':
      const { customer_id, staff_id, service_id, appointment_date, appointment_time } = req.body;
      
      if (!customer_id || !staff_id || !service_id || !appointment_date || !appointment_time) {
        return res.status(400).json({ error: 'Alle Termindetails sind erforderlich' });
      }

      // Check if time slot is available
      const existingAppointment = await pool.query(
        'SELECT id FROM appointments WHERE staff_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status != $4',
        [staff_id, appointment_date, appointment_time, 'cancelled']
      );

      if (existingAppointment.rows.length > 0) {
        return res.status(409).json({ error: 'Dieser Zeitslot ist bereits belegt' });
      }

      const newAppointment = await pool.query(
        'INSERT INTO appointments (user_id, customer_id, staff_id, service_id, appointment_date, appointment_time, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [userId, customer_id, staff_id, service_id, appointment_date, appointment_time, 'confirmed']
      );

      // Update customer visit count
      await pool.query(
        'UPDATE customers SET total_visits = total_visits + 1, last_visit = $1 WHERE id = $2',
        [appointment_date, customer_id]
      );

      return res.status(201).json(newAppointment.rows[0]);

    case 'PUT':
      if (!appointmentId) {
        return res.status(400).json({ error: 'Termin-ID erforderlich' });
      }

      // Handle cancel action
      if (action === 'cancel') {
        const cancelledAppointment = await pool.query(
          'UPDATE appointments SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
          ['cancelled', appointmentId, userId]
        );
        
        if (cancelledAppointment.rows.length === 0) {
          return res.status(404).json({ error: 'Termin nicht gefunden' });
        }
        return res.json({ message: 'Termin storniert', appointment: cancelledAppointment.rows[0] });
      }

      // Regular update
      const updateData = req.body;
      const updatedAppointment = await pool.query(
        'UPDATE appointments SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [updateData.status, appointmentId, userId]
      );
      
      if (updatedAppointment.rows.length === 0) {
        return res.status(404).json({ error: 'Termin nicht gefunden' });
      }
      return res.json(updatedAppointment.rows[0]);

    case 'DELETE':
      if (!appointmentId) {
        return res.status(400).json({ error: 'Termin-ID erforderlich' });
      }
      
      const deletedAppointment = await pool.query(
        'DELETE FROM appointments WHERE id = $1 AND user_id = $2 RETURNING *',
        [appointmentId, userId]
      );
      
      if (deletedAppointment.rows.length === 0) {
        return res.status(404).json({ error: 'Termin nicht gefunden' });
      }
      return res.json({ message: 'Termin gelöscht', appointment: deletedAppointment.rows[0] });

    default:
      return res.status(405).json({ error: 'Methode nicht unterstützt' });
  }
};

// =============================================================================
// Main Handler
// =============================================================================
module.exports = async (req, res) => {
  setCORSHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse body for POST/PUT requests
  if (req.method === 'POST' || req.method === 'PUT') {
    req.body = await parseBody(req);
  }

  const { url, method } = req;
  const path = url.replace('/api', '') || '/';
  const pathParts = path.split('/').filter(Boolean);
  
  console.log(`${method} ${path}`, req.body ? JSON.stringify(req.body) : '');

  try {
    // Health Check
    if (path.includes('/health')) {
      return res.status(200).json({ 
        status: 'ProfiSlots API Online',
        timestamp: new Date().toISOString(),
        database: 'Connected',
        version: '1.0.0'
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
          'GET /dashboard - Dashboard-Statistiken',
          'GET /services - Services abrufen',
          'GET /staff - Mitarbeiter abrufen',
          'GET /customers - Kunden abrufen',
          'GET /appointments - Termine abrufen',
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
        return res.status(
