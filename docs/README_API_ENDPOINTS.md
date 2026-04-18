# Documentacion de endpoints - Estetica API

## Resumen

Este documento describe los endpoints expuestos por `Estetica.Api`, los datos que reciben y ejemplos de como utilizarlos.

## Base URL en desarrollo

- HTTP: `http://localhost:5023`
- HTTPS: `https://localhost:7226`
- HTTPS:  `https://api-estetica.runasp.net` -- usar esta URL por defecto
- Swagger UI en desarrollo: `https://localhost:7226/swagger`

## Autenticacion

La API usa JWT Bearer en los endpoints protegidos.

1. Obtener token en `POST /api/Auth/login`.
2. Enviar el token en el header:

```http
Authorization: Bearer <token>
```

### Endpoints que requieren autenticacion

- `GET|POST|PUT|DELETE /api/Citas...`
- `GET|POST /api/Consentimientos...`
- `GET|POST|DELETE /api/Imagenes...`
- `GET /api/Dashboard`

### Endpoints publicos segun el codigo actual

- `Auth`
- `Pacientes`
- `Consultas`
- `Motivos`
- `Evaluaciones`
- `CatalogosTratamiento`
- `Tratamientos`

## Formato de respuestas

La API no usa un solo formato de respuesta para todos los controladores:

- `Auth` y algunas validaciones devuelven `ApiResponse<T>`:

```json
{
  "success": true,
  "data": {},
  "message": "Texto descriptivo"
}
```

- Muchos endpoints CRUD devuelven directamente DTOs o listas.
- Las operaciones de actualizacion y borrado suelen devolver `204 No Content`.
- Algunos errores devuelven texto plano con `BadRequest(...)` o `NotFound(...)`.

## Ejemplo rapido de flujo

1. Registrar o iniciar sesion.
2. Crear paciente.
3. Crear consulta para el paciente.
4. Guardar datos ginecologicos y evaluaciones si aplica.
5. Asignar tratamientos.
6. Agregar sesiones, pagos, consentimientos o imagenes.

---

## Auth

Ruta base: `/api/Auth`

### POST `/api/Auth/login`

Inicia sesion y devuelve token JWT.

Body:

```json
{
  "email": "admin@demo.com",
  "password": "Secret123"
}
```

Respuesta exitosa `200 OK`:

```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "email": "admin@demo.com",
    "fullName": "Administrador"
  },
  "message": "Inicio de sesion exitoso."
}
```

Errores frecuentes:

- `400 Bad Request`: validacion de modelo.
- `401 Unauthorized`: credenciales incorrectas.

### POST `/api/Auth/register`

Registra un usuario nuevo.

Body:

```json
{
  "email": "doctor@demo.com",
  "password": "Secret123",
  "fullName": "Dra. Demo"
}
```

Respuesta exitosa `201 Created` con `ApiResponse<AuthResponse>`.

Errores frecuentes:

- `400 Bad Request`: email invalido, password corta o nombre vacio.
- `409 Conflict`: ya existe un usuario con ese correo.

---

## Pacientes

Ruta base: `/api/Pacientes`

### GET `/api/Pacientes`

Obtiene todos los pacientes.

### GET `/api/Pacientes/{id}`

Obtiene un paciente por id.

- `404 Not Found` si no existe.

### POST `/api/Pacientes`

Crea un paciente.

Body ejemplo:

```json
{
  "dni": "0801199912345",
  "nombrePaciente": "Maria Lopez",
  "profesion": "Abogada",
  "direccion": "Col. Palmira",
  "fechaNacimiento": "1991-05-10T00:00:00",
  "telefono": "9999-9999",
  "correo": "maria@example.com",
  "contacto": "Hermana",
  "sexo": "F"
}
```

Respuesta: `201 Created` con `PacienteDto`.

### PUT `/api/Pacientes/{id}`

Actualiza un paciente.

Usa el mismo cuerpo que `POST /api/Pacientes`.

Respuesta:

- `204 No Content`
- `404 Not Found` si no existe.

### DELETE `/api/Pacientes/{id}`

Elimina un paciente.

Respuesta: `204 No Content`.

---

## Motivos

Ruta base: `/api/Motivos`

### GET `/api/Motivos`

Lista motivos de consulta.

### GET `/api/Motivos/{id}`

Obtiene un motivo por id.

### POST `/api/Motivos`

Body:

```json
{
  "nombre": "Acne"
}
```

