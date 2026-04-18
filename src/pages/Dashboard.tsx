import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api, DASHBOARD_ENDPOINTS } from '../services/api';
import type { DashboardData } from '../types/dashboard';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 p-6 shadow-sm backdrop-blur-md transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

interface CitaCardProps {
  cita: {
    id: number;
    nombrePaciente: string;
    fecha: string;
    motivo: string;
  };
}

function CitaCard({ cita }: CitaCardProps) {
  const fecha = new Date(cita.fecha);
  const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return (
    <Link to="/citas" className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 dark:bg-white/5 p-4 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-500/20">
          <span className="font-medium text-primary-700 dark:text-primary-400">{cita.nombrePaciente.charAt(0)}</span>
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-200">{cita.nombrePaciente}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{cita.motivo}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-slate-900 dark:text-slate-200">{hora}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{fechaFormateada}</p>
      </div>
    </Link>
  );
}

interface PacienteCardProps {
  paciente: {
    id: number;
    nombrePaciente: string;
    telefono: string;
  };
}

function PacienteCard({ paciente }: PacienteCardProps) {
  return (
    <Link to="/pacientes" className="flex items-center gap-4 rounded-xl bg-slate-50 dark:bg-white/5 p-4 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-500/20">
        <span className="font-medium text-primary-700 dark:text-primary-400">{paciente.nombrePaciente.charAt(0)}</span>
      </div>
      <div>
        <p className="font-medium text-slate-900 dark:text-slate-200">{paciente.nombrePaciente}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{paciente.telefono}</p>
      </div>
    </Link>
  );
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get<DashboardData>(DASHBOARD_ENDPOINTS.getDashboard);
        setData(response.data);
      } catch {
        setError('Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{error || 'Error al cargar datos'}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Pacientes"
            value={data.stats.totalPacientes}
            icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            color="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
          />
          <StatCard
            title="Citas Hoy"
            value={data.stats.citasHoy}
            icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            color="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
          />
          <StatCard
            title="Consultas del Mes"
            value={data.stats.consultasMes}
            icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            color="bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
          />
          <StatCard
            title="Pacientes Nuevos"
            value={data.stats.pacientesNuevosMes}
            icon="M18 9v3m0 0v3m0-3h3m-3 0H9m3 0V6m0 3h3m-3 0H9m-3 6a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 16a3 3 0 11-6 0 3 3 0 016 0z"
            color="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 p-6 shadow-sm backdrop-blur-md transition-colors">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Próximas Citas</h3>
            <div className="space-y-3">
              {data.citasProximas.length > 0 ? (
                data.citasProximas.slice(0, 5).map((cita) => <CitaCard key={cita.id} cita={cita} />)
              ) : (
                <p className="py-4 text-center text-slate-500 dark:text-slate-400">No hay citas programadas</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 p-6 shadow-sm backdrop-blur-md transition-colors">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Pacientes Recientes</h3>
            <div className="space-y-3">
              {data.recentPacientes.length > 0 ? (
                data.recentPacientes
                  .slice(0, 5)
                  .map((paciente) => <PacienteCard key={paciente.id} paciente={paciente} />)
              ) : (
                <p className="py-4 text-center text-slate-500 dark:text-slate-400">No hay pacientes recientes</p>
              )}
            </div>
          </div>
        </div>

        {data.treatmentDistribution.length > 0 && (
          <div className="mt-6 rounded-2xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 p-6 shadow-sm backdrop-blur-md transition-colors">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Distribución de Tratamientos</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {data.treatmentDistribution.map((treatment, index) => (
                <div key={index} className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 transition-colors">
                  <p className="font-medium text-slate-900 dark:text-slate-200">{treatment.nombre}</p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{treatment.cantidad}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
