import { Request, Response } from 'express';
import { pool } from '../config/database';
import { Activity } from '../types/Activity';

export class ActivityController {
  // Obtener todas las actividades
  static async getAll(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT * FROM actividades_personales 
        ORDER BY fecha_actividad DESC, hora_actividad DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener actividades:', error);
      res.status(500).json({ error: 'Error al obtener actividades' });
    }
  }

  // Crear nueva actividad
  static async create(req: Request, res: Response) {
    try {
      const activity: Activity = req.body;
      
      const query = `
        INSERT INTO actividades_personales (
          titulo, descripcion, fecha_actividad, hora_actividad, 
          tipo, completada, cedula_cliente
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        activity.titulo,
        activity.descripcion || null,
        activity.fecha_actividad,
        activity.hora_actividad || null,
        activity.tipo,
        activity.completada || false,
        activity.cedula_cliente || null,
      ];
      
      const result = await pool.query(query, values);
      console.log('Actividad creada exitosamente');
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error al crear actividad:', error);
      res.status(500).json({ error: 'Error al crear actividad' });
    }
  }

  // Actualizar actividad
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const activity: Activity = req.body;
      
      const query = `
        UPDATE actividades_personales SET
          titulo = $1,
          descripcion = $2,
          fecha_actividad = $3,
          hora_actividad = $4,
          tipo = $5,
          completada = $6,
          cedula_cliente = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `;
      
      const values = [
        activity.titulo,
        activity.descripcion,
        activity.fecha_actividad,
        activity.hora_actividad,
        activity.tipo,
        activity.completada,
        activity.cedula_cliente,
        id,
      ];
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error al actualizar actividad:', error);
      res.status(500).json({ error: 'Error al actualizar actividad' });
    }
  }

  // Eliminar actividad
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        'DELETE FROM actividades_personales WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }
      
      res.json({ message: 'Actividad eliminada exitosamente' });
    } catch (error) {
      console.error('Error al eliminar actividad:', error);
      res.status(500).json({ error: 'Error al eliminar actividad' });
    }
  }

  // Marcar como completada
  static async toggleComplete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        'UPDATE actividades_personales SET completada = NOT completada, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error al actualizar actividad:', error);
      res.status(500).json({ error: 'Error al actualizar actividad' });
    }
  }
}