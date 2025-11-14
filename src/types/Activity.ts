export interface Activity {
    id?: number;
    titulo: string;
    descripcion?: string;
    fecha_actividad: string;
    hora_actividad?: string;
    tipo: 'personal' | 'cliente';
    completada: boolean;
    cedula_cliente?: string;
    created_at?: string;
    updated_at?: string;
}