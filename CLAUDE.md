# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# menu-tea — CLAUDE.md

## Que es este proyecto

Menu interactivo para **Té Sueño**, una tienda de bubble tea. Los clientes pueden ver el menu por categorias, personalizar su orden (sabor, tamano, toppings), agregar items al carrito y compartir pedidos para entrega con mapa de ubicacion.

## Stack

- **Next.js 15** + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** (con PostCSS)
- **Firebase 12** (Firestore) — menu, precios, toppings, sesiones, ordenes, fidelidad, gastos, dinamica express
- **Supabase Storage** — imagenes de productos (bucket `menu`, ruta `{itemId}/{category}.{ext}`)
- **Leaflet / react-leaflet** — mapa en la pantalla de entrega
- **Radix UI** (checkbox, dialog, label, slot) + **Vaul** (drawer/modal con animaciones)
- **shadcn/ui** (new-york style) — calendar, popover, button; config en `components.json`
- **react-day-picker** + **date-fns** — date range picker en el dashboard admin
- **Lucide React** — iconos

## Comandos

```bash
npm run dev      # desarrollo local
npm run build    # build de produccion
npm run lint     # ESLint
```

## Estructura de archivos clave

```
src/
├── app/
│   ├── page.tsx                          # Pagina principal (render del menu)
│   ├── delivery/page.tsx                 # Pantalla de entrega con mapa
│   ├── share/[sessionId]/page.tsx        # Orden compartida por sesion
│   ├── admin/
│   │   ├── page.tsx                      # Login admin (PIN)
│   │   ├── actions.ts                    # Server action: validateAdminPin()
│   │   └── (panel)/
│   │       ├── layout.tsx                # Layout del panel (requiere sesion) — sidebar + bottom nav
│   │       ├── comanda/page.tsx          # Comandas en tiempo real
│   │       ├── dashboard/page.tsx        # Metricas y pedidos con filtro por periodo/rango
│   │       ├── gastos/page.tsx           # Gestion de gastos del negocio
│   │       ├── menu/page.tsx             # Gestion de productos, precios y toppings
│   │       ├── loyalty/page.tsx          # Gestion de tarjetas de fidelidad
│   │       └── dinamica/page.tsx         # Gestion de la Dinamica Express (preguntas y participantes)
│   ├── api/
│   │   └── upload-menu-image/route.ts    # API route: sube imagenes a Supabase con service role
│   ├── mi-tarjeta/page.tsx               # Vista publica de tarjeta de fidelidad por telefono
│   ├── dinamica/page.tsx                 # Vista publica de la Dinamica Express (registro + preguntas)
│   └── layout.tsx
├── components/
│   ├── menu/
│   │   ├── index.tsx                     # Componente principal del menu (carga desde Firestore)
│   │   ├── BottomProduct.tsx             # Modal de detalle/personalizacion de producto
│   │   └── BottomCart.tsx                # Modal del carrito + guardado de orden en Firestore
│   ├── delivery/index.tsx                # Vista de delivery con mapa Leaflet
│   ├── share-location/index.tsx          # Componente para compartir ubicacion
│   └── ui/                               # Componentes reutilizables (button, card, badge, etc.)
├── data/
│   └── menu.ts                           # Data estatica de respaldo (sabores, categorias, precios)
└── lib/
    ├── firebase.ts                       # Config de Firebase — solo exporta `db` (Firestore)
    ├── supabase.ts                       # Cliente Supabase + uploadMenuImageSupabase()
    ├── menu-items.ts                     # CRUD Firestore: menu_items, price_rules, toppings
    ├── loyalty.ts                        # Operaciones Firestore para tarjetas de fidelidad
    ├── expenses.ts                       # CRUD Firestore: expenses — gastos del negocio
    ├── orders.ts                         # CRUD Firestore: orders — getOrders, saveFullOrder, subscribeToCommandaOrders
    ├── express.ts                        # CRUD Firestore: express_dynamics, express_participants — Dinamica Express
    └── utils.ts                          # Utilidades (cn, etc.)
```

## Data del menu (`src/data/menu.ts`)

### Categorias activas

| ID            | Nombre         |
|---------------|----------------|
| `frappe`      | Frappe         |
| `tea`         | Te Frutal      |
| `sodaItaliana`| Soda Italiana  |
| `specialty`   | Especiales     |

