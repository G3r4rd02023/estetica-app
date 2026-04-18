import React, { useEffect, useState, useMemo, Fragment, type ChangeEvent, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api, CONSULTAS_ENDPOINTS, TRATAMIENTOS_ENDPOINTS, CONSENTIMIENTOS_ENDPOINTS, CATALOGOS_ENDPOINTS } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toApiDateTime, formatDateDisplay } from '../utils/date';
import { SignaturePad } from '../components/ui/SignaturePad';
import type { ConsultaDetalle, DatosGinecologicos, EvaluacionItem } from '../types/consulta';
export interface EvaluacionItemDef {
  itemId: number;
  nombre: string;
}

export interface EvaluacionCategoria {
  id: number;
  nombre: string;
  items: EvaluacionItemDef[];
}
import type { Tratamiento, CatalogoTratamiento, CampoTratamiento, CreateTratamientoRequest } from '../types/tratamiento';
import type { Consentimiento, TipoConsentimiento } from '../types/consentimiento';
import type { Imagen, TipoImagen } from '../types/imagen';
import { EVALUACIONES_ENDPOINTS, IMAGENES_ENDPOINTS } from '../services/api';

export function ConsultaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [consulta, setConsulta] = useState<ConsultaDetalle | null>(null);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>([]);
  const [tipoConsentimientos, setTipoConsentimientos] = useState<TipoConsentimiento[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogoTratamiento[]>([]);
  const [campos, setCampos] = useState<CampoTratamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'ginecologicos' | 'evaluacion' | 'tratamientos' | 'consentimientos' | 'imagenes'>('info');
  const [showGineModal, setShowGineModal] = useState(false);
  const [showTratamientoModal, setShowTratamientoModal] = useState(false);
  const [showConsentimientoModal, setShowConsentimientoModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [expandedTratamientos, setExpandedTratamientos] = useState<number[]>([]);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [activeHistorialTab, setActiveHistorialTab] = useState<'finanzas' | 'sesiones'>('finanzas');
  const [historialData, setHistorialData] = useState<any>(null);
  const [selectedTratamientoId, setSelectedTratamientoId] = useState<number | null>(null);

  const [pagoData, setPagoData] = useState({
    monto: 0,
    metodoPago: 'Efectivo',
    referencia: '',
  });

  const [sesionData, setSesionData] = useState({
    notas: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  const [gineData, setGineData] = useState<DatosGinecologicos>({
    embarazos: 0,
    partos: 0,
    abortos: 0,
    lactancia: false,
    fechaUltimaMenstruacion: '',
    metodoAnticonceptivo: '',
  });

  const [tratamientoData, setTratamientoData] = useState({
    catalogoTratamientoId: 0,
    precioVenta: 0,
    valores: [] as { campoTratamientoId: number; valor: string }[],
  });

  const [consentimientoData, setConsentimientoData] = useState({
    tipoConsentimientoId: 0,
    contenido: '',
    firmaBase64: '',
  });

  const [evaluacionData, setEvaluacionData] = useState<EvaluacionItem[]>([]);
  const [categoriasEvaluacion, setCategoriasEvaluacion] = useState<EvaluacionCategoria[]>([]);
  const [imagenes, setImagenes] = useState<Imagen[]>([]);
  const [tiposImagen, setTiposImagen] = useState<TipoImagen[]>([]);
  const [uploadingImagen, setUploadingImagen] = useState(false);
  const [showImagenModal, setShowImagenModal] = useState(false);
  const [imagenData, setImagenData] = useState<{ file: File | null; tipoImagenId: number; preview: string }>({
    file: null,
    tipoImagenId: 0,
    preview: '',
  });
  const [showConsentDropdown, setShowConsentDropdown] = useState(false);

  const groupedImagenes = useMemo(() => {
    const groups: Record<string, Imagen[]> = {};
    imagenes.forEach(img => {
      const type = img.nombreTipo || 'Sin Categoría';
      if (!groups[type]) groups[type] = [];
      groups[type].push(img);
    });
    
    // Ordenar imágenes por fecha descendente dentro de cada grupo
    Object.keys(groups).forEach(type => {
      groups[type].sort((a, b) => new Date(b.fechaSubida).getTime() - new Date(a.fechaSubida).getTime());
    });
    
    return groups;
  }, [imagenes]);

  useEffect(() => {
    if (id) {
      fetchConsulta();
      fetchTratamientos();
      fetchConsentimientos();
      fetchImagenes();
      fetchCategoriasEvaluacion();
      fetchCatalogos();
    }
  }, [id]);

  const fetchConsulta = async () => {
    try {
      const response = await api.get<ConsultaDetalle>(CONSULTAS_ENDPOINTS.getById(Number(id)));
      setConsulta(response.data);
    } catch {
      setError('Error al cargar consulta');
    } finally {
      setLoading(false);
    }
  };

  const fetchTratamientos = async () => {
    try {
      const response = await api.get<Tratamiento[]>(TRATAMIENTOS_ENDPOINTS.getByConsulta(Number(id)));
      setTratamientos(response.data);
    } catch {
      console.error('Error al cargar tratamientos');
    }
  };

  const fetchConsentimientos = async () => {
    try {
      const [consResponse, tiposResponse] = await Promise.all([
        api.get<Consentimiento[]>(CONSENTIMIENTOS_ENDPOINTS.getByConsulta(Number(id))),
        api.get<TipoConsentimiento[]>(CONSENTIMIENTOS_ENDPOINTS.getTipos),
      ]);
      setConsentimientos(consResponse.data);
      setTipoConsentimientos(tiposResponse.data);
    } catch {
      console.error('Error al cargar consentimientos');
    }
  };

  const fetchCatalogos = async () => {
    try {
      const [catRes, camposRes] = await Promise.all([
        api.get<CatalogoTratamiento[]>(CATALOGOS_ENDPOINTS.getTratamientos),
        api.get<CampoTratamiento[]>(CATALOGOS_ENDPOINTS.getCampos),
      ]);
      setCatalogos(catRes.data);
      setCampos(camposRes.data);
    } catch {
      setError('Error al cargar catálogos');
    }
  };

  const fetchCategoriasEvaluacion = async () => {
    try {
      const response = await api.get<EvaluacionCategoria[]>(EVALUACIONES_ENDPOINTS.getCategorias);
      setCategoriasEvaluacion(response.data);
      
      // Si la consulta ya tiene evaluaciones, cargarlas
      const consultaDetRes = await api.get<any>(CONSULTAS_ENDPOINTS.getById(Number(id)));
      if (consultaDetRes.data.evaluaciones) {
        setEvaluacionData(consultaDetRes.data.evaluaciones);
      }
    } catch {
      console.error('Error al cargar categorías de evaluación');
    }
  };

  const fetchImagenes = async () => {
    try {
      const [imgRes, tiposRes] = await Promise.all([
        api.get<Imagen[]>(IMAGENES_ENDPOINTS.getByConsulta(Number(id))),
        api.get<TipoImagen[]>(IMAGENES_ENDPOINTS.getTipos),
      ]);
      setImagenes(imgRes.data);
      setTiposImagen(tiposRes.data);
    } catch {
      console.error('Error al cargar imágenes');
    }
  };

  const handleGineChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setGineData((prev) => ({
      ...prev,
      [name]: 
        type === 'checkbox' ? (e.target as HTMLInputElement).checked :
        type === 'number' ? (value === '' ? 0 : Number(value)) :
        value,
    }));
  };

  const handleSaveGinecologicos = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Formatear la fecha para asegurar compatibilidad con el backend
      const dataToSave = {
        ...gineData,
        fechaUltimaMenstruacion: gineData.fechaUltimaMenstruacion 
          ? toApiDateTime(gineData.fechaUltimaMenstruacion.includes('T') 
              ? gineData.fechaUltimaMenstruacion 
              : `${gineData.fechaUltimaMenstruacion}T00:00`)
          : null
      };

      await api.post(CONSULTAS_ENDPOINTS.datosGinecologicos(Number(id)), dataToSave);
      await fetchConsulta();
      setShowGineModal(false);
      alert('Datos ginecológicos guardados correctamente');
    } catch (err: any) {
      const msg = err.response?.data || 'Error al guardar datos ginecológicos';
      setError(msg);
      alert(msg);
      console.error('Error saving gine data:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTratamientoChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'catalogoTratamientoId') {
      const catId = Number(value);
      const catalogo = catalogos.find((c) => c.id === catId);
      setTratamientoData((prev) => ({
        ...prev,
        catalogoTratamientoId: catId,
        precioVenta: catalogo?.precioBase || 0,
        valores: catalogo?.campoTratamientoIds.map((cid) => ({ campoTratamientoId: cid, valor: '' })) || [],
      }));
    } else if (name.startsWith('valor_')) {
      const campoId = Number(name.replace('valor_', ''));
      setTratamientoData((prev) => ({
        ...prev,
        valores: prev.valores.map((v) => (v.campoTratamientoId === campoId ? { ...v, valor: value } : v)),
      }));
    } else {
      setTratamientoData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveTratamiento = async (e: FormEvent) => {
    e.preventDefault();
    if (!tratamientoData.catalogoTratamientoId) return;
    setSaving(true);
    try {
      const request: CreateTratamientoRequest = {
        consultaId: Number(id),
        catalogoTratamientoId: tratamientoData.catalogoTratamientoId,
        precioVenta: tratamientoData.precioVenta,
        valores: tratamientoData.valores,
      };
      await api.post(TRATAMIENTOS_ENDPOINTS.asignar, request);
      fetchTratamientos();
      setShowTratamientoModal(false);
    } catch {
      setError('Error al asignar tratamiento');
    } finally {
      setSaving(false);
    }
  };

  const handleConsentimientoChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'tipoConsentimientoId') {
      const tipo = tipoConsentimientos.find((t) => t.id === Number(value));
      setConsentimientoData((prev) => ({
        ...prev,
        tipoConsentimientoId: Number(value),
        contenido: tipo ? getDefaultContent(tipo.nombre) : '',
      }));
    } else if (name === 'contenido') {
      setConsentimientoData((prev) => ({ ...prev, contenido: value }));
    }
  };

  const getDefaultContent = (tipoNombre: string): string => {
    const contenidos: Record<string, string> = {
      'Tratamiento Facial': 'Yo, [NOMBRE_PACIENTE], autorizo voluntariamente al equipo médico a realizar el tratamiento de facial indicado. He sido informado/a de los procedimientos, riesgos y alternativas.',
      'Tratamiento Láser': 'Yo, [NOMBRE_PACIENTE], autorizo el uso de tecnología láser para el tratamiento indicado. Comprendo los cuidados post-tratamiento.',
      'Aplicación de Botox': 'Yo, [NOMBRE_PACIENTE], autorizo la aplicación de toxina botulínica (Botox) según lo conversado.',
      'Relleno Dérmico': 'Yo, [NOMBRE_PACIENTE], autorizo la aplicación de relleno dérmico.',
    };
    return (contenidos[tipoNombre] || 'Yo, [NOMBRE_PACIENTE], autorizo el procedimiento indicado.').replace('[NOMBRE_PACIENTE]', consulta?.nombrePaciente || '');
  };

  const handleSaveConsentimiento = async (e: FormEvent) => {
    e.preventDefault();
    if (!consentimientoData.tipoConsentimientoId) return;
    setSaving(true);
    try {
      await api.post(CONSENTIMIENTOS_ENDPOINTS.create, {
        consultaId: Number(id),
        tipoConsentimientoId: consentimientoData.tipoConsentimientoId,
        contenido: consentimientoData.contenido,
        firmaBase64: consentimientoData.firmaBase64 || undefined,
      });
      fetchConsentimientos();
      setShowConsentimientoModal(false);
    } catch {
      setError('Error al crear consentimiento');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEstado = async (estado: string) => {
    if (!confirm(`¿Cambiar estado a "${estado}"?`)) return;
    try {
      await api.put(CONSULTAS_ENDPOINTS.update(Number(id)), {
        ...consulta,
        estado,
      });
      fetchConsulta();
    } catch {
      setError('Error al actualizar estado');
    }
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const toggleTratamiento = (tratamientoId: number) => {
    setExpandedTratamientos(prev => 
      prev.includes(tratamientoId) 
        ? prev.filter(id => id !== tratamientoId) 
        : [...prev, tratamientoId]
    );
  };

  const fetchHistorial = async (tratamientoId: number) => {
    setSelectedTratamientoId(tratamientoId);
    setLoadingHistorial(true);
    setShowHistorialModal(true);
    try {
      const response = await api.get(TRATAMIENTOS_ENDPOINTS.getHistorial(tratamientoId));
      setHistorialData(response.data);
    } catch (error) {
      console.error('Error al cargar historial', error);
      alert('No se pudo cargar el historial del tratamiento');
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleDeleteTratamiento = async (tratamientoId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este tratamiento asignado? Esta acción no se puede deshacer.')) return;
    
    try {
      await api.delete(TRATAMIENTOS_ENDPOINTS.delete(tratamientoId));
      setTratamientos(prev => prev.filter(t => t.id !== tratamientoId));
      alert('Tratamiento eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar tratamiento', error);
      alert('Error al intentar eliminar el tratamiento');
    }
  };

  const handleSavePago = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTratamientoId || pagoData.monto <= 0) return;

    setSaving(true);
    try {
      await api.post(TRATAMIENTOS_ENDPOINTS.createPago, {
        tratamientoId: selectedTratamientoId,
        monto: pagoData.monto,
        metodoPago: pagoData.metodoPago,
        referencia: pagoData.referencia,
      });
      
      // Recargar historial
      const response = await api.get(TRATAMIENTOS_ENDPOINTS.getHistorial(selectedTratamientoId));
      setHistorialData(response.data);
      setPagoData({ monto: 0, metodoPago: 'Efectivo', referencia: '' });
      alert('Pago registrado correctamente');
    } catch (error) {
      console.error('Error al registrar pago', error);
      alert('Error al registrar el pago');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSesion = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTratamientoId || !sesionData.notas.trim()) return;

    setSaving(true);
    try {
      await api.post(TRATAMIENTOS_ENDPOINTS.createSesion, {
        tratamientoId: selectedTratamientoId,
        fecha: toApiDateTime(sesionData.fecha),
        notas: sesionData.notas,
      });
      
      // Recargar historial
      const response = await api.get(TRATAMIENTOS_ENDPOINTS.getHistorial(selectedTratamientoId));
      setHistorialData(response.data);
      setSesionData({ notas: '', fecha: new Date().toISOString().split('T')[0] });
      alert('Sesión registrada correctamente');
    } catch (error) {
      console.error('Error al registrar sesión', error);
      alert('Error al registrar la sesión');
    } finally {
      setSaving(false);
    }
  };

  const handleEvaluacionChange = (itemId: number, seleccionado: boolean, observacion: string) => {
    if (itemId === undefined || itemId === null) return;
    setEvaluacionData((prev) => {
      const existingIndex = prev.findIndex((i) => i.itemId === itemId);
      if (existingIndex !== -1) {
        const newData = [...prev];
        newData[existingIndex] = { ...newData[existingIndex], seleccionado, observacion };
        return newData;
      }
      return [...prev, { itemId, seleccionado, observacion }];
    });
  };

  const handleSaveEvaluacion = async () => {
    setSaving(true);
    try {
      await api.post(CONSULTAS_ENDPOINTS.evaluaciones(Number(id)), { items: evaluacionData });
      fetchCategoriasEvaluacion();
      alert('Evaluación guardada');
    } catch {
      setError('Error al guardar evaluación');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Resetear el input primero para permitir re-selecciones limpias
    const inputElement = e.target;
    
    // Preparar datos iniciales
    setImagenData({
      file,
      tipoImagenId: 1,
      preview: ''
    });

    // Abrir modal
    setShowImagenModal(true);

    // Cargar la previsualización
    const reader = new FileReader();
    reader.onload = () => {
      setImagenData(prev => ({ ...prev, preview: reader.result as string }));
    };
    reader.readAsDataURL(file);
    
    inputElement.value = '';
  };

  const handleSubmitImagen = async (e: FormEvent) => {
    e.preventDefault();
    if (!imagenData.file || !imagenData.tipoImagenId) return;

    setUploadingImagen(true);
    try {
      const formData = new FormData();
      formData.append('consultaId', id!);
      formData.append('tipoImagenId', imagenData.tipoImagenId.toString());
      formData.append('file', imagenData.file);

      await api.post(IMAGENES_ENDPOINTS.upload, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchImagenes();
      setShowImagenModal(false);
      setImagenData({ file: null, tipoImagenId: 0, preview: '' });
    } catch {
      setError('Error al subir imagen');
    } finally {
      setUploadingImagen(false);
    }
  };

  const getFullImageUrl = (img: { url?: string; URLImagen?: string }) => {
    const path = img.url || img.URLImagen || '';
    if (!path) return '';
    return path;
  };

  const handleDeleteImagen = async (imageId: number) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      await api.delete(IMAGENES_ENDPOINTS.delete(imageId));
      fetchImagenes();
    } catch {
      setError('Error al eliminar imagen');
    }
  };

  const openGineModal = () => {
    if (consulta?.datosGinecologicos) {
      setGineData(consulta.datosGinecologicos);
    } else {
      setGineData({
        embarazos: 0,
        partos: 0,
        abortos: 0,
        lactancia: false,
        fechaUltimaMenstruacion: '',
        metodoAnticonceptivo: '',
      });
    }
    setShowGineModal(true);
  };

  const openTratamientoModal = () => {
    fetchCatalogos();
    setTratamientoData({
      catalogoTratamientoId: 0,
      precioVenta: 0,
      valores: [],
    });
    setShowTratamientoModal(true);
  };

  const openConsentimientoModal = () => {
    setConsentimientoData({
      tipoConsentimientoId: 0,
      contenido: '',
      firmaBase64: '',
    });
    setShowConsentimientoModal(true);
  };

  const formatFecha = (fecha: string) => {
    return formatDateDisplay(fecha);
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

  if (error || !consulta) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error || 'Consulta no encontrada'}</p>
        </div>
        <Button onClick={() => navigate('/consultas')} className="w-auto">
          Volver a Consultas
        </Button>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button onClick={() => navigate('/consultas')} className="w-auto mb-4 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-none">
              ← Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{consulta.nombrePaciente}</h1>
            <p className="text-gray-500 dark:text-gray-400">{formatFecha(consulta.fecha)}</p>
          </div>
          <div className="flex gap-2">
            {consulta.estado !== 'Completa' && (
              <button
                onClick={() => handleUpdateEstado('Completa')}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Completar
              </button>
            )}
            <select
              value={consulta.estado}
              onChange={(e) => handleUpdateEstado(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
            >
              <option value="Borrador">Borrador</option>
              <option value="EnProgreso">En Progreso</option>
              <option value="Completa">Completa</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 mb-6 transition-colors">
          <div className="border-b border-gray-100 dark:border-white/5">
            <nav className="flex overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'info'
                    ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Información
              </button>
              <button
                onClick={() => setActiveTab('ginecologicos')}
                className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'ginecologicos'
                    ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Datos Ginecológicos
                {consulta.tieneDatosGinecologicos && (
                  <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('evaluacion')}
                className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'evaluacion'
                    ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Evaluación
                {evaluacionData.length > 0 && (
                  <span className="ml-2 w-2 h-2 bg-primary-500 rounded-full inline-block"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('tratamientos')}
                className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'tratamientos'
                    ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Tratamientos
                {tratamientos.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full text-xs">
                    {tratamientos.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('consentimientos')}
                className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'consentimientos'
                    ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Consentimientos
                {consentimientos.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full text-xs">
                    {consentimientos.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('imagenes')}
                className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'imagenes'
                    ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Imágenes
                {imagenes.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full text-xs">
                    {imagenes.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                    <p className="font-medium text-gray-900 dark:text-white">{consulta.estado}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tratamientos</p>
                    <p className="font-medium text-gray-900 dark:text-white">{consulta.cantidadTratamientos}</p>
                  </div>
                </div>
                {consulta.observaciones && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Observaciones</p>
                    <p className="font-medium text-gray-900 dark:text-white">{consulta.observaciones}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ginecologicos' && (
              <div className="space-y-6">
                {!consulta.datosGinecologicos ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 transition-colors">
                    <p className="text-gray-500 dark:text-gray-400 mb-4 font-medium">No se han registrado datos ginecológicos para esta consulta.</p>
                    <Button onClick={openGineModal} className="w-auto">
                      + Agregar Datos
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden transition-colors">
                    <div className="bg-gray-50 dark:bg-slate-800/80 px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center transition-colors">
                      <h3 className="font-bold text-gray-800 dark:text-white">Resumen Ginecológico</h3>
                      <button 
                        onClick={openGineModal}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors"
                      >
                        Editar Datos
                      </button>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Antecedentes</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg text-center transition-colors">
                            <span className="block text-xl font-bold text-gray-800 dark:text-white">{consulta.datosGinecologicos.embarazos}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Emb.</span>
                          </div>
                          <div className="bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg text-center transition-colors">
                            <span className="block text-xl font-bold text-gray-800 dark:text-white">{consulta.datosGinecologicos.partos}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Partos</span>
                          </div>
                          <div className="bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg text-center transition-colors">
                            <span className="block text-xl font-bold text-gray-800 dark:text-white">{consulta.datosGinecologicos.abortos}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Abortos</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Estado Actual</p>
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg flex items-center justify-between transition-colors">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Lactancia Activa</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${consulta.datosGinecologicos.lactancia ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                            {consulta.datosGinecologicos.lactancia ? 'SÍ' : 'NO'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Planificación</p>
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg transition-colors">
                          <p className="text-sm font-medium text-gray-800 dark:text-white">{consulta.datosGinecologicos.metodoAnticonceptivo || 'Ninguno / No especificado'}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Método Anticonceptivo</p>
                        </div>
                      </div>

                      <div className="space-y-1 md:col-span-2 lg:col-span-1">
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Calendario</p>
                        <div className="bg-primary-50 dark:bg-primary-500/10 p-3 rounded-lg border border-primary-100 dark:border-primary-500/20 transition-colors">
                          <p className="text-sm font-bold text-primary-700">
                            {consulta.datosGinecologicos.fechaUltimaMenstruacion 
                              ? new Date(consulta.datosGinecologicos.fechaUltimaMenstruacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                              : 'No registrada'}
                          </p>
                          <p className="text-[10px] text-primary-600 uppercase">Última Menstruación (FUM)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tratamientos' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tratamientos Asignados</h3>
                  <Button onClick={openTratamientoModal} className="w-auto bg-slate-900 border-none shadow-md">
                    + AGREGAR TRATAMIENTO
                  </Button>
                </div>
                
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm transition-colors">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5">
                      <tr>
                        <th className="w-10 px-4 py-3"></th>
                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tratamiento</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha Inicio</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Precio</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Estado</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                      {tratamientos.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 italic">
                            No hay tratamientos asignados aún.
                          </td>
                        </tr>
                      ) : (
                        tratamientos.map((t) => {
                          const catalogo = catalogos.find(c => c.id === t.catalogoTratamientoId);
                          const nombreMostrar = t.nombre || catalogo?.nombre || 'Tratamiento';
                          const isExpanded = expandedTratamientos.includes(t.id);
                          
                          return (
                            <React.Fragment key={t.id}>
                              <tr className={`group transition-colors ${isExpanded ? 'bg-slate-50/50 dark:bg-slate-800/50' : 'hover:bg-slate-50/30 dark:hover:bg-slate-800/30'}`}>
                                <td className="px-4 py-4">
                                  <button onClick={() => toggleTratamiento(t.id)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-transform">
                                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                </td>
                                <td className="px-4 py-4">
                                  <p className="font-bold text-slate-800 dark:text-white text-sm">{nombreMostrar}</p>
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                  {formatFecha(t.fechaCreacion || consulta.fecha)}
                                </td>
                                <td className="px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {formatMonto(t.precioVenta)}
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                    t.estado === 'Activo' ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20' :
                                    t.estado === 'Finalizado' ? 'bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20' :
                                    'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-white/5'
                                  }`}>
                                    {t.estado}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <div className="flex justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                                    <button 
                                      onClick={() => fetchHistorial(t.id)}
                                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Ver Historial"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteTratamiento(t.id)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Eliminar"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={6} className="bg-white dark:bg-slate-900 px-12 py-6 border-b border-slate-100 dark:border-white/5 transition-colors">
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Información Capturada:</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {t.valores && t.valores.length > 0 ? (
                                          t.valores.map((v) => {
                                            const campo = campos.find(c => c.id === v.campoTratamientoId);
                                            return (
                                              <div key={v.campoTratamientoId} className="flex flex-col gap-1">
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                  {v.nombreCampo || campo?.nombre || 'Campo'}:
                                                </p>
                                                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 font-medium italic transition-colors">
                                                  {v.valor || 'Sin valor'}
                                                </p>
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <p className="col-span-full text-xs text-slate-400 dark:text-slate-500 italic">No se capturaron campos adicionales para este tratamiento.</p>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'consentimientos' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Consentimientos Informados</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{consentimientos.length} documento(s) firmado(s)</p>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setShowConsentDropdown(!showConsentDropdown)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg ${
                        showConsentDropdown ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-slate-300 dark:shadow-slate-900/50' : 'bg-[#1e3a5f] dark:bg-primary-600 text-white shadow-blue-900/10'
                      }`}
                    >
                      EMITIR CONSENTIMIENTO
                      <svg className={`w-4 h-4 transition-transform ${showConsentDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showConsentDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowConsentDropdown(false)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/5 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          <p className="px-4 py-2 text-[9px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest border-b border-slate-50 dark:border-white/5 mb-1">Seleccionar Tipo</p>
                          {tipoConsentimientos.map((tipo) => (
                            <button
                              key={tipo.id}
                              onClick={() => {
                                setConsentimientoData(prev => ({ 
                                  ...prev, 
                                  tipoConsentimientoId: tipo.id,
                                  contenido: `Yo, autorizo el procedimiento de ${tipo.nombre} indicado.`
                                }));
                                setShowConsentDropdown(false);
                                setShowConsentimientoModal(true);
                              }}
                              className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#1e3a5f] dark:hover:text-white transition-colors flex items-center justify-between group"
                            >
                              {tipo.nombre}
                              <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          ))}
                          <div className="h-px bg-slate-50 dark:bg-white/5 my-1"></div>
                          <button 
                            onClick={() => {
                              openConsentimientoModal();
                              setShowConsentDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Generación Libre
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {consentimientos.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 transition-colors">
                    <p className="text-gray-500 dark:text-gray-400 mb-4 font-medium">No se han registrado consentimientos aún.</p>
                    <Button onClick={openConsentimientoModal} className="w-auto">
                      Iniciar Proceso de Firma
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {consentimientos.map((c) => (
                      <div key={c.id} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:border-primary-500/20 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 dark:text-green-400 shadow-inner group-hover:scale-110 transition-transform">
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                                {c.nombreTipo || (c as any).tipoConsentimientoNombre || (c as any).nombre || 'Consentimiento Informado'}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Documento Firmado Digitamente</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                            {formatFecha(c.fecha)}
                          </span>
                        </div>

                        <div className="relative mb-6">
                          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"></div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium pl-4 italic">
                            "{c.contenido}"
                          </p>
                        </div>
                        {(() => {
                          const firma = c.firmaBase64 || (c as any).firma || (c as any).firmaUrl;
                          if (!firma) return (
                            <div className="pt-3 border-t border-gray-50 flex items-center gap-2 text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span className="text-[10px] uppercase font-bold tracking-widest">Sin datos de firma en el registro</span>
                            </div>
                          );

                          return (
                              <div className="flex justify-between items-end bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-white/5 group/sig transition-colors">
                                <div className="space-y-1">
                                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Huella Digital/Firma</p>
                                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 italic">Legalmente vinculante</p>
                                </div>
                                <div className="relative bg-white dark:bg-slate-800 p-2 rounded-xl">
                                  <img 
                                    src={firma.startsWith('http') ? firma : (firma.startsWith('data:') ? firma : `data:image/png;base64,${firma}`)} 
                                    alt="Firma Digital" 
                                    className="h-20 max-w-[200px] object-contain drop-shadow-md group-hover/sig:scale-105 transition-transform"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<p class="text-[9px] text-red-400 font-bold uppercase">Error firma</p>';
                                    }}
                                  />
                                </div>
                              </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'evaluacion' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Evaluación Clínica</h3>
                  <Button onClick={handleSaveEvaluacion} loading={saving} className="w-auto">
                    Guardar Evaluación
                  </Button>
                </div>
                {categoriasEvaluacion.map((cat) => {
                  const isExpanded = expandedCategories.includes(cat.id);
                  return (
                    <div key={cat.id} className="border border-gray-100 dark:border-white/5 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm transition-colors">
                      <button 
                        onClick={() => toggleCategory(cat.id)}
                        className="w-full flex justify-between items-center p-4 bg-gray-50/80 dark:bg-slate-800/80 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <h4 className="font-bold text-gray-700 dark:text-gray-200">{cat.nombre}</h4>
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {isExpanded && (
                        <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                          {cat.items.map((item) => {
                            // Soportar tanto itemId como id por resiliencia con la API
                            const effectiveItemId = item.itemId || (item as any).id;
                            const data = evaluacionData.find((i) => i.itemId === effectiveItemId) || { seleccionado: false, observacion: '' };
                            return (
                              <div key={`${cat.id}-${effectiveItemId}`} className="flex flex-col md:flex-row md:items-center gap-4 p-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-lg group transition-colors">
                                <label className="flex items-center gap-3 min-w-[200px] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={data.seleccionado}
                                    onChange={(e) => handleEvaluacionChange(effectiveItemId, e.target.checked, data.observacion)}
                                    className="w-5 h-5 text-primary-600 rounded border-gray-300 dark:border-white/20 dark:bg-slate-900 focus:ring-primary-500 cursor-pointer accent-primary-600"
                                  />
                                  <span className="text-gray-800 dark:text-gray-300 font-medium group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">{item.nombre}</span>
                                </label>
                                {data.seleccionado && (
                                  <input
                                    type="text"
                                    placeholder="Observaciones adicionales..."
                                    value={data.observacion}
                                    onChange={(e) => handleEvaluacionChange(effectiveItemId, data.seleccionado, e.target.value)}
                                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 focus:border-primary-500 focus:outline-none bg-white dark:bg-slate-900/50 text-gray-800 dark:text-white shadow-inner transition-colors"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'imagenes' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Galería de Imágenes</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{imagenes.length} imagen(es) en esta consulta</p>
                  </div>
                  <label className="cursor-pointer bg-primary-600 dark:bg-primary-500 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 dark:hover:bg-primary-600 transition-all shadow-md hover:shadow-primary-500/20 flex items-center gap-2 font-semibold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Subir Imagen
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={uploadingImagen} />
                  </label>
                </div>
                
                {imagenes.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 transition-colors">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-500 transition-colors">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No se han cargado imágenes clínicas aún.</p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {Object.entries(groupedImagenes).sort().map(([type, items]) => (
                      <div key={type} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-4 mb-6">
                          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full transition-colors">
                            {type}
                          </h4>
                          <div className="h-px bg-slate-100 dark:bg-white/10 flex-1 transition-colors"></div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{items.length} imágenes</span>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                          {items.map((img) => (
                            <div key={img.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm bg-white dark:bg-slate-900 ring-1 ring-gray-100 dark:ring-white/5 hover:ring-primary-400 dark:hover:ring-primary-500 transition-all duration-300">
                              <img 
                                src={getFullImageUrl(img)} 
                                alt={img.nombreTipo} 
                                title={`URL original: ${img.url || img.URLImagen || ''}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (!target.src.includes('placehold.co')) {
                                    target.src = 'https://placehold.co/400x400?text=Error+Imagen';
                                  }
                                }}
                              />
                              <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 backdrop-blur-sm flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <a 
                                  href={getFullImageUrl(img)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-white font-bold hover:underline py-1 px-2 border border-white/30 rounded-lg"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Ver original ↗
                                </a>
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <p className="text-white font-black text-[11px] mb-1 drop-shadow-sm">{img.nombreTipo}</p>
                                <p className="text-white/90 text-[10px] font-medium">{formatFecha(img.fechaSubida)}</p>
                              </div>

                              <button
                                onClick={() => handleDeleteImagen(img.id)}
                                className="absolute top-3 right-3 p-2 bg-red-500/90 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 shadow-lg scale-75 group-hover:scale-100"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showImagenModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-slate-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Subir Imagen</h2>
                <button onClick={() => setShowImagenModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmitImagen} className="p-6 space-y-4">
                {imagenData.preview && (
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-white/10">
                    <img src={imagenData.preview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de Imagen</label>
                  <select 
                    value={imagenData.tipoImagenId} 
                    onChange={(e) => setImagenData(prev => ({ ...prev, tipoImagenId: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value={0}>Seleccionar...</option>
                    {tiposImagen.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" onClick={() => setShowImagenModal(false)} className="w-auto bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">Cancelar</Button>
                  <Button type="submit" loading={uploadingImagen} disabled={!imagenData.tipoImagenId} className="w-auto">
                    Subir Imagen
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showGineModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Datos Ginecológicos</h2>
              </div>
              <form onSubmit={handleSaveGinecologicos} className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Input name="embarazos" type="number" label="Embarazos" value={gineData.embarazos} onChange={handleGineChange} />
                  <Input name="partos" type="number" label="Partos" value={gineData.partos} onChange={handleGineChange} />
                  <Input name="abortos" type="number" label="Abortos" value={gineData.abortos} onChange={handleGineChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input name="fechaUltimaMenstruacion" type="date" label="Última Menstruación" value={gineData.fechaUltimaMenstruacion?.split('T')[0] || ''} onChange={handleGineChange} />
                  <div>
                    <label className="flex items-center gap-2 mt-6">
                      <input type="checkbox" name="lactancia" checked={gineData.lactancia} onChange={handleGineChange} className="w-4 h-4 text-primary-500 rounded" />
                      <span className="text-sm text-gray-700">En Lactancia</span>
                    </label>
                  </div>
                </div>
                <Input name="metodoAnticonceptivo" label="Método Anticonceptivo" value={gineData.metodoAnticonceptivo} onChange={handleGineChange} />
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" onClick={() => setShowGineModal(false)} className="w-auto bg-gray-100 text-gray-700">Cancelar</Button>
                  <Button type="submit" loading={saving} className="w-auto">Guardar</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showTratamientoModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-slate-900/80 flex items-center justify-center z-50 p-4 transition-colors">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors">
              <div className="p-6 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Agregar Tratamiento</h2>
              </div>
              <form onSubmit={handleSaveTratamiento} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tratamiento</label>
                  <select name="catalogoTratamientoId" value={tratamientoData.catalogoTratamientoId} onChange={handleTratamientoChange} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none transition-colors">
                    <option value={0}>Seleccionar...</option>
                    {catalogos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <Input name="precioVenta" type="number" label="Precio" value={tratamientoData.precioVenta} onChange={handleTratamientoChange} />
                {tratamientoData.valores.map((v) => {
                  const campo = campos.find((c) => c.id === v.campoTratamientoId);
                  return campo ? (
                    <Input key={v.campoTratamientoId} name={`valor_${v.campoTratamientoId}`} label={campo.nombre} value={v.valor} onChange={handleTratamientoChange} />
                  ) : null;
                })}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" onClick={() => setShowTratamientoModal(false)} className="w-auto bg-gray-100 text-gray-700">Cancelar</Button>
                  <Button type="submit" loading={saving} className="w-auto">Asignar</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showConsentimientoModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-slate-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-colors">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 w-full max-w-2xl max-h-[95vh] overflow-y-auto transition-colors">
              <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center transition-colors">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Firma de Consentimiento</h2>
                <button onClick={() => setShowConsentimientoModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSaveConsentimiento} className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Tipo de Documento</label>
                  <select 
                    name="tipoConsentimientoId" 
                    value={consentimientoData.tipoConsentimientoId} 
                    onChange={handleConsentimientoChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-white/10 focus:border-primary-500 focus:outline-none bg-gray-50/50 dark:bg-slate-900/50 text-gray-900 dark:text-white font-medium transition-colors"
                  >
                    <option value={0}>Seleccionar tipo de consentimiento...</option>
                    {tipoConsentimientos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Contenido Legal</label>
                  <textarea 
                    name="contenido" 
                    value={consentimientoData.contenido} 
                    onChange={handleConsentimientoChange} 
                    rows={4} 
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-white/10 focus:border-primary-500 focus:outline-none bg-gray-50/50 dark:bg-slate-900/50 text-sm italic text-gray-600 dark:text-gray-300 leading-relaxed transition-colors" 
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Firma del Paciente</label>
                  <div className="border-2 border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-inner transition-colors">
                    <SignaturePad 
                      onSave={(base64) => setConsentimientoData(prev => ({ ...prev, firmaBase64: base64 }))}
                      onClear={() => setConsentimientoData(prev => ({ ...prev, firmaBase64: '' }))}
                    />
                  </div>
                  {consentimientoData.firmaBase64 ? (
                    <div className="flex items-center gap-2 justify-center text-green-600 dark:text-green-400 animate-bounce">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-bold uppercase tracking-widest">Firma lista para registrar</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center uppercase tracking-widest">Por favor, firme en el recuadro superior</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                  <Button type="button" onClick={() => setShowConsentimientoModal(false)} className="w-auto bg-gray-50 text-gray-500 hover:bg-gray-100 border-none">
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    loading={saving} 
                    disabled={!consentimientoData.tipoConsentimientoId || !consentimientoData.firmaBase64}
                    className="w-auto px-12 shadow-lg shadow-primary-200"
                  >
                    Registrar Firma
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {showHistorialModal && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-white/10 w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300 transition-colors">
              <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Historial:</h2>
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{tratamientos.find(t => t.id === selectedTratamientoId)?.nombre || 'Detalle del Tratamiento'}</p>
                  </div>
                </div>
                <button onClick={() => setShowHistorialModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-8">
                {/* Tabs */}
                <div className="flex gap-2 p-1.5 bg-slate-900 rounded-2xl mb-8">
                  <button 
                    onClick={() => setActiveHistorialTab('finanzas')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-bold transition-all ${
                      activeHistorialTab === 'finanzas' 
                        ? 'bg-[#1e3a5f] text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                    FINANZAS Y PAGOS
                  </button>
                  <button 
                    onClick={() => setActiveHistorialTab('sesiones')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-bold transition-all ${
                      activeHistorialTab === 'sesiones' 
                        ? 'bg-[#1e3a5f] text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    SESIONES CLÍNICAS
                  </button>
                </div>

                {loadingHistorial ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando datos...</p>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in initial:opacity-0 initial:translate-y-4 duration-500 overflow-y-auto max-h-[60vh] pr-2">
                    {activeHistorialTab === 'finanzas' && (
                      <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center group hover:border-slate-300 dark:hover:border-slate-600 transition-colors bg-white dark:bg-slate-900">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total Tratamiento</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white transition-transform group-hover:scale-110">
                              {formatMonto(historialData?.tratamiento?.precioVenta || tratamientos.find(t => t.id === selectedTratamientoId)?.precioVenta || 0)}
                            </p>
                          </div>
                          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center group hover:border-green-300 transition-colors bg-white dark:bg-slate-900">
                            <p className="text-[10px] font-bold text-green-500 dark:text-green-600 uppercase tracking-widest mb-2">Total Pagado</p>
                            <p className="text-2xl font-black text-green-600 dark:text-green-500 transition-transform group-hover:scale-110">{formatMonto(historialData?.totalPagado || 0)}</p>
                          </div>
                          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center group hover:border-red-300 transition-colors bg-white dark:bg-slate-900">
                            <p className="text-[10px] font-bold text-red-500 dark:text-red-600 uppercase tracking-widest mb-2">Saldo Pendiente</p>
                            <p className="text-2xl font-black text-red-600 dark:text-red-500 transition-transform group-hover:scale-110">
                              {formatMonto(
                                (historialData?.tratamiento?.precioVenta || tratamientos.find(t => t.id === selectedTratamientoId)?.precioVenta || 0) - 
                                (historialData?.totalPagado || 0)
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Payment Form */}
                        <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 transition-colors">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest mb-4">Registrar Nuevo Pago</h4>
                          <form onSubmit={handleSavePago} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-2">Monto</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold">$</span>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={pagoData.monto || ''} 
                                  onChange={(e) => setPagoData(prev => ({ ...prev, monto: Number(e.target.value) }))}
                                  placeholder="0.00 L."
                                  className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-white dark:border-slate-700 focus:border-slate-200 dark:focus:border-slate-500 focus:outline-none shadow-sm font-bold text-slate-700 dark:text-white bg-white dark:bg-slate-900 transition-colors" 
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-2">Método</label>
                              <select 
                                value={pagoData.metodoPago} 
                                onChange={(e) => setPagoData(prev => ({ ...prev, metodoPago: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border-2 border-white dark:border-slate-700 focus:border-slate-200 dark:focus:border-slate-500 focus:outline-none shadow-sm font-bold text-slate-700 dark:text-white appearance-none bg-white dark:bg-slate-900 transition-colors"
                              >
                                <option value="Efectivo">Efectivo</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Transferencia">Transferencia</option>
                              </select>
                            </div>
                            <div className="flex items-end">
                              <Button type="submit" loading={saving} disabled={pagoData.monto <= 0} className="w-full py-3.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 border-none font-bold uppercase tracking-widest transition-colors">
                                REGISTRAR
                              </Button>
                            </div>
                          </form>
                        </div>

                        {/* Payments Table */}
                        <div className="max-h-[300px] overflow-y-auto rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-white dark:bg-slate-900 sticky top-0 border-b border-slate-100 dark:border-white/5 transition-colors z-10">
                              <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Fecha</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Método</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase text-right">Monto</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5 bg-white dark:bg-slate-900 transition-colors">
                              {historialData?.pagos?.length > 0 ? (
                                historialData.pagos.map((p: any) => (
                                  <tr key={p.id}>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{formatFecha(p.fecha)}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{p.metodoPago}</td>
                                    <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">{formatMonto(p.monto)}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 italic">No hay pagos registrados.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {activeHistorialTab === 'sesiones' && (
                      <>
                        {/* Session Form */}
                        <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 transition-colors">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest mb-4">Registrar Sesión Realizada</h4>
                          <form onSubmit={handleSaveSesion} className="flex gap-4 items-end">
                            <div className="flex-1 space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-2">Notas Clínicas / Evolución</label>
                              <input 
                                type="text" 
                                value={sesionData.notas} 
                                onChange={(e) => setSesionData(prev => ({ ...prev, notas: e.target.value }))}
                                placeholder="Ej. Paciente tolera bien el tratamiento..."
                                className="w-full px-4 py-3 rounded-xl border-2 border-white dark:border-slate-700 focus:border-slate-200 dark:focus:border-slate-500 focus:outline-none shadow-sm text-sm font-medium text-slate-700 dark:text-white bg-white dark:bg-slate-900 transition-colors" 
                              />
                            </div>
                            <Button type="submit" loading={saving} disabled={!sesionData.notas.trim()} className="w-auto px-8 py-3.5 bg-[#1e3a5f] dark:bg-primary-600 hover:bg-[#162a45] dark:hover:bg-primary-700 shadow-lg shadow-blue-900/10 border-none font-bold text-[11px] uppercase tracking-widest transition-colors">
                              FINALIZAR SESIÓN
                            </Button>
                          </form>
                        </div>

                        {/* Sessions Table */}
                        <div className="max-h-[300px] overflow-y-auto rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-white dark:bg-slate-900 sticky top-0 border-b border-slate-100 dark:border-white/5 transition-colors z-10">
                              <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase w-20"># Sesión</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase w-32">Fecha</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Notas / Evolución</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5 bg-white dark:bg-slate-900 transition-colors">
                              {historialData?.sesiones?.length > 0 ? (
                                [...historialData.sesiones]
                                  .sort((a, b) => a.id - b.id)
                                  .map((s: any, index: number) => (
                                    <tr key={s.id}>
                                      <td className="px-6 py-4 font-black text-slate-800 dark:text-white">{index + 1}</td>
                                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{formatFecha(s.fecha)}</td>
                                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{s.notas}</td>
                                    </tr>
                                  ))
                              ) : (
                                <tr>
                                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 italic">No hay sesiones registradas.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-8 flex justify-end">
                  <button onClick={() => setShowHistorialModal(false)} className="px-6 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 uppercase tracking-widest transition-colors">
                    CERRAR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}