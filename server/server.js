import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Initialize environment variables
dotenv.config();

// Create uploads directory if it doesn't exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database setup
let db;

async function initializeDatabase() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medication_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      proof_image TEXT,
      FOREIGN KEY (medication_id) REFERENCES medications (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS caretaker_patient (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caretaker_id INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (caretaker_id) REFERENCES users (id),
      FOREIGN KEY (patient_id) REFERENCES users (id)
    );
  `);

  console.log('Database initialized');
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    
    // Validate input
    if (!username || !password || !email || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user into database
    const result = await db.run(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email, role]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: result.lastID, username, role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.lastID,
        username,
        email,
        role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Medication routes
app.get('/api/medications', authenticateToken, async (req, res) => {
  try {
    const medications = await db.all(
      'SELECT * FROM medications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Server error fetching medications' });
  }
});

app.post('/api/medications', authenticateToken, async (req, res) => {
  try {
    const { name, dosage, frequency, time } = req.body;
    
    // Validate input
    if (!name || !dosage || !frequency || !time) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Insert medication
    const result = await db.run(
      'INSERT INTO medications (user_id, name, dosage, frequency, time) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name, dosage, frequency, time]
    );
    
    const newMedication = await db.get('SELECT * FROM medications WHERE id = ?', [result.lastID]);
    
    res.status(201).json({
      message: 'Medication added successfully',
      medication: newMedication
    });
  } catch (error) {
    console.error('Error adding medication:', error);
    res.status(500).json({ error: 'Server error adding medication' });
  }
});

app.put('/api/medications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dosage, frequency, time } = req.body;
    
    // Validate input
    if (!name || !dosage || !frequency || !time) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if medication exists and belongs to user
    const medication = await db.get(
      'SELECT * FROM medications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found or unauthorized' });
    }
    
    // Update medication
    await db.run(
      'UPDATE medications SET name = ?, dosage = ?, frequency = ?, time = ? WHERE id = ?',
      [name, dosage, frequency, time, id]
    );
    
    const updatedMedication = await db.get('SELECT * FROM medications WHERE id = ?', [id]);
    
    res.json({
      message: 'Medication updated successfully',
      medication: updatedMedication
    });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ error: 'Server error updating medication' });
  }
});

app.delete('/api/medications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if medication exists and belongs to user
    const medication = await db.get(
      'SELECT * FROM medications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found or unauthorized' });
    }
    
    // Delete medication logs first (foreign key constraint)
    await db.run('DELETE FROM medication_logs WHERE medication_id = ?', [id]);
    
    // Delete medication
    await db.run('DELETE FROM medications WHERE id = ?', [id]);
    
    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ error: 'Server error deleting medication' });
  }
});

// Medication logs routes
app.post('/api/medications/:id/log', authenticateToken, upload.single('proof_image'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if medication exists and belongs to user
    const medication = await db.get(
      'SELECT * FROM medications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found or unauthorized' });
    }
    
    // Check if medication was already taken today
    const today = new Date().toISOString().split('T')[0];
    const existingLog = await db.get(
      `SELECT * FROM medication_logs 
       WHERE medication_id = ? AND user_id = ? AND date(taken_at) = ?`,
      [id, req.user.id, today]
    );
    
    if (existingLog) {
      return res.status(409).json({ error: 'Medication already logged for today' });
    }
    
    // Insert log
    const proofImage = req.file ? `/uploads/${req.file.filename}` : null;
    
    const result = await db.run(
      'INSERT INTO medication_logs (medication_id, user_id, proof_image) VALUES (?, ?, ?)',
      [id, req.user.id, proofImage]
    );
    
    const newLog = await db.get('SELECT * FROM medication_logs WHERE id = ?', [result.lastID]);
    
    res.status(201).json({
      message: 'Medication logged successfully',
      log: newLog
    });
  } catch (error) {
    console.error('Error logging medication:', error);
    res.status(500).json({ error: 'Server error logging medication' });
  }
});

app.get('/api/medication-logs', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT ml.*, m.name, m.dosage, m.time 
      FROM medication_logs ml
      JOIN medications m ON ml.medication_id = m.id
      WHERE ml.user_id = ?
    `;
    
    const params = [req.user.id];
    
    if (startDate) {
      query += ' AND date(ml.taken_at) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND date(ml.taken_at) <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY ml.taken_at DESC';
    
    const logs = await db.all(query, params);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching medication logs:', error);
    res.status(500).json({ error: 'Server error fetching medication logs' });
  }
});

