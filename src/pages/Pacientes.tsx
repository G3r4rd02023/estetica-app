import { useEffect, useState, type ChangeEvent, type FormEvent, type FocusEvent } from 'react';
import { Layout } from '../components/Layout';
import { api, PACIENTES_ENDPOINTS } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { Paciente, CreatePacienteRequest } from '../types/paciente';

interface FormErrors {
  dni?: string;
  nombrePaciente?: string;
  telefono?: string;
  correo?: string;
}

export function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<CreatePacienteRequest>({
    dni: '',
    nombrePaciente: '',
    profesion: '',
    direccion: '',
    fechaNacimiento: '',
    telefono: '',
    correo: '',
    contacto: '',
    sexo: 'F',
  });

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    try {
      const response = await api.get<Paciente[]>(PACIENTES_ENDPOINTS.getAll);
      setPacientes(response.data);
    } catch {
      setError('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: keyof FormErrors, value: string): string | undefined => {
    if (field === 'dni') {
      if (!value.trim()) return 'El DNI es requerido';
    }
    if (field === 'nombrePaciente') {
      if (!value.trim()) return 'El nombre es requerido';
    }
    if (field === 'telefono') {
      if (!value.trim()) return 'El teléfono es requerido';
    }
    if (field === 'correo') {
      if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Ingresa un correo válido';
      }
    }
    return undefined;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name as keyof FormErrors, value);
    if (error) {
      setFormErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const openModal = (paciente?: Paciente) => {
    if (paciente) {
      setEditingId(paciente.id);
      setFormData({
        dni: paciente.dni,
        nombrePaciente: paciente.nombrePaciente,
        profesion: paciente.profesion,
        direccion: paciente.direccion,
        fechaNacimiento: paciente.fechaNacimiento.split('T')[0],
        telefono: paciente.telefono,
        correo: paciente.correo,
        contacto: paciente.contacto,
        sexo: paciente.sexo,
      });
    } else {
      setEditingId(null);
      setFormData({
        dni: '',
        nombrePaciente: '',
        profesion: '',
        direccion: '',
        fechaNacimiento: '',
        telefono: '',
        correo: '',
        contacto: '',
        sexo: 'F',
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormErrors({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    newErrors.dni = validateField('dni', formData.dni);
    newErrors.nombrePaciente = validateField('nombrePaciente', formData.nombrePaciente);
    newErrors.telefono = validateField('telefono', formData.telefono);
    newErrors.correo = validateField('correo', formData.correo);

    if (Object.values(newErrors).some(Boolean)) {
      setFormErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(PACIENTES_ENDPOINTS.update(editingId), formData);
      } else {
        await api.post(PACIENTES_ENDPOINTS.create, formData);
      }
      fetchPacientes();
      closeModal();
    } catch {
      setError(editingId ? 'Error al actualizar' : 'Error al crear');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Confirmas eliminar este paciente?')) return;
    try {
      await api.delete(PACIENTES_ENDPOINTS.delete(id));
      fetchPacientes();
    } catch {
      setError('Error al eliminar');
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
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Pacientes</h1>
          <Button onClick={() => openModal()} className="w-auto px-8 bg-slate-900 dark:bg-primary-600 shadow-lg shadow-slate-200 dark:shadow-none border-none">
            + Nuevo Paciente
          </Button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">DNI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Correo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sexo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {pacientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 italic">
                    No hay pacientes registrados
                  </td>
                </tr>
              ) : (
                pacientes.map((paciente) => (
                  <tr key={paciente.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5 font-medium text-slate-800 dark:text-slate-200">{paciente.nombrePaciente}</td>
                    <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">{paciente.dni}</td>
                    <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">{paciente.telefono}</td>
                    <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">{paciente.correo}</td>
                    <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
                      <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-white/10">
                        {paciente.sexo === 'F' ? 'Femenino' : 'Masculino'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(paciente)}
                          className="text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          EDITAR
                        </button>
                        <button
                          onClick={() => handleDelete(paciente.id)}
                          className="text-[11px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingId ? 'Editar Paciente' : 'Nuevo Paciente'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    name="dni"
                    label="DNI"
                    value={formData.dni}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={formErrors.dni}
                    disabled={submitting}
                  />
                  <Input
                    name="nombrePaciente"
                    label="Nombre Completo"
                    value={formData.nombrePaciente}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={formErrors.nombrePaciente}
                    disabled={submitting}
                  />
                  <Input
                    name="telefono"
                    label="Teléfono"
                    value={formData.telefono}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={formErrors.telefono}
                    disabled={submitting}
                  />
                  <Input
                    name="correo"
                    type="email"
                    label="Correo"
                    value={formData.correo}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={formErrors.correo}
                    disabled={submitting}
                  />
                  <Input
                    name="fechaNacimiento"
                    type="date"
                    label="Fecha de Nacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  <div className="w-full">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sexo</label>
                    <select
                      name="sexo"
                      value={formData.sexo}
                      onChange={handleChange}
                      disabled={submitting}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-500 focus:outline-none transition-colors"
                    >
                      <option value="F">Femenino</option>
                      <option value="M">Masculino</option>
                    </select>
                  </div>
                  <Input
                    name="profesion"
                    label="Profesión"
                    value={formData.profesion}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  <Input
                    name="contacto"
                    label="Contacto de Emergencia"
                    value={formData.contacto}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  <Input
                    name="direccion"
                    label="Dirección"
                    value={formData.direccion}
                    onChange={handleChange}
                    disabled={submitting}
                    className="md:col-span-2"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10 mt-6">
                  <Button type="button" onClick={closeModal} className="w-auto bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10">
                    Cancelar
                  </Button>
                  <Button type="submit" loading={submitting} className="w-auto">
                    {editingId ? 'Actualizar' : 'Crear'}
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