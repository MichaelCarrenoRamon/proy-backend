import { Request, Response } from 'express';
import { pool } from '../config/database';
import { Case } from '../types/Case';

export class CaseController {
  // Obtener todos los casos
  static async getAll(req: Request, res: Response) {
    try {
      const result = await pool.query('SELECT * FROM datos_judiciales ORDER BY nro_de_cedula_usuario DESC');
      console.log(`📊 Se encontraron ${result.rows.length} casos`);
      res.json(result.rows);
    } catch (error) {
      console.error('❌ Error al obtener casos:', error);
      res.status(500).json({ error: 'Error al obtener casos' });
    }
  }

  // Obtener un caso por CEDULA
  static async getById(req: Request, res: Response) {
    try {
      const { cedula } = req.params;
      const result = await pool.query('SELECT * FROM datos_judiciales WHERE nro_de_cedula_usuario = $1', [cedula]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Caso no encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Error al obtener caso:', error);
      res.status(500).json({ error: 'Error al obtener caso' });
    }
  }

  // Crear nuevo caso
  static async create(req: Request, res: Response) {
    try {
      const caseData: Case = req.body;
      
      const query = `
        INSERT INTO datos_judiciales (
          nro_de_cedula_usuario, fecha, gestion, nombres_apellidos, fecha_de_nacimiento,
          nro_proceso_judicial, telefono, materia, tipo_de_proceso, parte_actor_demandado,
          juez_fiscal, juez_fiscal_1, contraparte, actividades_realizadas,
          estado_actual, fecha_de_proxima_actividad
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;
      
      const values = [
        caseData.nro_de_cedula_usuario,
        caseData.fecha,
        caseData.gestion,
        caseData.nombres_y_apellidos_de_usuario,
        caseData.fecha_de_nacimiento,
        caseData.nro_proceso_judicial_expediente,
        caseData.telefono,
        caseData.materia,
        caseData.tipo_de_proceso,
        caseData.parte_actor_demandado,
        caseData.juez_fiscal,
        caseData.juez_fiscal_1,
        caseData.contraparte,
        caseData.actividades_realizadas,
        caseData.estado_actual,
        caseData.fecha_de_proxima_actividad,
      ];
      
      const result = await pool.query(query, values);
      console.log('✅ Caso creado exitosamente');
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('❌ Error al crear caso:', error);
      res.status(500).json({ error: 'Error al crear caso', details: error });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { cedula } = req.params;  // ✅ Debe ser 'cedula'
      const updates = req.body;
      
      console.log('📝 Actualizando caso con cédula:', cedula);
      console.log('📦 Datos recibidos:', JSON.stringify(updates, null, 2));
      
      // Verificar que el caso existe
      const checkQuery = 'SELECT * FROM datos_judiciales WHERE nro_de_cedula_usuario = $1';
      const checkResult = await pool.query(checkQuery, [cedula]);
      
      if (checkResult.rows.length === 0) {
        console.error('❌ Caso no encontrado con cédula:', cedula);
        return res.status(404).json({ error: 'Caso no encontrado' });
      }
      
      console.log('✅ Caso encontrado:', checkResult.rows[0].nombres_y_apellidos_de_usuario);
      
      // Construir query dinámicamente
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      const allowedFields: { [key: string]: string } = {
        'fecha': 'fecha',
        'gestion': 'gestion',
        'nombres_y_apellidos_de_usuario': 'nombres_y_apellidos_de_usuario',
        'fecha_de_nacimiento': 'fecha_de_nacimiento',
        'nro_proceso_judicial_expediente': 'nro_proceso_judicial_expediente',
        'telefono': 'telefono',
        'telefono_fijo': 'telefono_fijo',
        'email': 'email',
        'direccion': 'direccion',
        'materia': 'materia',
        'tipo_de_proceso': 'tipo_de_proceso',
        'parte_actor_demandado': 'parte_actor_demandado',
        'juez_fiscal': 'juez_fiscal',
        'juez_fiscal_1': 'juez_fiscal_1',
        'contraparte': 'contraparte',
        'actividades_realizadas': 'actividades_realizadas',
        'estado_actual': 'estado_actual',
        'fecha_de_proxima_actividad': 'fecha_de_proxima_actividad',
        'ocupacion': 'ocupacion',
        'instruccion': 'instruccion',
        'etnia': 'etnia',
        'genero': 'genero',
        'estado_civil': 'estado_civil',
        'nro_hijos': 'nro_hijos',
        'discapacidad': 'discapacidad',
        'tipo_usuario': 'tipo_usuario',
        'linea_servicio': 'linea_servicio',
        'tema': 'tema',
        'estudiante_asignado': 'estudiante_asignado',
        'asesor_legal': 'asesor_legal'
      };
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields[key]) {
          setClauses.push(`${allowedFields[key]} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }
      
      if (setClauses.length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }
      
      values.push(cedula);
      
      const query = `
        UPDATE datos_judiciales 
        SET ${setClauses.join(', ')}
        WHERE nro_de_cedula_usuario = $${paramCount}
        RETURNING *
      `;
      
      console.log('🔍 Query SQL:', query);
      console.log('📊 Valores:', values);
      
      const result = await pool.query(query, values);
      
      console.log('✅ Caso actualizado exitosamente');
      res.json(result.rows[0]);
      
    } catch (error) {
      console.error('❌ Error al actualizar caso:', error);
      res.status(500).json({ 
        error: 'Error al actualizar caso',
        details: (error as Error).message 
      });
    }
  }

