import { useEffect, useState, type ChangeEvent, type FormEvent, type FocusEvent } from 'react';
import { Layout } from '../components/Layout';
import { api, CITAS_ENDPOINTS, PACIENTES_ENDPOINTS } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { Cita, CreateCitaRequest } from '../types/cita';
import type { Paciente } from '../types/paciente';
import { toApiDateTime, fromApiDateTime, formatDateDisplay } from '../utils/date';

interface FormErrors {
  pacienteId?: string;
  nombrePacienteTemporal?: string;
  telefonoTemporal?: string;
  fecha?: string;
  motivo?: string;
}

export function Citas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [usePacienteRegistrado, setUsePacienteRegistrado] = useState(true);
  const [viewMode, setViewMode] = useState<'agenda' | 'calendar'>('agenda');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [formData, setFormData] = useState<CreateCitaRequest>({
    pacienteId: undefined,
    nombrePacienteTemporal: '',
    telefonoTemporal: '',
    fecha: fromApiDateTime(new Date().toISOString()),
    motivo: '',
    observaciones: '',
    duracionMinutos: 30,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (start?: string, end?: string) => {
    try {
      const [citasRes, pacientesRes] = await Promise.all([
        api.get<Cita[]>(CITAS_ENDPOINTS.getAll(start, end)),
        api.get<Paciente[]>(PACIENTES_ENDPOINTS.getAll),
      ]);
      setCitas(citasRes.data);
      setPacientes(pacientesRes.data);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setLoading(true);
    fetchData(filterStart, filterEnd);
  };

  const validateField = (field: keyof FormErrors, value: unknown): string | undefined => {
    if (usePacienteRegistrado) {
      if (field === 'pacienteId') {
        if (!value) return 'Selecciona un paciente';
      }
    } else {
      if (field === 'nombrePacienteTemporal') {
        if (!String(value).trim()) return 'El nombre es requerido';
      }
      if (field === 'telefonoTemporal') {
        if (!String(value).trim()) return 'El teléfono es requerido';
      }
    }
    if (field === 'fecha') {
      if (!value) return 'La fecha es requerida';
    }
    if (field === 'motivo') {
      if (!String(value).trim()) return 'El motivo es requerido';
    }
    return undefined;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'pacienteId') {
      setFormData((prev) => ({ ...prev, pacienteId: Number(value) || undefined }));
    } else if (name === 'duracionMinutos') {
      setFormData((prev) => ({ ...prev, duracionMinutos: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name as keyof FormErrors, value);
    if (error) {
      setFormErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const openModal = () => {
    setFormData({
      pacienteId: undefined,
      nombrePacienteTemporal: '',
      telefonoTemporal: '',
      fecha: fromApiDateTime(new Date().toISOString()),
      motivo: '',
      observaciones: '',
      duracionMinutos: 30,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormErrors({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    if (usePacienteRegistrado) {
      newErrors.pacienteId = validateField('pacienteId', formData.pacienteId) || '';
    } else {
      newErrors.nombrePacienteTemporal = validateField('nombrePacienteTemporal', formData.nombrePacienteTemporal) || '';
      newErrors.telefonoTemporal = validateField('telefonoTemporal', formData.telefonoTemporal) || '';
    }
    newErrors.fecha = validateField('fecha', formData.fecha) || '';
    newErrors.motivo = validateField('motivo', formData.motivo) || '';

    if (Object.values(newErrors).some(Boolean)) {
      setFormErrors(newErrors);
      return;
    }

    const payload: any = {
      fecha: toApiDateTime(formData.fecha),
      motivo: formData.motivo,
      observaciones: formData.observaciones?.trim() || null,
      duracionMinutos: formData.duracionMinutos,
    };

    if (usePacienteRegistrado) {
      payload.pacienteId = formData.pacienteId;
      // Asegurar que no vayan campos temporales si es registrado
      delete payload.nombrePacienteTemporal;
      delete payload.telefonoTemporal;
    } else {
      payload.nombrePacienteTemporal = formData.nombrePacienteTemporal;
      payload.telefonoTemporal = formData.telefonoTemporal;
      // Asegurar que no vaya pacienteId si es temporal
      delete payload.pacienteId;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(CITAS_ENDPOINTS.create, payload);
      await fetchData();
      closeModal();
    } catch (err: any) {
      console.error('Error al procesar cita:', err);
      let errorMsg = err.response?.data || err.response?.data?.title || err.message || 'No se pudo guardar la cita';
      if (typeof errorMsg === 'object') {
        errorMsg = JSON.stringify(errorMsg);
      }
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

const handleUpdateEstado = async (id: number, estado: string) => {
    if (!confirm(`¿Cambiar estado a "${estado}"?`)) return;
    try {
      await api.put(CITAS_ENDPOINTS.updateEstado(id), estado);
      fetchData(filterStart, filterEnd);
    } catch {
      setError('Error al actualizar estado');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Confirmas eliminar esta cita?')) return;
    try {
      await api.delete(CITAS_ENDPOINTS.delete(id));
      fetchData(filterStart, filterEnd);
    } catch {
      setError('Error al eliminar');
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'Programada': return 'bg-blue-100 text-blue-700';
      case 'Confirmada': return 'bg-green-100 text-green-700';
      case 'Cancelada': return 'bg-red-100 text-red-700';
      case 'Reprogramada': return 'bg-yellow-100 text-yellow-700';
      case 'Completada': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#1e3a5f] dark:text-white tracking-tight">Agenda Clínica</h1>
            <p className="text-slate-400 dark:text-slate-400 font-medium text-sm mt-1">Gestione las citas y la disponibilidad del centro.</p>
          </div>
          <Button onClick={openModal} className="w-auto px-8 py-3 bg-[#1e3a5f] dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-500 shadow-xl shadow-blue-900/10 dark:shadow-none border-none font-bold text-xs uppercase tracking-widest">
            + NUEVA CITA
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#1e3a5f] dark:bg-slate-900 p-1 rounded-2xl mb-8 flex w-fit shadow-lg dark:border dark:border-white/10 transition-colors">
          <button 
            onClick={() => setViewMode('agenda')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
              viewMode === 'agenda' ? 'bg-white text-[#1e3a5f] dark:bg-slate-800 dark:text-white shadow-sm' : 'text-white/60 hover:text-white dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            VISTA AGENDA
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
              viewMode === 'calendar' ? 'bg-white text-[#1e3a5f] dark:bg-slate-800 dark:text-white shadow-sm' : 'text-white/60 hover:text-white dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            CALENDARIO
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700 font-bold">{error}</p>
            </div>
          </div>
        )}

        {viewMode === 'agenda' ? (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 p-6 mb-8 flex flex-col md:flex-row gap-6 items-end animate-in fade-in duration-500 transition-colors">
              <div className="flex-1 w-full">
                <Input
                  type="date"
                  label="FILTRAR DESDE"
                  value={filterStart}
                  onChange={(e) => setFilterStart(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-600 dark:text-slate-300 rounded-xl"
                />
              </div>
              <div className="flex-1 w-full">
                <Input
                  type="date"
                  label="HASTA"
                  value={filterEnd}
                  onChange={(e) => setFilterEnd(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-600 dark:text-slate-300 rounded-xl"
                />
              </div>
              <Button onClick={handleFilter} className="w-auto px-10 py-3.5 bg-slate-800 dark:bg-slate-800 border-none shadow-lg text-xs font-black tracking-widest">
                FILTRAR RESULTADOS
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-900/80 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-500 backdrop-blur-md">
              <table className="w-full">
                <thead className="bg-[#1e3a5f]/5 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha y Hora</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {citas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center border-t border-slate-100 dark:border-white/5">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[11px]">No hay citas programadas para este periodo</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    citas.map((cita) => (
                      <tr key={cita.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group border-t border-slate-50 dark:border-white/5">
                        <td className="px-8 py-6">
                          <p className="font-black text-slate-800 dark:text-slate-200 text-sm mb-0.5">
                            {formatDateDisplay(cita.fecha, false)}
                          </p>
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-[#1e3a5f] dark:group-hover:text-primary-400 transition-colors">
                            {formatDateDisplay(cita.fecha, true).split(' ').pop()}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-slate-500 dark:text-slate-400 text-xs shadow-inner">
                              {cita.nombrePaciente.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 dark:text-slate-200 text-sm">{cita.nombrePaciente}</p>
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{cita.telefono}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium italic">"{cita.motivo}"</p>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                            cita.estado === 'Confirmada' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30' :
                            cita.estado === 'Cancelada' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30' :
                            cita.estado === 'Programada' ? 'bg-blue-100 dark:bg-blue-500/20 text-[#1e3a5f] dark:text-blue-400 border-blue-200 dark:border-blue-500/30' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {cita.estado}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <select
                              value={cita.estado}
                              onChange={(e) => handleUpdateEstado(cita.id, e.target.value)}
                              className="text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 transition-all cursor-pointer dark:text-white"
                            >
                              <option value="Programada">Programar</option>
                              <option value="Confirmada">Confirmar</option>
                              <option value="Cancelada">Cancelar</option>
                              <option value="Completada">Completar</option>
                            </select>
                            <button
                              onClick={() => handleDelete(cita.id)}
                              className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                              title="Eliminar Cita"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl dark:shadow-none border border-slate-100 dark:border-white/5 overflow-hidden animate-in slide-in-from-bottom-6 duration-700 transition-colors">
            {/* Calendar Controls */}
            <div className="p-10 border-b border-slate-50 dark:border-white/5 flex flex-wrap justify-between items-center bg-[#1e3a5f]/[0.02] dark:bg-white/[0.02]">
              <div className="flex items-center gap-8 mb-4 md:mb-0">
                <h2 className="text-4xl font-black text-[#1e3a5f] dark:text-white uppercase tracking-tighter">
                  {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 transition-colors">
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 dark:text-slate-300 hover:text-[#1e3a5f] dark:hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300 hover:text-[#1e3a5f] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    HOY
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 dark:text-slate-300 hover:text-[#1e3a5f] dark:hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)]"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Programada</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmada</span>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border-b border-slate-50 dark:border-white/5">
              {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(day => (
                <div key={day} className="py-6 text-center text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] bg-white dark:bg-slate-900 border-r border-slate-50 dark:border-white/5 last:border-none">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {(() => {
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                const totalDays = new Date(year, month + 1, 0).getDate();
                const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Ajustado a que lunes sea 0
                
                const dayCells = [];
                // Relleno días mes anterior
                for (let i = 0; i < firstDay; i++) {
                  dayCells.push(<div key={`empty-${i}`} className="aspect-square border-r border-b border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-slate-800/10"></div>);
                }
                
                // Días del mes
                for (let d = 1; d <= totalDays; d++) {
                  const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const citasDelDia = citas.filter(c => c.fecha.startsWith(dayString));
                  const isToday = new Date().toISOString().startsWith(dayString);
                  
                  dayCells.push(
                    <div key={d} className={`aspect-square border-r border-b border-slate-50 dark:border-white/5 p-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all group overflow-y-auto ${isToday ? 'bg-blue-50/20 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-900'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-sm font-black transition-colors ${
                          isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200 font-bold'
                        }`}>
                          {d}
                        </span>
                        {isToday && (
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {citasDelDia.map(c => (
                          <div 
                            key={c.id} 
                            onClick={(e) => { e.stopPropagation(); /* Podría abrir detalle */ }}
                            className={`p-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all cursor-pointer hover:scale-[1.03] shadow-sm ${
                              c.estado === 'Confirmada' ? 'bg-green-500 text-white shadow-green-200' :
                              c.estado === 'Cancelada' ? 'bg-red-500 text-white shadow-red-200' :
                              'bg-[#1e3a5f] text-white shadow-blue-200'
                            }`}
                          >
                            <div className="flex justify-between items-center gap-1">
                              <span className="truncate">{c.nombrePaciente.split(' ')[0]}</span>
                              <span className="opacity-70 whitespace-nowrap">
                                {formatDateDisplay(c.fecha, true).split(' ').pop()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                return dayCells;
              })()}
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/80 flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-transparent dark:border-white/10">
              <div className="p-6 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nueva Cita</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {submitError && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-500/20 text-sm">
                    {submitError}
                  </div>
                )}
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="tipoPaciente"
                      checked={usePacienteRegistrado}
                      onChange={() => setUsePacienteRegistrado(true)}
                      className="accent-primary-600"
                    />
                    <span className="text-sm font-medium">Paciente Registrado</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="tipoPaciente"
                      checked={!usePacienteRegistrado}
                      onChange={() => setUsePacienteRegistrado(false)}
                      className="accent-primary-600"
                    />
                    <span className="text-sm font-medium">Paciente Nuevo</span>
                  </label>
                </div>

                {usePacienteRegistrado ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Paciente</label>
                    <select
                      name="pacienteId"
                      value={formData.pacienteId || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-500 focus:outline-none transition-colors"
                    >
                      <option value="">Seleccionar paciente...</option>
                      {pacientes.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombrePaciente}</option>
                      ))}
                    </select>
                    {formErrors.pacienteId && (
                      <p className="mt-1.5 text-sm text-red-500">{formErrors.pacienteId}</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="nombrePacienteTemporal"
                      label="Nombre del Paciente"
                      value={formData.nombrePacienteTemporal}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={formErrors.nombrePacienteTemporal}
                      disabled={isSubmitting}
                    />
                    <Input
                      name="telefonoTemporal"
                      label="Teléfono"
                      value={formData.telefonoTemporal}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={formErrors.telefonoTemporal}
                      disabled={isSubmitting}
                    />
                  </div>
                )}

                <Input
                  name="fecha"
                  type="datetime-local"
                  label="Fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={formErrors.fecha}
                  disabled={isSubmitting}
                />

                <Input
                  name="motivo"
                  label="Motivo"
                  value={formData.motivo}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={formErrors.motivo}
                  disabled={isSubmitting}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="duracionMinutos"
                    type="number"
                    label="Duración (minutos)"
                    value={formData.duracionMinutos}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-500 focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10 mt-6">
                  <Button type="button" onClick={closeModal} className="w-auto bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10">
                    Cancelar
                  </Button>
                  <Button type="submit" loading={isSubmitting} className="w-auto">
                    Crear
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}