export interface Paciente {
  id: number;
  dni: string;
  nombrePaciente: string;
  profesion: string;
  direccion: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  contacto: string;
  sexo: string;
}

export interface CreatePacienteRequest {
  dni: string;
  nombrePaciente: string;
  profesion: string;
  direccion: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  contacto: string;
  sexo: string;
}