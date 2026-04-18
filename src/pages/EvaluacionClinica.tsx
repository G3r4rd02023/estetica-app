import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api, EVALUACIONES_ENDPOINTS } from '../services/api';
import type { EvaluacionCategoria, CreateEvaluacionCategoriaRequest, CreateEvaluacionItemRequest } from '../types/evaluacion';

export function EvaluacionClinica() {
  const [categorias, setCategorias] = useState<EvaluacionCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [nuevoItem, setNuevoItem] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const response = await api.get<EvaluacionCategoria[]>(EVALUACIONES_ENDPOINTS.getCategorias);
      setCategorias(response.data);
    } catch {
      setError('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;

    setSubmitting(true);
    try {
      const request: CreateEvaluacionCategoriaRequest = { nombre: nuevaCategoria };
      await api.post(EVALUACIONES_ENDPOINTS.createCategoria, request);
      setNuevaCategoria('');
      await fetchCategorias();
    } catch {
      setError('Error al crear la categoría');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategoria = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta categoría y todos sus ítems?')) return;

    try {
      await api.delete(EVALUACIONES_ENDPOINTS.deleteCategoria(id));
      await fetchCategorias();
    } catch {
      setError('Error al eliminar la categoría');
    }
  };

  const handleAddItem = async (categoriaId: number) => {
    const nombre = nuevoItem[categoriaId];
    if (!nombre?.trim()) return;

    setSubmitting(true);
    try {
      const request: CreateEvaluacionItemRequest = {
        nombre,
        categoriaEvaluacionId: categoriaId
      };
      await api.post(EVALUACIONES_ENDPOINTS.createItem, request);
      setNuevoItem({ ...nuevoItem, [categoriaId]: '' });
      await fetchCategorias();
    } catch {
      setError('Error al crear el ítem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await api.delete(EVALUACIONES_ENDPOINTS.deleteItem(itemId));
      await fetchCategorias();
    } catch {
      setError('Error al eliminar el ítem');
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Layout>
      <div className="min-h-[80vh] rounded-3xl bg-white dark:bg-[#0f172a] p-6 text-gray-900 dark:text-white shadow-xl dark:shadow-2xl border border-gray-100 dark:border-none lg:p-8 transition-colors">
        <div className="mb-10">
          <h1 className="text-4xl font-light tracking-tight text-gray-800 dark:text-white sm:text-5xl">
            Catálogos de <span className="font-semibold text-primary-500 dark:text-primary-400">Evaluaciones</span>
          </h1>
          <p className="mt-4 text-gray-500 dark:text-slate-400">Gestiona las categorías y puntos de evaluación clínica.</p>
        </div>

        {error && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-red-200">
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mb-12 overflow-hidden rounded-3xl border border-gray-200 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/40 backdrop-blur-xl transition-colors">
          <div className="p-6 sm:p-8">
            <h2 className="mb-6 text-xl font-medium text-gray-800 dark:text-slate-200">Nueva Categoría</h2>
            <form onSubmit={handleAddCategoria} className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Nombre de la categoría"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-6 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 ring-primary-500/30 transition-all focus:border-primary-500 focus:outline-none focus:ring-4"
                  disabled={submitting}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !nuevaCategoria.trim()}
                className="inline-flex items-center justify-center rounded-2xl bg-gray-800 dark:bg-slate-700 px-8 py-4 font-semibold text-white transition-all hover:bg-gray-700 dark:hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-slate-500/30 disabled:opacity-50 sm:w-auto"
              >
                {submitting ? 'AGREGANDO...' : 'AGREGAR CATEGORÍA'}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-slate-500">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-slate-700 border-t-primary-500"></div>
              <p>Cargando catálogo...</p>
            </div>
          ) : categorias.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 dark:border-slate-700 py-20 text-center text-gray-500 dark:text-slate-500">
              <p>No hay categorías registradas aún.</p>
            </div>
          ) : (
            categorias.map((cat) => (
              <div
                key={cat.id}
                className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/40 transition-all hover:border-gray-300 dark:hover:border-slate-600/50 shadow-sm dark:shadow-none"
              >
                <div
                  className="flex cursor-pointer items-center justify-between p-6"
                  onClick={() => toggleExpand(cat.id)}
                >
                  <h3 className="text-lg font-medium text-gray-800 dark:text-slate-200">{cat.nombre}</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategoria(cat.id);
                      }}
                      className="group p-2 text-slate-500 transition-colors hover:text-red-400"
                      title="Eliminar categoría"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div className={`text-gray-400 dark:text-slate-500 transition-transform duration-300 ${expandedId === cat.id ? 'rotate-180' : ''}`}>
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {expandedId === cat.id && (
                  <div className="border-t border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-900/30 p-6 pt-2 transition-colors">
                    <div className="mt-4 space-y-2">
                      {cat.items?.length > 0 ? (
                        cat.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-800/30 px-4 py-3 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700/30 shadow-sm dark:shadow-none transition-colors"
                          >
                            <span>{item.nombre}</span>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="py-2 text-sm text-gray-500 dark:text-slate-500">No hay ítems en esta categoría.</p>
                      )}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        placeholder="Nuevo ítem (ej. Rosácea)"
                        value={nuevoItem[cat.id] || ''}
                        onChange={(e) => setNuevoItem({ ...nuevoItem, [cat.id]: e.target.value })}
                        className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddItem(cat.id)}
                      />
                      <button
                        onClick={() => handleAddItem(cat.id)}
                        disabled={submitting || !nuevoItem[cat.id]?.trim()}
                        className="rounded-xl bg-gray-800 dark:bg-slate-700 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-gray-700 dark:hover:bg-slate-600 disabled:opacity-50 shadow-sm"
                      >
                        AGREGAR
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
