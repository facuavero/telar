# Referencias de diseño para Telar (investigación en Mobbin)

> Investigación hecha el 11/09/2026 navegando mobbin.com con tu sesión de Chrome (cuenta **free**).
> Todas las referencias de abajo las abrí y las miré en Mobbin, ninguna sale de memoria.

## Método y limitaciones

- **Buscador interno de Mobbin**, dos secciones:
  - **Apps → Screens** (web) para el producto: `integrations`, `connect apps`, `AI assistant`, `AI dashboard`, `onboarding`, `empty state`, `workflow builder`, `automation`, `zapier`, `n8n`.
  - **Sites → Sections** para landings: `AI automation`, `integrations`, `AI agents hero`, `workflow automation`, `linear`, `vercel`.
- **Límite de la cuenta free:** cada búsqueda muestra **3 resultados** y después aparece el paywall ("Access all 660,566 screens"). Las pantallas "similares" que sugiere Mobbin (Linear, Attio, etc.) se ven como placeholder gris. Por eso hice muchas búsquedas y me quedé con las 3 que da cada una.
- **n8n:** la búsqueda no devolvió pantallas de n8n (trajo fal, Devin y Plain). **Make** no lo busqué por separado. **Zapier** sí apareció, con 3 pantallas.
- **Links:** los de `mobbin.com/screens/...` y `mobbin.com/sites/...` requieren login en Mobbin. En los *sites*, el link lleva a la ficha del sitio. La sección puntual aparece buscando el término indicado.
- **Tipografías:** las describo por lo que se ve ("grotesca tipo Inter"), no las verifiqué en el código.

**Total: 40 referencias de 29 productos distintos, en 6 categorías.**

---

## 1. Integraciones / "Connect apps"

### 1.1 Canny: catálogo de integraciones en Settings
- **Link:** https://mobbin.com/screens/ad0e6779-37be-4f85-a109-d2dc75764ce5 (búsqueda: `integrations`)
- **Visual:**
  - Fondo blanco. Rail de íconos a la izquierda con tinte lavanda y el ítem activo en violeta.
  - Nav de settings con grupos en mayúscula chica gris (PERSONAL / AS MOBBIN / PORTAL).
  - Header "Integrations" + subtítulo "Connect Canny to your tools and services" + link "Learn more".
  - Tercera columna de filtros: **All Integrations / Active Integrations**, "Works with" y **Categories** (AI, Authentication, Automation, Communication, Data and Enrichment, Project Management, Sales).
  - Contenido en secciones ("New Integrations": Claude, OpenAI; "Autopilot Sources") con una **grilla de 3 columnas de cards chicas**: logo a color 24px + nombre, borde gris claro, radio ~8px.
- **Patrón que resuelve bien:**
  - Estado conectado/desconectado **inline con un toggle** en la card (off = gris).
  - Badge **"via Zapier"** en las integraciones indirectas.
  - Separación explícita entre "todas" y "activas".
- **Para Telar:** tab *Todas / Conectadas*, filtro por categoría (Comunicación, Documentos, Datos, Email…) y badge del *método* de conexión (nativa · vía webhook · vía API).

### 1.2 MagicPath: lista mínima de integraciones
- **Link:** https://mobbin.com/screens/8b054024-79ea-4a31-b0fe-9b68cb1e0648 (búsqueda: `integrations`)
- **Visual:**
  - Todo gris/blanco, tipografía muy chica y neutra.
  - Nav izquierda simple (Account, Plans & billing, Usage, **Integrations**, Skills, Assets).
  - Columna central angosta con filas: logo en un cuadrado con borde, nombre en bold, una línea de descripción gris y un botón outline a la derecha.
- **Patrón:** la anatomía de fila más limpia que vi. El **verbo del CTA cambia según el estado**: "Connect →" si falta conectar, "View docs →" si no requiere acción.
- **Para Telar:** usar esta anatomía (logo · nombre · descripción · 1 CTA) en listas cortas, como en el onboarding o en el drawer de "herramientas de esta automatización".

### 1.3 Toggl Track: página de integraciones con salida "¿no la encontrás?"
- **Link:** https://mobbin.com/screens/35dc1ca5-7b49-4501-b0c3-a52faa0f5128 (búsqueda: `integrations`)
- **Visual:**
  - Filas grandes (Asana, QuickBooks): logo, nombre + ícono de info, descripción y botón "Get started" con ícono de link externo.
  - Banner promocional con ilustración violeta/rosa (laptop + pieza de puzzle) y fila de íconos de apps soportadas.
  - Al final, **"Can't find an Integration?"** con dos cards-link grandes: "Build something on your own with the Toggl Track API →" y "Discover automation apps… →".
  - Sidebar con badge "NEW" en Integrations y una card oscura "Trial: 7 days left".
- **Patrón:** resuelve el **callejón sin salida** de un catálogo, cuando la herramienta del usuario no está.
- **Para Telar:** bloque final "¿No está tu herramienta? → Pedila / Conectala por webhook / API". Crítico para un producto que promete "conectar todo".

### 1.4 Supabase: drawer "Connect to your project" (MCP)
- **Link:** https://mobbin.com/screens/6c67b38e-8804-465a-9d94-1075201ebb05 (búsqueda: `connect apps`)
- **Visual:**
  - **Hoja lateral derecha** sobre el dashboard atenuado.
  - Selector de método con 4 cards segmentadas (ícono + label + sublabel): Framework / Direct / ORM / **MCP "Connect your agent"**.
  - Formulario con label a la izquierda y control a la derecha: Client (dropdown "Claude Code"), **Read-only (toggle verde ON)** con ayuda "Only allow read operations on your database" y Feature groups.
  - Después, "Connect your app" con botón "Copy prompt" y **pasos numerados** (1 Add MCP server, 2 Authenticate) con bloque de código mono.