> `milkTea` esta comentado/deshabilitado actualmente.

### Tamanos

| ID        | Nombre           | Precio base |
|-----------|------------------|-------------|
| `mediano` | Mediano (16oz)   | $65         |
| `grande`  | Grande (24oz)    | $75         |
| `pandi`   | Pandi (24oz)     | $80         |

### Reglas de precio (`priceRules`)

| Regla            | Mediano | Grande | Pandi |
|------------------|---------|--------|-------|
| `frappeClassic`  | $70     | $80    | $85   |
| `frappePremium`  | $70     | $80    | $85   |
| `tea`            | $70     | $80    | $85   |
| `sodaItaliana`   | $65     | $75    | $80   |
| `specialty`      | $70     | $80    | $85   |

Los sabores de **Especiales** con `customPrice` (Red Velvet, Chocoreta, Black Forest) tienen precio propio: $75/$85/$90.

### Toppings disponibles

- **Popping Boba**: Mora, Manzana verde, Fresa, Chicle
- **Jellys**: Mix de frutas tropicales, Jelly de Cafe

### Precio de toppings

El primero es **gratis** (incluido con la bebida). Cada topping adicional suma **$10**. La logica esta en `BottomProduct.tsx`:

```
precio_final = precio_base + max(0, selectedToppings.length - 1) * 10
```

### Agregar un nuevo sabor

**Desde el admin (recomendado):** `/admin` → Menu → "Nuevo producto". No requiere tocar codigo.

**Desde codigo (fallback estatico):**
1. Agregar la imagen en `src/assets/images/<categoria>/`
2. Importar la imagen en `src/data/menu.ts`
3. Agregar el objeto al array `flavors` con: `id`, `name`, `categories`, `tier` y opcionalmente `images`, `description`, `customPrice`

## Tipos importantes (`src/data/menu.ts`)

```ts
type SizeId = "mediano" | "grande" | "pandi";
type CategoryId = "frappe" | "milkTea" | "tea" | "sodaItaliana" | "specialty";

interface Flavor {
  id: string;
  name: string;
  categories: string[];
  tier?: "classic" | "premium";
  customPrice?: Record<SizeId, number>;   // sobreescribe priceRules
  images?: Partial<Record<CategoryId, string>>;
  description?: Partial<Record<CategoryId, string>>;
}
```

## Design tokens (colores)

El menu publico (`index.tsx`, `BottomProduct.tsx`, `BottomCart.tsx`) y la tarjeta de fidelidad (`mi-tarjeta/page.tsx`) comparten el mismo sistema de tokens `T`:

```ts
const T = {
  bg:          "#F8FAFC",   // fondo de pagina
  white:       "#FFFFFF",   // superficie de cards y drawers
  border:      "#E2E8F0",   // bordes slate (cards, separadores)
  text:        "#0F172A",   // texto principal
  secondary:   "#334155",   // texto secundario
  muted:       "#64748B",   // texto auxiliar
  mutedLight:  "#94A3B8",   // texto muy suave
  slate:       "#F1F5F9",   // fondos de hover / skeleton
  rose:        "#CD576A",   // acento principal (CTAs, activos, header)
  roseBg:      "#FFF1F2",   // fondo suave rose (chips, placeholders)
  roseBorder:  "#FECDD3",   // borde rose
  roseDeep:    "#B8465A",   // rose hover/pressed
  olive:       "#79874C",   // precios, acentos secundarios
  oliveBg:     "rgba(121,135,76,0.08)",
  oliveBorder: "rgba(121,135,76,0.2)",
};
```

El panel admin usa los mismos tokens `T` con la adicion de colores blue/slate para la UI de gestion.

### Estructura visual del menu publico

- **Header**: blanco, borde inferior slate, logo `src/assets/images/logo-pink.png`
- **Category tabs**: fondo blanco, borde inferior slate; tab activa = pill rose, inactiva = pill con borde slate
- **Product cards**: `background: T.white`, `border: 1px solid T.border`, sombra sutil
- **Barra del carrito**: fondo `T.bg`, boton verde WhatsApp (`#22C55E`)
- **BottomProduct drawer**: fondo blanco, borde superior rose; size buttons activos en `roseBg` + borde rose; topping pills activos en rose solido
- **BottomCart drawer**: fondo blanco, borde superior rose; boton WhatsApp verde hero

