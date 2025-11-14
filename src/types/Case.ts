export interface Case {
  nro_de_cedula_usuario: string;
  nombres_y_apellidos_de_usuario: string;
  fecha_de_nacimiento: string;
  nro_proceso_judicial_expediente: string;
  telefono: string;
  materia: string;
  tipo_de_proceso: string;
  parte_actor_demandado: 'ACTOR' | 'DEMANDADO';
  juez_fiscal: string;
  juez_fiscal_1?: string;
  contraparte: string;
  actividades_realizadas: string;
  estado_actual: string;
  fecha_de_proxima_actividad: string;
  fecha: string;
  gestion: string;
  
  // Campos adicionales opcionales
  email?: string;
  telefono_fijo?: string;
  direccion?: string;
  ocupacion?: string;
  instruccion?: string;
  etnia?: string;
  genero?: string;
  estado_civil?: string;
  nro_hijos?: number;
  discapacidad?: string;
  tipo_usuario?: string;
  linea_servicio?: string;
  tema?: string;
  estudiante_asignado?: string;
  asesor_legal?: string;
}

export interface FichaSocioeconomica {
  cedula_usuario: string;
  padre_trabaja: boolean;
  madre_trabaja: boolean;
  otros_trabajan: boolean;
  tiene_vehiculo: boolean;
  tiene_negocio: boolean;
  tiene_casa: boolean;
  tiene_departamento: boolean;
  tiene_terreno: boolean;
  otros_bienes?: string;
  ingresos_totales?: number;
  egresos_totales?: number;
  gasto_arriendo?: number;
  gasto_luz?: number;
  gasto_agua?: number;
  gasto_telefono?: number;
  gasto_internet?: number;
}

export interface EncuestaSatisfaccion {
  cedula_usuario: string;
  medio_conocimiento: string;
  telefono_referido?: string;
  informacion_recibida: string;
  orientacion_brindada: string;
  nivel_satisfaccion: string;
  volveria_usar: boolean;
  comentarios?: string;
}