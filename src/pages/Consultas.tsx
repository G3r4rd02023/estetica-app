import { useEffect, useState, type ChangeEvent, type FormEvent, type FocusEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api, CONSULTAS_ENDPOINTS, MOTIVOS_ENDPOINTS, PACIENTES_ENDPOINTS } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toApiDateTime } from '../utils/date';
import type { Consulta, CreateConsultaRequest, Motivo } from '../types/consulta';
import type { Paciente as PacienteType } from '../types/paciente';

interface FormErrors {
  pacienteId?: string;
  fecha?: string;
  motivosIds?: string;
}

export function Consultas() {
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [pacientes, setPacientes] = useState<PacienteType[]>([]);
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<CreateConsultaRequest>({
    pacienteId: 0,
    fecha: new Date().toISOString().slice(0, 16),
    motivosIds: [],
    observaciones: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [consultasRes, pacientesRes, motivosRes] = await Promise.all([
        api.get<Consulta[]>(CONSULTAS_ENDPOINTS.getAll),
        api.get<PacienteType[]>(PACIENTES_ENDPOINTS.getAll),
        api.get<Motivo[]>(MOTIVOS_ENDPOINTS.getAll),
      ]);
      setConsultas(consultasRes.data);
      setPacientes(pacientesRes.data);
      setMotivos(motivosRes.data);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: keyof FormErrors, value: unknown): string | undefined => {
    if (field === 'pacienteId') {
      if (!value) return 'El paciente es requerido';
    }
    if (field === 'fecha') {
      if (!value) return 'La fecha es requerida';
    }
    if (field === 'motivosIds') {
      if (!(value as number[]).length) return 'Selecciona al menos un motivo';
    }
    return undefined;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'pacienteId') {
      setFormData((prev) => ({ ...prev, pacienteId: Number(value) }));
    } else if (name === 'fecha') {
      setFormData((prev) => ({ ...prev, fecha: value }));
    } else if (name === 'observaciones') {
      setFormData((prev) => ({ ...prev, observaciones: value }));
    } else if (name === 'motivo') {
      const motivoId = Number(value);
      setFormData((prev) => ({
        ...prev,
        motivosIds: prev.motivosIds.includes(motivoId)
          ? prev.motivosIds.filter((id) => id !== motivoId)
          : [...prev.motivosIds, motivoId],
      }));
    }
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name as keyof FormErrors, name === 'pacienteId' ? Number(value) : value);
    if (error) {
      setFormErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const openModal = () => {
    setFormData({
      pacienteId: 0,
      fecha: new Date().toISOString().slice(0, 16),
      motivosIds: [],
      observaciones: '',
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
    newErrors.pacienteId = validateField('pacienteId', formData.pacienteId);
    newErrors.fecha = validateField('fecha', formData.fecha);
    newErrors.motivosIds = validateField('motivosIds', formData.motivosIds);

    if (Object.values(newErrors).some(Boolean)) {
      setFormErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateConsultaRequest = {
        ...formData,
        fecha: toApiDateTime(formData.fecha),
      };
      await api.post(CONSULTAS_ENDPOINTS.create, payload);
      fetchData();
      closeModal();
    } catch {
      setError('Error al crear consulta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Confirmas eliminar esta consulta?')) return;
    try {
      await api.delete(CONSULTAS_ENDPOINTS.delete(id));
      fetchData();
    } catch {
      setError('Error al eliminar');
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Gestión de Consultas</h1>
          <Button onClick={openModal} className="w-auto px-8 bg-slate-900 dark:bg-primary-600 shadow-lg shadow-slate-200 dark:shadow-none border-none">
            + NUEVA CONSULTA
          </Button>
        </div>

        <div className="mb-6 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar paciente por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-white/5 focus:border-primary-500 dark:focus:border-primary-500 focus:outline-none shadow-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium text-slate-600 dark:text-slate-300"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden transition-colors">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Motivos</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tratamientos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {consultas.filter(c => c.nombrePaciente.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 italic">
                    {searchTerm ? `No se encontraron resultados para "${searchTerm}"` : 'No hay consultas registradas'}
                  </td>
                </tr>
              ) : (
                consultas
                  .filter(c => c.nombrePaciente.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((consulta) => (
                    <tr key={consulta.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{consulta.nombrePaciente}</p>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400 font-medium">{formatFecha(consulta.fecha)}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          consulta.estado === 'Completa' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                          consulta.estado === 'Borrador' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                          'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-white/10'
                        }`}>
                          {consulta.estado === 'Activa' ? 'Con Tratamiento' : consulta.estado}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-xs font-bold">
                          {consulta.cantidadMotivos}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold">
                          {consulta.cantidadTratamientos}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/consultas/${consulta.id}`)}
                            className="text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800"
                          >
                            VER
                          </button>
                          <button
                            onClick={() => navigate(`/consultas/${consulta.id}`)} // Placeholder for EDIT
                            className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                          >
                            EDITAR
                          </button>
                          <button
                            onClick={() => handleDelete(consulta.id)}
                            className="text-[11px] font-black uppercase tracking-widest text-red-400 hover:text-red-600"
                          >
                            ELIMINAR
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/80 flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-transparent dark:border-white/10">
              <div className="p-6 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nueva Consulta</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Paciente</label>
                  <select
                    name="pacienteId"
                    value={formData.pacienteId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-500 focus:outline-none transition-colors"
                  >
                    <option value={0}>Seleccionar paciente...</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombrePaciente}</option>
                    ))}
                  </select>
                  {formErrors.pacienteId && (
                    <p className="mt-1.5 text-sm text-red-500">{formErrors.pacienteId}</p>
                  )}
                </div>

                <Input
                  name="fecha"
                  type="datetime-local"
                  label="Fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={formErrors.fecha}
                  disabled={submitting}
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Motivos de Consulta</label>
                  <div className="grid grid-cols-2 gap-2">
                    {motivos.map((motivo) => (
                      <label key={motivo.id} className="flex items-center gap-2 p-3 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <input
                          type="checkbox"
                          name="motivo"
                          value={motivo.id}
                          checked={formData.motivosIds.includes(motivo.id)}
                          onChange={handleChange}
                          disabled={submitting}
                          className="w-4 h-4 text-primary-500 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{motivo.nombre}</span>
                      </label>
                    ))}
                  </div>
                  {formErrors.motivosIds && (
                    <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{formErrors.motivosIds}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    disabled={submitting}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-500 focus:outline-none resize-none transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10 mt-6">
                  <Button type="button" onClick={closeModal} className="w-auto bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10">
                    Cancelar
                  </Button>
                  <Button type="submit" loading={submitting} className="w-auto">
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