## Logica de precios (`getPrice` en `src/components/menu/index.tsx`)

```
si flavor.customPrice  → usar customPrice[sizeId]
si category === "frappe" → priceRules[tier === "premium" ? "frappePremium" : "frappeClassic"][sizeId]
si category en ["tea", "sodaItaliana", "milkTea"] → priceRules.tea[sizeId]
si category === "specialty" → priceRules.specialty[sizeId]
```

## Estado del carrito

Manejado con `useState` local en `Menu` (`src/components/menu/index.tsx`). No hay estado global ni Context — el carrito vive solo en este componente y se pasa por props a `BottomCart`.

## Variables de entorno

```
ADMIN_PIN=                              # PIN del panel admin (solo servidor, sin NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_SUPABASE_URL=               # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=          # Clave publica Supabase
SUPABASE_SERVICE_ROLE_KEY=              # Clave privada (solo servidor) — usada en la API route de upload
```

## Firebase

Colecciones en Firestore:

| Coleccion       | Descripcion                                                        |
|-----------------|--------------------------------------------------------------------|
| `menu_items`    | Productos del menu (nombre, categorias, tier, precios, imagenes)   |
| `settings`      | Config global: `price_rules` y `toppings`                          |
| `sessions`      | Sesiones de delivery en vivo (lat/long/timestamp)                  |
| `orders`        | Ordenes guardadas (WhatsApp y comanda interna)                     |
| `loyalty_cards` | Tarjetas de fidelidad indexadas por telefono                       |
| `expenses`      | Gastos del negocio (efectivo y tarjeta, con MSI)                   |
| `settings/banner` | Banner informativo del menú público (`enabled`, `message`)       |
| `express_dynamics` | Dinamica Express: tandas de preguntas de cultura general (solo una `active` a la vez) |
| `express_participants` | Registros de participantes por dinamica (nombre, telefono, respuestas) |

La config se lee desde variables de entorno `NEXT_PUBLIC_FIREBASE_*`. Ver `src/lib/firebase.ts`.

### Fuente de datos del menu publico

El menu carga primero desde Firestore (`menu_items`). Si la coleccion esta vacia o falla, cae silenciosamente al array estatico `flavors` en `src/data/menu.ts`. Durante la carga muestra un skeleton animado.

### Imagenes de productos

Se almacenan en **Supabase Storage** (bucket `menu`). Cada producto puede tener una imagen distinta por categoria: ruta `{itemId}/{category}.{ext}`. La subida se hace via API route `/api/upload-menu-image` usando el service role key (evita RLS).

### Schema `menu_items/{id}`

```ts
interface MenuItem {
  id: string;
  name: string;
  categories: string[];
  tier: "classic" | "premium";
  customPrice?: { mediano: number; grande: number; pandi: number };
  imageUrls?: Record<string, string>;   // categoryId -> URL de Supabase
  descriptions: Record<string, string>; // categoryId -> descripcion
  active: boolean;
  createdAt: number;
  order: number;
}
```

### Schema `settings/price_rules`

```ts
interface PriceRules {
  frappeClassic:  { mediano: number; grande: number; pandi: number };
  frappePremium:  { mediano: number; grande: number; pandi: number };
  tea:            { mediano: number; grande: number; pandi: number };
  sodaItaliana:   { mediano: number; grande: number; pandi: number };
  specialty:      { mediano: number; grande: number; pandi: number };
}
```

### Schema `settings/toppings`

```ts
interface ToppingGroup {
  id: string;
  label: string;
  items: { name: string; active: boolean }[];
}
// guardado como: { groups: ToppingGroup[] }
```

### Schema `orders/{id}`

```ts
type OrderStatus = "pending" | "success" | "ready" | "delivered" | "cancelled";

interface OrderItem {
  flavor: string;
  size: string;
  category: string;
  toppings: string[];
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items?: OrderItem[];       // formato nuevo (multi-item)
  total?: number;
  phone?: string;
  // formato legacy (single-item, compatibilidad hacia atras)
  flavor?: string;
  size?: string;
  category?: string;
  toppings?: string[];
  price?: number;
  quantity?: number;
  // comanda
  orderNumber?: number;      // consecutivo diario (1, 2, 3…)
  source?: "whatsapp" | "comanda";
  // comun
  timestamp: Timestamp;
  status: OrderStatus;
}
```

