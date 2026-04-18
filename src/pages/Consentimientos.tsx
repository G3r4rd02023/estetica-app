import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Layout } from '../components/Layout';
import { api, CONSENTIMIENTOS_ENDPOINTS, CONSULTAS_ENDPOINTS } from '../services/api';
import { Button } from '../components/ui/Button';
import type { Consentimiento, TipoConsentimiento, CreateConsentimientoRequest } from '../types/consentimiento';
import type { Consulta } from '../types/consulta';
import { SignaturePad } from '../components/ui/SignaturePad';

export function Consentimientos() {
  const [consentimientosList, setConsentimientosList] = useState<Consentimiento[]>([]);
  const [tipoConsentimientos, setTipoConsentimientos] = useState<TipoConsentimiento[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedConsultaId, setSelectedConsultaId] = useState<number>(0);
  const [firmaData, setFirmaData] = useState<string>('');

  const [formData, setFormData] = useState<CreateConsentimientoRequest>({
    consultaId: 0,
    tipoConsentimientoId: 0,
    contenido: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedConsultaId) {
      fetchConsentimientosByConsulta(selectedConsultaId);
    }
  }, [selectedConsultaId]);

  const fetchData = async () => {
    try {
      const [tiposRes, consultasRes] = await Promise.all([
        api.get<TipoConsentimiento[]>(CONSENTIMIENTOS_ENDPOINTS.getTipos),
        api.get<Consulta[]>(CONSULTAS_ENDPOINTS.getAll),
      ]);
      setTipoConsentimientos(tiposRes.data);
      setConsultas(consultasRes.data);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsentimientosByConsulta = async (consultaId: number) => {
    try {
      const response = await api.get<Consentimiento[]>(CONSENTIMIENTOS_ENDPOINTS.getByConsulta(consultaId));
      setConsentimientosList(response.data);
    } catch {
      setError('Error al cargar consentimientos');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'consultaId') {
      setSelectedConsultaId(Number(value));
      setFormData((prev) => ({ ...prev, consultaId: Number(value) }));
    } else if (name === 'tipoConsentimientoId') {
      const tipo = tipoConsentimientos.find((t) => t.id === Number(value));
      setFormData((prev) => ({
        ...prev,
        tipoConsentimientoId: Number(value),
        contenido: tipo ? getDefaultContent(tipo.nombre) : '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const getDefaultContent = (tipoNombre: string): string => {
    const consulta = consultas.find(c => c.id === selectedConsultaId);
    const nombre = consulta?.nombrePaciente || '[NOMBRE_PACIENTE]';
    
    const contenidos: Record<string, string> = {
      'Tratamiento Facial': `Yo, ${nombre}, autorizo voluntariamente al equipo médico a realizar el tratamiento de facial indicado. He sido informado/a de los procedimiento riesgos y alternativas. Acepto seguir las instrucciones post-tratamiento.`,
      'Tratamiento Láser': `Yo, ${nombre}, autorizo el uso de tecnología láser para el tratamiento indicado. Comprendo los riesgos potenciales y beneficios del procedimiento.`,
      'Aplicación de Botox': `Yo, ${nombre}, autorizo la aplicación de toxina botulínica (Botox). He sido informado/a sobre los efectos secundarios posibles.`,
      'Relleno Dérmico': `Yo, ${nombre}, autorizo la aplicación de relleno dérmico. Comprendo que los resultados pueden variar.`,
      'Cirugía Menor': `Yo, ${nombre}, autorizo la realización del procedimiento quirúrgico menor. He comprendido la naturaleza de la intervención.`,
    };
    return contenidos[tipoNombre] || `Yo, ${nombre}, autorizo el procedimiento indicado. He sido informado/a sobre los riesgos y beneficios.`;
  };

  const openModal = () => {
    setFormData({
      consultaId: selectedConsultaId,
      tipoConsentimientoId: 0,
      contenido: '',
    });
    setFirmaData('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.consultaId || !formData.tipoConsentimientoId) {
      setError('Selecciona consulta y tipo de consentimiento');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(CONSENTIMIENTOS_ENDPOINTS.create, {
        ...formData,
        firmaBase64: firmaData || undefined,
      });
      fetchConsentimientosByConsulta(selectedConsultaId);
      closeModal();
    } catch {
      setError('Error al crear consentimiento');
    } finally {
      setSubmitting(false);
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Consentimientos</h1>
          <Button onClick={openModal} className="w-auto px-6" disabled={!selectedConsultaId}>
            + Nuevo Consentimiento
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 p-4 mb-6 transition-colors">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Buscar por Consulta</label>
          <select
            name="consultaId"
            value={selectedConsultaId}
            onChange={(e) => setSelectedConsultaId(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-white/10 focus:border-primary-500 focus:outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors"
          >
            <option value={0}>Seleccionar consulta...</option>
            {consultas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombrePaciente} - {formatFecha(c.fecha)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden transition-colors">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/80 transition-colors">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Firma</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contenido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 transition-colors">
              {!selectedConsultaId ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Selecciona una consulta para ver consentimientos
                  </td>
                </tr>
              ) : consentimientosList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay consentimientos para esta consulta
                  </td>
                </tr>
              ) : (
                consentimientosList.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">{c.nombreTipo}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatFecha(c.fecha)}</td>
                    <td className="px-6 py-4">
                      {c.firmaBase64 ? (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-500/20 rounded text-xs">Firmado</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/5 rounded text-xs">Sin firma</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">{c.contenido}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-slate-900/80 flex items-center justify-center z-50 p-4 transition-colors">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors">
              <div className="p-6 border-b border-gray-100 dark:border-white/10 transition-colors">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Nuevo Consentimiento</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de Consentimiento</label>
                  <select
                    name="tipoConsentimientoId"
                    value={formData.tipoConsentimientoId}
                    onChange={handleChange}
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-white/10 focus:border-primary-500 focus:outline-none bg-white dark:bg-slate-900/50 text-gray-900 dark:text-white transition-colors"
                  >
                    <option value={0}>Seleccionar...</option>
                    {tipoConsentimientos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Contenido</label>
                  <textarea
                    name="contenido"
                    value={formData.contenido}
                    onChange={handleChange}
                    disabled={submitting}
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-white/10 focus:border-primary-500 focus:outline-none bg-white dark:bg-slate-900/50 text-gray-900 dark:text-white resize-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">Firma Digital</label>
                  <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-slate-800 transition-colors">
                    <SignaturePad 
                      onSave={(base64) => setFirmaData(base64)} 
                      onClear={() => setFirmaData('')} 
                    />
                  </div>
                  {firmaData && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-500/20 rounded-lg flex items-center gap-3 transition-colors">
                      <div className="bg-green-500 dark:bg-green-500/20 rounded-full p-1 text-white dark:text-green-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-xs text-green-700 dark:text-green-400 font-medium">Firma capturada correctamente</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                  <Button type="button" onClick={closeModal} className="w-auto bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 border-none transition-colors">
                    Cancelar
                  </Button>
                  <Button type="submit" loading={submitting} className="w-auto">
                    Guardar
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