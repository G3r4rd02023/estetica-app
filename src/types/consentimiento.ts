export interface Consentimiento {
  id: number;
  consultaId: number;
  tipoConsentimientoId: number;
  nombreTipo: string;
  contenido: string;
  firmaBase64: string | null;
  fecha: string;
}

export interface TipoConsentimiento {
  id: number;
  nombre: string;
}

export interface CreateConsentimientoRequest {
  consultaId: number;
  tipoConsentimientoId: number;
  contenido: string;
  firmaBase64?: string;
}