Flujo de estados: `pending`/`success` → `ready` → `delivered` | `cancelled`

### Schema `expenses/{id}`

```ts
type PaymentMethod = "cash" | "card";

interface Expense {
  id: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  cardName?: string;          // ej. "BBVA", "Banamex"
  cardDueDay?: number;        // dia del mes en que se paga
  cardPaid?: boolean;
  installments?: number;      // total de meses sin intereses
  firstPaymentMonth?: string; // "YYYY-MM" (ej. "2026-06")
  paidMonths?: string[];      // meses pagados ["YYYY-MM", ...]
  installmentsPaid?: number;  // legacy: contador simple
  timestamp: Timestamp;
}
```

### Schema `express_dynamics/{id}`

```ts
type QuestionType = "multiple" | "open";

interface ExpressQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];       // solo type === "multiple"
  correctIndex?: number;    // solo type === "multiple"
  correctAnswer?: string;   // opcional, solo type === "open" — si se define, la pregunta califica sola
  imageUrl?: string;        // opcional — Supabase Storage, bucket "menu", ruta express/{dynamicId}/{questionId}.{ext}
}

interface ExpressDynamic {
  id: string;
  title: string;
  description?: string;
  questions: ExpressQuestion[];
  active: boolean;         // solo una dinamica puede estar activa a la vez
  maxWinners?: number | null; // opcional — cupo de ganadores; al alcanzarse se desactiva sola
  winnersCount: number;    // contador denormalizado, se actualiza atomicamente en la misma transaccion que registra al ganador
  concludedAt?: number | null; // timestamp de cuando se desactivo sola por alcanzar maxWinners
  createdAt: number;
}
```

### Schema `express_participants/{dynamicId}_{phone}`

```ts
interface ExpressAnswer {
  questionId: string;
  value: string; // multiple: indice de la opcion ("0","1"...) | open: texto libre
}

interface ExpressParticipant {
  id: string;           // `${dynamicId}_${phone}` — id deterministico
  dynamicId: string;
  name: string;
  phone: string;        // solo digitos
  answers: ExpressAnswer[];
  correctCount: number;
  totalGraded: number;  // preguntas que calificaron: todas las "multiple" + las "open" con correctAnswer definida
  won: boolean;         // true si acerto todas las preguntas que calificaban (y hay al menos una)
  timestamp: number;
}
```

## Flujo de pedido (WhatsApp)

Al confirmar en `BottomCart.tsx`:
1. Guarda la orden en Firestore coleccion `orders` con `source: "whatsapp"`, `status: "pending"`
2. Abre WhatsApp al numero `529969634631` con el pedido formateado en texto

El campo de telefono de fidelidad fue eliminado del flujo de pedido publico. La fidelidad se gestiona exclusivamente desde el panel admin (`/admin/loyalty`).

## Sistema de fidelidad

**`src/lib/loyalty.ts`** — funciones Firestore:
- `getCard(phone)` — busca tarjeta por telefono normalizado
- `addStamp(phone)` — agrega sello; al llegar a `8` resetea y suma `freedrinks`
- `redeemFreeDrink(phone)` — descuenta un `freedrinks`

**Esquema en Firestore (`loyalty_cards/{phone}`):**

```ts
interface LoyaltyCard {
  phone: string;       // solo digitos
  stamps: number;      // 0-7, resetea a 0 al completar tarjeta
  totalOrders: number;
  freedrinks: number;
  history: number[];   // timestamps de cada sello
  createdAt: number;
}
```

**`/mi-tarjeta`** — pagina publica: muestra la tarjeta dado un numero de telefono. Acepta `?tel=...` en la URL para auto-buscar.

## Panel admin (`/admin`)

Protegido por PIN via server action (`actions.ts` → `validateAdminPin()`). El `ADMIN_PIN` vive en el servidor y nunca se expone al cliente — la action solo devuelve `true/false`.

### Sesion persistente

La sesion usa `localStorage` con expiración de **30 días** (no `sessionStorage`). Las funciones viven en `src/app/admin/page.tsx` y se importan desde el layout:

- `setAdminSession()` — guarda `{ v: "1", exp: timestamp }` al hacer login exitoso
- `checkAdminSession()` — verifica existencia y vigencia del token; lo elimina si expiró

El layout (`(panel)/layout.tsx`) llama `checkAdminSession()` en el `useEffect` inicial y redirige a `/admin` si falla. No usar `sessionStorage` — se borra al cerrar la pestaña.

El layout (`src/app/admin/(panel)/layout.tsx`) incluye:
- **Sidebar** en desktop (220px, fijo a la izquierda)
- **Bottom nav** en mobile (fijo en el footer)

Navegacion: **Comanda → Metricas → Fidelidad → Gastos → Insumos → Menu → Publicaciones → Dinamica Express**

### `/admin/(panel)/comanda` — Comandas en tiempo real

Vista de cocina/caja para gestionar ordenes del dia en tiempo real.

- Suscripcion en tiempo real via `subscribeToCommandaOrders` (Firestore `onSnapshot`, solo ordenes de hoy)
- Toast de notificacion al llegar una orden nueva
- Tabs en mobile: **Nuevos / Listos / Historial**
- Desktop: grid 2 columnas (Nuevos + Listos) + seccion de historial abajo
- Acciones por estado:
  - `pending`/`success` → boton "Listo" (→ `ready`) + "Cancelar"
  - `ready` → boton "Entregar" (→ `delivered`) + revertir a `pending`
- Crear orden interna desde el panel: drawer lateral con buscador de productos, selector de categoria, tamano, toppings y resumen. Se guarda con `source: "comanda"` y `orderNumber` consecutivo diario.
- Badge de fuente en cada tarjeta: "WhatsApp" (verde) o "Comanda" (morado)

**Funciones clave en `src/lib/orders.ts`:**
- `subscribeToCommandaOrders(callback)` — suscripcion realtime de ordenes de hoy
- `getNextOrderNumber()` — calcula el siguiente numero de orden del dia
- `getOrderTotal(order)` — calcula total soportando formato nuevo y legacy
- `getOrderLabel(order)` — etiqueta resumida de la orden
- `saveFullOrder({ items, total, phone?, orderNumber?, source? })` — guarda con `status: "pending"`

### `/admin/(panel)/dashboard` — Metricas

- Filtros de periodo: Hoy, Semana, Mes, Todo, Rango
- Cards: pedidos, ingresos, pendientes, cancelados — todos filtrados por el periodo activo
- Grafico de barras por dia/semana/mes segun el periodo
- Top 5 bebidas mas pedidas en el periodo
- Lista de pedidos con acciones (Entregado / Cancelar / Revertir)

#### Logica de fetch

- Periodos fijos (Hoy/Semana/Mes/Todo) → fetch automatico al cambiar de tab
- **Rango** → fetch manual: el usuario elige fechas con el date range picker (shadcn Calendar) y presiona "Consultar". No se lanza ninguna query hasta entonces
- "Todo" usa `limit(500)` en Firestore para evitar traer toda la coleccion
- `getOrders(from?, to?, limitCount?)` en `src/lib/orders.ts` — filtra por `timestamp` con `where` en Firestore

### `/admin/(panel)/gastos` — Gestion de gastos

- Registrar gastos del negocio con metodo de pago: **Efectivo** o **Tarjeta**
- Para pagos con tarjeta: nombre de tarjeta, dia de corte, opcion de meses sin intereses (MSI)
- MSI: se define el numero de meses y el mes de primer pago (`YYYY-MM`). El sistema muestra un chip por mes y permite marcar cuales se han pagado
- Filtros de periodo identicos al dashboard (Hoy/Semana/Mes/Todo/Rango)
- Cards de resumen: total de gastos, gastos en efectivo, gastos en tarjeta, MSI pendientes
- CRUD completo: agregar, editar (lapiz), eliminar
- **Funciones en `src/lib/expenses.ts`:**
  - `getExpenses(from?, to?, limitCount?)` — lista con filtro de fecha
  - `addExpense(expense)` — crear nuevo gasto
  - `updateExpense(id, data)` — actualizar cualquier campo
  - `updateExpenseCardPaid(id, cardPaid)` — marcar tarjeta pagada/pendiente
  - `updateExpensePaidMonths(id, paidMonths, cardPaid)` — actualizar meses MSI pagados
  - `deleteExpense(id)` — eliminar