  // Eliminar caso
  static async delete(req: Request, res: Response) {
    try {
      const { cedula } = req.params;
      const result = await pool.query('DELETE FROM datos_judiciales WHERE nro_de_cedula_usuario = $1 RETURNING *', [cedula]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Caso no encontrado' });
      }
      
      console.log('✅ Caso eliminado exitosamente');
      res.json({ message: 'Caso eliminado exitosamente' });
    } catch (error) {
      console.error('❌ Error al eliminar caso:', error);
      res.status(500).json({ error: 'Error al eliminar caso' });
    }
  }
  
// Crear caso completo con ficha socioeconómica
static async createComplete(req: Request, res: Response) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { caseData, fichaSocioeconomica } = req.body;
    
    // Insertar caso principal - 31 columnas exactas de tu BD
    const caseQuery = `
      INSERT INTO datos_judiciales (
        fecha, gestion, nombres_y_apellidos_de_usuario, nro_de_cedula_usuario,
        fecha_de_nacimiento, nro_proceso_judicial_expediente, telefono, materia,
        tipo_de_proceso, parte_actor_demandado, juez_fiscal, juez_fiscal_1,
        contraparte, actividades_realizadas, estado_actual, fecha_de_proxima_actividad,
        email, telefono_fijo, direccion, ocupacion, instruccion, etnia, genero,
        estado_civil, nro_hijos, discapacidad, tipo_usuario, linea_servicio,
        tema, estudiante_asignado, asesor_legal
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
      ) RETURNING *
    `;
    
    // 31 valores que coinciden con las 31 columnas
    const caseValues = [
      caseData.fecha,                              // $1
      caseData.gestion,                            // $2
      caseData.nombres_y_apellidos_de_usuario,     // $3
      caseData.nro_de_cedula_usuario,              // $4
      caseData.fecha_de_nacimiento,                // $5
      caseData.nro_proceso_judicial_expediente,    // $6
      caseData.telefono,                           // $7
      caseData.materia,                            // $8
      caseData.tipo_de_proceso,                    // $9
      caseData.parte_actor_demandado,              // $10
      caseData.juez_fiscal,                        // $11
      caseData.juez_fiscal_1 || null,              // $12
      caseData.contraparte,                        // $13
      caseData.actividades_realizadas || '',       // $14
      caseData.estado_actual,                      // $15
      caseData.fecha_de_proxima_actividad,         // $16
      caseData.email || null,                      // $17
      caseData.telefono_fijo || null,              // $18
      caseData.direccion || null,                  // $19
      caseData.ocupacion || null,                  // $20
      caseData.instruccion || null,                // $21
      caseData.etnia || null,                      // $22
      caseData.genero || null,                     // $23
      caseData.estado_civil || null,               // $24
      caseData.nro_hijos || 0,                     // $25
      caseData.discapacidad || null,               // $26
      caseData.tipo_usuario || null,               // $27
      caseData.linea_servicio || null,             // $28
      caseData.tema || null,                       // $29
      caseData.estudiante_asignado || null,        // $30
      caseData.asesor_legal || null                // $31
    ];
    
