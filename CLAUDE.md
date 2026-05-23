# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# menu-tea — CLAUDE.md

## Que es este proyecto

Menu interactivo para **Té Sueño**, una tienda de bubble tea. Los clientes pueden ver el menu por categorias, personalizar su orden (sabor, tamano, toppings), agregar items al carrito y compartir pedidos para entrega con mapa de ubicacion.

## Stack

- **Next.js 15** + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** (con PostCSS)
- **Firebase 12** (Firestore) — menu, precios, toppings, sesiones, ordenes, fidelidad, gastos
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
│   │       └── loyalty/page.tsx          # Gestion de tarjetas de fidelidad
│   ├── api/
│   │   └── upload-menu-image/route.ts    # API route: sube imagenes a Supabase con service role
│   ├── mi-tarjeta/page.tsx               # Vista publica de tarjeta de fidelidad por telefono
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

Navegacion: **Comanda → Metricas → Gastos → Fidelidad → Menu**

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

## Roadmap / futuro

- **Comidas y postres**: en el futuro el menu podria incluir categorias no-bebida. Las categorias, imagenes y precios ya soportan esto estructuralmente. Lo que requiere trabajo es generalizar el concepto de "tamano" (`mediano/grande/pandi`) a "variante" en `BottomProduct.tsx` y en el schema de Firestore, para que aplique a cualquier tipo de producto. No tocar hasta que sea necesario.

## Notas de desarrollo

- Los sabores comentados en `menu.ts` son los que estan **temporalmente deshabilitados** (Durazno, Mango, Taro, etc.) — no eliminar, solo comentar/descomentar para activarlos. La fuente de verdad en produccion es Firestore.
- La categoria `milkTea` existe en los datos pero esta comentada en el array `categories` — los sabores con esa categoria siguen en el array `flavors`.
- El carrito muestra una barra fija verde WhatsApp en el footer solo cuando `cartItemCount > 0`. Abre `BottomCart` para revisar antes de enviar.
- Las imagenes de productos se sirven desde Supabase Storage. Las imagenes estaticas en `src/assets/images/` solo se usan como fallback cuando un item de Firestore no tiene `imageUrls`.
- `next.config.ts` incluye `*.supabase.co` en `images.remotePatterns` para permitir `next/image` con URLs de Supabase.
- El schema de `Order` mantiene compatibilidad con el formato legacy (single-item) via campos opcionales `flavor`, `size`, `price`, `quantity`. Usar siempre `getOrderTotal()` y `getOrderLabel()` para leer ordenes.