// Caretaker-patient relationship routes
app.post('/api/caretaker/patients', authenticateToken, async (req, res) => {
  try {
    // Ensure user is a caretaker
    if (req.user.role !== 'caretaker') {
      return res.status(403).json({ error: 'Only caretakers can add patients' });
    }
    
    const { patientId } = req.body;
    
    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }
    
    // Check if patient exists
    const patient = await db.get('SELECT * FROM users WHERE id = ? AND role = ?', [patientId, 'patient']);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Check if relationship already exists
    const existingRelationship = await db.get(
      'SELECT * FROM caretaker_patient WHERE caretaker_id = ? AND patient_id = ?',
      [req.user.id, patientId]
    );
    
    if (existingRelationship) {
      return res.status(409).json({ error: 'Patient already added' });
    }
    
    // Create relationship
    await db.run(
      'INSERT INTO caretaker_patient (caretaker_id, patient_id) VALUES (?, ?)',
      [req.user.id, patientId]
    );
    
    res.status(201).json({ message: 'Patient added successfully' });
  } catch (error) {
    console.error('Error adding patient:', error);
    res.status(500).json({ error: 'Server error adding patient' });
  }
});

app.get('/api/caretaker/patients', authenticateToken, async (req, res) => {
  try {
    // Ensure user is a caretaker
    if (req.user.role !== 'caretaker') {
      return res.status(403).json({ error: 'Only caretakers can view patients' });
    }
    
    const patients = await db.all(`
      SELECT u.id, u.username, u.email, cp.created_at as added_at
      FROM caretaker_patient cp
      JOIN users u ON cp.patient_id = u.id
      WHERE cp.caretaker_id = ?
    `, [req.user.id]);
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Server error fetching patients' });
  }
});


app.get('/api/caretaker/patients/:patientId/medications', authenticateToken, async (req, res) => {
  try {
    // Ensure user is a caretaker
    if (req.user.role !== 'caretaker') {
      return res.status(403).json({ error: 'Only caretakers can view patient medications' });
    }
    
    const { patientId } = req.params;
    
    // Check if caretaker has access to this patient
    const hasAccess = await db.get(
      'SELECT * FROM caretaker_patient WHERE caretaker_id = ? AND patient_id = ?',
      [req.user.id, patientId]
    );
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized to view this patient\'s medications' });
    }
    
    const medications = await db.all(
      'SELECT * FROM medications WHERE user_id = ? ORDER BY created_at DESC',
      [patientId]
    );
    
    res.json(medications);
  } catch (error) {
    console.error('Error fetching patient medications:', error);
    res.status(500).json({ error: 'Server error fetching patient medications' });
  }
});

app.get('/api/caretaker/patients/:patientId/logs', authenticateToken, async (req, res) => {
  try {
    // Ensure user is a caretaker
    if (req.user.role !== 'caretaker') {
      return res.status(403).json({ error: 'Only caretakers can view patient logs' });
    }
    
    const { patientId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check if caretaker has access to this patient
    const hasAccess = await db.get(
      'SELECT * FROM caretaker_patient WHERE caretaker_id = ? AND patient_id = ?',
      [req.user.id, patientId]
    );
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized to view this patient\'s logs' });
    }
    
    let query = `
      SELECT ml.*, m.name, m.dosage, m.time 
      FROM medication_logs ml
      JOIN medications m ON ml.medication_id = m.id
      WHERE ml.user_id = ?
    `;
    
    const params = [patientId];
    
    if (startDate) {
      query += ' AND date(ml.taken_at) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND date(ml.taken_at) <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY ml.taken_at DESC';
    
    const logs = await db.all(query, params);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching patient logs:', error);
    res.status(500).json({ error: 'Server error fetching patient logs' });
  }
});

// Start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});