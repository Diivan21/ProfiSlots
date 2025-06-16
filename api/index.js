// api/index.js - ProfiSlots Produktionsversion
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Datenbankverbindung mit erweiterten Produktionseinstellungen
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximale Anzahl Verbindungen
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Sicherheitsvalidierung für JWT
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'profi_slots_secret') {
  console.error('WARNUNG: JWT_SECRET nicht gesetzt oder unsicher! Bitte setzen Sie eine starke JWT_SECRET Umgebungsvariable.');
}

// Helper Functions
const authenticateToken = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    throw new Error('Zugriff verweigert - Token erforderlich');
  }
  
  try {
    const user = jwt.verify(token, JWT_SECRET || 'fallback_secret');
    return user.id;
  } catch (err) {
    throw new Error('Ungültiger oder abgelaufener Token');
  }
};

// Erweiterte CORS Headers für Produktion
const setCORSHeaders = (res) => {
  // In Produktion sollten Sie spezifische Domains verwenden statt *
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// Input Validierung
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 8; // Erhöhte Mindestlänge für Produktion
};

// Rate Limiting (einfache Implementierung)
const rateLimitMap = new Map();
const rateLimit = (ip, limit = 10, windowMs = 15 * 60 * 1000) => { // 10 Anfragen pro 15 Minuten
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip).filter(time => time > windowStart);
  
  if (requests.length >= limit) {
    return false;
  }
  
  requests.push(now);
  rateLimitMap.set(ip, requests);
  return true;
};

