export interface Imagen {
  id: number;
  consultaId: number;
  tipoImagenId: number;
  nombreTipo: string;
  url: string;  // Mapeado desde URLImagen (backend)
  URLImagen?: string;  // Campo original del backend
  fechaSubida: string;
}

export interface TipoImagen {
  id: number;
  nombre: string;
}

export interface UploadImagenRequest {
  consultaId: number;
  tipoImagenId: number;
  file: File;
}