- **Patrón:** **permisos granulares en el momento de conectar**. Cada toggle lleva microcopy que explica qué habilita.
- **Para Telar:** al conectar Gmail o Slack, un drawer con permisos del tipo "Telar puede: leer ✓ · enviar en tu nombre ☐ · solo estos canales…". Baja el miedo del usuario B2B a darle acceso a una IA.

### 1.5 Mistral Le Chat: modal de conector (Gmail)
- **Link:** https://mobbin.com/screens/1c9dedfc-77f9-4805-8fc3-c51f13be4eb0 (búsqueda: `connect apps`)
- **Visual:**
  - Modal blanco centrado sobre la app desenfocada.
  - Logo de Gmail + nombre, tab "Overview" y fila **"Reference"** con un chip copiable `gmail`.
  - Descripción: "Include your email in your chats."
  - Botón **negro full-width "Connect"**.
  - Footer con ícono de escudo: *"Your data will be kept private to members of this workspace. Mistral will not use it as training data."*
  - En la sidebar de fondo: "Connectors" con badge "New".
- **Patrón:** conectar una herramienta **a un asistente de IA**:
  - El conector tiene un *handle* que después se usa en el chat.
  - La promesa de privacidad está **pegada al botón de decisión**.
- **Para Telar:** la referencia más directa. Cada integración con su handle (`@slack`, `@gmail`, `@notion`) para mencionarla en lenguaje natural, y la nota de privacidad justo arriba de "Conectar".

### 1.6 Zapier: configuración de paso con cuenta conectada
- **Link:** https://mobbin.com/screens/01143689-3301-4625-b1d4-eebcb87ef7b6 (búsqueda: `zapier`)
- **Visual:**
  - Modal "1. New Email" con ícono de Gmail y lápiz para renombrar.
  - Stepper en tabs: **Setup ✓ · Configure ✓ · Test ⚠** (check verde, warning amarillo).
  - Campos: App (chip "Gmail" + botón "Change"), Trigger event (select), Account ("Gmail SLMobbin — Used in 1 Zap" + Change + menú ⋮).
  - Nota: "Gmail is a secure partner with Zapier. **Your credentials are encrypted and can be removed at any time.** You can manage all of your connected accounts here."
  - Botón violeta full-width "Continue".
- **Patrón:**
  - La **cuenta conectada se reutiliza** entre automatizaciones ("Used in 1 Zap").
  - El estado de cada sub-paso es visible en el stepper.
- **Para Telar:** mostrar "Usada en N automatizaciones" en cada cuenta conectada (sirve para no romper nada al desconectar) y un stepper con estado por paso en el editor.

---

## 2. AI assistant / AI dashboard

### 2.1 Zapier: home "What would you like to automate?"
- **Link:** https://mobbin.com/screens/006c2287-7ff7-40ef-93ae-9ea7efa1f7f3 (búsqueda: `zapier`)
- **Visual:**
  - Fondo crema muy claro. Título grande "What would you like to automate?" + badge "Beta".
  - **Input de prompt con borde degradé** (rosa → violeta → azul), ícono ✨ y placeholder de ejemplo: *"When I add a reaction to a Slack message, create a card in Trello."*
  - Chips lavanda "Some ideas to get started".
  - **"Or try one of these prompts"**: 3 cards de texto con los nombres de las apps en **bold**.
  - "Start from scratch": tiles con ícono naranja (Zap, Table, Interface, Chatbot, Canvas).
  - **"Unfinished Zaps"**: cards con badge amarillo **"Missing authorization"** y stack de íconos de apps (+3).
  - Sidebar con botón naranja "+ Create" y, abajo, un medidor de plan "Included Tasks 119 / 750" con barra y "Usage resets in 4 weeks".
- **Patrón:**
  - Home centrado en **describir la automatización en lenguaje natural**.
  - Automatizaciones incompletas **por falta de autorización** (integración desconectada) marcadas con un badge claro.
- **Para Telar:** es el competidor directo. Robar: prompts de ejemplo con las apps en bold, badge "Falta autorizar" y medidor de uso en la sidebar. **Diferenciarse** del degradé violeta genérico.

### 2.2 Dropbox Dash: home del asistente
- **Link:** https://mobbin.com/screens/c71d9bb7-035a-4f72-b229-5bfc561f2470 (búsqueda: `AI assistant`)
- **Visual:**
  - Blanco cálido. Sidebar (Home, Search ⌘K, Chats, Stacks).
  - H1 centrado bold "Here to help, anytime" y **caja de prompt grande redondeada** (adjuntar, filtros, micrófono).
  - Debajo, **chips de intención** con ícono: Analyze · Write · Organize · Prepare · Status.
  - Card de checklist **"Get to know Dash" (1 of 5)**: los ítems completados quedan tachados, con círculos como checkbox y chevrons.
- **Patrón:** home = prompt + intenciones + activación, **las tres cosas en una sola vista**.
- **Para Telar:** la estructura base del Inicio del dashboard.