// Erweiterte Standard-Daten
async function createDefaultData(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Standard Services - angepasst für verschiedene Branchen
    const defaultServices = [
      { name: 'Beratungsgespräch', duration: 30, price: 35.00, icon: 'MessageSquare', category: 'Beratung' },
      { name: 'Standardtermin', duration: 60, price: 60.00, icon: 'Clock', category: 'Service' },
      { name: 'Langtermin', duration: 120, price: 110.00, icon: 'Calendar', category: 'Service' },
      { name: 'Folgetermin', duration: 45, price: 45.00, icon: 'RotateCcw', category: 'Service' }
    ];
    
    for (let service of defaultServices) {
      await client.query(
        'INSERT INTO services (user_id, name, duration, price, icon, category) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, service.name, service.duration, service.price, service.icon, service.category]
      );
    }
    
    // Standard Mitarbeiter
    await client.query(
      'INSERT INTO staff (user_id, name, specialty, email, phone, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, 'Standard Mitarbeiter', 'Allgemein', '', '', true]
    );
    
    // Standard Arbeitszeiten (Mo-Fr 9-17 Uhr)
    const workingHours = [
      { day: 1, start_time: '09:00', end_time: '17:00', is_working: true }, // Montag
      { day: 2, start_time: '09:00', end_time: '17:00', is_working: true }, // Dienstag
      { day: 3, start_time: '09:00', end_time: '17:00', is_working: true }, // Mittwoch
      { day: 4, start_time: '09:00', end_time: '17:00', is_working: true }, // Donnerstag
      { day: 5, start_time: '09:00', end_time: '17:00', is_working: true }, // Freitag
      { day: 6, start_time: '10:00', end_time: '14:00', is_working: false }, // Samstag
      { day: 0, start_time: '00:00', end_time: '00:00', is_working: false }  // Sonntag
    ];
    
    for (let hours of workingHours) {
      await client.query(
        'INSERT INTO working_hours (user_id, day_of_week, start_time, end_time, is_working) VALUES ($1, $2, $3, $4, $5)',
        [userId, hours.day, hours.start_time, hours.end_time, hours.is_working]
      );
    }
    
    await client.query('COMMIT');
    console.log(`Default data created for user ${userId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating default data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Logging für Produktion
const logRequest = (req, statusCode, message = '') => {
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  console.log(`[${timestamp}] ${req.method} ${req.url} - ${statusCode} - IP: ${ip} - ${message}`);
};

// Main Handler
module.exports = async (req, res) => {
  const startTime = Date.now();
  setCORSHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  const path = url.replace('/api', '') || '/';
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  
  try {
    // Rate Limiting für kritische Endpoints
    if (['register', 'login'].some(endpoint => path.includes(endpoint))) {
      if (!rateLimit(clientIP, 5, 15 * 60 * 1000)) { // 5 Versuche pro 15 Minuten
        logRequest(req, 429, 'Rate limit exceeded');
        return res.status(429).json({ 
          error: 'Zu viele Anfragen. Bitte versuchen Sie es in 15 Minuten erneut.',
          retryAfter: 900
        });
      }
    }

    // Health Check - erweitert
    if (path.includes('/health')) {
      try {
        await pool.query('SELECT 1');
        logRequest(req, 200, 'Health check OK');
        return res.status(200).json({ 
          status: 'ProfiSlots API Online',
          timestamp: new Date().toISOString(),
          database: 'Connected',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        });
      } catch (dbError) {
        logRequest(req, 503, 'Database connection failed');
        return res.status(503).json({
          status: 'Service Unavailable',
          error: 'Database connection failed',
          timestamp: new Date().toISOString()
        });
      }
    }

    // API Info
    if (path === '/' || path === '') {
      logRequest(req, 200, 'API info requested');
      return res.status(200).json({ 
        message: 'ProfiSlots Terminbuchungssystem API',
        status: 'online',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: [
          'POST /register - Account erstellen',
          'POST /login - Anmelden',
          'GET /health - System-Status',
          'GET /dashboard - Dashboard-Statistiken (authentifiziert)',
          'GET /services - Services abrufen (authentifiziert)',
          'GET /staff - Mitarbeiter abrufen (authentifiziert)',
          'GET /customers - Kunden abrufen (authentifiziert)',
          'GET /appointments - Termine abrufen (authentifiziert)'
        ]
      });
    }

    // Registrierung - erweiterte Validierung
    if (path === '/register' && method === 'POST') {
      const { email, password, salonName } = req.body;
      
      // Validierung
      if (!email || !password || !salonName) {
        logRequest(req, 400, 'Missing required fields for registration');
        return res.status(400).json({ error: 'E-Mail, Passwort und Salon-Name sind erforderlich' });
      }

      if (!validateEmail(email)) {
        logRequest(req, 400, 'Invalid email format');
        return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
      }

      if (!validatePassword(password)) {
        logRequest(req, 400, 'Password too weak');
        return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen haben' });
      }

      if (salonName.length < 2 || salonName.length > 100) {
        logRequest(req, 400, 'Invalid salon name length');
        return res.status(400).json({ error: 'Salon-Name muss zwischen 2 und 100 Zeichen haben' });
      }
      
      try {
        // Prüfen ob E-Mail bereits existiert
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
          logRequest(req, 400, 'Email already exists');
          return res.status(400).json({ error: 'Diese E-Mail ist bereits registriert' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const result = await pool.query(
          'INSERT INTO users (email, password, salon_name, created_at, is_active) VALUES ($1, $2, $3, NOW(), $4) RETURNING id, email, salon_name, created_at',
          [email.toLowerCase(), hashedPassword, salonName.trim(), true]
        );
        
        const newUser = result.rows[0];
        await createDefaultData(newUser.id);
        
        logRequest(req, 201, `New user registered: ${newUser.email}`);
        
        return res.status(201).json({ 
          message: 'Account erfolgreich erstellt! Sie können sich jetzt anmelden.',
          user: {
            id: newUser.id,
            email: newUser.email,
            salonName: newUser.salon_name,
            createdAt: newUser.created_at
          }
        });
      } catch (error) {
        logRequest(req, 500, `Registration error: ${error.message}`);
        throw error;
      }
    }

    // Login - erweiterte Sicherheit
    if (path === '/login' && method === 'POST') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        logRequest(req, 400, 'Missing credentials');
        return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' });
      }

      if (!validateEmail(email)) {
        logRequest(req, 400, 'Invalid email format on login');
        return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
      }
      
      try {
        const result = await pool.query(
          'SELECT id, email, password, salon_name, is_active, last_login FROM users WHERE email = $1', 
          [email.toLowerCase()]
        );
        
        if (result.rows.length === 0) {
          logRequest(req, 401, 'Login attempt with non-existent email');
          return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch' });
        }
        
        const user = result.rows[0];
        
        if (!user.is_active) {
          logRequest(req, 401, 'Login attempt with deactivated account');
          return res.status(401).json({ error: 'Account ist deaktiviert. Bitte kontaktieren Sie den Support.' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
          logRequest(req, 401, 'Invalid password attempt');
          return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch' });
        }
        
        // Last login aktualisieren
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email,
            iat: Math.floor(Date.now() / 1000)
          }, 
          JWT_SECRET || 'fallback_secret', 
          { expiresIn: '7d' }
        );
        
        logRequest(req, 200, `Successful login: ${user.email}`);
        
        return res.json({ 
          message: 'Erfolgreich angemeldet',
          token, 
          user: { 
            id: user.id, 
            email: user.email, 
            salonName: user.salon_name,
            lastLogin: user.last_login
          }
        });
      } catch (error) {
        logRequest(req, 500, `Login error: ${error.message}`);
        throw error;
      }
    }

    // Ab hier authentifizierte Routen
    const userId = authenticateToken(req);

    // Dashboard Stats - erweitert
    if (path === '/dashboard' && method === 'GET') {
      try {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().substring(0, 7);
        
        const [appointments, customers, services, monthlyRevenue, upcomingAppointments] = await Promise.all([
          pool.query('SELECT COUNT(*) as count FROM appointments WHERE user_id = $1 AND appointment_date = $2 AND status != $3', [userId, today, 'cancelled']),
          pool.query('SELECT COUNT(*) as count FROM customers WHERE user_id = $1', [userId]),
          pool.query('SELECT COUNT(*) as count FROM services WHERE user_id = $1', [userId]),
          pool.query(`
            SELECT COALESCE(SUM(sv.price), 0) as revenue 
            FROM appointments a 
            JOIN services sv ON a.service_id = sv.id 
            WHERE a.user_id = $1 AND a.appointment_date LIKE $2 AND a.status = 'confirmed'
          `, [userId, thisMonth + '%']),
          pool.query(`
            SELECT COUNT(*) as count 
            FROM appointments 
            WHERE user_id = $1 AND appointment_date > $2 AND status = 'confirmed'
          `, [userId, today])
        ]);
        
        logRequest(req, 200, 'Dashboard data retrieved');
        
        return res.json({
          todayAppointments: parseInt(appointments.rows[0].count),
          totalCustomers: parseInt(customers.rows[0].count),
          totalServices: parseInt(services.rows[0].count),
          monthlyRevenue: parseFloat(monthlyRevenue.rows[0].revenue),
          upcomingAppointments: parseInt(upcomingAppointments.rows[0].count),
          currentDate: today
        });
      } catch (error) {
        logRequest(req, 500, `Dashboard error: ${error.message}`);
        throw error;
      }
    }

    // Services
    if (path === '/services' && method === 'GET') {
      try {
        const result = await pool.query(
          'SELECT *, created_at, updated_at FROM services WHERE user_id = $1 ORDER BY category, name', 
          [userId]
        );
        logRequest(req, 200, 'Services retrieved');
        return res.json(result.rows);
      } catch (error) {
        logRequest(req, 500, `Services error: ${error.message}`);
        throw error;
      }
    }

    // Staff
    if (path === '/staff' && method === 'GET') {
      try {
        const result = await pool.query(
          'SELECT *, created_at, updated_at FROM staff WHERE user_id = $1 ORDER BY name', 
          [userId]
        );
        logRequest(req, 200, 'Staff retrieved');
        return res.json(result.rows);
      } catch (error) {
        logRequest(req, 500, `Staff error: ${error.message}`);
        throw error;
      }
    }

    // Customers
    if (path === '/customers' && method === 'GET') {
      try {
        const result = await pool.query(
          'SELECT *, created_at, updated_at FROM customers WHERE user_id = $1 ORDER BY created_at DESC', 
          [userId]
        );
        logRequest(req, 200, 'Customers retrieved');
        return res.json(result.rows);
      } catch (error) {
        logRequest(req, 500, `Customers error: ${error.message}`);
        throw error;
      }
    }

    // Appointments
    if (path === '/appointments' && method === 'GET') {
      try {
        const result = await pool.query(`
          SELECT a.*, 
                 c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
                 s.name as staff_name, 
                 sv.name as service_name, sv.price as service_price, sv.duration as service_duration,
                 a.created_at, a.updated_at
          FROM appointments a
          JOIN customers c ON a.customer_id = c.id
          JOIN staff s ON a.staff_id = s.id  
          JOIN services sv ON a.service_id = sv.id
          WHERE a.user_id = $1
          ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `, [userId]);
        
        logRequest(req, 200, 'Appointments retrieved');
        return res.json(result.rows);
      } catch (error) {
        logRequest(req, 500, `Appointments error: ${error.message}`);
        throw error;
      }
    }

    // Test für authentifizierte Routen
    if (path === '/test-auth') {
      logRequest(req, 200, 'Auth test successful');
      return res.json({
        message: 'Authentifizierung erfolgreich!',
        userId: userId,
        timestamp: new Date().toISOString(),
        requestProcessingTime: `${Date.now() - startTime}ms`
      });
    }

    // 404 für unbekannte Routen
    logRequest(req, 404, `Unknown endpoint: ${path}`);
    return res.status(404).json({ 
      error: 'Endpoint nicht gefunden',
      path: path,
      method: method,
      availableEndpoints: [
        'GET /health - System-Status',
        'POST /register - Account erstellen', 
        'POST /login - Anmelden',
        'GET /dashboard - Dashboard-Statistiken',
        'GET /services - Services verwalten',
        'GET /staff - Mitarbeiter verwalten',
        'GET /customers - Kunden verwalten',
        'GET /appointments - Termine verwalten'
      ]
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logRequest(req, 500, `Server error: ${error.message} (${processingTime}ms)`);
    
    // Detaillierte Fehlerbehandlung für Produktion
    let errorMessage = 'Ein unerwarteter Serverfehler ist aufgetreten';
    let statusCode = 500;
    
    if (error.message.includes('Token') || error.message.includes('Zugriff verweigert')) {
      errorMessage = error.message;
      statusCode = 401;
    } else if (error.message.includes('Validierung') || error.message.includes('erforderlich')) {
      errorMessage = error.message;
      statusCode = 400;
    }
    
    return res.status(statusCode).json({ 
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message,
        stack: error.stack 
      })
    });
  }
};
