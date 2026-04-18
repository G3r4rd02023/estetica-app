export interface DashboardStats {
  totalPacientes: number;
  citasHoy: number;
  consultasMes: number;
  pacientesNuevosMes: number;
}

export interface CitaProxima {
  id: number;
  pacienteId: number;
  nombrePaciente: string;
  fecha: string;
  motivo: string;
  estado: string;
}

export interface PacienteReciente {
  id: number;
  nombrePaciente: string;
  telefono: string;
  fechaNacimiento: string;
}

export interface TreatmentDistribution {
  nombre: string;
  cantidad: number;
}

export interface DashboardData {
  stats: DashboardStats;
  citasProximas: CitaProxima[];
  recentPacientes: PacienteReciente[];
  treatmentDistribution: TreatmentDistribution[];
}