// api/index.js - Vercel Serverless Functions
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Datenbankverbindung
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
};

// Helper Functions
const connectDB = async () => {
  return await mysql.createConnection(dbConfig);
};

const authenticateToken = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    throw new Error('Access Token erforderlich');
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'terminbuchung_secret');
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

// Main Handler
module.exports = async (req, res) => {
  setCORSHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  const path = url.replace('/api', '');

  try {
    // Registrierung
    if (path === '/register' && method === 'POST') {
      const { email, password, salonName } = req.body;
      const db = await connectDB();
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await db.execute(
        'INSERT INTO users (email, password, salon_name) VALUES (?, ?, ?)',
        [email, hashedPassword, salonName]
      );
      
      await db.end();
      res.status(201).json({ message: 'Account erfolgreich erstellt' });
      return;
    }

    // Login
    if (path === '/login' && method === 'POST') {
      const { email, password } = req.body;
      const db = await connectDB();
      
      const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      
      if (users.length === 0) {
        await db.end();
        res.status(401).json({ error: 'Ungültige Anmeldedaten' });
        return;
      }
      
      const user = users[0];
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        await db.end();
        res.status(401).json({ error: 'Ungültige Anmeldedaten' });
        return;
      }
      
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'terminbuchung_secret');
      
      await db.end();
      res.json({ 
        token, 
        user: { id: user.id, email: user.email, salonName: user.salon_name }
      });
      return;
    }

    // Authentifizierte Routen
    const userId = authenticateToken(req);
    const db = await connectDB();

    // Services
    if (path === '/services' && method === 'GET') {
      const [services] = await db.execute('SELECT * FROM services WHERE user_id = ?', [userId]);
      await db.end();
      res.json(services);
      return;
    }

    if (path === '/services' && method === 'POST') {
      const { name, duration, price, icon } = req.body;
      const [result] = await db.execute(
        'INSERT INTO services (user_id, name, duration, price, icon) VALUES (?, ?, ?, ?, ?)',
        [userId, name, duration, price, icon]
      );
      await db.end();
      res.status(201).json({ id: result.insertId, name, duration, price, icon });
      return;
    }

    // Staff
    if (path === '/staff' && method === 'GET') {
      const [staff] = await db.execute('SELECT * FROM staff WHERE user_id = ?', [userId]);
      await db.end();
      res.json(staff);
      return;
    }

    if (path === '/staff' && method === 'POST') {
      const { name, specialty, email, phone } = req.body;
      const [result] = await db.execute(
        'INSERT INTO staff (user_id, name, specialty, email, phone) VALUES (?, ?, ?, ?, ?)',
        [userId, name, specialty, email, phone]
      );
      await db.end();
      res.status(201).json({ id: result.insertId, name, specialty, email, phone });
      return;
    }

    // Customers
    if (path === '/customers' && method === 'GET') {
      const [customers] = await db.execute('SELECT * FROM customers WHERE user_id = ?', [userId]);
      await db.end();
      res.json(customers);
      return;
    }

    if (path === '/customers' && method === 'POST') {
      const { name, phone, email } = req.body;
      const [result] = await db.execute(
        'INSERT INTO customers (user_id, name, phone, email) VALUES (?, ?, ?, ?)',
        [userId, name, phone, email]
      );
      await db.end();
      res.status(201).json({ id: result.insertId, name, phone, email, totalVisits: 0 });
      return;
    }

    // Appointments
    if (path === '/appointments' && method === 'GET') {
      const [appointments] = await db.execute(`
        SELECT a.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
               s.name as staff_name, sv.name as service_name, sv.price as service_price
        FROM appointments a
        JOIN customers c ON a.customer_id = c.id
        JOIN staff s ON a.staff_id = s.id  
        JOIN services sv ON a.service_id = sv.id
        WHERE a.user_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `, [userId]);
      await db.end();
      res.json(appointments);
      return;
    }

    if (path === '/appointments' && method === 'POST') {
      const { customerId, staffId, serviceId, date, time } = req.body;
      
      // Verfügbarkeit prüfen
      const [existing] = await db.execute(
        'SELECT id FROM appointments WHERE staff_id = ? AND appointment_date = ? AND appointment_time = ? AND status != "cancelled"',
        [staffId, date, time]
      );
      
      if (existing.length > 0) {
        await db.end();
        res.status(400).json({ error: 'Zeitslot bereits belegt' });
        return;
      }
      
      const [result] = await db.execute(
        'INSERT INTO appointments (user_id, customer_id, staff_id, service_id, appointment_date, appointment_time) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, customerId, staffId, serviceId, date, time]
      );
      
      // Kundenstatistik aktualisieren
      await db.execute(
        'UPDATE customers SET total_visits = total_visits + 1, last_visit = ? WHERE id = ?',
        [date, customerId]
      );
      
      await db.end();
      res.status(201).json({ id: result.insertId, message: 'Termin erfolgreich gebucht' });
      return;
    }

    await db.end();
    res.status(404).json({ error: 'Endpoint nicht gefunden' });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
};
