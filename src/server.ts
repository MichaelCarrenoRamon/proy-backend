import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import caseRoutes from './routes/caseRoutes';
import activityRoutes from './routes/activityRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Consultorio Jurídico funcionando' });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Consultorio Jurídico',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      cases: '/api/cases',
      activities: '/api/activities'
    }
  });
});

// Inicializar base de datos y servidor
async function startServer() {
  try {
    await initDatabase();
    
    // Solo hacer listen en desarrollo (NO en Vercel)
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      });
    }
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
  }
}

// Inicializar
startServer();

// Exportar para Vercel (serverless)
export default app;