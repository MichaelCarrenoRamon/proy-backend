import { Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_cambiala';
const MAX_INTENTOS = 3;
const TIEMPO_BLOQUEO = 15; // minutos

export class AuthController {
  // Login
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
      }

      // Buscar usuario
      const result = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const user = result.rows[0];

      // Verificar si está bloqueado
      if (user.bloqueado_hasta) {
        const ahora = new Date();
        const bloqueoHasta = new Date(user.bloqueado_hasta);
        
        if (ahora < bloqueoHasta) {
          const minutosRestantes = Math.ceil((bloqueoHasta.getTime() - ahora.getTime()) / 60000);
          return res.status(403).json({ 
            error: `Cuenta bloqueada. Intenta de nuevo en ${minutosRestantes} minutos.` 
          });
        } else {
          // Desbloquear cuenta
          await pool.query(
            'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1',
            [user.id]
          );
          user.intentos_fallidos = 0;
        }
      }

      // Verificar si está activo
      if (!user.activo) {
        return res.status(403).json({ error: 'Cuenta inactiva. Contacta al administrador.' });
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, user.password_hash);

      if (!passwordValida) {
        // Incrementar intentos fallidos
        const nuevosIntentos = user.intentos_fallidos + 1;
        
        if (nuevosIntentos >= MAX_INTENTOS) {
          const bloqueadoHasta = new Date();
          bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + TIEMPO_BLOQUEO);
          
          await pool.query(
            'UPDATE usuarios SET intentos_fallidos = $1, bloqueado_hasta = $2 WHERE id = $3',
            [nuevosIntentos, bloqueadoHasta, user.id]
          );
          
          return res.status(403).json({ 
            error: `Has excedido el número máximo de intentos. Cuenta bloqueada por ${TIEMPO_BLOQUEO} minutos.` 
          });
        } else {
          await pool.query(
            'UPDATE usuarios SET intentos_fallidos = $1 WHERE id = $2',
            [nuevosIntentos, user.id]
          );
          
          return res.status(401).json({ 
            error: `Credenciales inválidas. Te quedan ${MAX_INTENTOS - nuevosIntentos} intentos.` 
          });
        }
      }

      // Login exitoso - resetear intentos
      await pool.query(
        'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1',
        [user.id]
      );

      // Generar token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          nombre: user.nombre_completo
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre_completo: user.nombre_completo,
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  // Solicitar recuperación de contraseña
  static async requestPasswordRecovery(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const result = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1',
        [email]
      );

      // Siempre devolver éxito (seguridad)
      if (result.rows.length === 0) {
        return res.json({ 
          message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña.' 
        });
      }

      const user = result.rows[0];

      // Generar token único
      const token = crypto.randomBytes(32).toString('hex');
      const expiracion = new Date();
      expiracion.setHours(expiracion.getHours() + 1); // Token válido por 1 hora

      await pool.query(
        'UPDATE usuarios SET token_recuperacion = $1, token_expiracion = $2 WHERE id = $3',
        [token, expiracion, user.id]
      );

      // En producción, aquí enviarías un email
      console.log('Token de recuperación:', token);
      console.log('URL de recuperación:', `http://localhost:5173/#recovery?token=${token}`);

      res.json({ 
        message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña.',
        // SOLO PARA DESARROLLO - ELIMINAR EN PRODUCCIÓN
        devToken: token 
      });

    } catch (error) {
      console.error('Error en recuperación:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  // Resetear contraseña con token
  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Buscar usuario con token válido
      const result = await pool.query(
        'SELECT * FROM usuarios WHERE token_recuperacion = $1 AND token_expiracion > NOW()',
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Token inválido o expirado' });
      }

      const user = result.rows[0];

      // Hash nueva contraseña
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña y limpiar token
      await pool.query(
        `UPDATE usuarios SET 
          password_hash = $1, 
          token_recuperacion = NULL, 
          token_expiracion = NULL,
          intentos_fallidos = 0,
          bloqueado_hasta = NULL
        WHERE id = $2`,
        [passwordHash, user.id]
      );

      res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  // Verificar token
  static async verifyToken(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const result = await pool.query(
        'SELECT id, email, nombre_completo FROM usuarios WHERE id = $1 AND activo = true',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      res.json({ user: result.rows[0] });

    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  }
}