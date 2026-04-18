import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Layout } from '../components/Layout';
import { api, TRATAMIENTOS_ENDPOINTS, CATALOGOS_ENDPOINTS, CONSULTAS_ENDPOINTS } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toApiDateTime } from '../utils/date';
import type { Tratamiento, CreateTratamientoRequest, TratamientoHistorial, CatalogoTratamiento, CampoTratamiento, CreateSesionRequest, CreatePagoRequest } from '../types/tratamiento';
import type { Consulta } from '../types/consulta';

export function TratamientosAsignados() {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogoTratamiento[]>([]);
  const [campos, setCampos] = useState<CampoTratamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [selectedTratamiento, setSelectedTratamiento] = useState<TratamientoHistorial | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'asignar' | 'sesion' | 'pago'>('asignar');

  const [formData, setFormData] = useState<{
    consultaId: number;
    catalogoTratamientoId: number;
    precioVenta: number;
    valores: { campoTratamientoId: number; valor: string }[];
  }>({
    consultaId: 0,
    catalogoTratamientoId: 0,
    precioVenta: 0,
    valores: [],
  });

  const [sesionData, setSesionData] = useState<CreateSesionRequest>({
    tratamientoId: 0,
    fecha: new Date().toISOString().slice(0, 16),
    notas: '',
  });

  const [pagoData, setPagoData] = useState<CreatePagoRequest>({
    tratamientoId: 0,
    monto: 0,
    metodoPago: 'Efectivo',
    referencia: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [consultasRes, catalogosRes, camposRes] = await Promise.all([
        api.get<Consulta[]>(CONSULTAS_ENDPOINTS.getAll),
        api.get<CatalogoTratamiento[]>(CATALOGOS_ENDPOINTS.getTratamientos),
        api.get<CampoTratamiento[]>(CATALOGOS_ENDPOINTS.getCampos),
      ]);
      setConsultas(consultasRes.data);
      setCatalogos(catalogosRes.data);
      setCampos(camposRes.data);

      const allTratamientos: Tratamiento[] = [];
      for (const consulta of consultasRes.data) {
        const TratamientoResponse = await api.get<Tratamiento[]>(TRATAMIENTOS_ENDPOINTS.getByConsulta(consulta.id));
        allTratamientos.push(...TratamientoResponse.data);
      }
      setTratamientos(allTratamientos);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'consultaId') {
      const consultaId = Number(value);
      setFormData((prev) => ({ ...prev, consultaId, valores: [] }));
    } else if (name === 'catalogoTratamientoId') {
      const catId = Number(value);
      const catalogo = catalogos.find((c) => c.id === catId);
      setFormData((prev) => ({
        ...prev,
        catalogoTratamientoId: catId,
        precioVenta: catalogo?.precioBase || 0,
        valores: catalogo?.campoTratamientoIds.map((id) => ({ campoTratamientoId: id, valor: '' })) || [],
      }));
    } else if (name.startsWith('valor_')) {
      const campoId = Number(name.replace('valor_', ''));
      setFormData((prev) => ({
        ...prev,
        valores: prev.valores.map((v) => (v.campoTratamientoId === campoId ? { ...v, valor: value } : v)),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openModal = (tipo: 'asignar' | 'sesion' | 'pago' = 'asignar') => {
    setActiveTab(tipo);
    if (tipo === 'asignar') {
      setFormData({
        consultaId: 0,
        catalogoTratamientoId: 0,
        precioVenta: 0,
        valores: [],
      });
    } else if (tipo === 'sesion') {
      setSesionData({
        tratamientoId: 0,
        fecha: new Date().toISOString().slice(0, 16),
        notas: '',
      });
    } else {
      setPagoData({
        tratamientoId: 0,
        monto: 0,
        metodoPago: 'Efectivo',
        referencia: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (activeTab !== 'asignar') return;

    if (!formData.consultaId || !formData.catalogoTratamientoId) {
      setError('Selecciona consulta y tratamiento');
      return;
    }

    setSubmitting(true);
    try {
      const request: CreateTratamientoRequest = {
        consultaId: formData.consultaId,
        catalogoTratamientoId: formData.catalogoTratamientoId,
        precioVenta: formData.precioVenta,
        valores: formData.valores,
      };
      await api.post(TRATAMIENTOS_ENDPOINTS.asignar, request);
      fetchData();
      closeModal();
    } catch {
      setError('Error al asignar tratamiento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSesion = async (e: FormEvent) => {
    e.preventDefault();
    if (!sesionData.tratamientoId || !sesionData.fecha) {
      setError('Completa los campos');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateSesionRequest = {
        ...sesionData,
        fecha: toApiDateTime(sesionData.fecha),
      };
      await api.post(TRATAMIENTOS_ENDPOINTS.createSesion, payload);
      fetchData();
      closeModal();
    } catch {
      setError('Error al agregar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPago = async (e: FormEvent) => {
    e.preventDefault();
    if (!pagoData.tratamientoId || !pagoData.monto) {
      setError('Completa los campos');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(TRATAMIENTOS_ENDPOINTS.createPago, pagoData);
      fetchData();
      closeModal();
    } catch {
      setError('Error al registrar pago');
    } finally {
      setSubmitting(false);
    }
  };

  const viewHistorial = async (tratamientoId: number) => {
    try {
      const response = await api.get<TratamientoHistorial>(TRATAMIENTOS_ENDPOINTS.getHistorial(tratamientoId));
      setSelectedTratamiento(response.data);
      setShowHistorialModal(true);
    } catch {
      setError('Error al cargar historial');
    }
  };

  const updateEstado = async (id: number, estado: string) => {
    if (!confirm(`¿Cambiar estado a "${estado}"?`)) return;
    try {
      await api.put(TRATAMIENTOS_ENDPOINTS.updateEstado(id), estado);
      fetchData();
    } catch {
      setError('Error al actualizar estado');
    }
  };

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'Activo': return 'bg-blue-100 text-blue-700';
      case 'Finalizado': return 'bg-green-100 text-green-700';
      case 'Cancelado': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(monto);
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white uppercase tracking-tight transition-colors">Tratamientos</h1>
          <div className="flex gap-2">
            <Button onClick={() => openModal('asignar')} className="w-auto px-4 text-sm">
              + Asignar
            </Button>
            <Button onClick={() => openModal('sesion')} className="w-auto px-4 text-sm bg-green-500 hover:bg-green-600">
              + Sesión
            </Button>
            <Button onClick={() => openModal('pago')} className="w-auto px-4 text-sm bg-blue-500 hover:bg-blue-600">
              + Pago
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg transition-colors">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden transition-colors">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Tratamiento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {tratamientos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">
                    No hay tratamientos asignados
                  </td>
                </tr>
              ) : (
                tratamientos.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-slate-200">{t.nombre}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{formatMonto(t.precioVenta)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoClass(t.estado)} dark:bg-opacity-20`}>
                        {t.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => viewHistorial(t.id)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 mr-4 transition-colors"
                      >
                        Historial
                      </button>
                      <select
                        value={t.estado}
                        onChange={(e) => updateEstado(t.id, e.target.value)}
                        className="text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded px-2 py-1 transition-colors"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Finalizado">Finalizado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 dark:bg-slate-900/80 flex items-center justify-center z-50 p-4 transition-colors">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700/50 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white transition-colors">
                  {activeTab === 'asignar' ? 'Asignar Tratamiento' : activeTab === 'sesion' ? 'Agregar Sesión' : 'Registrar Pago'}
                </h2>
              </div>
              <form onSubmit={activeTab === 'asignar' ? handleSubmit : activeTab === 'sesion' ? handleAddSesion : handleAddPago} className="p-6 space-y-4">
                {activeTab === 'asignar' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 transition-colors">Consulta</label>
                      <select
                        name="consultaId"
                        value={formData.consultaId}
                        onChange={handleChange}
                        disabled={submitting}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none transition-colors"
                      >
                        <option value={0}>Seleccionar consulta...</option>
                        {consultas.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombrePaciente} - {formatFecha(c.fecha)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 transition-colors">Tratamiento</label>
                      <select
                        name="catalogoTratamientoId"
                        value={formData.catalogoTratamientoId}
                        onChange={handleChange}
                        disabled={submitting}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none transition-colors"
                      >
                        <option value={0}>Seleccionar...</option>
                        {catalogos.map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      name="precioVenta"
                      type="number"
                      label="Precio"
                      value={formData.precioVenta}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                    {formData.valores.map((v) => {
                      const campo = campos.find((c) => c.id === v.campoTratamientoId);
                      return campo ? (
                        <Input
                          key={v.campoTratamientoId}
                          name={`valor_${v.campoTratamientoId}`}
                          label={campo.nombre}
                          value={v.valor}
                          onChange={handleChange}
                          disabled={submitting}
                        />
                      ) : null;
                    })}
                  </>
                ) : activeTab === 'sesion' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 transition-colors">Tratamiento</label>
                      <select
                        name="tratamientoId"
                        value={sesionData.tratamientoId}
                        onChange={(e) => setSesionData((prev) => ({ ...prev, tratamientoId: Number(e.target.value) }))}
                        disabled={submitting}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none transition-colors"
                      >
                        <option value={0}>Seleccionar...</option>
                        {tratamientos.filter((t) => t.estado === 'Activo').map((t) => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      name="fecha"
                      type="datetime-local"
                      label="Fecha"
                      value={sesionData.fecha}
                      onChange={(e) => setSesionData((prev) => ({ ...prev, fecha: e.target.value }))}
                      disabled={submitting}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 transition-colors">Notas</label>
                      <textarea
                        name="notas"
                        value={sesionData.notas}
                        onChange={(e) => setSesionData((prev) => ({ ...prev, notas: e.target.value }))}
                        disabled={submitting}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none resize-none transition-colors"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 transition-colors">Tratamiento</label>
                      <select
                        name="tratamientoId"
                        value={pagoData.tratamientoId}
                        onChange={(e) => setPagoData((prev) => ({ ...prev, tratamientoId: Number(e.target.value) }))}
                        disabled={submitting}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none transition-colors"
                      >
                        <option value={0}>Seleccionar...</option>
                        {tratamientos.filter((t) => t.estado === 'Activo').map((t) => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      name="monto"
                      type="number"
                      label="Monto"
                      value={pagoData.monto}
                      onChange={(e) => setPagoData((prev) => ({ ...prev, monto: Number(e.target.value) }))}
                      disabled={submitting}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 transition-colors">Método de Pago</label>
                      <select
                        name="metodoPago"
                        value={pagoData.metodoPago}
                        onChange={(e) => setPagoData((prev) => ({ ...prev, metodoPago: e.target.value }))}
                        disabled={submitting}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none transition-colors"
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Tarjeta">Tarjeta</option>
                      </select>
                    </div>
                    <Input
                      name="referencia"
                      label="Referencia"
                      value={pagoData.referencia}
                      onChange={(e) => setPagoData((prev) => ({ ...prev, referencia: e.target.value }))}
                      disabled={submitting}
                    />
                  </>
                )}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" onClick={closeModal} className="w-auto bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700">
                    Cancelar
                  </Button>
                  <Button type="submit" loading={submitting} className="w-auto">
                    {activeTab === 'asignar' ? 'Asignar' : activeTab === 'sesion' ? 'Agregar' : 'Registrar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showHistorialModal && selectedTratamiento && (
          <div className="fixed inset-0 bg-black/60 dark:bg-slate-900/80 flex items-center justify-center z-50 p-4 transition-colors">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700/50 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white transition-colors">Historial - {selectedTratamiento.tratamiento.nombre}</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Total</p>
                    <p className="font-bold text-lg dark:text-white">{formatMonto(selectedTratamiento.tratamiento.precioVenta)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Pagado</p>
                    <p className="font-bold text-lg text-green-600 dark:text-green-400">{formatMonto(selectedTratamiento.totalPagado)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Pendiente</p>
                    <p className="font-bold text-lg text-red-600 dark:text-red-400">{formatMonto(selectedTratamiento.totalPendiente)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Estado</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium dark:bg-opacity-20 ${getEstadoClass(selectedTratamiento.tratamiento.estado)}`}>
                      {selectedTratamiento.tratamiento.estado}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2 transition-colors">Sesiones</h3>
                  {selectedTratamiento.sesiones.length === 0 ? (
                    <p className="text-gray-500 dark:text-slate-400">No hay sesiones</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTratamiento.sesiones.map((s) => (
                        <div key={s.id} className="p-3 bg-gray-50 dark:bg-slate-800/40 rounded-lg">
                          <p className="font-medium dark:text-slate-200">{formatFecha(s.fecha)}</p>
                          {s.notas && <p className="text-sm text-gray-500 dark:text-slate-400">{s.notas}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2 transition-colors">Pagos</h3>
                  {selectedTratamiento.pagos.length === 0 ? (
                    <p className="text-gray-500 dark:text-slate-400">No hay pagos</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTratamiento.pagos.map((p) => (
                        <div key={p.id} className="p-3 bg-gray-50 dark:bg-slate-800/40 rounded-lg flex justify-between">
                          <div>
                            <p className="font-medium text-gray-800 dark:text-slate-200">{formatMonto(p.monto)}</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{p.metodoPago}</p>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-slate-400">{formatFecha(p.fecha)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setShowHistorialModal(false)} className="w-auto">
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}