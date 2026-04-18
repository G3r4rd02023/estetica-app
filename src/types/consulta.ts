export interface Consulta {
  id: number;
  pacienteId: number;
  nombrePaciente: string;
  fecha: string;
  estado: string;
  cantidadMotivos: number;
  cantidadTratamientos: number;
  tieneDatosGinecologicos: boolean;
  observaciones?: string;
}

export interface ConsultaDetalle extends Consulta {
  motivos: Motivo[];
  tratamientos: Tratamiento[];
  datosGinecologicos?: DatosGinecologicos;
  evaluaciones?: EvaluacionItem[];
}

export interface CreateConsultaRequest {
  pacienteId: number;
  fecha: string;
  motivosIds: number[];
  observaciones?: string;
}

export interface UpdateConsultaRequest {
  fecha: string;
  motivosIds: number[];
  estado: string;
  observaciones?: string;
}

export interface Motivo {
  id: number;
  nombre: string;
}

export interface DatosGinecologicos {
  embarazos: number;
  partos: number;
  abortos: number;
  lactancia: boolean;
  fechaUltimaMenstruacion: string;
  metodoAnticonceptivo: string;
}

export interface EvaluacionItem {
  itemId: number;
  seleccionado: boolean;
  observacion: string;
}

export interface EvaluacionItemDef {
  id: number;
  nombre: string;
  categoriaEvaluacionId: number;
}

export interface EvaluacionCategoria {
  id: number;
  nombre: string;
  items: EvaluacionItemDef[];
}

export interface CreateEvaluacionCategoriaRequest {
  nombre: string;
}

export interface CreateEvaluacionItemRequest {
  nombre: string;
  categoriaEvaluacionId: number;
}

export interface Tratamiento {
  id: number;
  nombre: string;
  estado: string;
}