    const caseResult = await client.query(caseQuery, caseValues);
    
    // Insertar ficha socioeconómica si existe (sin la columna id que es autoincremental)
    if (fichaSocioeconomica) {
      const fichaQuery = `
        INSERT INTO ficha_socioeconomica (
          cedula_usuario, padre_trabaja, madre_trabaja, otros_trabajan,
          tiene_vehiculo, tiene_negocio, tiene_casa, tiene_departamento,
          tiene_terreno, otros_bienes, ingresos_totales, egresos_totales,
          gasto_arriendo, gasto_luz, gasto_agua, gasto_telefono, gasto_internet
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;
      
      const fichaValues = [
        caseData.nro_de_cedula_usuario,              // $1
        fichaSocioeconomica.padre_trabaja || false,  // $2
        fichaSocioeconomica.madre_trabaja || false,  // $3
        fichaSocioeconomica.otros_trabajan || false, // $4
        fichaSocioeconomica.tiene_vehiculo || false, // $5
        fichaSocioeconomica.tiene_negocio || false,  // $6
        fichaSocioeconomica.tiene_casa || false,     // $7
        fichaSocioeconomica.tiene_departamento || false, // $8
        fichaSocioeconomica.tiene_terreno || false,  // $9
        fichaSocioeconomica.otros_bienes || null,    // $10
        fichaSocioeconomica.ingresos_totales || 0,   // $11
        fichaSocioeconomica.egresos_totales || 0,    // $12
        fichaSocioeconomica.gasto_arriendo || 0,     // $13
        fichaSocioeconomica.gasto_luz || 0,          // $14
        fichaSocioeconomica.gasto_agua || 0,         // $15
        fichaSocioeconomica.gasto_telefono || 0,     // $16
        fichaSocioeconomica.gasto_internet || 0      // $17
      ];
      
      await client.query(fichaQuery, fichaValues);
    }
    
    await client.query('COMMIT');
    res.status(201).json(caseResult.rows[0]);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear caso completo:', error);
    res.status(500).json({ 
      error: 'Error al crear caso completo',
      details: (error as Error).message 
    });
  } finally {
    client.release();
  }
}

// Guardar encuesta de satisfacción
static async saveEncuesta(req: Request, res: Response) {
  try {
    const encuesta = req.body;
    
    const query = `
      INSERT INTO encuestas_satisfaccion (
        cedula_usuario, medio_conocimiento, telefono_referido,
        informacion_recibida, orientacion_brindada, nivel_satisfaccion,
        volveria_usar, comentarios
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      encuesta.cedula_usuario,
      encuesta.medio_conocimiento,
      encuesta.telefono_referido || null,
      encuesta.informacion_recibida,
      encuesta.orientacion_brindada,
      encuesta.nivel_satisfaccion,
      encuesta.volveria_usar,
      encuesta.comentarios || null
    ];
    
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('Error al guardar encuesta:', error);
    res.status(500).json({ error: 'Error al guardar encuesta' });
  }
}

