import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, pool } from '../src/config/database';
import caseRoutes from '../src/routes/caseRoutes';
import activityRoutes from '../src/routes/activityRoutes';
import authRoutes from '../src/routes/authRoutes';

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
    // Permitir requests sin origin (como mobile apps o curl)
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

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware mejorado
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    headers: {
      origin: req.headers.origin,
      authorization: req.headers.authorization ? '✓ Presente' : '✗ Ausente'
    }
  });
  next();
});

// Rutas - IMPORTANTE: El orden importa
app.use('/api/auth', authRoutes);
app.use('/api', caseRoutes);
app.use('/api', activityRoutes);

// Health check básico
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API Consultorio Jurídico funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check con verificación de base de datos
app.get('/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as database');
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const casesCount = await pool.query('SELECT COUNT(*) as count FROM datos_judiciales');
    const activitiesCount = await pool.query('SELECT COUNT(*) as count FROM actividades_personales');
    
    res.json({
      status: 'ok',
      message: 'Conexión a base de datos exitosa',
      database: result.rows[0].database,
      serverTime: result.rows[0].time,
      counts: {
        users: usersCount.rows[0].count,
        cases: casesCount.rows[0].count,
        activities: activitiesCount.rows[0].count
      },
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
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      healthDb: '/health/db',
      auth: {
        login: 'POST /api/auth/login',
        verify: 'GET /api/auth/verify',
        recoverPassword: 'POST /api/auth/recover-password',
        resetPassword: 'POST /api/auth/reset-password'
      },
      cases: {
        getAll: 'GET /api/cases',
        getById: 'GET /api/cases/:cedula',
        create: 'POST /api/cases',
        createComplete: 'POST /api/cases/complete',
        update: 'PUT /api/cases/:cedula',
        updateComplete: 'PUT /api/cases/:cedula/complete',
        delete: 'DELETE /api/cases/:cedula',
        getFicha: 'GET /api/cases/:cedula/ficha',
        migrate: 'PUT /api/cases/:cedulaVieja/migrate/:cedulaNueva'
      },
      activities: {
        getAll: 'GET /api/activities',
        create: 'POST /api/activities',
        update: 'PUT /api/activities/:id',
        delete: 'DELETE /api/activities/:id',
        toggle: 'PATCH /api/activities/:id/toggle'
      },
      encuestas: {
        save: 'POST /api/encuestas',
        stats: 'GET /api/encuestas/stats'
      }
    }
  });
});

// Ruta 404 para rutas no encontradas
app.use((req, res) => {
  console.log('❌ Ruta no encontrada:', req.method, req.path);
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
    availableEndpoints: '/health, /health/db, /api/auth/*, /api/cases/*, /api/activities/*'
  });
});

// Manejador de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message,
    path: req.path
  });
});

// Inicializar base de datos
let initialized = false;

async function init() {
  if (!initialized) {
    try {
      console.log('🔄 Inicializando base de datos...');
      await initDatabase();
      console.log('✅ Base de datos inicializada');
      initialized = true;
    } catch (error) {
      console.error('❌ Error al inicializar BD:', error);
      // No lanzar error para que la app siga funcionando
    }
  }
}

// Handler para Vercel - CRÍTICO
export default async (req: any, res: any) => {
  // Inicializar DB solo una vez
  await init();
  
  // Pasar la request a Express
  return app(req, res);
};

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    init();
  });
}