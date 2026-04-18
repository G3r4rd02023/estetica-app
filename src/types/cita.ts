export interface Cita {
  id: number;
  pacienteId: number | null;
  nombrePaciente: string;
  telefono: string;
  fecha: string;
  motivo: string;
  estado: string;
  observaciones: string | null;
  duracionMinutos: number;
  esPacienteRegistrado: boolean;
}

export interface CreateCitaRequest {
  pacienteId?: number;
  nombrePacienteTemporal?: string;
  telefonoTemporal?: string;
  fecha: string;
  motivo: string;
  observaciones?: string;
  duracionMinutos: number;
}

export interface UpdateCitaRequest {
  fecha: string;
  motivo: string;
  estado: string;
  observaciones?: string;
  duracionMinutos: number;
}