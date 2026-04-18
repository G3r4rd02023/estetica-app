import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api, CATALOGOS_ENDPOINTS } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import type { CampoTratamiento, CatalogoTratamiento, CreateCampoTratamientoRequest, CreateCatalogoTratamientoRequest } from '../types/tratamiento';

export function Tratamientos() {
  const [activeTab, setActiveTab] = useState<'campos' | 'tratamientos'>('campos');
  const [campos, setCampos] = useState<CampoTratamiento[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogoTratamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states for Campos
  const [campoForm, setCampoForm] = useState<CreateCampoTratamientoRequest>({
    nombre: '',
    tipoDato: 'texto',
    requerido: false,
    opciones: '',
  });

  // Form states for Catalogo
  const [catalogoForm, setCatalogoForm] = useState<CreateCatalogoTratamientoRequest>({
    nombre: '',
    sesionesSugeridas: 1,
    precioBase: 0,
    campoTratamientoIds: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [camposRes, catalogosRes] = await Promise.all([
        api.get<CampoTratamiento[]>(CATALOGOS_ENDPOINTS.getCampos),
        api.get<CatalogoTratamiento[]>(CATALOGOS_ENDPOINTS.getTratamientos),
      ]);
      setCampos(camposRes.data);
      setCatalogos(catalogosRes.data);
    } catch {
      setError('Error al cargar datos del catálogo');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campoForm.nombre.trim()) return;

    setSubmitting(true);
    try {
      await api.post(CATALOGOS_ENDPOINTS.getCampos, campoForm);
      setCampoForm({ nombre: '', tipoDato: 'texto', requerido: false, opciones: '' });
      await fetchData();
    } catch {
      setError('Error al crear el campo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampo = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este campo?')) return;
    try {
      await api.delete(`${CATALOGOS_ENDPOINTS.getCampos}/${id}`);
      await fetchData();
    } catch {
      setError('Error al eliminar el campo');
    }
  };

  const handleCreateCatalogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogoForm.nombre.trim()) return;

    setSubmitting(true);
    try {
      await api.post(CATALOGOS_ENDPOINTS.getTratamientos, catalogoForm);
      setCatalogoForm({ nombre: '', sesionesSugeridas: 1, precioBase: 0, campoTratamientoIds: [] });
      await fetchData();
    } catch {
      setError('Error al crear el tratamiento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCatalogo = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este tratamiento del catálogo?')) return;
    try {
      await api.delete(`${CATALOGOS_ENDPOINTS.getTratamientos}/${id}`);
      await fetchData();
    } catch {
      setError('Error al eliminar el tratamiento');
    }
  };

  const toggleCampoId = (id: number) => {
    setCatalogoForm(prev => ({
      ...prev,
      campoTratamientoIds: prev.campoTratamientoIds.includes(id)
        ? prev.campoTratamientoIds.filter(cid => cid !== id)
        : [...prev.campoTratamientoIds, id]
    }));
  };

  return (
    <Layout>
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Catálogo de Tratamientos</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Configuración técnica de servicios y campos personalizados.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="flex border-b border-slate-200 dark:border-white/10 mb-6 overflow-x-auto no-scrollbar transition-colors">
          <button
            onClick={() => setActiveTab('campos')}
            className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'campos'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            CAMPOS DINÁMICOS
          </button>
          <button
            onClick={() => setActiveTab('tratamientos')}
            className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'tratamientos'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            TRATAMIENTOS
          </button>
        </div>

        {activeTab === 'campos' ? (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 xl:col-span-4">
              <Card className="p-5 sticky top-24">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Gestión de Campos</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  Define los datos adicionales para la asignación de tratamientos.
                </p>
                <form onSubmit={handleCreateCampo} className="space-y-4">
                  <Input
                    label="Nombre"
                    value={campoForm.nombre}
                    onChange={(e) => setCampoForm({ ...campoForm, nombre: e.target.value })}
                    placeholder="Ej: Zona"
                    disabled={submitting}
                    required
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo</label>
                    <select
                      value={campoForm.tipoDato}
                      onChange={(e) => setCampoForm({ ...campoForm, tipoDato: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-white/10 dark:bg-slate-900/50 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      disabled={submitting}
                    >
                      <option value="texto">Texto</option>
                      <option value="numero">Número</option>
                      <option value="select">Selección</option>
                      <option value="fecha">Fecha</option>
                    </select>
                  </div>
                  
                  {campoForm.tipoDato === 'select' && (
                    <Input
                      label="Opciones"
                      value={campoForm.opciones || ''}
                      onChange={(e) => setCampoForm({ ...campoForm, opciones: e.target.value })}
                      placeholder="Rostro, Cuello..."
                      disabled={submitting}
                      required
                    />
                  )}

                  <label className="flex items-center gap-3 cursor-pointer group pt-1">
                    <input
                      type="checkbox"
                      checked={campoForm.requerido}
                      onChange={(e) => setCampoForm({ ...campoForm, requerido: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 dark:border-white/20 dark:bg-slate-900 text-primary-600 focus:ring-primary-500 accent-primary-600"
                      disabled={submitting}
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Obligatorio</span>
                  </label>

                  <Button type="submit" loading={submitting} className="w-full mt-2">
                    GUARDAR CAMPO
                  </Button>
                </form>
              </Card>
            </div>

            <div className="lg:col-span-7 xl:col-span-8">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-x-auto shadow-sm transition-colors">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-4">Nombre</th>
                      <th className="px-4 py-4 w-24">Tipo</th>
                      <th className="px-4 py-4">Opciones</th>
                      <th className="px-4 py-4 text-center w-28">Oblig.</th>
                      <th className="px-4 py-4 text-right w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">Cargando...</td></tr>
                    ) : campos.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">No hay campos dinámicos</td></tr>
                    ) : (
                      campos.map((campo) => (
                        <tr key={campo.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-200 text-sm whitespace-nowrap">{campo.nombre}</td>
                          <td className="px-4 py-4 text-xs font-medium uppercase text-slate-400 dark:text-slate-500">{campo.tipoDato}</td>
                          <td className="px-4 py-4 text-slate-500 dark:text-slate-400 text-xs truncate max-w-[150px]">{campo.opciones || '-'}</td>
                          <td className="px-4 py-4 text-center">
                            {campo.requerido ? (
                              <div className="inline-flex p-1 bg-green-50 dark:bg-green-500/20 rounded-full text-green-500 dark:text-green-400"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>
                            ) : (
                              <div className="inline-flex p-1 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 dark:text-slate-500"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => handleDeleteCampo(campo.id)}
                              className="p-2 text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 xl:col-span-4">
              <Card className="p-5 sticky top-24">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Nuevo Tratamiento</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  Registra un tratamiento base en el catálogo.
                </p>
                <form onSubmit={handleCreateCatalogo} className="space-y-4">
                  <Input
                    label="Nombre"
                    value={catalogoForm.nombre}
                    onChange={(e) => setCatalogoForm({ ...catalogoForm, nombre: e.target.value })}
                    placeholder="Ej: Facial"
                    disabled={submitting}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Sesiones"
                      type="number"
                      value={catalogoForm.sesionesSugeridas}
                      onChange={(e) => setCatalogoForm({ ...catalogoForm, sesionesSugeridas: Number(e.target.value) })}
                      disabled={submitting}
                      required
                    />
                    <Input
                      label="Precio"
                      type="number"
                      value={catalogoForm.precioBase}
                      onChange={(e) => setCatalogoForm({ ...catalogoForm, precioBase: Number(e.target.value) })}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Campos Asociados</label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto p-3 border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50 dark:bg-slate-900/50 transition-colors">
                      {campos.length === 0 ? (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium">No hay campos definidos</p>
                      ) : (
                        campos.map((campo) => (
                          <label key={campo.id} className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={catalogoForm.campoTratamientoIds.includes(campo.id)}
                              onChange={() => toggleCampoId(campo.id)}
                              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-white/20 dark:bg-slate-900 text-primary-600 focus:ring-primary-500 accent-primary-600"
                              disabled={submitting}
                            />
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">{campo.nombre}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <Button type="submit" loading={submitting} className="w-full mt-2">
                    GUARDAR TRATAMIENTO
                  </Button>
                </form>
              </Card>
            </div>

            <div className="lg:col-span-7 xl:col-span-8">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-x-auto shadow-sm transition-colors">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-4">Tratamiento</th>
                      <th className="px-4 py-4 w-16 text-center">Ses.</th>
                      <th className="px-4 py-4 w-32">Precio</th>
                      <th className="px-4 py-4">Campos</th>
                      <th className="px-4 py-4 text-right w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-medium">Cargando...</td></tr>
                    ) : catalogos.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">No hay tratamientos en el catálogo</td></tr>
                    ) : (
                      catalogos.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-200 text-sm whitespace-nowrap">{cat.nombre}</td>
                          <td className="px-4 py-4 text-slate-500 dark:text-slate-400 text-sm text-center font-medium">{cat.sesionesSugeridas}</td>
                          <td className="px-4 py-4 text-slate-900 dark:text-white font-medium text-sm">L. {cat.precioBase.toLocaleString()}</td>
                          <td className="px-4 py-4">
                            <div className="flex -space-x-1.5">
                              {cat.campoTratamientoIds.map((cid, i) => (
                                <div 
                                  key={cid} 
                                  className="w-6 h-6 rounded-full border border-white dark:border-slate-900 bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 flex items-center justify-center text-[9px] font-bold transition-colors"
                                  title={campos.find(c => c.id === cid)?.nombre || 'Campo'}
                                >
                                  {i + 1}
                                </div>
                              ))}
                              {cat.campoTratamientoIds.length === 0 && <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Ninguno</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => handleDeleteCatalogo(cat.id)}
                              className="p-2 text-red-400 font-semibold hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}