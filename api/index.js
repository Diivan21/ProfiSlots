// ProfiSlots API - Vercel Serverless Function
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

// Environment Variables Check
console.log('=== ProfiSlots API Starting ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

// Database Connection mit URL-Dekodierung
let pool;
try {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // URL dekodieren für Sonderzeichen im Passwort
  const databaseUrl = decodeURIComponent(process.env.DATABASE_URL);
  console.log('Using database URL (masked):', databaseUrl.replace(/:[^:@]+@/, ':***@'));

  pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  console.log('✅ Database pool created successfully');
} catch (error) {
  console.error('❌ Database pool creation failed:', error.message);
}

// Helper Functions
const setCORSHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const sendResponse = (res, status, data) => {
  res.status(status).json({
    ...data,
    timestamp: new Date().toISOString()
  });
};

const sendError = (res, status, message, details = null) => {
  console.error(`API Error ${status}: ${message}`, details);
  sendResponse(res, status, {
    error: message,
    ...(details && process.env.NODE_ENV !== 'production' && { details })
  });
};

// Authentication Helper
const authenticateToken = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    throw new Error('Access Token erforderlich');
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || '306651848');
    return user.id;
  } catch (err) {
    throw new Error('Ungültiger Token');
  }
};

// Standard-Daten erstellen
async function createDefaultData(userId) {
  try {
    debugLog('Creating default data for user:', userId);
    
    // Standard Services
    const defaultServices = [
      { name: 'Haarschnitt', duration: 60, price: 45.00, icon: 'Scissors' },
      { name: 'Färbung', duration: 120, price: 80.00, icon: 'Scissors' },
      { name: 'Massage', duration: 60, price: 65.00, icon: 'Heart' },
      { name: 'Beratung', duration: 30, price: 35.00, icon: 'MessageSquare' }
    ];
    
    for (const service of defaultServices) {
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
    // Nicht kritisch, App funktioniert auch ohne Standarddaten
  }
}

// Main Handler
module.exports = async (req, res) => {
  debugLog(`Incoming request: ${req.method} ${req.url}`);
  
  // CORS Headers setzen
  setCORSHeaders(res);
  
  // OPTIONS Request für CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  const path = url.replace('/api', '') || '/';
  
  try {
    // ==================== HEALTH CHECK ====================
    if (path.includes('/health') || path === '/health') {
      debugLog('Health check requested');
      
      try {
        // Database Connection Test
        if (!pool) {
          throw new Error('Database pool not initialized');
        }
        
        // Einfacher Test
        const client = await pool.connect();
        const dbResult = await client.query('SELECT NOW() as time, current_database() as db');
        client.release();
        
        debugLog('Database connection successful');
        
        return sendResponse(res, 200, {
          status: 'ProfiSlots API Online',
          database: 'Connected',
          dbTime: dbResult.rows[0].time,
          database_name: dbResult.rows[0].db,
          environment: process.env.NODE_ENV || 'development',
          node_version: process.version
        });
      } catch (dbError) {
        debugLog('Database error in health check:', dbError.message);
        console.error('Full DB Error:', dbError);
        
        return sendError(res, 503, 'Database connection failed', {
          message: dbError.message,
          code: dbError.code,
          detail: dbError.detail
        });
      }
    }

    // ==================== API INFO ====================
    if (path === '/' || path === '') {
      return sendResponse(res, 200, {
        message: 'ProfiSlots Terminbuchungssystem API',
        status: 'online',
        version: '1.0.0',
        endpoints: {
          system: ['GET /health'],
          auth: ['POST /register', 'POST /login'],
          protected: ['GET /dashboard', 'GET /services', 'GET /staff', 'GET /customers', 'GET /appointments']
        }
      });
    }

    // ==================== REGISTRIERUNG ====================
    if (path === '/register' && method === 'POST') {
      debugLog('Registration attempt');
      
      const { email, password, salonName } = req.body;
      
      if (!email || !password || !salonName) {
        return sendError(res, 400, 'E-Mail, Passwort und Salon-Name sind erforderlich');
      }

      if (password.length < 6) {
        return sendError(res, 400, 'Passwort muss mindestens 6 Zeichen haben');
      }
      
      try {
        // Check if email exists
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [email.toLowerCase()]
        );
        
        if (existingUser.rows.length > 0) {
          return sendError(res, 409, 'Diese E-Mail ist bereits registriert');
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create user
        const result = await pool.query(
          'INSERT INTO users (email, password, salon_name) VALUES ($1, $2, $3) RETURNING id, email, salon_name, created_at',
          [email.toLowerCase(), hashedPassword, salonName]
        );
        
        const newUser = result.rows[0];
        debugLog('User created successfully:', { id: newUser.id, email: newUser.email });
        
        // Create default data (non-critical)
        createDefaultData(newUser.id).catch(err => 
          debugLog('Default data creation failed (non-critical):', err.message)
        );
        
        return sendResponse(res, 201, {
          message: 'Account erfolgreich erstellt! Sie können sich jetzt anmelden.',
          user: {
            id: newUser.id,
            email: newUser.email,
            salonName: newUser.salon_name,
            createdAt: newUser.created_at
          }
        });
      } catch (error) {
        debugLog('Registration error:', error.message);
        return sendError(res, 500, 'Registrierung fehlgeschlagen', error.message);
      }
    }

    // ==================== LOGIN ====================
    if (path === '/login' && method === 'POST') {
      debugLog('Login attempt');
      
      const { email, password } = req.body;
      
      if (!email || !password) {
        return sendError(res, 400, 'E-Mail und Passwort sind erforderlich');
      }
      
      try {
        const result = await pool.query(
          'SELECT id, email, password, salon_name, created_at FROM users WHERE email = $1',
          [email.toLowerCase()]
        );
        
        if (result.rows.length === 0) {
          return sendError(res, 401, 'E-Mail oder Passwort ist falsch');
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
          return sendError(res, 401, 'E-Mail oder Passwort ist falsch');
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, email: user.email }, 
          process.env.JWT_SECRET || '306651848', 
          { expiresIn: '7d' }
        );
        
        debugLog('Login successful for user:', user.email);
        
        return sendResponse(res, 200, {
          message: 'Erfolgreich angemeldet',
          token, 
          user: { 
            id: user.id, 
            email: user.email, 
            salonName: user.salon_name,
            createdAt: user.created_at
          }
        });
      } catch (error) {
        debugLog('Login error:', error.message);
        return sendError(res, 500, 'Anmeldung fehlgeschlagen', error.message);
      }
    }

    // ==================== PROTECTED ROUTES ====================
    let userId;
    try {
      userId = authenticateToken(req);
    } catch (authError) {
      return sendError(res, 401, authError.message);
    }

    // Dashboard Stats
    if (path === '/dashboard' && method === 'GET') {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const [appointmentsResult, customersResult, servicesResult] = await Promise.all([
          pool.query(
            'SELECT COUNT(*) as count FROM appointments WHERE user_id = $1 AND appointment_date = $2 AND status != $3', 
            [userId, today, 'cancelled']
          ),
          pool.query('SELECT COUNT(*) as count FROM customers WHERE user_id = $1', [userId]),
          pool.query('SELECT COUNT(*) as count FROM services WHERE user_id = $1', [userId])
        ]);
        
        return sendResponse(res, 200, {
          todayAppointments: parseInt(appointmentsResult.rows[0].count),
          totalCustomers: parseInt(customersResult.rows[0].count),
          totalServices: parseInt(servicesResult.rows[0].count)
        });
      } catch (error) {
        return sendError(res, 500, 'Dashboard-Daten konnten nicht geladen werden', error.message);
      }
    }

    // Services
    if (path === '/services' && method === 'GET') {
      try {
        const result = await pool.query(
          'SELECT * FROM services WHERE user_id = $1 ORDER BY created_at ASC',
          [userId]
        );
        return sendResponse(res, 200, result.rows);
      } catch (error) {
        return sendError(res, 500, 'Services konnten nicht geladen werden', error.message);
      }
    }

    // Staff
    if (path === '/staff' && method === 'GET') {
      try {
        const result = await pool.query(
          'SELECT * FROM staff WHERE user_id = $1 ORDER BY created_at ASC',
          [userId]
        );
        return sendResponse(res, 200, result.rows);
      } catch (error) {
        return sendError(res, 500, 'Mitarbeiter konnten nicht geladen werden', error.message);
      }
    }

    // Customers - GET
    if (path === '/customers' && method === 'GET') {
      try {
        const result = await pool.query(
          'SELECT * FROM customers WHERE user_id = $1 ORDER BY created_at DESC',
          [userId]
        );
        return sendResponse(res, 200, result.rows);
      } catch (error) {
        return sendError(res, 500, 'Kunden konnten nicht geladen werden', error.message);
      }
    }

    // Customers - POST
    if (path === '/customers' && method === 'POST') {
      const { name, email, phone } = req.body;
      
      if (!name) {
        return sendError(res, 400, 'Name ist erforderlich');
      }
      
      try {
        const result = await pool.query(
          'INSERT INTO customers (user_id, name, email, phone, total_visits, last_visit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [userId, name, email || '', phone || '', 0, null]
        );
        
        return sendResponse(res, 201, result.rows[0]);
      } catch (error) {
        return sendError(res, 500, 'Kunde konnte nicht erstellt werden', error.message);
      }
    }

    // Appointments - GET
    if (path === '/appointments' && method === 'GET') {
      try {
        const result = await pool.query(`
          SELECT 
            a.*,
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
        
        return sendResponse(res, 200, result.rows);
      } catch (error) {
        return sendError(res, 500, 'Termine konnten nicht geladen werden', error.message);
      }
    }

    // Appointments - POST
    if (path === '/appointments' && method === 'POST') {
      const { customer_id, service_id, staff_id, appointment_date, appointment_time, notes } = req.body;
      
      if (!customer_id || !service_id || !staff_id || !appointment_date || !appointment_time) {
        return sendError(res, 400, 'Alle Pflichtfelder sind erforderlich');
      }
      
      try {
        const result = await pool.query(
          'INSERT INTO appointments (user_id, customer_id, service_id, staff_id, appointment_date, appointment_time, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
          [userId, customer_id, service_id, staff_id, appointment_date, appointment_time, notes || '', 'confirmed']
        );
        
        return sendResponse(res, 201, result.rows[0]);
      } catch (error) {
        return sendError(res, 500, 'Termin konnte nicht erstellt werden', error.message);
      }
    }

    // Appointments by Date
    if (path.startsWith('/appointments/date/') && method === 'GET') {
      const date = path.split('/')[3];
      
      try {
        const result = await pool.query(`
          SELECT 
            a.*,
            c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
            s.name as staff_name,
            sv.name as service_name, sv.price as service_price, sv.duration as service_duration
          FROM appointments a
          JOIN customers c ON a.customer_id = c.id
          JOIN staff s ON a.staff_id = s.id  
          JOIN services sv ON a.service_id = sv.id
          WHERE a.user_id = $1 AND a.appointment_date = $2
          ORDER BY a.appointment_time ASC
        `, [userId, date]);
        
        return sendResponse(res, 200, result.rows);
      } catch (error) {
        return sendError(res, 500, 'Termine konnten nicht geladen werden', error.message);
      }
    }

    // ==================== 404 ====================
    return sendError(res, 404, `Endpoint nicht gefunden: ${method} ${path}`);

  } catch (error) {
    debugLog('Unhandled error:', error.message);
    console.error('Full error stack:', error.stack);
    
    return sendError(res, 500, 'Ein unerwarteter Serverfehler ist aufgetreten', {
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};
