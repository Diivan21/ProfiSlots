// Services
    if (path === '/services' && method === 'GET') {
      debugLog('Services request for user:', userId);
      
      try {
        const result = await pool.query('SELECT * FROM services WHERE user_id = $1 ORDER BY created_at', [userId]);
        debugLog('Services found:', result.rows.length);
        return res.json(result.rows);
      } catch (error) {
        debugLog('Services error:', error.message);
        return res.status(500).json({ 
          error: 'Services konnten nicht geladen werden',
          details: error.message
        });
      }
    }

    // Staff
    if (path === '/staff' && method === 'GET') {
      debugLog('Staff request for user:', userId);
      
      try {
        const result = await pool.query('SELECT * FROM staff WHERE user_id = $1 ORDER BY created_at', [userId]);
        debugLog('Staff found:', result.rows.length);
        return res.json(result.rows);
      } catch (error) {
        debugLog('Staff error:', error.message);
        return res.status(500).json({ 
          error: 'Mitarbeiter konnten nicht geladen werden',
          details: error.message
        });
      }
    }

    // Customers - GET und POST
    if (path === '/customers') {
      if (method === 'GET') {
        debugLog('Customers GET request for user:', userId);
        
        try {
          const result = await pool.query('SELECT * FROM customers WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
          debugLog('Customers found:', result.rows.length);
          return res.json(result.rows);
        } catch (error) {
          debugLog('Customers GET error:', error.message);
          return res.status(500).json({ 
            error: 'Kunden konnten nicht geladen werden',
            details: error.message
          });
        }
      }
      
      if (method === 'POST') {
        debugLog('Customers POST request for user:', userId);
        debugLog('Customer data:', req.body);
        
        const { name, email, phone, address, notes } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'Name ist erforderlich' });
        }
        
        try {
          const result = await pool.query(
            'INSERT INTO customers (user_id, name, email, phone, address, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, name, email || '', phone || '', address || '', notes || '']
          );
          
          debugLog('Customer created:', result.rows[0]);
          return res.status(201).json(result.rows[0]);
        } catch (error) {
          debugLog('Customer creation error:', error.message);
          return res.status(500).json({ 
            error: 'Kunde konnte nicht erstellt werden',
            details: error.message
          });
        }
      }
    }

    // Appointments - GET und POST
    if (path === '/appointments') {
      if (method === 'GET') {
        debugLog('Appointments GET request for user:', userId);
        
        try {
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
          
          debugLog('Appointments found:', result.rows.length);
          return res.json(result.rows);
        } catch (error) {
          debugLog('Appointments GET error:', error.message);
          return res.status(500).json({ 
            error: 'Termine konnten nicht geladen werden',
            details: error.message
          });
        }
      }
      
      if (method === 'POST') {
        debugLog('Appointments POST request for user:', userId);
        debugLog('Appointment data:', req.body);
        
        const { customer_id, service_id, staff_id, appointment_date, appointment_time, notes } = req.body;
        
        if (!customer_id || !service_id || !staff_id || !appointment_date || !appointment_time) {
          return res.status(400).json({ error: 'Alle Pflichtfelder sind erforderlich' });
        }
        
        try {
          const result = await pool.query(
            'INSERT INTO appointments (user_id, customer_id, service_id, staff_id, appointment_date, appointment_time, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [userId, customer_id, service_id, staff_id, appointment_date, appointment_time, notes || '', 'confirmed']
          );
          
          debugLog('Appointment created:', result.rows[0]);
          return res.status(201).json(result.rows[0]);
        } catch (error) {
          debugLog('Appointment creation error:', error.message);
          return res.status(500).json({ 
            error: 'Termin konnte nicht erstellt werden',
            details: error.message
          });
        }
      }
    // api/index.js - Debug Version mit erweiterten Logs
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Debug Logging
const debugLog = (message, data = null) => {
  console.log(`[DEBUG ${new Date().toISOString()}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

console.log('=== ProfiSlots API Starting ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

// Datenbankverbindung mit Debug-Logs
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test Datenbankverbindung beim Start
pool.connect()
  .then(client => {
    console.log('✅ Database connection successful');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

// Helper Functions
const authenticateToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    debugLog('Auth header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      throw new Error('Access Token erforderlich');
    }
    
    const user = jwt.verify(token, process.env.JWT_SECRET || 'profi_slots_secret');
    debugLog('Token verified for user:', user.id);
    return user.id;
  } catch (err) {
    debugLog('Auth error:', err.message);
    throw new Error('Ungültiger Token');
  }
};

// CORS Headers
const setCORSHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Einfache Standard-Daten (ohne Transaktionen)
async function createDefaultData(userId) {
  try {
    debugLog('Creating default data for user:', userId);
    
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
    
    debugLog('Default data created successfully');
  } catch (error) {
    debugLog('Error creating default data:', error.message);
    console.error('Full error:', error);
  }
}

// Main Handler
module.exports = async (req, res) => {
  debugLog(`Incoming request: ${req.method} ${req.url}`);
  
  setCORSHeaders(res);
  
  if (req.method === 'OPTIONS') {
    debugLog('Handling OPTIONS request');
    return res.status(200).end();
  }

  const { url, method } = req;
  const path = url.replace('/api', '') || '/';
  
  debugLog(`Processing: ${method} ${path}`);

  try {
    // Health Check
    if (path.includes('/health')) {
      debugLog('Health check requested');
      try {
        const dbResult = await pool.query('SELECT NOW() as time');
        debugLog('Database query successful:', dbResult.rows[0]);
        
        return res.status(200).json({ 
          status: 'ProfiSlots API Online',
          timestamp: new Date().toISOString(),
          database: 'Connected',
          dbTime: dbResult.rows[0].time
        });
      } catch (dbError) {
        debugLog('Database error in health check:', dbError.message);
        return res.status(503).json({
          status: 'Database Error',
          error: dbError.message
        });
      }
    }

    // API Info
    if (path === '/' || path === '') {
      debugLog('API info requested');
      return res.status(200).json({ 
        message: 'ProfiSlots Terminbuchungssystem API',
        status: 'online',
        version: '1.0.0',
        debug: true,
        endpoints: [
          'POST /register - Account erstellen',
          'POST /login - Anmelden',
          'GET /health - System-Status'
        ]
      });
    }

    // Registrierung
    if (path === '/register' && method === 'POST') {
      debugLog('Registration attempt');
      debugLog('Request body:', req.body);
      
      const { email, password, salonName } = req.body;
      
      if (!email || !password || !salonName) {
        debugLog('Missing required fields');
        return res.status(400).json({ error: 'E-Mail, Passwort und Salon-Name sind erforderlich' });
      }

      if (password.length < 6) {
        debugLog('Password too short');
        return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen haben' });
      }
      
      try {
        // Prüfen ob E-Mail bereits existiert
        debugLog('Checking if email exists:', email);
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        
        if (existingUser.rows.length > 0) {
          debugLog('Email already exists');
          return res.status(400).json({ error: 'Diese E-Mail ist bereits registriert' });
        }
        
        debugLog('Hashing password');
        const hashedPassword = await bcrypt.hash(password, 12);
        
        debugLog('Creating user in database');
        const result = await pool.query(
          'INSERT INTO users (email, password, salon_name) VALUES ($1, $2, $3) RETURNING id, email, salon_name',
          [email.toLowerCase(), hashedPassword, salonName]
        );
        
        const newUser = result.rows[0];
        debugLog('User created:', newUser);
        
        await createDefaultData(newUser.id);
        
        debugLog('Registration successful');
        
        return res.status(201).json({ 
          message: 'Account erfolgreich erstellt! Sie können sich jetzt anmelden.',
          user: {
            id: newUser.id,
            email: newUser.email,
            salonName: newUser.salon_name
          }
        });
      } catch (error) {
        debugLog('Registration error:', error.message);
        console.error('Full registration error:', error);
        return res.status(500).json({ 
          error: 'Registrierung fehlgeschlagen',
          details: error.message
        });
      }
    }

    // Login
    if (path === '/login' && method === 'POST') {
      debugLog('Login attempt');
      debugLog('Request body:', req.body);
      
      const { email, password } = req.body;
      
      if (!email || !password) {
        debugLog('Missing credentials');
        return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' });
      }
      
      try {
        debugLog('Looking up user:', email);
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        
        if (result.rows.length === 0) {
          debugLog('User not found');
          return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch' });
        }
        
        const user = result.rows[0];
        debugLog('User found:', { id: user.id, email: user.email });
        
        debugLog('Comparing password');
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
          debugLog('Invalid password');
          return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch' });
        }
        
        debugLog('Creating JWT token');
        const token = jwt.sign(
          { id: user.id, email: user.email }, 
          process.env.JWT_SECRET || 'profi_slots_secret', 
          { expiresIn: '7d' }
        );
        
        debugLog('Login successful');
        
        return res.json({ 
          message: 'Erfolgreich angemeldet',
          token, 
          user: { 
            id: user.id, 
            email: user.email, 
            salonName: user.salon_name 
          }
        });
      } catch (error) {
        debugLog('Login error:', error.message);
        console.error('Full login error:', error);
        return res.status(500).json({ 
          error: 'Anmeldung fehlgeschlagen',
          details: error.message
        });
      }
    }

    // Authentifizierte Routen ab hier
    let userId;
    try {
      userId = authenticateToken(req);
      debugLog('User authenticated:', userId);
    } catch (authError) {
      debugLog('Authentication failed:', authError.message);
      return res.status(401).json({ error: authError.message });
    }

    // Dashboard Stats
    if (path === '/dashboard' && method === 'GET') {
      debugLog('Dashboard request for user:', userId);
      
      try {
        const today = new Date().toISOString().split('T')[0];
        debugLog('Today date:', today);
        
        const appointments = await pool.query(
          'SELECT COUNT(*) as count FROM appointments WHERE user_id = $1 AND appointment_date = $2 AND status != $3', 
          [userId, today, 'cancelled']
        );
        
        const customers = await pool.query(
          'SELECT COUNT(*) as count FROM customers WHERE user_id = $1', 
          [userId]
        );
        
        const services = await pool.query(
          'SELECT COUNT(*) as count FROM services WHERE user_id = $1', 
          [userId]
        );
        
        const stats = {
          todayAppointments: parseInt(appointments.rows[0].count),
          totalCustomers: parseInt(customers.rows[0].count),
          totalServices: parseInt(services.rows[0].count)
        };
        
        debugLog('Dashboard stats:', stats);
        
        return res.json(stats);
      } catch (error) {
        debugLog('Dashboard error:', error.message);
        console.error('Full dashboard error:', error);
        return res.status(500).json({ 
          error: 'Dashboard-Daten konnten nicht geladen werden',
          details: error.message
        });
      }
    }

    // Services
    if (path === '/services' && method === 'GET') {
      debugLog('Services request for user:', userId);
      
      try {
        const result = await pool.query('SELECT * FROM services WHERE user_id = $1 ORDER BY created_at', [userId]);
        debugLog('Services found:', result.rows.length);
        return res.json(result.rows);
      } catch (error) {
        debugLog('Services error:', error.message);
        return res.status(500).json({ 
          error: 'Services konnten nicht geladen werden',
          details: error.message
        });
      }
    }

    // Staff
    if (path === '/staff' && method === 'GET') {
      debugLog('Staff request for user:', userId);
      
      try {
        const result = await pool.query('SELECT * FROM staff WHERE user_id = $1 ORDER BY created_at', [userId]);
        debugLog('Staff found:', result.rows.length);
        return res.json(result.rows);
      } catch (error) {
        debugLog('Staff error:', error.message);
        return res.status(500).json({ 
          error: 'Mitarbeiter konnten nicht geladen werden',
          details: error.message
        });
      }
    }

    // Customers - GET und POST
    if (path === '/customers') {
      if (method === 'GET') {
        debugLog('Customers GET request for user:', userId);
        
        try {
          const result = await pool.query('SELECT * FROM customers WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
          debugLog('Customers found:', result.rows.length);
          return res.json(result.rows);
        } catch (error) {
          debugLog('Customers GET error:', error.message);
          return res.status(500).json({ 
            error: 'Kunden konnten nicht geladen werden',
            details: error.message
          });
        }
      }
      
      if (method === 'POST') {
        debugLog('Customers POST request for user:', userId);
        debugLog('Customer data:', req.body);
        
        const { name, email, phone, address, notes } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'Name ist erforderlich' });
        }
        
        try {
          const result = await pool.query(
            'INSERT INTO customers (user_id, name, email, phone, address, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, name, email || '', phone || '', address || '', notes || '']
          );
          
          debugLog('Customer created:', result.rows[0]);
          return res.status(201).json(result.rows[0]);
        } catch (error) {
          debugLog('Customer creation error:', error.message);
          return res.status(500).json({ 
            error: 'Kunde konnte nicht erstellt werden',
            details: error.message
          });
        }
      }
    }

    // Appointments - GET und POST
    if (path === '/appointments') {
      if (method === 'GET') {
        debugLog('Appointments GET request for user:', userId);
        
        try {
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
          
          debugLog('Appointments found:', result.rows.length);
          return res.json(result.rows);
        } catch (error) {
          debugLog('Appointments GET error:', error.message);
          return res.status(500).json({ 
            error: 'Termine konnten nicht geladen werden',
            details: error.message
          });
        }
      }
      
      if (method === 'POST') {
        debugLog('Appointments POST request for user:', userId);
        debugLog('Appointment data:', req.body);
        
        const { customer_id, service_id, staff_id, appointment_date, appointment_time, notes } = req.body;
        
        if (!customer_id || !service_id || !staff_id || !appointment_date || !appointment_time) {
          return res.status(400).json({ error: 'Alle Pflichtfelder sind erforderlich' });
        }
        
        try {
          const result = await pool.query(
            'INSERT INTO appointments (user_id, customer_id, service_id, staff_id, appointment_date, appointment_time, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [userId, customer_id, service_id, staff_id, appointment_date, appointment_time, notes || '', 'confirmed']
          );
          
          debugLog('Appointment created:', result.rows[0]);
          return res.status(201).json(result.rows[0]);
        } catch (error) {
          debugLog('Appointment creation error:', error.message);
          return res.status(500).json({ 
            error: 'Termin konnte nicht erstellt werden',
            details: error.message
          });
        }
      }
    }

    // Test für authentifizierte Routen
    if (path === '/test-auth') {
      debugLog('Auth test successful for user:', userId);
      return res.json({
        message: 'Authentifizierung erfolgreich!',
        userId: userId,
        timestamp: new Date().toISOString()
      });
    }

    // 404 für unbekannte Routen
    debugLog('Unknown route:', path);
    return res.status(404).json({ 
      error: 'Endpoint nicht gefunden',
      path: path,
      method: method,
      availableEndpoints: ['/health', '/register', '/login', '/dashboard']
    });

  } catch (error) {
    debugLog('Unhandled error:', error.message);
    console.error('Full unhandled error:', error);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({ 
      error: 'Ein unerwarteter Serverfehler ist aufgetreten',
      message: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
  }
};