### `/admin/(panel)/menu` — Gestion de menu

- Listar, buscar y filtrar productos por categoria
- Activar/desactivar productos (toggle)
- Crear y editar productos: nombre, categorias, tier, precio custom, descripcion por categoria, imagen por categoria
- Eliminar productos
- **Precios**: editar las reglas de precio por tier/tamano (`settings/price_rules`)
- **Toppings**: editar grupos y items, activar/desactivar por topping (`settings/toppings`)
- Boton "Importar del codigo" para hacer seed inicial desde `menu.ts` (solo si la coleccion esta vacia)

### `/admin/(panel)/loyalty` — Tarjetas de fidelidad

- Buscar tarjeta por telefono
- Agregar sello
- Canjear bebida gratis
- Generar link de WhatsApp para enviarle la tarjeta al cliente

### `/admin/(panel)/dinamica` — Dinamica Express

- Vista de lista: todas las dinamicas creadas, con badge "ACTIVA" en la que esta publicada
- Boton "+ Nueva" crea una dinamica vacia (`active: false`) y abre la vista de edicion
- Vista de edicion:
  - Activar/Desactivar (`setActiveDynamic` desactiva cualquier otra dinamica activa automaticamente)
  - Editar titulo y descripcion
  - CRUD de preguntas: texto, tipo (opcion multiple / respuesta abierta), opciones y marcado de la correcta (solo multiple), y "Respuesta correcta" opcional para las abiertas (si se deja vacia, esa pregunta no califica)
  - Imagen opcional por pregunta: se sube a Supabase Storage (mismo bucket `menu` que las imagenes de productos, reutilizando `uploadMenuImageSupabase` de `src/lib/supabase.ts`) bajo la ruta `express/{dynamicId}/{questionId}.{ext}`. Igual que las demas ediciones de pregunta, el archivo se sube y se persiste hasta que se pulsa "Guardar cambios" (estado local `questionImageFiles`/`questionImagePreviews` en el admin)
  - Campo "Maximo de ganadores" (`maxWinners`, opcional) + contador de ganadores actual + boton "Reiniciar contador de ganadores"
  - Lista de participantes registrados (nombre, telefono, aciertos, badge "GANO")
  - Eliminar dinamica completa
  - Badge "CONCLUIDA" en la lista cuando `concludedAt` esta seteado (se cerro sola por cupo, a diferencia de una dinamica simplemente desactivada a mano)
- Ver seccion "Feature: Dinamica Express" mas abajo para el detalle del flujo publico

## Feature: Banner informativo

Tira delgada que aparece entre el header y las tabs de categorias en el menu publico. Editable desde el dashboard admin.

**Firestore**: `settings/banner` — `{ enabled: boolean, message: string }`

**`src/lib/menu-items.ts`**: `getBanner()` / `saveBanner(banner)`

**Menú publico** (`src/components/menu/index.tsx`): se fetcha junto con el resto del menu en el `Promise.all` inicial. Se renderiza solo si `enabled === true` y `message` no esta vacio.

**Admin** (`/admin/dashboard`): card con toggle on/off + textarea + boton "Guardar". Al desactivar aparece un boton para confirmar la desactivacion. El estado `bannerDraft` maneja cambios locales; se persiste en Firestore al guardar.

## Feature: Sorpréndeme

Boton en el menu publico que abre un bottom sheet con una bebida aleatoria pre-armada.

**Reglas:** siempre 1 sabor aleatorio + 1 topping aleatorio (gratis) + el usuario elige el tamano.

**Implementacion** (`src/components/menu/index.tsx`):
- `pickRandom(activeFlavors, categories, toppingGroups)` — elige categoria aleatoria → sabor en esa categoria → 1 topping activo
- `SurpriseDrawer` — bottom sheet que muestra la tarjeta del producto con imagen hero + chips de categoria y topping superpuestos, selector de tamano y botones "Agregar al carrito" / "Otra opcion"
- El precio es el precio base del tamano elegido (1 topping siempre gratis)

## Feature: Dinamica Express

Pagina publica (`/dinamica`) con preguntas de cultura general que el admin configura desde `/admin/dinamica`. Solo puede haber **una dinamica activa a la vez**.

