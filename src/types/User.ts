export interface User {
    id?: number;
    email: string;
    password_hash?: string;
    nombre_completo: string;
    activo: boolean;
    intentos_fallidos?: number;
    bloqueado_hasta?: string;
    token_recuperacion?: string;
    token_expiracion?: string;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface LoginResponse {
    token: string;
    user: {
      id: number;
      email: string;
      nombre_completo: string;
    };
  }
  
  export interface RecoverPasswordRequest {
    email: string;
  }
  
  export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
  }