// Obtener estadísticas de encuestas
static async getEncuestasStats(req: Request, res: Response) {
  try {
    // Query principal con totales generales
    const totalsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN informacion_recibida = 'excelente' THEN 1 END) as info_excelente,
        COUNT(CASE WHEN informacion_recibida = 'buena' THEN 1 END) as info_buena,
        COUNT(CASE WHEN informacion_recibida = 'deficiente' THEN 1 END) as info_deficiente,
        COUNT(CASE WHEN orientacion_brindada = 'excelente' THEN 1 END) as orient_excelente,
        COUNT(CASE WHEN orientacion_brindada = 'buena' THEN 1 END) as orient_buena,
        COUNT(CASE WHEN orientacion_brindada = 'deficiente' THEN 1 END) as orient_deficiente,
        COUNT(CASE WHEN nivel_satisfaccion = 'excelente' THEN 1 END) as satisf_excelente,
        COUNT(CASE WHEN nivel_satisfaccion = 'buena' THEN 1 END) as satisf_buena,
        COUNT(CASE WHEN nivel_satisfaccion = 'deficiente' THEN 1 END) as satisf_deficiente,
        COUNT(CASE WHEN volveria_usar = true THEN 1 END) as volveria_usar
      FROM encuestas_satisfaccion
    `);

    // Query separada para medios de conocimiento
    const mediosQuery = await pool.query(`
      SELECT 
        medio_conocimiento,
        COUNT(*) as count_medio
      FROM encuestas_satisfaccion
      WHERE medio_conocimiento IS NOT NULL
      GROUP BY medio_conocimiento
      ORDER BY count_medio DESC
    `);

    // Combinar resultados
    const totals = totalsQuery.rows[0];
    const medios = mediosQuery.rows;

    // Crear array de respuesta
    const response = [
      {
        ...totals,
        medio_conocimiento: null,
        count_medio: null
      },
      ...medios.map(medio => ({
        total: totals.total,
        info_excelente: totals.info_excelente,
        info_buena: totals.info_buena,
        info_deficiente: totals.info_deficiente,
        orient_excelente: totals.orient_excelente,
        orient_buena: totals.orient_buena,
        orient_deficiente: totals.orient_deficiente,
        satisf_excelente: totals.satisf_excelente,
        satisf_buena: totals.satisf_buena,
        satisf_deficiente: totals.satisf_deficiente,
        volveria_usar: totals.volveria_usar,
        medio_conocimiento: medio.medio_conocimiento,
        count_medio: medio.count_medio
      }))
    ];

    console.log('📊 Estadísticas generadas:', {
      total_encuestas: totals.total,
      medios_unicos: medios.length
    });

    res.json(response);
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}

// Obtener ficha socioeconómica por cédula
static async getFichaSocioeconomica(req: Request, res: Response) {
  try {
    const { cedula } = req.params;  // ✅ Cambiar de nro_de_cedula_usuario a cedula
    const result = await pool.query(
      'SELECT * FROM ficha_socioeconomica WHERE cedula_usuario = $1',
      [cedula]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ficha socioeconómica no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error al obtener ficha:', error);
    res.status(500).json({ error: 'Error al obtener ficha socioeconómica' });
  }
}
// Actualizar caso completo con ficha socioeconómica
static async updateComplete(req: Request, res: Response) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { cedula } = req.params;
    const { caseData, fichaSocioeconomica } = req.body;
    
    console.log('📝 Actualizando caso completo:', cedula);
    
    // Verificar que existe
    const checkResult = await client.query(
      'SELECT * FROM datos_judiciales WHERE nro_de_cedula_usuario = $1',
      [cedula]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Caso no encontrado' });
    }
    
    // Actualizar caso principal (sin la cédula que es PK)
    const caseQuery = `
      UPDATE datos_judiciales SET
        fecha = $1, gestion = $2, nombres_y_apellidos_de_usuario = $3,
        fecha_de_nacimiento = $4, nro_proceso_judicial_expediente = $5,
        telefono = $6, materia = $7, tipo_de_proceso = $8,
        parte_actor_demandado = $9, juez_fiscal = $10, juez_fiscal_1 = $11,
        contraparte = $12, actividades_realizadas = $13, estado_actual = $14,
        fecha_de_proxima_actividad = $15, email = $16, telefono_fijo = $17,
        direccion = $18, ocupacion = $19, instruccion = $20, etnia = $21,
        genero = $22, estado_civil = $23, nro_hijos = $24, discapacidad = $25,
        tipo_usuario = $26, linea_servicio = $27, tema = $28,
        estudiante_asignado = $29, asesor_legal = $30
      WHERE nro_de_cedula_usuario = $31
      RETURNING *
    `;
    
    const caseValues = [
      caseData.fecha,
      caseData.gestion,
      caseData.nombres_y_apellidos_de_usuario,
      caseData.fecha_de_nacimiento,
      caseData.nro_proceso_judicial_expediente,
      caseData.telefono,
      caseData.materia,
      caseData.tipo_de_proceso,
      caseData.parte_actor_demandado,
      caseData.juez_fiscal,
      caseData.juez_fiscal_1 || null,
      caseData.contraparte,
      caseData.actividades_realizadas || '',
      caseData.estado_actual,
      caseData.fecha_de_proxima_actividad,
      caseData.email || null,
      caseData.telefono_fijo || null,
      caseData.direccion || null,
      caseData.ocupacion || null,
      caseData.instruccion || null,
      caseData.etnia || null,
      caseData.genero || null,
      caseData.estado_civil || null,
      caseData.nro_hijos || 0,
      caseData.discapacidad || null,
      caseData.tipo_usuario || null,
      caseData.linea_servicio || null,
      caseData.tema || null,
      caseData.estudiante_asignado || null,
      caseData.asesor_legal || null,
      cedula // WHERE
    ];
    
    const caseResult = await client.query(caseQuery, caseValues);
    
    // Actualizar o crear ficha socioeconómica
    if (fichaSocioeconomica) {
      // Verificar si ya existe
      const fichaCheck = await client.query(
        'SELECT * FROM ficha_socioeconomica WHERE cedula_usuario = $1',
        [cedula]
      );
      
      if (fichaCheck.rows.length > 0) {
        // Actualizar
        const fichaUpdateQuery = `
          UPDATE ficha_socioeconomica SET
            padre_trabaja = $1, madre_trabaja = $2, otros_trabajan = $3,
            tiene_vehiculo = $4, tiene_negocio = $5, tiene_casa = $6,
            tiene_departamento = $7, tiene_terreno = $8, otros_bienes = $9,
            ingresos_totales = $10, egresos_totales = $11, gasto_arriendo = $12,
            gasto_luz = $13, gasto_agua = $14, gasto_telefono = $15, gasto_internet = $16
          WHERE cedula_usuario = $17
          RETURNING *
        `;
        
        const fichaValues = [
          fichaSocioeconomica.padre_trabaja || false,
          fichaSocioeconomica.madre_trabaja || false,
          fichaSocioeconomica.otros_trabajan || false,
          fichaSocioeconomica.tiene_vehiculo || false,
          fichaSocioeconomica.tiene_negocio || false,
          fichaSocioeconomica.tiene_casa || false,
          fichaSocioeconomica.tiene_departamento || false,
          fichaSocioeconomica.tiene_terreno || false,
          fichaSocioeconomica.otros_bienes || null,
          fichaSocioeconomica.ingresos_totales || 0,
          fichaSocioeconomica.egresos_totales || 0,
          fichaSocioeconomica.gasto_arriendo || 0,
          fichaSocioeconomica.gasto_luz || 0,
          fichaSocioeconomica.gasto_agua || 0,
          fichaSocioeconomica.gasto_telefono || 0,
          fichaSocioeconomica.gasto_internet || 0,
          cedula
        ];
        
        await client.query(fichaUpdateQuery, fichaValues);
      } else {
        // Crear nueva
        const fichaInsertQuery = `
          INSERT INTO ficha_socioeconomica (
            cedula_usuario, padre_trabaja, madre_trabaja, otros_trabajan,
            tiene_vehiculo, tiene_negocio, tiene_casa, tiene_departamento,
            tiene_terreno, otros_bienes, ingresos_totales, egresos_totales,
            gasto_arriendo, gasto_luz, gasto_agua, gasto_telefono, gasto_internet
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING *
        `;
        
        const fichaValues = [
          cedula,
          fichaSocioeconomica.padre_trabaja || false,
          fichaSocioeconomica.madre_trabaja || false,
          fichaSocioeconomica.otros_trabajan || false,
          fichaSocioeconomica.tiene_vehiculo || false,
          fichaSocioeconomica.tiene_negocio || false,
          fichaSocioeconomica.tiene_casa || false,
          fichaSocioeconomica.tiene_departamento || false,
          fichaSocioeconomica.tiene_terreno || false,
          fichaSocioeconomica.otros_bienes || null,
          fichaSocioeconomica.ingresos_totales || 0,
          fichaSocioeconomica.egresos_totales || 0,
          fichaSocioeconomica.gasto_arriendo || 0,
          fichaSocioeconomica.gasto_luz || 0,
          fichaSocioeconomica.gasto_agua || 0,
          fichaSocioeconomica.gasto_telefono || 0,
          fichaSocioeconomica.gasto_internet || 0
        ];
        
        await client.query(fichaInsertQuery, fichaValues);
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ Caso actualizado exitosamente');
    res.json({ message: 'Caso actualizado exitosamente', case: caseResult.rows[0] });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al actualizar caso completo:', error);
    res.status(500).json({ 
      error: 'Error al actualizar caso completo',
      details: (error as Error).message 
    });
  } finally {
    client.release();
  }
}

// Migrar caso a nueva cédula (cambiar PK)
static async migrateCedula(req: Request, res: Response) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { cedulaVieja, cedulaNueva } = req.params;
    const { caseData, fichaSocioeconomica } = req.body;
    
    console.log('🔄 Migrando cédula:', cedulaVieja, '→', cedulaNueva);
    
    // 1. Verificar que la cédula vieja existe
    const checkVieja = await client.query(
      'SELECT * FROM datos_judiciales WHERE nro_de_cedula_usuario = $1',
      [cedulaVieja]
    );
    
    if (checkVieja.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cédula original no encontrada' });
    }
    
    // 2. Verificar que la nueva cédula NO existe
    const checkNueva = await client.query(
      'SELECT * FROM datos_judiciales WHERE nro_de_cedula_usuario = $1',
      [cedulaNueva]
    );
    
    if (checkNueva.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: `La cédula ${cedulaNueva} ya existe en el sistema. No se puede migrar.` 
      });
    }
    
    // 3. Crear nuevo registro con la nueva cédula
    const insertCaseQuery = `
      INSERT INTO datos_judiciales (
        fecha, gestion, nombres_y_apellidos_de_usuario, nro_de_cedula_usuario,
        fecha_de_nacimiento, nro_proceso_judicial_expediente, telefono, materia,
        tipo_de_proceso, parte_actor_demandado, juez_fiscal, juez_fiscal_1,
        contraparte, actividades_realizadas, estado_actual, fecha_de_proxima_actividad,
        email, telefono_fijo, direccion, ocupacion, instruccion, etnia, genero,
        estado_civil, nro_hijos, discapacidad, tipo_usuario, linea_servicio,
        tema, estudiante_asignado, asesor_legal
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
      ) RETURNING *
    `;
    
    const caseValues = [
      caseData.fecha,
      caseData.gestion,
      caseData.nombres_y_apellidos_de_usuario,
      cedulaNueva, // ✅ Nueva cédula
      caseData.fecha_de_nacimiento,
      caseData.nro_proceso_judicial_expediente,
      caseData.telefono,
      caseData.materia,
      caseData.tipo_de_proceso,
      caseData.parte_actor_demandado,
      caseData.juez_fiscal,
      caseData.juez_fiscal_1 || null,
      caseData.contraparte,
      caseData.actividades_realizadas || '',
      caseData.estado_actual,
      caseData.fecha_de_proxima_actividad,
      caseData.email || null,
      caseData.telefono_fijo || null,
      caseData.direccion || null,
      caseData.ocupacion || null,
      caseData.instruccion || null,
      caseData.etnia || null,
      caseData.genero || null,
      caseData.estado_civil || null,
      caseData.nro_hijos || 0,
      caseData.discapacidad || null,
      caseData.tipo_usuario || null,
      caseData.linea_servicio || null,
      caseData.tema || null,
      caseData.estudiante_asignado || null,
      caseData.asesor_legal || null
    ];
    
    const newCaseResult = await client.query(insertCaseQuery, caseValues);
    
    // 4. Migrar ficha socioeconómica si existe
    if (fichaSocioeconomica) {
      // ✅ CAMBIO: Verificar si existe primero, luego actualizar o insertar
      const fichaCheck = await client.query(
        'SELECT * FROM ficha_socioeconomica WHERE cedula_usuario = $1',
        [cedulaNueva]
      );
      
      if (fichaCheck.rows.length > 0) {
        // Ya existe, actualizar
        const updateFichaQuery = `
          UPDATE ficha_socioeconomica SET
            padre_trabaja = $1, madre_trabaja = $2, otros_trabajan = $3,
            tiene_vehiculo = $4, tiene_negocio = $5, tiene_casa = $6,
            tiene_departamento = $7, tiene_terreno = $8, otros_bienes = $9,
            ingresos_totales = $10, egresos_totales = $11, gasto_arriendo = $12,
            gasto_luz = $13, gasto_agua = $14, gasto_telefono = $15, gasto_internet = $16
          WHERE cedula_usuario = $17
          RETURNING *
        `;
        
        const fichaValues = [
          fichaSocioeconomica.padre_trabaja || false,
          fichaSocioeconomica.madre_trabaja || false,
          fichaSocioeconomica.otros_trabajan || false,
          fichaSocioeconomica.tiene_vehiculo || false,
          fichaSocioeconomica.tiene_negocio || false,
          fichaSocioeconomica.tiene_casa || false,
          fichaSocioeconomica.tiene_departamento || false,
          fichaSocioeconomica.tiene_terreno || false,
          fichaSocioeconomica.otros_bienes || null,
          fichaSocioeconomica.ingresos_totales || 0,
          fichaSocioeconomica.egresos_totales || 0,
          fichaSocioeconomica.gasto_arriendo || 0,
          fichaSocioeconomica.gasto_luz || 0,
          fichaSocioeconomica.gasto_agua || 0,
          fichaSocioeconomica.gasto_telefono || 0,
          fichaSocioeconomica.gasto_internet || 0,
          cedulaNueva
        ];
        
        await client.query(updateFichaQuery, fichaValues);
      } else {
        // No existe, insertar
        const insertFichaQuery = `
          INSERT INTO ficha_socioeconomica (
            cedula_usuario, padre_trabaja, madre_trabaja, otros_trabajan,
            tiene_vehiculo, tiene_negocio, tiene_casa, tiene_departamento,
            tiene_terreno, otros_bienes, ingresos_totales, egresos_totales,
            gasto_arriendo, gasto_luz, gasto_agua, gasto_telefono, gasto_internet
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING *
        `;
        
        const fichaValues = [
          cedulaNueva, // ✅ Nueva cédula
          fichaSocioeconomica.padre_trabaja || false,
          fichaSocioeconomica.madre_trabaja || false,
          fichaSocioeconomica.otros_trabajan || false,
          fichaSocioeconomica.tiene_vehiculo || false,
          fichaSocioeconomica.tiene_negocio || false,
          fichaSocioeconomica.tiene_casa || false,
          fichaSocioeconomica.tiene_departamento || false,
          fichaSocioeconomica.tiene_terreno || false,
          fichaSocioeconomica.otros_bienes || null,
          fichaSocioeconomica.ingresos_totales || 0,
          fichaSocioeconomica.egresos_totales || 0,
          fichaSocioeconomica.gasto_arriendo || 0,
          fichaSocioeconomica.gasto_luz || 0,
          fichaSocioeconomica.gasto_agua || 0,
          fichaSocioeconomica.gasto_telefono || 0,
          fichaSocioeconomica.gasto_internet || 0
        ];
        
        await client.query(insertFichaQuery, fichaValues);
      }
    }
    
    // 5. Migrar encuestas asociadas (si existen)
    await client.query(
      'UPDATE encuestas_satisfaccion SET cedula_usuario = $1 WHERE cedula_usuario = $2',
      [cedulaNueva, cedulaVieja]
    );
    
    // 6. Migrar actividades personales asociadas (si existen)
    await client.query(
      'UPDATE actividades_personales SET cedula_cliente = $1 WHERE cedula_cliente = $2',
      [cedulaNueva, cedulaVieja]
    );
    
    // 7. Eliminar ficha socioeconómica vieja
    await client.query(
      'DELETE FROM ficha_socioeconomica WHERE cedula_usuario = $1',
      [cedulaVieja]
    );
    
    // 8. Eliminar caso viejo
    await client.query(
      'DELETE FROM datos_judiciales WHERE nro_de_cedula_usuario = $1',
      [cedulaVieja]
    );
    
    await client.query('COMMIT');
    
    console.log(`✅ Migración exitosa: ${cedulaVieja} → ${cedulaNueva}`);
    
    res.json({ 
      message: `Cédula migrada exitosamente de ${cedulaVieja} a ${cedulaNueva}`,
      case: newCaseResult.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al migrar cédula:', error);
    res.status(500).json({ 
      error: 'Error al migrar cédula',
      details: (error as Error).message 
    });
  } finally {
    client.release();
  }
}

}