**Registro (una sola vez por telefono):**
- El cliente ingresa nombre y telefono. `hasParticipated(dynamicId, phone)` revisa si ya existe `express_participants/{dynamicId}_{phone}` antes de mostrar las preguntas
- El anti-duplicado esta scopeado **por dinamica activa**: si el admin crea/activa una nueva tanda de preguntas, el mismo telefono puede volver a participar
- `registerParticipant()` en `src/lib/express.ts` usa el id deterministico `{dynamicId}_{phone}` dentro de una `runTransaction` de Firestore, para que dos envios simultaneos del mismo telefono no puedan crear dos registros (condicion de carrera)

**Preguntas:** mixtas — cada pregunta puede ser `type: "multiple"` (opciones + una correcta marcada por el admin) o `type: "open"` (texto libre), y puede llevar una `imageUrl` opcional que se muestra arriba de las opciones/input. El publico las responde una por una (stepper con pastilla "Pregunta X de Y" + barra de progreso), no todas juntas en una sola pantalla.

**Calificacion y premio:**
- Las preguntas `type: "multiple"` siempre califican. Las `type: "open"` califican **solo si el admin les definio `correctAnswer`** en `/admin/dinamica` (campo opcional "Respuesta correcta") — si se deja vacio, esa pregunta se guarda pero no cuenta para el resultado
- La comparacion de texto libre normaliza ambos lados con `trim().toUpperCase()` — no distingue mayusculas/minusculas ni espacios al inicio/fin, pero **no tolera faltas de ortografia**: es coincidencia exacta, no aproximada
- `totalGraded` = numero de preguntas que calificaron (todas las `multiple` + las `open` con `correctAnswer`). `won = totalGraded > 0 && correctCount === totalGraded` (acerto todas las que calificaban). Si ninguna pregunta califica, `won` siempre es `false`
- Si `won === true` → pantalla "¡Felicidades, ganaste!" con el logo de Té Sueño enmarcado ("trofeo"), confeti, dos insignias flotantes, y boton para enviar WhatsApp al numero `529969634631` (mismo numero que el flujo de pedidos) con nombre/telefono/dinamica precargados, para que el cliente reclame su premio manualmente
- Si `won === false` → pantalla "Gracias por jugar" (mismo estilo visual: pastilla, titulo, logo enmarcado) con boton "Ver el menu"; muestra aciertos si `totalGraded > 0`
- La calificacion se hace **dentro de la transaccion de Firestore** releyendo `express_dynamics/{id}.questions` (no las preguntas que manda el cliente), para no confiar en datos que ya viajaron al navegador

**Cupo de ganadores (`maxWinners`) y conclusion automatica:**
- El admin puede poner un `maxWinners` opcional (ej. "solo 3 ganadores") en `/admin/dinamica`. Sin limite = campo vacio (`null`)
- Cada vez que `registerParticipant()` califica a alguien como ganador, la misma transaccion incrementa `winnersCount` en el doc de la dinamica; si `winnersCount >= maxWinners` tras el incremento, esa misma transaccion pone `active: false` y `concludedAt: Date.now()` — la dinamica se cierra sola, atomicamente, sin condicion de carrera aunque dos ganadores lleguen al mismo tiempo
- **Editar `maxWinners` retroactivamente tambien puede concluir la dinamica al instante.** Si el admin olvido ponerle limite, la dinamica ya lleva N ganadores, y luego le define `maxWinners <= N`, `updateDynamic()` (en `src/lib/express.ts`) detecta esto dentro de una transaccion y pone `active: false` + `concludedAt` en el mismo guardado — no hace falta esperar a que entre un ganador mas para que se cierre. Esto solo transiciona `active` de `true` a `false` (nunca lo reactiva); si el admin sube el limite o lo borra en una dinamica ya concluida, sigue concluida hasta que la reactive a mano
- La UI de `/admin/dinamica` relee la dinamica de Firestore despues de guardar (por si `updateDynamic()` la concluyo) y muestra un toast distinto avisando que se cerro sola
- El flujo publico revisa el estado real antes de dejar contestar (`handleStart` relee la dinamica) y vuelve a validar en el submit (la transaccion regresa `closed: true` si ya no esta activa) — si se cierra entre que el cliente abre el formulario y envia sus respuestas, ve la pantalla "Esta dinamica ya concluyo" en vez de guardarse un registro fantasma
- Si alguien entra a `/dinamica` **despues** de que ya se cerro (llego tarde), `getActiveDynamic()` no devuelve nada — en ese caso se hace fallback a `getMostRecentlyConcluded()` (busca la ultima dinamica con `concludedAt` seteado) para mostrarle "'{title}' ya concluyo · Ya se alcanzo el cupo de ganadores" en vez del generico "No hay ninguna dinamica activa". Solo se distingue este mensaje cuando `concludedAt` esta presente (cierre automatico por cupo); si el admin solo la desactivo a mano, se ve el mensaje generico
- El admin puede reabrir una dinamica concluida con "Activar" y limpiar el contador con "Reiniciar contador de ganadores" (`resetWinners(id)`) si quiere arrancar una ronda nueva desde cero

