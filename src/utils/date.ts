/**
 * Convierte una cadena de fecha local a formato ISO para enviar a la API.
 * Suma 7 horas para que el servidor (GMT+1) valide correctamente.
 */
export const toApiDateTime = (localDateTimeStr: string): string => {
  if (!localDateTimeStr) return '';
  if (localDateTimeStr.includes('Z') || /[-+]\d{2}:\d{2}$/.test(localDateTimeStr)) {
    return localDateTimeStr;
  }

  try {
    const [datePart, timePart] = localDateTimeStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = (timePart || '00:00').split(':').map(Number);
    
    const totalMinutes = hours * 60 + minutes + (7 * 60);
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newDays = Math.floor(totalMinutes / 1440);
    
    let adjustedDate = new Date(year, month - 1, day + newDays);
    adjustedDate.setHours(newHours, totalMinutes % 60, 0, 0);
    
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${adjustedDate.getFullYear()}-${pad(adjustedDate.getMonth() + 1)}-${pad(adjustedDate.getDate())}T${pad(adjustedDate.getHours())}:${pad(adjustedDate.getMinutes())}:00`;
  } catch {
    return localDateTimeStr + ':00';
  }
};

/**
 * Convierte una fecha de la API al formato requerido por inputs 'datetime-local' 
 * (YYYY-MM-DDTHH:mm) - el navegador convierte a hora local.
 */
export const fromApiDateTime = (apiDateTimeStr: string): string => {
  if (!apiDateTimeStr) return '';
  
  let normalizedStr = apiDateTimeStr;
  if (!normalizedStr.includes('Z') && !/[-+]\d{2}:\d{2}$/.test(normalizedStr)) {
    normalizedStr += 'Z';
  }
  
  const date = new Date(normalizedStr);
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Formatea una fecha para visualización en español.
 * Convierte la hora del servidor (GMT+1) a hora local (GMT-6) restando 7 horas.
 */
export const formatDateDisplay = (apiDateTimeStr: string, includeTime: boolean = true): string => {
  if (!apiDateTimeStr) return 'Fecha no disponible';
  
  const [datePart, timePart] = apiDateTimeStr.split('T');
  if (!datePart) return apiDateTimeStr;
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hora, min] = timePart ? timePart.split(':').slice(0, 2).map(Number) : [0, 0];
  
  // Restar 7 horas para convertir de GMT+1 a GMT-6
  const totalMinutos = hora * 60 + min - (7 * 60);
  let horasRestadas = Math.floor(totalMinutos / 60) % 24;
  if (horasRestadas < 0) horasRestadas += 24;
  const diasRestados = Math.floor(totalMinutos / 1440);
  
  let fechaAjustada = new Date(year, month - 1, day + diasRestados);
  fechaAjustada.setHours(horasRestadas, totalMinutos % 60, 0, 0);
  
  const opciones: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };
  
  if (includeTime) {
    opciones.hour = '2-digit';
    opciones.minute = '2-digit';
  }
  
  return fechaAjustada.toLocaleDateString('es-ES', opciones);
};
