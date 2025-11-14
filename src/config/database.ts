import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Verificar conexión
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error al conectar a la base de datos:', err.stack);
  } else {
    console.log('✅ Conectado a PostgreSQL en Supabase');
    release();
  }
});

// Verificar que las tablas existen
export async function initDatabase() {
  try {
    // Primero verificar la conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a base de datos establecida');
    
    const tables = ['datos_judiciales', 'usuarios', 'ficha_socioeconomica', 'actividades_personales'];
    
    for (const tableName of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `, [tableName]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Tabla "${tableName}" encontrada`);
      } else {
        console.log(`⚠️ Tabla "${tableName}" no existe`);
      }
    }
  } catch (error) {
    console.error('❌ Error al verificar tablas:', error);
    throw error; // Es importante lanzar el error para que se capture arriba
  }
}

export const db = pool;