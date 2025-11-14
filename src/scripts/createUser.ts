import bcrypt from 'bcrypt';
import { pool } from '../config/database';

async function createUser(email: string, password: string, nombreCompleto: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  
  const result = await pool.query(
    'INSERT INTO usuarios (email, password_hash, nombre_completo) VALUES ($1, $2, $3) RETURNING *',
    [email, passwordHash, nombreCompleto]
  );
  
  console.log('✅ Usuario creado:', result.rows[0]);
}