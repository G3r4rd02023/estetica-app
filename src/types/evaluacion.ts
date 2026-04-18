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