Respuesta: `201 Created` con `MotivoDto`.

### PUT `/api/Motivos/{id}`

Body:

```json
{
  "nombre": "Melasma"
}
```

Respuesta:

- `204 No Content`
- `404 Not Found`

### DELETE `/api/Motivos/{id}`

Respuesta: `204 No Content`.

---

## Consultas

Ruta base: `/api/Consultas`

### GET `/api/Consultas`

Lista todas las consultas.

### GET `/api/Consultas/{id}`

Obtiene el detalle de una consulta.

Incluye:

- paciente
- datos ginecologicos
- motivos
- evaluaciones
- tratamientos

### GET `/api/Consultas/paciente/{pacienteId}`

Lista consultas por paciente.

### POST `/api/Consultas`

Crea una consulta.

Body:

```json
{
  "pacienteId": 1,
  "fecha": "2026-04-16T10:00:00",
  "motivosIds": [1, 3],
  "observaciones": "Paciente refiere sensibilidad en piel."
}
```

Respuesta: `201 Created` con `ConsultaDto`.

Errores:

- `400 Bad Request` con mensaje en texto si el servicio falla.

### PUT `/api/Consultas/{id}`

Actualiza la consulta.

Body:

```json
{
  "fecha": "2026-04-16T11:00:00",
  "motivosIds": [1, 2],
  "estado": "Completa",
  "observaciones": "Se actualizo la valoracion inicial."
}
```

Respuesta:

- `204 No Content`
- `404 Not Found`
- `400 Bad Request`

### DELETE `/api/Consultas/{id}`

Respuesta:

- `204 No Content`
- `404 Not Found`

### POST `/api/Consultas/{id}/datos-ginecologicos`

Crea o actualiza datos ginecologicos de la consulta.

Body:

```json
{
  "embarazos": 2,
  "partos": 1,
  "abortos": 0,
  "lactancia": false,
  "fechaUltimaMenstruacion": "2026-04-01T00:00:00",
  "metodoAnticonceptivo": "Oral"
}
```

Respuesta:

- `204 No Content`
- `404 Not Found`
- `400 Bad Request`

### POST `/api/Consultas/{id}/evaluaciones`

Guarda o reemplaza el bloque de evaluaciones de una consulta.

Body:

```json
{
  "items": [
    {
      "itemId": 10,
      "seleccionado": true,
      "observacion": "Leve irritacion"
    },
    {
      "itemId": 11,
      "seleccionado": false,
      "observacion": ""
    }
  ]
}
```

Respuesta:

- `204 No Content`
- `404 Not Found`
- `400 Bad Request`

---

## Evaluaciones

Ruta base: `/api/Evaluaciones`

### GET `/api/Evaluaciones/categorias`

Lista categorias con sus items.

### GET `/api/Evaluaciones/categorias/{id}`

Obtiene una categoria por id.

### POST `/api/Evaluaciones/categorias`

Body:

```json
{
  "nombre": "Piel"
}
```

### PUT `/api/Evaluaciones/categorias/{id}`

Body:

```json
{
  "nombre": "Piel sensible"
}
```

### DELETE `/api/Evaluaciones/categorias/{id}`

### POST `/api/Evaluaciones/items`

Crea un item asociado a una categoria.

Body:

```json
{
  "nombre": "Rosacea",
  "categoriaEvaluacionId": 1
}
```

### PUT `/api/Evaluaciones/items/{id}`

Body:

```json
{
  "nombre": "Rosacea activa"
}
```

### DELETE `/api/Evaluaciones/items/{id}`

Respuestas comunes en este controlador:

- `201 Created` en creacion
- `204 No Content` en actualizacion o eliminacion
- `404 Not Found`
- `400 Bad Request`

---

## Catalogos de tratamiento

Ruta base: `/api/CatalogosTratamiento`

### Tratamientos de catalogo

#### GET `/api/CatalogosTratamiento/tratamientos`

Lista tratamientos base del catalogo.

#### GET `/api/CatalogosTratamiento/tratamientos/{id}`

Obtiene un tratamiento de catalogo.

#### POST `/api/CatalogosTratamiento/tratamientos`

Body:

```json
{
  "nombre": "Limpieza profunda",
  "sesionesSugeridas": 4,
  "precioBase": 1500,
  "campoTratamientoIds": [1, 2]
}
```

#### PUT `/api/CatalogosTratamiento/tratamientos/{id}`

