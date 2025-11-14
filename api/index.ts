import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from '../src/config/database';
import caseRoutes from '../src/routes/caseRoutes';
import activityRoutes from '../src/routes/activityRoutes';
import authRoutes from '../src/routes/authRoutes';
import { pool } from '../src/config/database'; // Importa el pool

dotenv.config();

const app = express();

// Configuración de CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000'
    ];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Origen bloqueado por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Logging middleware
app.use('/api/cases/complete', (req, res, next) => {
  console.log('🔐 Headers recibidos:', req.headers);
  console.log('📦 Body recibido:', req.body);
  next();
});

// Rutas
app.use('/api', caseRoutes);
app.use('/api', activityRoutes);
app.use('/api/auth', authRoutes);

// Health check básico
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Consultorio Jurídico funcionando' });
});

// Health check con verificación de base de datos
app.get('/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as database');
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
    
    res.json({
      status: 'ok',
      message: 'Conexión a base de datos exitosa',
      database: result.rows[0].database,
      serverTime: result.rows[0].time,
      usersCount: usersCount.rows[0].count,
      databaseUrl: process.env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada'
    });
  } catch (error: any) {
    console.error('❌ Error de conexión a BD:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al conectar con la base de datos',
      error: error.message,
      databaseUrl: process.env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada'
    });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Consultorio Jurídico',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      healthDb: '/health/db',
      auth: '/api/auth',
      cases: '/api/cases',
      activities: '/api/activities'
    }
  });
});

// Inicializar base de datos
let initialized = false;

async function init() {
  if (!initialized) {
    try {
      await initDatabase();
      console.log('✅ Base de datos inicializada');
      initialized = true;
    } catch (error) {
      console.error('❌ Error al inicializar BD:', error);
    }
  }
}

// Handler para Vercel
export default async (req: any, res: any) => {
  await init();
  return app(req, res);
};