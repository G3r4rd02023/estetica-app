# Estetica App

Aplicación web para la gestión de clínicas de estética y consultorios médicos.

## Características

- **Gestión de Pacientes**: Registro y seguimiento de pacientes
- **Citas**: Agenda y programación de citas con validación de horarios
- **Consultas**: Historial clínico de consultas por paciente
- **Tratamientos**: Catálogo de tratamientos y asignación a pacientes
- **Evaluación Clínica**: Evaluación médica por categorías
- **Consentimientos**: Generación y firma de consentimiento informado
- **Imágenes**: Álbum de imágenes clínicas por consulta
- **Dashboard**: Vista general de métricas y estadísticas

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Estilos**: Tailwind CSS
- **Router**: React Router DOM
- **HTTP**: Axios

## Estructura del Proyecto

```
src/
├── components/       # Componentes reutilizables
│   └── ui/         # Componentes de UI (Button, Input, Card, etc.)
├── contexts/       # Contextos de React (Theme)
├── pages/          # Páginas de la aplicación
├── services/       # Configuración de API
├── types/         # Tipos TypeScript
├── utils/         # Utilidades (fechas)
└── App.tsx        # Componente principal
```

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
```

El build se genera en la carpeta `dist/`.

## Configuración

El archivo `.env.example` contiene las variables de entorno necesarias. Copiar a `.env` y ajustar:

```
VITE_API_URL=https://api-estetica.runasp.net
```

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard |
| `/login` | Inicio de sesión |
| `/pacientes` | Lista de pacientes |
| `/citas` | Agenda de citas |
| `/consultas` | Lista de consultas |
| `/consultas/:id` | Detalle de consulta |
| `/tratamientos` | Catálogo de tratamientos |

## Zonas Horarias

La aplicación maneja conversión entre:
- **Hora local**: GMT-6 (Honduras)
- **Servidor**: GMT+1

Las fechas se ajustan automáticamente al enviar y recibir.