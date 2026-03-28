export interface Profile {
  id: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  cedula?: string;
  email?: string;
  foto_url?: string | null;
  rol?: string;
  categoria_usuario?: string;
  estado_aprobacion?: string;
  color_perfil?: string;
  matricula_nro?: string;
  creado_por?: string;
  cambiar_pass_obligatorio?: boolean;
}

export interface Case {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  cliente_id: string;
  created_at?: string;
  cliente?: Profile;
}

export interface CaseItem extends Case {}

export interface TimeEntry {
  id: string;
  perfil_id: string;
  caso_id: string;
  descripcion_tarea: string;
  fecha_tarea: string;
  hora_inicio: string;
  horas: number;
  tarifa_personalizada?: number | null;
  estado?: string;
  creado_por?: string;
  profiles?: Profile;
  cases?: Case;
}

export interface CaseUpdate {
  id: string;
  case_id?: string;
  created_at: string;
  descripcion: string;
  file_url: string | null;
  file_name: string | null;
  estado_aprobacion?: string;
  observacion?: string | null;
  perfil_id?: string;
  caso?: Case;
}

export interface Expense {
  id: string;
  perfil_id?: string;
  trabajador_id?: string;
  cliente_id?: string;
  caso_id?: string;
  descripcion: string;
  monto: number;
  fecha: string;
  comprobante_url?: string | null;
  foto_url?: string | null;
}