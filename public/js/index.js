// ProfiSlots Backend API
// Vollständiges Node.js Backend für Vercel mit PostgreSQL

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ==================== DATABASE CONNECTION ====================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// ==================== HELPER FUNCTIONS ====================

// JWT Authentication
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
    throw new Error('Ungültiger oder abgelaufener Token');
  }
};

// CORS Headers
const setCORSHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Error Response Helper
const sendError = (res, status, message, details = null) => {
  const errorResponse = {
    error: message,
    timestamp: new Date().toISOString()
  };
  
  if (details && process.env.NODE_ENV !== 'production') {
    errorResponse.details = details;
  }
  
  console.error(`API Error ${status}: ${message}`, details);
  return res.status(status).json(errorResponse);
};

// Success Response Helper
const sendSuccess = (res, data, message = null) => {
  const response = {
    ...data,
    timestamp: new Date().toISOString()
  };
  
  if (message) {
    response.message = message;
  }
  
  return res.status(200).json(response);
};

// Input Validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateName = (name) => {
  return name && name.trim().length >= 2;
};

const validatePhone = (phone) => {
  return phone && phone.trim().length >= 8;
};

// ==================== DEFAULT DATA CREATION ====================
async function createDefaultData(userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Default Services
    const defaultServices = [
      { name: 'Haarschnitt', duration: 60, price: 45.00, icon: 'Scissors' },
      { name: 'Färbung', duration: 120, price: 80.00, icon: 'Scissors' },
      { name: 'Massage (60 Min)', duration: 60, price: 65.00, icon: 'Heart' },
      { name: 'Beratung', duration: 30, price: 35.00, icon: 'MessageSquare' },
      { name: 'Styling', duration: 45, price: 40.00, icon: 'Scissors' }
    ];
    
    for (const service of defaultServices) {
      await client.query(
        'INSERT INTO services (user_id, name, duration, price, icon) VALUES ($1, $2, $3, $4, $5)',
        [userId, service.name, service.duration, service.price, service.icon]
      );
    }
    
    // Default Staff Member
    await client.query(
      'INSERT INTO staff (user_id, name, specialty, email, phone) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'Standard Mitarbeiter', 'Allgemein', '', '']
    );
    
    await client.query('COMMIT');
    console.log(`✅ Default data created for user ${userId}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating default data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ==================== MAIN API HANDLER ====================
module.exports = async (req, res) => {
  setCORSHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  const path = url.replace('/api', '') || '/';
  
  console.log(`🌐 ${method} ${path}`, {
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent']?.substring(0, 50)
  });

  try {
    // ==================== HEALTH CHECK ====================
    if (path.includes('/health')) {
      try {
        // Test database connection
        await pool.query('SELECT NOW()');
        return sendSuccess(res, {
          status: 'ProfiSlots API Online',
          version: '1.0.0',
          database: 'Connected',
          environment: process.env.NODE_ENV || 'development'
        });
      } catch (dbError) {
        return sendError(res, 503, 'Database connection failed', dbError.message);
      }
    }

    // ==================== API INFO ====================
    if (path === '/' || path === '') {
      return sendSuccess(res, {
        message: 'ProfiSlots Terminbuchungssystem API',
        status: 'online',
        version: '1.0.0',
        endpoints: {
          auth: ['POST /register', 'POST /login'],
          dashboard: ['GET /dashboard'],
          services: ['GET /services', 'POST /services', 'PUT /services/:id', 'DELETE /services/:id'],
          staff: ['GET /staff', 'POST /staff', 'PUT /staff/:id', 'DELETE /staff/:id'],
          customers: ['GET /customers', 'POST /customers', 'PUT /customers/:id', 'DELETE /customers/:id', 'GET /customers/search'],
          appointments: ['GET /appointments', 'POST /appointments', 'PUT /appointments/:id', 'DELETE /appointments/:id', 'GET /appointments/date/:date']
        }
      });
    }

    // ==================== AUTHENTICATION ROUTES ====================
    
    // User Registration
    if (path === '/register' && method === 'POST') {
      const { email, password, salonName } = req.body;
      
      // Validation
      if (!email || !password || !salonName) {
        return sendError(res, 400, 'E-Mail, Passwort und Salon-Name sind erforderlich');
      }

      if (!validateEmail(email)) {
        return sendError(res, 400, 'Ungültige E-Mail-Adresse');
      }

      if (!validatePassword(password)) {
        return sendError(res, 400, 'Passwort muss mindestens 6 Zeichen haben');
      }

      if (!validateName(salonName)) {
        return sendError(res, 400, 'Gültiger Salon-Name ist erforderlich');
      }
      
      const client = await pool.connect();
      
      try {
        // Check if email already exists
        const existingUser = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [email.toLowerCase()]
        );
        
        if (existingUser.rows.length > 0) {
          return sendError(res, 409, 'Diese E-Mail-Adresse ist bereits registriert');
        }
        
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create user
        const result = await client.query(
          'INSERT INTO users (email, password, salon_name) VALUES ($1, $2, $3) RETURNING id, email, salon_name, created_at',
          [email.toLowerCase(), hashedPassword, salonName.trim()]
        );
        
        const newUser = result.rows[0];
        
        // Create default data
        await createDefaultData(newUser.id);
        
        console.log(`✅ New user registered: ${newUser.email}`);
        
        return sendSuccess(res, {
          message: 'Account erfolgreich erstellt! Sie können sich jetzt anmelden.',
          user: {
            id: newUser.id,
            email: newUser.email,
            salonName: newUser.salon_name,
            createdAt: newUser.created_at
          }
        });
        
      } finally {
        client.release();
      }
    }

    // User Login
    if (path === '/login' && method === 'POST') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return sendError(res, 400, 'E-Mail und Passwort sind erforderlich');
      }
      
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
        { 
          id: user.id, 
          email: user.email 
        }, 
        process.env.JWT_SECRET || '306651848', 
        { expiresIn: '7d' }
      );
      
      console.log(`✅ User logged in: ${user.email}`);
      
      return sendSuccess(res, {
        message: 'Erfolgreich angemeldet',
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          salonName: user.salon_name,
          createdAt: user.created_at
        }
      });
    }

    // ==================== PROTECTED ROUTES ====================
    const userId = authenticateToken(req);

    // Dashboard Statistics
    if (path === '/dashboard' && method === 'GET') {
      const today = new Date().toISOString().split('T')[0];
      
      const [appointmentsResult, customersResult, servicesResult] = await Promise.all([
        pool.query(
          'SELECT COUNT(*) as count FROM appointments WHERE user_id = $1 AND appointment_date = $2 AND status != $3', 
          [userId, today, 'cancelled']
        ),
        pool.query('SELECT COUNT(*) as count FROM customers WHERE user_id = $1', [userId]),
        pool.query('SELECT COUNT(*) as count FROM services WHERE user_id = $1', [userId])
      ]);
      
      return sendSuccess(res, {
        todayAppointments: parseInt(appointmentsResult.rows[0].count),
        totalCustomers: parseInt(customersResult.rows[0].count),
        totalServices: parseInt(servicesResult.rows[0].count)
      });
    }

    // ==================== SERVICES ROUTES ====================
    
    // Get all services
    if (path === '/services' && method === 'GET') {
      const result = await pool.query(
        'SELECT * FROM services WHERE user_id = $1 ORDER BY created_at ASC',
        [userId]
      );
      return sendSuccess(res, result.rows);
    }

    // Create service
    if (path === '/services' && method === 'POST') {
      const { name, duration, price, icon } = req.body;
      
      if (!validateName(name) || !duration || duration <= 0 || price < 0) {
        return sendError(res, 400, 'Ungültige Service-Daten');
      }

      const result = await pool.query(
        'INSERT INTO services (user_id, name, duration, price, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, name.trim(), parseInt(duration), parseFloat(price), icon || 'Scissors']
      );
      
      return sendSuccess(res, result.rows[0], 'Service erfolgreich erstellt');
    }

    // Update service
    if (path.startsWith('/services/') && method === 'PUT') {
      const serviceId = path.split('/')[2];
      const { name, duration, price, icon } = req.body;
      
      if (!validateName(name) || !duration || duration <= 0 || price < 0) {
        return sendError(res, 400, 'Ungültige Service-Daten');
      }

      const result = await pool.query(
        'UPDATE services SET name = $1, duration = $2, price = $3, icon = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
        [name.trim(), parseInt(duration), parseFloat(price), icon || 'Scissors', serviceId, userId]
      );
      
      if (result.rows.length === 0) {
        return sendError(res, 404, 'Service nicht gefunden');
      }
      
      return sendSuccess(res, result.rows[0], 'Service erfolgreich aktualisiert');
    }

    // Delete service
    if (path.startsWith('/services/') && method === 'DELETE') {
      const serviceId = path.split('/')[2];
      
      const result = await pool.query(
        'DELETE FROM services WHERE id = $1 AND user_id = $2 RETURNING *',
        [serviceId, userId]
      );
      
      if (result.rows.length === 0) {
        return sendError(res, 404, 'Service nicht gefunden');
      }
      
      return sendSuccess(res, {}, 'Service erfolgreich gelöscht');
    }

    // ==================== STAFF ROUTES ====================
    
    // Get all staff
    if (path === '/staff' && method === 'GET') {
      const result = await pool.query(
        'SELECT * FROM staff WHERE user_id = $1 ORDER BY created_at ASC',
        [userId]
      );
      return sendSuccess(res, result.rows);
    }

    // Create staff member
    if (path === '/staff' && method === 'POST') {
      const { name, specialty, email, phone } = req.body;
      
      if (!validateName(name)) {
        return sendError(res, 400, 'Name ist erforderlich');
      }

      const result = await pool.query(
        'INSERT INTO staff (user_id, name, specialty, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, name.trim(), specialty?.trim() || '', email?.trim() || '', phone?.trim() || '']
      );
      
      return sendSuccess(res, result.rows[0], 'Mitarbeiter erfolgreich erstellt');
    }

    // Update staff member
    if (path.startsWith('/staff/') && method === 'PUT') {
      const staffId = path.split('/')[2];
      const { name, specialty, email, phone } = req.body;
      
      if (!validateName(name)) {
        return sendError(res, 400, 'Name ist erforderlich');
      }

      const result = await pool.query(
        'UPDATE staff SET name = $1, specialty = $2, email = $3, phone = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
        [name.trim(), specialty?.trim() || '', email?.trim() || '', phone?.trim() || '', staffId, userId]
      );
      
      if (result.rows.length === 0) {
        return sendError(res, 404, 'Mitarbeiter nicht gefunden');
      }
      
      return sendSuccess(res, result.rows[0], 'Mitarbeiter erfolgreich aktualisiert');
    }

    // Delete staff member
    if (path.startsWith('/staff/') && method === 'DELETE') {
      const staffId = path.split('/')[2];
      
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Cancel appointments with this staff member
        await client.query(
          'UPDATE appointments SET status = $1 WHERE staff_id = $2 AND user_id = $3',
          ['cancelled', staffId, userId]
        );
        
        // Delete staff member
        const result = await client.query(
          'DELETE FROM staff WHERE id = $1 AND user_id = $2 RETURNING *',
          [staffId, userId]
        );
        
        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          return sendError(res, 404, 'Mitarbeiter nicht gefunden');
        }
        
        await client.query('COMMIT');
        return sendSuccess(res, {}, 'Mitarbeiter erfolgreich gelöscht');
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    // ==================== CUSTOMERS ROUTES ====================
    
    // Get all customers
    if (path === '/customers' && method === 'GET') {
      const result = await pool.query(
        'SELECT * FROM customers WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return sendSuccess(res, result.rows);
    }

    // Search customers
    if (path === '/customers/search' && method === 'GET') {
      const { q } = req.query;
      
      if (!q || q.trim().length < 2) {
        return sendSuccess(res, []);
      }
      
      const searchTerm = `%${q.trim().toLowerCase()}%`;
      const result = await pool.query(
        'SELECT * FROM customers WHERE user_id = $1 AND (LOWER(name) LIKE $2 OR phone LIKE $2) ORDER BY name ASC LIMIT 10',
        [userId, searchTerm]
      );
      
      return sendSuccess(res, result.rows);
    }

    // Create customer
    if (path === '/customers' && method === 'POST') {
      const { name, phone, email } = req.body;
      
      if (!validateName(name)) {
        return sendError(res, 400, 'Gültiger Name ist erforderlich');
      }
      
      if (!validatePhone(phone)) {
        return sendError(res, 400, 'Gültige Telefonnummer ist erforderlich');
      }
      
      if (email && email.trim() && !validateEmail(email)) {
        return sendError(res, 400, 'Gültige E-Mail-Adresse ist erforderlich');
      }

      const result = await pool.query(
        'INSERT INTO customers (user_id, name, phone, email, total_visits, last_visit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [userId, name.trim(), phone.trim(), email?.trim() || '', 0, null]
      );
      
      return sendSuccess(res, result.rows[0], 'Kunde erfolgreich erstellt');
    }

    // Update customer
    if (path.startsWith('/customers/') && method === 'PUT') {
      const customerId = path.split('/')[2];
      const { name, phone, email } = req.body;
      
      if (!validateName(name)) {
        return sendError(res, 400, 'Gültiger Name ist erforderlich');
      }
      
      if (!validatePhone(phone)) {
        return sendError(res, 400, 'Gültige Telefonnummer ist erforderlich');
      }
      
      if (email && email.trim() && !validateEmail(email)) {
        return sendError(res, 400, 'Gültige E-Mail-Adresse ist erforderlich');
      }

      const result = await pool.query(
        'UPDATE customers SET name = $1, phone = $2, email = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
        [name.trim(), phone.trim(), email?.trim() || '', customerId, userId]
      );
      
      if (result.rows.length === 0) {
        return sendError(res, 404, 'Kunde nicht gefunden');
      }
      
      return sendSuccess(res, result.rows[0], 'Kunde erfolgreich aktualisiert');
    }

    // Delete customer
    if (path.startsWith('/customers/') && method === 'DELETE') {
      const customerId = path.split('/')[2];
      
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Cancel appointments with this customer
        await client.query(
          'UPDATE appointments SET status = $1 WHERE customer_id = $2 AND user_id = $3',
          ['cancelled', customerId, userId]
        );
        
        // Delete customer
        const result = await client.query(
          'DELETE FROM customers WHERE id = $1 AND user_id = $2 RETURNING *',
          [customerId, userId]
        );
        
        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          return sendError(res, 404, 'Kunde nicht gefunden');
        }
        
        await client.query('COMMIT');
        return sendSuccess(res, {}, 'Kunde erfolgreich gelöscht');
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    // ==================== APPOINTMENTS ROUTES ====================
    
    // Get all appointments
    if (path === '/appointments' && method === 'GET') {
      const result = await pool.query(`
        SELECT 
          a.*,
          c.name as customer_name, 
          c.phone as customer_phone, 
          c.email as customer_email,
          s.name as staff_name,
          sv.name as service_name, 
          sv.price as service_price, 
          sv.duration as service_duration,
          sv.icon as service_icon
        FROM appointments a
        JOIN customers c ON a.customer_id = c.id
        JOIN staff s ON a.staff_id = s.id  
        JOIN services sv ON a.service_id = sv.id
        WHERE a.user_id = $1
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `, [userId]);
      
      return sendSuccess(res, result.rows);
    }

    // Get appointments by date
    if (path.startsWith('/appointments/date/') && method === 'GET') {
      const date = path.split('/')[3];
      
      const result = await pool.query(`
        SELECT 
          a.*,
          c.name as customer_name, 
          c.phone as customer_phone, 
          c.email as customer_email,
          s.name as staff_name,
          sv.name as service_name, 
          sv.price as service_price, 
          sv.duration as service_duration
        FROM appointments a
        JOIN customers c ON a.customer_id = c.id
        JOIN staff s ON a.staff_id = s.id  
        JOIN services sv ON a.service_id = sv.id
        WHERE a.user_id = $1 AND a.appointment_date = $2
        ORDER BY a.appointment_time ASC
      `, [userId, date]);
      
      return sendSuccess(res, result.rows);
    }

    // Create appointment
    if (path === '/appointments' && method === 'POST') {
      const { customer_id, staff_id, service_id, appointment_date, appointment_time } = req.body;
      
      if (!customer_id || !staff_id || !service_id || !appointment_date || !appointment_time) {
        return sendError(res, 400, 'Alle Termin-Daten sind erforderlich');
      }

      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Check if time slot is available
        const existingAppointment = await client.query(
          'SELECT id FROM appointments WHERE user_id = $1 AND staff_id = $2 AND appointment_date = $3 AND appointment_time = $4 AND status != $5',
          [userId, staff_id, appointment_date, appointment_time, 'cancelled']
        );
        
        if (existingAppointment.rows.length > 0) {
          await client.query('ROLLBACK');
          return sendError(res, 409, 'Dieser Zeitslot ist bereits belegt');
        }
        
        // Create appointment
        const result = await client.query(
          'INSERT INTO appointments (user_id, customer_id, staff_id, service_id, appointment_date, appointment_time, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [userId, customer_id, staff_id, service_id, appointment_date, appointment_time, 'confirmed']
        );
        
        // Update customer statistics
        await client.query(
          'UPDATE customers SET total_visits = total_visits + 1, last_visit = $1 WHERE id = $2 AND user_id = $3',
          [appointment_date, customer_id, userId]
        );
        
        await client.query('COMMIT');
        
        console.log(`✅ Appointment created: ${appointment_date} ${appointment_time}`);
        return sendSuccess(res, result.rows[0], 'Termin erfolgreich gebucht');
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    // Update appointment status
    if (path.startsWith('/appointments/') && path.includes('/cancel') && method === 'PUT') {
      const appointmentId = path.split('/')[2];
      
      const result = await pool.query(
        'UPDATE appointments SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        ['cancelled', appointmentId, userId]
      );
      
      if (result.rows.length === 0) {
        return sendError(res, 404, 'Termin nicht gefunden');
      }
      
      return sendSuccess(res, result.rows[0], 'Termin erfolgreich storniert');
    }

    if (path.startsWith('/appointments/') && path.includes('/confirm') && method === 'PUT') {
      const appointmentId = path.split('/')[2];
      
      const result = await pool.query(
        'UPDATE appointments SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        ['confirmed', appointmentId, userId]
      );
      
      if (result.rows.length === 0) {
        return sendError(res, 404, 'Termin nicht gefunden');
      }
      
      return sendSuccess(res, result.rows[0], 'Termin erfolgreich bestätigt');
    }

    // Update appointment
    if (path.startsWith('/appointments/') && method === 'PUT') {
      const appointmentId = path.split('/')[2];
      const { appointment_date, appointment_time, status } = req.body;
      
      const result = await pool.query(
        'UPDATE appointments SET appointment_date = COALESCE($1, appointment_date), appointment_time = COALESCE($2, appointment_time), status = COALESCE($3, status) WHERE id = $4 AND user_id = $5 RETURNING *',
        [appointment_date, appointment_time, status, appointmentId, userId]
      );
      
      if (result.rows.length === 0) {
        return sendError(res, 404, 'Termin nicht gefunden');
      }
      
      return sendSuccess(res, result.rows[0], 'Termin erfolgreich aktualisiert');
    }

    // Delete appointment
    if (path.startsWith('/appointments/') && method === 'DELETE') {
      const appointmentId = path.split('/')[2];
      
      const result = await pool.query(
        'DELETE FROM appointments WHERE id = $1 AND user_id = $2 RETURNING *',
        [appointmentId, userId]
      );
      
      if (result.rows.length === 0) {
        return sendError(res, 404, 'Termin nicht gefunden');
      }
      
      return sendSuccess(res, {}, 'Termin erfolgreich gelöscht');
    }

    // ==================== 404 - ROUTE NOT FOUND ====================
    return sendError(res, 404, `Endpoint nicht gefunden: ${method} ${path}`, {
      availableEndpoints: ['/health', '/register', '/login', '/dashboard', '/services', '/staff', '/customers', '/appointments']
    });

  } catch (error) {
    console.error('❌ API Error:', {
      method,
      path,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific error types
    if (error.message.includes('Token') || error.message.includes('JWT')) {
      return sendError(res, 401, error.message);
    }
    
    if (error.code === '23505') { // PostgreSQL unique violation
      return sendError(res, 409, 'Datensatz bereits vorhanden');
    }
    
    if (error.code === '23503') { // PostgreSQL foreign key violation
      return sendError(res, 400, 'Referenzierter Datensatz nicht gefunden');
    }
    
    if (error.code === '23502') { // PostgreSQL not null violation
      return sendError(res, 400, 'Erforderliche Felder fehlen');
    }
    
    // Database connection errors
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      return sendError(res, 503, 'Datenbankverbindung fehlgeschlagen');
    }
    
    // Generic server error
    return sendError(res, 500, 'Interner Serverfehler', process.env.NODE_ENV !== 'production' ? error.message : null);
  }
};

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGINT', async () => {
  console.log('🛑 Graceful shutdown initiated...');
  try {
    await pool.end();
    console.log('✅ Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  try {
    await pool.end();
    console.log('✅ Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

console.log('✅ ProfiSlots API Server loaded and ready');
