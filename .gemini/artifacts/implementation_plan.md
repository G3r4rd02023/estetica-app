# Modernización de Interfaz y Modo Oscuro (UI/UX Revamp)

Esta es una propuesta para renovar el aspecto visual de la aplicación. El objetivo principal es aportar un estilo premium, sumamente pulido y coherente en todo el sistema (Skill: `frontend-design`), añadiendo soporte completo para modo claro y modo oscuro, así como tipografías de alta legibilidad y elegancia contemporánea.

## User Review Required

> [!WARNING]
> La adición del Modo Oscuro implicará cambiar cómo gestionamos los colores de fondo (`bg-white` y `bg-slate-50`) agregándoles el modificador `dark:` en todos los componentes. 
> Por favor revisa las tipografías propuestas. Seleccioné una combinación que se usa mucho en productos de alta gama.

## Modificaciones Propuestas

### Configuración Base y Tipografía
Vamos a incluir tipografías de Google Fonts, configurándolas en Tailwind y CSS para que dominen inmediatamente la estética de los componentes.
- **Tipografías elegidas:**
  - *Outfit*: Para encabezados y títulos (aporta un look muy moderno, geométrico y limpio).
  - *Plus Jakarta Sans*: Para cuerpo de texto y UI (extremadamente legible, con excelente balance en pantallas de alta densidad).

#### [MODIFY] index.html
- Se agregarán los enlaces (`<link>`) a Google Fonts.

#### [MODIFY] tailwind.config.js
- Activación explícita de `darkMode: 'class'`.
- Configuración de `fontFamily` para usar *Outfit* y *Plus Jakarta Sans*.

#### [MODIFY] src/index.css
- Variables CSS para facilitar degradados más estilizados.
- Transiciones globales de color en `body` y `html` para que el cambio entre modos no sea abrupto.
- Cambios a `@layer base` para dar soporte a la tipografía y los fondos base de Dark Mode.

---

### Contexto de Tema (Dark/Light Switch)
Se necesita un manejador global del estado del tema.

#### [NEW] src/contexts/ThemeContext.tsx
- Un nuevo React Context que guardará la preferencia en `localStorage` y verificará el esquema de color del sistema (prefers-color-scheme). Agrega / quita la clase `dark` del elemento HTML global.

#### [MODIFY] src/App.tsx / main.tsx
- Envolverán la jerarquía de componentes con `<ThemeProvider>`.

---

### Componentes Globales y Layout
Se actualizarán los componentes principales de navegación y layout para soportar la coherencia visual.

#### [MODIFY] src/components/Layout.tsx
- Adición de un Toggle de Tema (Interruptor estilo minimalista) en el encabezado.
- Adaptación para Modo Oscuro en Sidebar, Headers y fondos:
  - `bg-white` a `bg-white dark:bg-slate-900`
  - Control de bordes `border-slate-200` a `border-slate-200 dark:border-white/10`
  - Re-estilización del Sidebar para que en modo oscuro tenga una profundidad adecuada.

#### [MODIFY] Componentes UI Globales (Button.tsx, Input.tsx)
- Se les dotará de un look más refinado: sombras más suaves, transiciones limpias y paleta para modo oscuro.
- Inputs con borde sutil `dark:border-white/10` y fondos de acento en hover.

---

### Páginas / Vistas Principales
Aplicación del sistema uniforme.

#### [MODIFY] src/pages/Consultas.tsx (y páginas clave)
- Transición dinámica de clases de fondo de la página, modales y tarjetas hacia la paleta oscura.
- Adaptación de textos de estado de las tablas.

## Open Questions

> [!IMPORTANT]
> ¿Tienes alguna preferencia de paleta de color principal para el "Modo Claro"? Actualmente usas tonos rosas (`primary-500` = `#ee458a`). Sugiero mantenerla pero afinar la pureza del color, o cambiar a un tono más moderno de morado/índigo si buscas un cambio más radical.
> ¿Te parece bien la selección tipográfica (Outfit + Plus Jakarta Sans), o preferirías explorar otras opciones como Inter / Roboto (que son más estándares pero genéricas)?

## Verification Plan

### Manual Verification
- Renderizar la aplicación localmente (`npm run dev`).
- Alternar repetidamente el modo Claro/Oscuro usando el nuevo botó para confirmar que la transición es imperceptiblemente fluida.
- Verificar modales, inputs en focus y selects nativos dentro del modo oscuro en la vista de `Consultas`.
- Inspeccionar la estructura de la fuente cargada globalmente en herramientas de desarrollador.
- Verificar el comportamiento Responsive (Sidebar).