### 2.3 Dropbox Dash: selector de contenido de apps conectadas
- **Link:** https://mobbin.com/screens/4e91bfac-5d41-4465-8787-e66138361ac5 (búsqueda: `AI dashboard`)
- **Visual:**
  - Prompt "Summarize key points of the attached document". Desde el clip se abre un dropdown con input **"Search connected apps"**.
  - Lista de documentos, cada uno con ícono de su fuente y meta **"Notion • Updated 2 days ago"** (también una hoja de Google Drive).
  - Separador y "Upload files". Botón de enviar: círculo negro.
- **Patrón:** **referenciar contenido de las herramientas conectadas dentro del prompt**, con fuente y fecha para desambiguar.
- **Para Telar:** el `@` del prompt tiene que abrir exactamente esto: canales de Slack, docs de Notion, hojas de Sheets, con ícono de la fuente y fecha de última actualización.

### 2.4 Shopify Sidekick: la IA pregunta antes de actuar
- **Link:** https://mobbin.com/screens/6e86f9d6-9202-48ed-8a10-055911b2c0a9 (búsqueda: `AI assistant`)
- **Visual:**
  - Top bar oscura con buscador ⌘K y nav del admin a la izquierda, con la lista **"Sidekick conversations"** abajo.
  - Mensaje del usuario: burbuja gris a la derecha, con grilla de imágenes.
  - Respuesta de la IA **sin burbuja**: texto plano con lista numerada en bold y estado "Asking questions…".
  - Abajo, **card de pregunta aclaratoria**: "Which products do you want descriptions for?" con opciones numeradas (1 All 5 products, 2…, 4 Other), paginador "1 of 2", "Dismiss" y botón violeta "Next ↵".
