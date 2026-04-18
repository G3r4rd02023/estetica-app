export interface Tratamiento {
  id: number;
  consultaId: number;
  catalogoTratamientoId: number;
  nombre: string;
  precioVenta: number;
  estado: string;
  valores: TratamientoCampo[];
  fechaCreacion?: string;
}

export interface TratamientoCampo {
  campoTratamientoId: number;
  valor: string;
  nombreCampo?: string;
}

export interface CreateTratamientoRequest {
  consultaId: number;
  catalogoTratamientoId: number;
  precioVenta: number;
  valores: TratamientoCampo[];
}

export interface Sesion {
  id: number;
  tratamientoId: number;
  fecha: string;
  notas: string | null;
}

export interface CreateSesionRequest {
  tratamientoId: number;
  fecha: string;
  notas?: string;
}

export interface Pago {
  id: number;
  tratamientoId: number;
  monto: number;
  metodoPago: string;
  referencia: string | null;
  fecha: string;
}

export interface CreatePagoRequest {
  tratamientoId: number;
  monto: number;
  metodoPago: string;
  referencia?: string;
}

export interface TratamientoHistorial {
  tratamiento: Tratamiento;
  sesiones: Sesion[];
  pagos: Pago[];
  totalPagado: number;
  totalPendiente: number;
}

export interface CatalogoTratamiento {
  id: number;
  nombre: string;
  sesionesSugeridas: number;
  precioBase: number;
  campoTratamientoIds: number[];
}

export interface CampoTratamiento {
  id: number;
  nombre: string;
  tipoDato: string;
  requerido: boolean;
  opciones: string | null;
}

export interface CreateCampoTratamientoRequest {
  nombre: string;
  tipoDato: string;
  requerido: boolean;
  opciones?: string;
}

export interface UpdateCampoTratamientoRequest extends CreateCampoTratamientoRequest {
  id: number;
}

export interface CreateCatalogoTratamientoRequest {
  nombre: string;
  sesionesSugeridas: number;
  precioBase: number;
  campoTratamientoIds: number[];
}