Usa el mismo cuerpo del POST.

#### DELETE `/api/CatalogosTratamiento/tratamientos/{id}`

### Campos de tratamiento

#### GET `/api/CatalogosTratamiento/campos`

Lista los campos configurables de tratamientos.

#### GET `/api/CatalogosTratamiento/campos/{id}`

Obtiene un campo por id.

#### POST `/api/CatalogosTratamiento/campos`

Body:

```json
{
  "nombre": "Zona",
  "tipoDato": "texto",
  "requerido": true,
  "opciones": null,
  "activo": true
}
```

`opciones` puede usarse para listas, por ejemplo: `"Rostro,Espalda"`.

#### PUT `/api/CatalogosTratamiento/campos/{id}`

Usa el mismo cuerpo del POST.

#### DELETE `/api/CatalogosTratamiento/campos/{id}`

Respuestas comunes:

- `200 OK` en consultas
- `201 Created` en creacion
- `204 No Content` en actualizacion o eliminacion
- `404 Not Found`
- `400 Bad Request`

---

## Tratamientos

Ruta base: `/api/Tratamientos`

### POST `/api/Tratamientos/asignar`

Asigna un tratamiento a una consulta.

Body:

```json
{
  "consultaId": 12,
  "catalogoTratamientoId": 3,
  "precioVenta": 1800,
  "valores": [
    {
      "campoTratamientoId": 1,
      "valor": "Rostro"
    },
    {
      "campoTratamientoId": 2,
      "valor": "Fototipo II"
    }
  ]
}
```

Respuesta: `201 Created` con `TratamientoDetalleDto`.

### GET `/api/Tratamientos/{id}`

Obtiene el detalle de un tratamiento asignado.

### GET `/api/Tratamientos/consulta/{consultaId}`

Lista tratamientos por consulta.

### PUT `/api/Tratamientos/{id}/estado`

Actualiza el estado de un tratamiento. El body es un string JSON.

Body:

```json
"Finalizado"
```

Respuesta:

- `204 No Content`
- `404 Not Found`

### DELETE `/api/Tratamientos/{id}`

Respuesta:

- `204 No Content`
- `404 Not Found`

### POST `/api/Tratamientos/sesiones`

Agrega una sesion a un tratamiento.

Body:

```json
{
  "tratamientoId": 5,
  "fecha": "2026-04-20T14:30:00",
  "notas": "Sesion tolerada sin molestias."
}
```

Respuesta: `200 OK` con `SesionDto`.

### POST `/api/Tratamientos/pagos`

Registra un pago.

Body:

```json
{
  "tratamientoId": 5,
  "monto": 500,
  "metodoPago": "Transferencia",
  "referencia": "TX-00991"
}
```

Respuesta: `200 OK` con `PagoTratamientoDto`.

### GET `/api/Tratamientos/{id}/historial`

Obtiene historial de sesiones y pagos del tratamiento.

Respuesta: `200 OK` con `TratamientoHistorialDto`.

---

## Citas

Ruta base: `/api/Citas`

Requiere token JWT.

### GET `/api/Citas`

Lista citas. Permite filtrar por rango de fechas con query params opcionales:

- `start`
- `end`

Ejemplo:

```http
GET /api/Citas?start=2026-04-01&end=2026-04-30
```

### GET `/api/Citas/{id}`

Obtiene una cita por id.

### GET `/api/Citas/paciente/{pacienteId}`

Lista citas de un paciente.

### POST `/api/Citas`

Permite crear una cita para paciente registrado o temporal.

Body para paciente registrado:

```json
{
  "pacienteId": 1,
  "fecha": "2026-04-18T09:00:00",
  "motivo": "Control",
  "observaciones": "Confirmada por telefono",
  "duracionMinutos": 45
}
```

Body para paciente temporal:

```json
{
  "nombrePacienteTemporal": "Paciente temporal",
  "telefonoTemporal": "8888-7777",
  "fecha": "2026-04-18T10:00:00",
  "motivo": "Valoracion inicial",
  "observaciones": null,
  "duracionMinutos": 30
}
```

Respuesta: `201 Created` con `CitaDto`.

### PUT `/api/Citas/{id}`

Body:

```json
{
  "fecha": "2026-04-18T11:00:00",
  "motivo": "Seguimiento",
  "estado": "Reprogramada",
  "observaciones": "Cambio solicitado por paciente",
  "duracionMinutos": 30
}
```