- **Patrón:** **desambiguación estructurada**. En lugar de adivinar, la IA ofrece opciones clickeables o navegables con teclado.
- **Para Telar:** si el pedido es ambiguo ("mandale el resumen al equipo"), mostrar una card "¿A qué canal?" con opciones numeradas (#ventas, #general, DM…) antes de armar el flujo.

### 2.5 Buffer: panel "AI Assistant" junto al editor
- **Link:** https://mobbin.com/screens/ff1e037e-1a9f-4bd3-8264-45189fe6ec0e (búsqueda: `AI assistant`)
- **Visual:**
  - Dos paneles. A la izquierda, "AI Assistant" con ícono ✨ violeta, input "What do you want to write about?" y **card de resultado lavanda** con Copy · Retry · **Insert** (violeta).
  - **Chips de refinamiento:** Rephrase, Shorten, Expand, More Casual, More Formal.
  - Disclaimer con ícono ⚠: "AI responses can be inaccurate or misleading. Always review before publishing."
  - En la sidebar de fondo: **"3/3 channels connected"** con barra de progreso.
- **Patrón:**
  - El resultado de la IA es un **borrador revisable** que se inserta a mano.
  - La iteración se hace con chips, no con más texto.
  - Medidor de conexiones en la sidebar.
- **Para Telar:** vista previa del resultado antes de activar, chips "Más corto / Más formal / Otro canal" y medidor "4/6 herramientas conectadas".

### 2.6 fal: dashboard con KPIs de uso
- **Link:** https://mobbin.com/screens/44c83f2d-2b82-411c-9565-5b1555737ed9 (búsqueda: `AI dashboard`)
- **Visual:**
  - Barra de anuncio azul marino arriba.
  - Header: logo + breadcrumb, buscador "Search anything ⌘K", **pill de créditos "$6.64"**, Docs y avatar azul. Nav horizontal en tabs (Home, Explore, Assets, Generate, Serverless, Compute *Beta*, Settings).
  - "Dashboard" + link "Hide getting started guide". Card "Getting started" partida en dos (pasos de API | modelos nuevos).
  - **Tira de 3 KPIs** en celdas con borde: saldo + costo estimado ("Go to billing"), **"Requests in the last 7 days: 11"** con barras violetas, **"Errors: 0"** con línea roja punteada ("See analytics").
  - "Recently active models": cards con ícono en tile de color, nombre y "Last used: about 1 hour ago".
- **Patrón:** KPIs con **micrográfico + CTA secundario** dentro de cada celda, más "recientes" para retomar.
- **Para Telar:** tira de KPIs *Ejecuciones (7 días) · Horas ahorradas · Errores*, cada una con sparkline y link ("Ver actividad"), más "Automatizaciones recientes".

### 2.7 Higgsfield (Supercomputer): galería de capacidades
- **Link:** https://mobbin.com/screens/d56a3a36-b7d8-40a3-90f5-c1222d5bd7ea (búsqueda: `AI dashboard`)
- **Visual:**
  - UI casi negra con textura de puntos y **acento lima neón**.
  - Headline en mayúscula bold condensada "WHAT ARE WE CREATING TODAY?".
  - Prompt con "+", selector "Efficient mode" y "Ask". Chips (Image, Video, Run marketing *HOT*, Create a design, Build websites).
  - Sección "WHAT SUPERCOMPUTER CAN DO" con cards de ejemplo, imagen grande y tags de color (NEW / POPULAR / VIRAL / HOT).
- **Patrón:** mostrar **qué puede hacer la IA con ejemplos clickeables** debajo del prompt.
- **Para Telar:** galería de "recetas" (plantillas) bajo el prompt. **No** copiar la estética neón/consumer, que choca con un B2B.

### 2.8 Magnific: prompt contextual sobre el objeto
- **Link:** https://mobbin.com/screens/408f1a97-d913-4815-886f-6cd5bc1e3cf9 (búsqueda: `connect apps`)
- **Visual:**
  - Editor de video blanco con sidebar y botón rosa "+ Create".
  - Una **barra de prompt flotante sobre el canvas**: "Describe what you want to do with your video", con selectores Auto / 720p y botón enviar.
  - Toolbar de íconos debajo.
- **Patrón:** el prompt vive **en contexto**, sobre lo que se edita, no en un chat aparte.
- **Para Telar:** en el editor de una automatización, una barra flotante "Describí qué cambiar…" ("agregá un paso que avise por email si falla").

---

## 3. Onboarding SaaS B2B

### 3.1 Devin: prompt condicionado a conectar la herramienta
- **Link:** https://mobbin.com/screens/7d6ffb47-80c1-4d42-b269-c0be539d07dc (búsqueda: `onboarding`)
- **Visual:**
  - Blanco minimal. Selector de organización (dropdown con badge "New").
  - Centro: glifo del logo y caja de prompt con una **tira pegada arriba: "Connect your codebase to try Devin for free — Connect"** (ícono de GitHub).
  - Meta debajo: "0 repositories · Ubuntu · Advanced capabilities →".
  - Checklist **"Get started with Devin" (1 of 6)** con barra de progreso azul: Connect to Git ✓, Select repositories, Make your first session… y "Show advanced tips".
- **Patrón:** el paso crítico de activación (conectar) está **adosado al input principal**, no escondido en settings.
- **Para Telar:** con 0 integraciones, la caja de prompt muestra "Conectá Slack o Gmail para empezar — Conectar". El checklist arranca con "Conectá tu primera herramienta".

### 3.2 HoneyBook: checklist con duración por paso
- **Link:** https://mobbin.com/screens/7c915d6b-2a99-4eb0-956d-e7a3a97bb265 (búsqueda: `onboarding`)
- **Visual:**
  - Sidebar negra con card fija arriba **"Set up your account 6/7 completed"** y barra verde.
  - Main gris claro con "Welcome to HoneyBook, Alex!" grande.
  - Card "Let's start step-by-step" (6/7) donde cada paso es una fila con borde: check verde, título + **pill de duración ("2 mins")**, descripción y chevron.
  - Columna derecha: Brand elements, **Integrations como chips con logo** (Gmail ✓, Zoom, Canva, Google Calendar, QuickBooks), video "How HoneyBook works" y links de ayuda.
- **Patrón:**
  - La duración estimada baja la fricción.
  - El progreso **persiste en la sidebar** aunque salgas de la página.
  - Integraciones como chips de un click, con check si ya están conectadas.
- **Para Telar:** pill "1 min" en cada paso, progreso en la sidebar y chips de integraciones sugeridas (con ✓ las conectadas).

### 3.3 Customer.io: workspace setup por canales + feed de tareas
- **Link:** https://mobbin.com/screens/b9bde54a-06d4-4204-9645-b5bc94694684 (búsqueda: `onboarding`)
- **Visual:**
  - Banner amarillo arriba ("We're reviewing your account…").
  - Sidebar agrupada por intención (Review, Send messages, Manage audience, Create content, Configure data).
  - "Workspace setup": card "Set up your email messaging channel (2/3)" con ítems hechos tachados; "Set up other messaging channels" (Slack, SMS, In-app, Push, WhatsApp); "Integrate your data" colapsado con check teal.
  - **"Up next"** en 3 cards.
  - Popover **"Tasks"** con badges verdes **"Success"** y tiempo relativo ("An hour ago — Prepare Newsletter").
- **Patrón:** setup dividido por canal y **feed de ejecuciones del agente** con estado.
- **Para Telar:** el popover "Tasks" es ideal para "Actividad de Telar": cada ejecución con estado (Éxito / Error / Esperando aprobación) y hora.

### 3.4 Zapier: signup en dos columnas
- **Link:** https://mobbin.com/screens/01a5c528-b60d-485a-9ec6-d17609069d85 (búsqueda: `zapier`)
- **Visual:**
  - Crema. A la izquierda, headline "Join millions worldwide who automate their work using Zapier." y 3 bullets con check verde (Easy setup, no coding required / Free forever… / 14-day trial…).
  - A la derecha, card de formulario con **validación de contraseña en vivo** (checks por regla) y CTA naranja "Get started for free".
  - Tira de logos de clientes en gris.
- **Patrón:** propuesta de valor + prueba social visibles *mientras* te registrás.
- **Para Telar:** signup con 3 promesas ("Sin código", "Conectás en 2 minutos", "Vos aprobás cada acción").

---

## 4. Empty states

### 4.1 v0: "No Templates Found" (anti-referencia)
- **Link:** https://mobbin.com/screens/c9c1383f-ca47-4b87-9a98-f8de2af02719 (búsqueda: `empty state`)
- **Visual:** tabs arriba, buscador y card con ícono de globo en un cuadradito con borde. "No Templates Found" en bold + "Your team hasn't created any templates."
- **Patrón:** empty prolijo pero **sin ninguna acción siguiente**.
- **Para Telar:** tomar la forma (ícono chico + título + una línea), pero **siempre con CTA**.

### 4.2 Plain: empty que explica qué integración falta
- **Link:** https://mobbin.com/screens/37b70815-3fba-43e3-9fe5-d0849eed4bca (búsqueda: `empty state`)
- **Visual:** rail de íconos + nav secundaria (Reporting, Top issues, Themes *Beta*). Card centrada: "No tracked issues" y "**Link Plain threads to your issue tracker** to track your customers' requests. Linked issues will appear here." + botón "Learn more".
- **Patrón:** el empty **dice qué conexión lo llena y qué va a aparecer**.
- **Para Telar:** fórmula de copy "Conectá **Notion** para ver acá tus docs recientes → [Conectar Notion]".

### 4.3 Perplexity: empty ultra liviano con ejemplos
- **Link:** https://mobbin.com/screens/248fe095-0704-4097-ae99-813eec3f8a89 (búsqueda: `empty state`)
- **Visual:** fondo **blanco cálido / hueso**, sidebar (New, Computer, Spaces, Artifacts, Customize, History) y botón oscuro "+ New space" arriba a la derecha. Una sola línea: "No Spaces yet. **View examples.**"
- **Patrón:** empty que no ocupa la pantalla y deriva a ejemplos.
- **Para Telar:** en listas secundarias (Actividad, Historial): una línea + "Ver ejemplos".

### 4.4 Devin: Automations vacío = crear con lenguaje natural
- **Link:** https://mobbin.com/screens/58315c7e-5288-4e82-b6b6-4e3399a94df3 (búsqueda: `automation`)
- **Visual:**
  - "Automations" y textarea grande con placeholder *"Fix lint errors whenever CI fails on a PR"*.
  - Pegado abajo, **"Featured automations"**: filas con ícono de la app (Slack, GitHub), título, descripción y "+" ("Triage Bug Reports on Slack", "CI Failure Fixer"…), más "View all examples".
  - "No automations yet. Set one up." y **dos cards de modo**: "Classical Automation — Trigger… based on integrations, schedules, and webhooks" (con íconos de integraciones) y "Watch a Channel — …triage incoming messages in a Slack channel".
  - Toast negro "Automation deleted successfully".
- **Patrón:** el empty state **es** el creador: prompt + plantillas + modos.
- **Para Telar:** es prácticamente la pantalla "Automatizaciones" vacía de Telar. Adaptar casi literal (plantillas con ícono de la app, dos modos: *Disparador* vs *Vigilar un canal*).

---

## 5. Flow builders y gestión de automatizaciones

### 5.1 Plain: builder horizontal con paleta de bloques
- **Link:** https://mobbin.com/screens/eb96bd12-ef00-4896-8d46-111ae483753a (búsqueda: `workflow builder`)
- **Visual:**
  - Canvas con grilla de puntos y flujo de izquierda a derecha: Start (Manual) → If/else (Support email…) → Apply labels / Send message.
  - Nodos: cards blancas con header (ícono + título) y campos internos como chips. Conectores bezier gris-violeta.
  - **Minimapa** abajo a la derecha y zoom abajo a la izquierda.
  - Top bar: volver, nombre del workflow, dropdown "Draft" y botón negro "Create".
  - **Panel derecho en tabs "Add block / Workflow runs"**: buscador de bloques agrupados (Logic: If/else, Wait for · Action: Apply labels, Assign to user, Send message, **Send Slack notification**…).
- **Patrón:** paleta de bloques buscable y categorizada, y el **historial de ejecuciones al lado del editor**.
- **Para Telar:** panel derecho con tabs *Bloques / Ejecuciones*.

### 5.2 HoneyBook: builder vertical para no técnicos
- **Link:** https://mobbin.com/screens/df8e01b6-28e1-43c8-9f2b-e1a4602b1db8 (búsqueda: `workflow builder`)
- **Visual:**
  - **Flujo vertical centrado**: trigger "Lead form submitted" (ícono naranja) → "Wait for 5 minutes" → condición "File viewed within 1 days" con bifurcación en pills **Yes / No** → "Send file via email" (**⚠ rojo, falta configurar**) → "Create task" → "End automation".
  - Conectores con "+" azul para insertar pasos.
  - Top bar: nombre, **toggle "Active"**, "Unsaved changes", botón ✨ IA, **"Test run"**, "Save" y botón negro **"Activate"**.
- **Patrón:**
  - El flujo vertical se lee como una receta y es más fácil que el horizontal para usuarios de negocio.
  - Error de configuración **dentro del nodo**.
  - Probar antes de activar.
- **Para Telar:** **el formato elegido para el editor**: vertical, ⚠ inline, "Probar" + "Activar" y estado activo/pausado en el header.

### 5.3 Customer.io: bloques de IA como ciudadanos de primera
- **Link:** https://mobbin.com/screens/eea60c2f-9308-4c84-b339-baf924ffa085 (búsqueda: `workflow builder`)
- **Visual:**
  - Canvas con puntos. Nodos verticales con **borde izquierdo de color por tipo** (violeta = email, naranja = espera). Trigger "signed_up" y condición "Only send if customer meets 1 condition".
  - Panel "Add" con secciones **AI** (Generate Content, Qualify Customers, Make Recommendation), Delays (Time Delay, Wait Until *New*…), Flow Control (True/False Branch, Multi-Split…) y Data.
  - Toolbar flotante abajo (+ Add, zoom 100%, nota adhesiva) y **chips de sugerencias del agente** ("Fix Liquid syntax errors", "Improve email open rates") + "Ask Agent".
- **Patrón:** color por tipo de paso y la IA como categoría propia de bloques y como asistente contextual.
- **Para Telar:** cada tipo de paso con su color (disparador, acción, IA, condición) y sugerencias de la IA al pie del editor.

### 5.4 HoneyBook: lista de automatizaciones
- **Link:** https://mobbin.com/screens/51719dd8-929a-4476-ae61-9731c6f82981 (búsqueda: `automation`)
- **Visual:**
  - "Automations" con tabs Automations / Activity. Botones: **"✨ Create with AI"** (outline) + **"Create automation"** (negro).
  - "Use a template": 4 cards, la primera **"Automate with AI — Describe what you want to achieve. Ex: When a contract is signed move project to completed."** con degradé lila; las otras con tags *Advanced / Basic*.
  - Tabla: Automation name · Trigger · **Status (toggle "Active")** · Runs · Last updated · ⋮.
- **Patrón:** gestión de automatizaciones con estado, métricas y trigger visibles, y la IA como primera opción para crear.
- **Para Telar:** la tabla de Automatizaciones: nombre, apps involucradas (stack de íconos), disparador, estado (toggle), ejecuciones y última ejecución.

### 5.5 Plain: "AI automations" como toggles (sin builder)
- **Link:** https://mobbin.com/screens/58e4320e-29cc-4858-984d-a06568a660e6 (búsqueda: `automation`)
- **Visual:** settings de "Sidekick · AI agent *Beta*": "Automations — Automated AI actions that run on threads in your workspace". Grupos **Auto-triage** (Auto-labeling, Urgency detection: toggles off) y **Context and metadata** (Thread titles, Thread catch-ups, Similar threads: toggles on en violeta). Cada fila con ícono, título y descripción de 1–2 líneas.
- **Patrón:** automatizaciones "de fábrica" que se prenden con un toggle, sin armar nada.
- **Para Telar:** sección "Automatizaciones rápidas" por integración ("Resumen diario de #canal", "Guardar adjuntos de Gmail en Drive") como quick wins del primer día.

---

## 6. Landing pages de SaaS de IA (Mobbin → Sites → Sections)

### 6.1 V7 Go: "No complex setup. Just language."
- **Link:** https://mobbin.com/sites/v-7-1fbe80df-2586-4a09-aa5c-29aeeb716a09 (búsqueda: `workflow automation`)
- **Visual:**
  - Fondo gris cálido. Título "Triggers, actions, and LLMs power the workflows" y a la derecha "Plug your existing tools into Go. Just like Zapier…".
  - **Dos filas de pills de integraciones en marquee** (logo + nombre).
  - Card blanca grande: a la izquierda **"No complex setup." negro + "Just language." gris**, a la derecha un **input de prompt: "Pull all rejected contracts from [Stripe]"** con el nombre de la app **como chip inline** dentro de la frase.
  - Debajo, 4 cards de features con eyebrow chiquito ("1,400+ integrations"…).
- **Patrón:** muestra el producto (lenguaje natural + apps) **en una sola frase interactiva**.
- **Para Telar:** **la base del hero**: prompt con chips de apps inline + marquee de integraciones.

### 6.2 V7: "Pre-built AI agents for operations."
- **Link:** misma ficha que 6.1 (búsqueda: `AI agents hero`)
- **Visual:** hero centrado con pill "Agents". **Headline en dos tonos**: "Pre-built AI agents for operations." (negro) + "Designed by experts, ready to deploy." (gris). Cubos 3D de vidrio flotando en pastel/azul. Abajo, una librería de agentes en cards con buscador lateral.
- **Patrón:** headline de dos tonos: qué es + beneficio.
- **Para Telar:** "Tus herramientas, tejidas." (tinta) + "Automatizá el trabajo con solo pedirlo." (gris).

### 6.3 Attio Automations: hero "Automate. Iterate. Accelerate."
- **Link:** https://mobbin.com/sites/attio-b668fc7c-10b0-4094-b3da-62d065024267 (búsqueda: `workflow automation`)
- **Visual:**
  - Blanco con grilla de puntos sutil. Pill "New · Automations library ›".
  - Headline enorme en tres líneas negras, tipografía grotesca bold, y sub corto.
  - A la derecha, un **diagrama de flujo vertical "en ejecución"**: Trigger "When Deal status updated" → condición "Is status MQL?" → "Send action buttons to Slack" → bifurcación Enterprise lead / SMB lead. Cada nodo con tag verde **"✓ Completed"**.
  - Tira de logos de clientes debajo.
- **Patrón:** demostrar el producto con un **flujo vivo** en vez de un screenshot.
- **Para Telar:** hero con la frase del prompt que "se teje" y se convierte en un flujo vertical con checks verdes.

### 6.4 Attio: sección de integraciones
- **Link:** misma ficha que 6.3 (búsqueda: `integrations`)
- **Visual:** headline de dos tonos ("Integrate" gris + "automations with your stack." negro) con párrafo a la derecha. Grilla 3×2 de cards con borde fino: logo chico + nombre + descripción (Outreach, Typeform, Slack, Mailchimp, Mixmax, Webhooks).
- **Para Telar:** incluir "Webhooks" como una card más, que comunica "si no está, igual se conecta".

### 6.5 Tally: "Connect your favorite tools"
- **Link:** https://mobbin.com/sites/tally-b867a10b-3896-4bbe-8beb-2e478272b2ec (búsqueda: `integrations`)
- **Visual:**
  - Blanco. Ilustración a mano (doodle de un personaje con un cartel) y subrayado rosa bajo "Connect".
  - **Grilla de 4 columnas sin cards**: logo chico + **nombre en bold** + descripción en la misma línea (Notion, Google Sheets, Airtable, Webhooks, Slack, Coda, Zapier, Make, Pipedream, "And many more").
  - Testimonio grande debajo: "Can attest that Tally >>> Typeform hands down".
- **Patrón:** una grilla de integraciones **liviana, sin cajas**, que escanea rápido.
- **Para Telar:** grilla tipográfica para mostrar muchas integraciones sin ruido visual.

### 6.6 Mailchimp: grilla de integraciones con contador
- **Link:** https://mobbin.com/sites/mailchimp-1115a5bd-ed71-4f2b-aa8f-76b3366c3199 (búsqueda: `integrations`)
- **Visual:** "Bring in more data, drive more growth with our integrations". Grilla de 3 columnas con **tiles de logo grandes y cuadrados** + nombre + descripción. CTA **"View all 300+ integrations →"** con círculo amarillo.
- **Para Telar:** CTA con número concreto ("Ver las 60+ integraciones →").

### 6.7 Retool Workflows: "How it works" con canvas real
- **Link:** https://mobbin.com/sites/retool-57b95056-1028-4d7b-a14a-c22f6c8694b6 (búsqueda: `workflow automation`)
- **Visual:**
  - Eyebrow en **monoespaciada**. "How it works" con **tabs de pasos como barras de progreso** (la activa con degradé magenta).
  - Headline "Fetch your data" en degradé magenta-violeta.
  - Canvas con bloques de código SQL, mensaje "Success: 32 records returned", tabla de resultados, ramas y botón ▶ en cada bloque.
- **Patrón:** "cómo funciona" en pasos con demo interactiva por paso.
- **Para Telar:** estructura de 4 tabs *Conectá · Describí · Revisá · Activá*, **sin** el código (Telar es no-code).

### 6.8 Notion Custom Agents: "Meet your new 24/7 AI teammates."
- **Link:** https://mobbin.com/sites/notion-b6351935-a840-4bfc-8706-36c70f3a1350 (búsqueda: `AI agents hero`)
- **Visual:**
  - Headline negro enorme.
  - Panel izquierdo "Custom Agents *New* — Automate repetitive work for your team." con tipos de agente e íconos coloridos estilo Notion (Q&A agents, Task routing, Reporting, Create your own).
  - A la derecha, un marco con **degradé durazno** y mock "Office Q&A" con overlay de chat.
  - Abajo, **cards de casos de uso orientados a resultado**: "Triage product feedback →", "Resolve support tickets in Slack →", "Automate weekly reporting →" y una card **oscura** "Create your own Custom Agent".
- **Patrón:** vender la IA como **compañero de equipo**, con casos de uso nombrados por el resultado.
- **Para Telar:** cards de casos por resultado ("Nunca más copiar leads de Gmail a Sheets →"). La última card oscura invita a crear la propia.

### 6.9 Intercom Fin: "Complete, fully configurable AI Agent System"
- **Link:** https://mobbin.com/sites/intercom-7164b223-2b19-451e-a6e8-14f9f32d14ef (búsqueda: `AI agents hero`)
- **Visual:**
  - Marco oscuro con página interior **crema**. **Serif editorial grande** con alineación partida (una línea a la izquierda, otra a la derecha).
  - Labels **mono en mayúscula** ("01 SYSTEM", "AI AGENT SYSTEM").
  - **Tabs en pill naranja: ANALYZE · TRAIN · TEST · DEPLOY**.
  - Mock de dashboard con KPIs grandes (96.1%, 73.9%, 87.2%) y gráfico de líneas multicolor.
- **Patrón:** el ciclo de vida del agente como tabs y los KPIs como prueba. El serif + mono le da carácter "editorial/serio".
- **Para Telar:** mezcla **serif para headlines de landing + sans para UI + mono para eyebrows**, y el ciclo *Conectar · Describir · Probar · Activar*.

### 6.10 Cohere North: "Put AI to work" con tabs por equipo
- **Link:** https://mobbin.com/sites/cohere-cc6d08a5-a307-453d-8fb4-96421a2c5575 (búsqueda: `AI automation`)
- **Visual:** título centrado. **Tabs en pill por área** (Legal, Sales, Finance, **Operations** activo en negro). Copy a la izquierda y, a la derecha, mock "Automations *Beta*" con filas ("Meeting Preparation", "Meeting summarizer") y **chips de fuentes** (Local files, Shared drive, Email, Chats, Web search, Calendar). Arte lineal de círculos.
- **Para Telar:** tabs por equipo (Ventas, Operaciones, Soporte, Marketing) que cambian el ejemplo, y automatizaciones con chips de las herramientas que usan.

### 6.11 Airtable AI: borde degradé = "IA trabajando"
- **Link:** https://mobbin.com/sites/airtable-c05b97c0-c3d4-4e0c-8c5b-b87da66425f8 (búsqueda: `AI automation`)
- **Visual:** "AI with real business impact" a la izquierda. A la derecha, una imagen con fondo pastel degradé, una tabla y una **card flotante "✦ Extracting royalty terms…" con borde degradé** (rosa-azul-verde) y el texto extraído **resaltado en amarillo**.
- **Patrón:** marcar visualmente **qué hizo la IA** (resaltado) y **que está trabajando** (borde).
- **Para Telar:** estado "Telar está trabajando…" con una firma visual propia (ver dirección visual) y resaltado de los datos extraídos en la vista previa.

### 6.12 Linear: hero oscuro de producto
- **Link:** https://mobbin.com/sites/linear-c00c68bf-f93c-4837-acf0-31f4e5b46d02 (búsqueda: `linear`)
- **Visual:**
  - Fondo casi negro con **líneas de perspectiva** y glow azul/rojo. Pill "Bring magic back to software · README →".
  - Headline blanco bold centrado en dos líneas, sub gris y CTA **índigo** "Sign up for free →".
  - Screenshot del producto saliendo desde abajo.
  - Otra sección: grilla de íconos de features con glow alrededor del logo central.
  - Cierre "Get started with Linear today." y footer con 4 columnas.
- **Patrón:** una sección oscura de alto contraste para el "momento producto".
- **Para Telar:** **una** sección oscura en la landing (seguridad o el flujo en acción) para ritmo y contraste, sin hacer toda la landing dark.

### 6.13 Vercel: "Develop. Preview. Ship."
- **Link:** https://mobbin.com/sites/vercel-a8556e28-93f4-4791-bf1c-f52246152965 (búsqueda: `vercel`)
- **Visual:**
  - Blanco. Headline de **tres palabras con punto**, la primera en degradé azul-cian y el resto negro.
  - Sub gris centrado. CTA negro "▲ Start Deploying" + secundario "Get a Demo" con glow.
  - "TRUSTED BY THE BEST FRONTEND TEAMS" en mayúscula espaciada y grilla de logos.
  - Otra sección: fondo negro con texto **mono en mayúscula** ("VERCEL FOR STARTUPS").
- **Patrón:** headline de verbos en ritmo de tres (igual que Attio) y botones primarios negros.
- **Para Telar:** posible headline "Conectá. Pedí. Listo." Botón primario **negro/tinta**, que es la convención B2B moderna.

---

## Síntesis: qué robar para Telar

### Patrones de producto (dashboard)
1. **Home = prompt + intenciones + activación** (Dropbox Dash 2.2, Zapier 2.1, Devin 3.1).
2. **`@` para mencionar herramientas y recursos** con handle, fuente y fecha (Mistral 1.5, Dash 2.3, V7 6.1).
3. **Desambiguación antes de ejecutar** con opciones numeradas (Shopify 2.4).
4. **Borrador revisable → Probar → Activar** (Buffer 2.5, HoneyBook 5.2).
5. **Editor vertical**, con color por tipo de paso y ⚠ inline (HoneyBook 5.2, Customer.io 5.3).
6. **Estados de integración explícitos**, en 4 estados de verdad:
   - *Conectada* (✓ + "usada en N automatizaciones"; Zapier 1.6)
   - *No conectada* (CTA "Conectar"; MagicPath 1.2)
   - *Requiere atención / falta autorizar* (badge amarillo; Zapier 2.1)
   - *Solo lectura / permisos limitados* (Supabase 1.4)
7. **Conexión en drawer con permisos + nota de privacidad** junto al botón (Supabase 1.4, Mistral 1.5, Zapier 1.6).
8. **Catálogo con tabs Todas/Conectadas, categorías y salida "¿no está?"** (Canny 1.1, Toggl 1.3).
9. **Empty states con CTA de conexión** del estilo "Conectá X para ver Y" (Plain 4.2). El empty de Automatizaciones funciona como creador (Devin 4.4).
10. **KPIs con sparkline y un feed de actividad** con estados (fal 2.6, Customer.io 3.3).
11. **Medidores en la sidebar**: uso del plan (Zapier) y herramientas conectadas (Buffer).
12. **Checklist de activación** con duración por paso y progreso persistente (HoneyBook 3.2, Dash 2.2).

### Patrones de landing
1. **Hero:** headline en dos tonos (V7, Attio) + prompt demo con apps como chips inline (V7 6.1). La demo se convierte en un flujo vertical con checks verdes (Attio 6.3).
2. **Marquee de integraciones** en pills (V7) y grilla tipográfica liviana (Tally), con contador "60+ →" (Mailchimp).
3. **"Cómo funciona" en 4 tabs** de ciclo de vida (Fin 6.9, Retool 6.7).
4. **Casos de uso por equipo** (tabs de Cohere) **nombrados por el resultado** (Notion).
5. **Una sola sección oscura** de contraste (Linear, Vercel, Fin), idealmente la de seguridad y permisos.
6. **Botón primario tinta/negro**, que es la convención dominante (Attio, Vercel, Devin, HoneyBook, Mistral, Perplexity).

### Dirección visual preliminar (a validar en el diseño)
- **Base cálida, no blanca pura:** hueso/crema (Dash, Perplexity, V7, Zapier y Fin la usan) con texto tinta casi negra. Se siente humana y "de oficio", que encaja con el nombre *Telar*.
- **Diferenciarse del violeta IA genérico:** Zapier, Buffer, Shopify, Customer.io y Linear usan violeta o índigo, y el degradé rosa-violeta es un cliché de "IA".
- **Propuesta:** una paleta de **tintes textiles naturales** (añil, carmín, ocre), usada como **"hilos"**:
  - Los conectores del flujo y la firma de "IA trabajando" son hilos entrelazados.
  - Reemplazan el borde degradé liso de Zapier y Airtable.
- **Tipografía:** serif editorial para headlines de landing (como Fin), grotesca neutra para la UI y mono para eyebrows y labels técnicos (como Fin, Retool y Vercel).
- **Densidad de UI:** rail + sidebar clara con grupos en mayúscula chica (Canny, Customer.io). Cards con borde de 1px y radio de 8–12px, sin sombras pesadas.

### Qué **no** hacer
- Empty states sin acción (v0 4.1).
- Estética neón/consumer (Higgsfield 2.7): no es para un comprador B2B.
- Degradé violeta de "IA" como identidad principal: indistinguible de Zapier.
- Builder horizontal denso con código (Retool/Plain) como vista por defecto: el usuario de Telar no es técnico.