**`src/lib/express.ts`** — funciones clave:
- `getActiveDynamic()` / `getDynamics()` / `getDynamic(id)` / `getMostRecentlyConcluded()`
- `createDynamic()` / `updateDynamic(id, data)` / `deleteDynamic(id)`
- `setActiveDynamic(id)` — activa esta y desactiva cualquier otra (batch write)
- `resetWinners(id)` — pone `winnersCount: 0` y limpia `concludedAt`
- `hasParticipated(dynamicId, phone)` / `registerParticipant({...})` — retorna `{ participant, duplicate, closed }`
- `getParticipants(dynamicId)` — usado en el admin para listar registros (incluye telefono completo — vista solo de administrador)
- `getTopWinners(dynamicId, max = 3)` — ganadores ordenados por `timestamp` ascendente (el primero en ganar es el 1er lugar). No hay un sistema de puntajes aparte: como `maxWinners` ya limita quien puede ganar, el orden de victoria **es** el ranking
- `maskParticipantName(name)` — enmascara para vistas publicas: `"Juan"` → `"J***n"` (primera/ultima letra, 3 asteriscos fijos sin importar el largo real, para no filtrar la longitud del nombre)

### Podio público (pantalla "cerrada")

Cuando una dinámica se concluye automáticamente por cupo de ganadores (`concludedAt` seteado), `/dinamica` muestra un podio con los primeros 3 ganadores (o menos, si hubo menos). Es intencionalmente minimo en cuanto a datos expuestos:
- Nombre **enmascarado** (`maskParticipantName`), nunca el nombre completo
- El **teléfono nunca se muestra** en esta vista
- No hay un botón de "ranking global" ni comparación entre dinámicas distintas — cada podio es de una sola ronda

Si una dinámica se desactivó manualmente (sin `concludedAt`) o no tiene ganadores, no se muestra podio.

## Roadmap / futuro

- **Comidas y postres**: en el futuro el menu podria incluir categorias no-bebida. Las categorias, imagenes y precios ya soportan esto estructuralmente. Lo que requiere trabajo es generalizar el concepto de "tamano" (`mediano/grande/pandi`) a "variante" en `BottomProduct.tsx` y en el schema de Firestore, para que aplique a cualquier tipo de producto. No tocar hasta que sea necesario.

## Notas de desarrollo

- Los sabores comentados en `menu.ts` son los que estan **temporalmente deshabilitados** (Durazno, Mango, Taro, etc.) — no eliminar, solo comentar/descomentar para activarlos. La fuente de verdad en produccion es Firestore.
- La categoria `milkTea` existe en los datos pero esta comentada en el array `categories` — los sabores con esa categoria siguen en el array `flavors`.
- El carrito muestra una barra fija verde WhatsApp en el footer solo cuando `cartItemCount > 0`. Abre `BottomCart` para revisar antes de enviar.
- Las imagenes de productos se sirven desde Supabase Storage. Las imagenes estaticas en `src/assets/images/` solo se usan como fallback cuando un item de Firestore no tiene `imageUrls`.
- `next.config.ts` incluye `*.supabase.co` en `images.remotePatterns` para permitir `next/image` con URLs de Supabase.
- El schema de `Order` mantiene compatibilidad con el formato legacy (single-item) via campos opcionales `flavor`, `size`, `price`, `quantity`. Usar siempre `getOrderTotal()` y `getOrderLabel()` para leer ordenes.