### PUT `/api/Citas/{id}/estado`

Actualiza solo el estado. El body es un string JSON.

```json
"Cancelada"
```

### DELETE `/api/Citas/{id}`

Respuestas comunes:

- `200 OK` o `201 Created` segun accion
- `204 No Content` en actualizacion o borrado
- `404 Not Found` con mensaje `Cita no encontrada`
- `400 Bad Request` con mensaje de error

---

## Consentimientos

Ruta base: `/api/Consentimientos`

Requiere token JWT.

### GET `/api/Consentimientos/tipos`

Lista tipos de consentimiento.

### GET `/api/Consentimientos/consulta/{consultaId}`

Lista consentimientos ligados a una consulta.

### POST `/api/Consentimientos`

Crea un consentimiento y guarda la firma enviada en base64.

Body:

```json
{
  "consultaId": 12,
  "tipoConsentimientoId": 2,
  "contenido": "Paciente autoriza el procedimiento...",
  "firmaBase64": "data:image/png;base64,iVBORw0KGgoAAA..."
}
```

Respuesta: `201 Created` con `ConsentimientoDto`.

Errores:

- `400 Bad Request` con mensaje del servicio.

---

## Imagenes

Ruta base: `/api/Imagenes`

Requiere token JWT.

### POST `/api/Imagenes/upload`

Sube una imagen usando `multipart/form-data`.

Campos esperados:

- `consultaId`.
- `tipoImagenId`.
- `file`.

Restricciones observadas en el controlador:

- archivo obligatorio
- extensiones permitidas: `.jpg`, `.jpeg`, `.png`

Ejemplo con `curl`:

```bash
curl -X POST "https://localhost:7226/api/Imagenes/upload" \
  -H "Authorization: Bearer <token>" \
  -F "consultaId=12" \
  -F "tipoImagenId=1" \
  -F "file=@C:/imagenes/antes.jpg"
```

Respuesta: `200 OK` con `ImagenDto`.

### GET `/api/Imagenes/consulta/{consultaId}`

Lista imagenes de una consulta.

### GET `/api/Imagenes/tipos`

Lista tipos de imagen disponibles.

### DELETE `/api/Imagenes/{id}`

Elimina una imagen.

Respuesta:

- `204 No Content`
- `404 Not Found`

---

## Dashboard

Ruta base: `/api/Dashboard`

Requiere token JWT.

### GET `/api/Dashboard`

Obtiene datos del tablero principal.

Respuesta `200 OK` con `DashboardDataDto`:

```json
{
  "stats": {
    "totalPacientes": 120,
    "citasHoy": 8,
    "consultasMes": 35,
    "pacientesNuevosMes": 12
  },
  "citasProximas": [],
  "recentPacientes": [],
  "treatmentDistribution": []
}
```

---

## DTOs mas usados

### PacienteDto

```json
{
  "id": 1,
  "dni": "0801199912345",
  "nombrePaciente": "Maria Lopez",
  "profesion": "Abogada",
  "direccion": "Col. Palmira",
  "fechaNacimiento": "1991-05-10T00:00:00",
  "telefono": "9999-9999",
  "correo": "maria@example.com",
  "contacto": "Hermana",
  "sexo": "F"
}
```

### ConsultaDto

```json
{
  "id": 12,
  "pacienteId": 1,
  "nombrePaciente": "Maria Lopez",
  "fecha": "2026-04-16T10:00:00",
  "estado": "Borrador",
  "cantidadMotivos": 2,
  "cantidadTratamientos": 1,
  "tieneDatosGinecologicos": true
}
```

### CitaDto

```json
{
  "id": 3,
  "pacienteId": 1,
  "nombrePaciente": "Maria Lopez",
  "telefono": "9999-9999",
  "fecha": "2026-04-18T09:00:00",
  "motivo": "Control",
  "estado": "Programada",
  "observaciones": "Confirmada",
  "duracionMinutos": 45,
  "esPacienteRegistrado": true
}
```

## Recomendaciones de uso

- Probar primero en Swagger cuando se quiera validar rapidamente el contrato.
- Guardar el token JWT del login y reutilizarlo en todos los endpoints protegidos.
- En `PUT /estado` para citas y tratamientos, enviar un string JSON y no un objeto.
- En cargas de imagenes usar `multipart/form-data`, no JSON.
- Si el frontend necesita un formato uniforme de errores y exitos, conviene estandarizar las respuestas de todos los controladores.
