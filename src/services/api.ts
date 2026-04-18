import axios, { type AxiosError } from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'https://api-estetica.runasp.net';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const url = response.config.url || '';
    
    // Transformar imágenes
    if (url.includes('/api/Imagenes/consulta/')) {
      const data = response.data;
      if (Array.isArray(data)) {
        response.data = data.map((item: Record<string, unknown>) => ({
          ...item,
          url: item.url || item.urlImagen || item.URLImagen || '',
          nombreTipo: item.nombreTipo || item.tipoImagenNombre || '',
        }));
      }
    }
    
    // Transformar catálogos de tratamiento: CamposAsignados -> campoTratamientoIds
    if (url.includes('/api/CatalogosTratamiento/tratamientos')) {
      const data = response.data;
      if (Array.isArray(data)) {
        response.data = data.map((item: Record<string, unknown>) => ({
          ...item,
          campoTratamientoIds: item.campoTratamientoIds || 
            (item.camposAsignados as Array<{ campoTratamientoId: number }>)?.map((c: { campoTratamientoId: number }) => c.campoTratamientoId) || [],
        }));
      }
    }
    
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const AUTH_ENDPOINTS = {
  login: '/api/Auth/login',
};

export const DASHBOARD_ENDPOINTS = {
  getDashboard: '/api/Dashboard',
};

export const PACIENTES_ENDPOINTS = {
  getAll: '/api/Pacientes',
  getById: (id: number) => `/api/Pacientes/${id}`,
  create: '/api/Pacientes',
  update: (id: number) => `/api/Pacientes/${id}`,
  delete: (id: number) => `/api/Pacientes/${id}`,
};

export const CONSULTAS_ENDPOINTS = {
  getAll: '/api/Consultas',
  getById: (id: number) => `/api/Consultas/${id}`,
  getByPaciente: (pacienteId: number) => `/api/Consultas/paciente/${pacienteId}`,
  create: '/api/Consultas',
  update: (id: number) => `/api/Consultas/${id}`,
  delete: (id: number) => `/api/Consultas/${id}`,
  datosGinecologicos: (id: number) => `/api/Consultas/${id}/datos-ginecologicos`,
  evaluaciones: (id: number) => `/api/Consultas/${id}/evaluaciones`,
};

export const MOTIVOS_ENDPOINTS = {
  getAll: '/api/Motivos',
  getById: (id: number) => `/api/Motivos/${id}`,
  create: '/api/Motivos',
  update: (id: number) => `/api/Motivos/${id}`,
  delete: (id: number) => `/api/Motivos/${id}`,
};

export const CITAS_ENDPOINTS = {
  getAll: (start?: string, end?: string) => 
    `/api/Citas${start && end ? `?start=${start}&end=${end}` : ''}`,
  getById: (id: number) => `/api/Citas/${id}`,
  getByPaciente: (pacienteId: number) => `/api/Citas/paciente/${pacienteId}`,
  create: '/api/Citas',
  update: (id: number) => `/api/Citas/${id}`,
  updateEstado: (id: number) => `/api/Citas/${id}/estado`,
  delete: (id: number) => `/api/Citas/${id}`,
};

export const TRATAMIENTOS_ENDPOINTS = {
  getById: (id: number) => `/api/Tratamientos/${id}`,
  getByConsulta: (consultaId: number) => `/api/Tratamientos/consulta/${consultaId}`,
  getHistorial: (id: number) => `/api/Tratamientos/${id}/historial`,
  asignar: '/api/Tratamientos/asignar',
  updateEstado: (id: number) => `/api/Tratamientos/${id}/estado`,
  delete: (id: number) => `/api/Tratamientos/${id}`,
  createSesion: '/api/Tratamientos/sesiones',
  createPago: '/api/Tratamientos/pagos',
};

export const CATALOGOS_ENDPOINTS = {
  getTratamientos: '/api/CatalogosTratamiento/tratamientos',
  getTratamientoById: (id: number) => `/api/CatalogosTratamiento/tratamientos/${id}`,
  getCampos: '/api/CatalogosTratamiento/campos',
  getCampoById: (id: number) => `/api/CatalogosTratamiento/campos/${id}`,
};

export const CONSENTIMIENTOS_ENDPOINTS = {
  getTipos: '/api/Consentimientos/tipos',
  getByConsulta: (consultaId: number) => `/api/Consentimientos/consulta/${consultaId}`,
  create: '/api/Consentimientos',
};

export const IMAGENES_ENDPOINTS = {
  upload: '/api/Imagenes/upload',
  getByConsulta: (consultaId: number) => `/api/Imagenes/consulta/${consultaId}`,
  getTipos: '/api/Imagenes/tipos',
  delete: (id: number) => `/api/Imagenes/${id}`,
};

export const EVALUACIONES_ENDPOINTS = {
  getCategorias: '/api/Evaluaciones/categorias',
  getCategoriaById: (id: number) => `/api/Evaluaciones/categorias/${id}`,
  createCategoria: '/api/Evaluaciones/categorias',
  updateCategoria: (id: number) => `/api/Evaluaciones/categorias/${id}`,
  deleteCategoria: (id: number) => `/api/Evaluaciones/categorias/${id}`,
  createItem: '/api/Evaluaciones/items',
  updateItem: (id: number) => `/api/Evaluaciones/items/${id}`,
  deleteItem: (id: number) => `/api/Evaluaciones/items/${id}`,
};

export const saveToken = (token: string) => {
  localStorage.setItem('EsteticaToken', token);
};

export const getToken = () => {
  return localStorage.getItem('EsteticaToken');
};

export const removeToken = () => {
  localStorage.removeItem('EsteticaToken');
};
