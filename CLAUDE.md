# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# menu-tea — CLAUDE.md

## Que es este proyecto

Menu interactivo para **Té Sueño**, una tienda de bubble tea. Los clientes pueden ver el menu por categorias, personalizar su orden (sabor, tamano, toppings), agregar items al carrito y compartir pedidos para entrega con mapa de ubicacion.

## Stack

- **Next.js 15** + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** (con PostCSS)
- **Firebase 12** (Firestore) — persistencia de sesiones de delivery
- **Leaflet / react-leaflet** — mapa en la pantalla de entrega
- **Radix UI** (checkbox, dialog, label, slot) + **Vaul** (drawer/modal con animaciones)
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
│   ├── page.tsx                      # Pagina principal (render del menu)
│   ├── delivery/page.tsx             # Pantalla de entrega con mapa
│   ├── share/[sessionId]/page.tsx    # Orden compartida por sesion
│   ├── admin/
│   │   ├── page.tsx                  # Panel admin con PIN + gestion de tarjetas de fidelidad
│   │   └── actions.ts                # Server action: validateAdminPin()
│   ├── mi-tarjeta/page.tsx           # Vista publica de tarjeta de fidelidad por telefono
│   └── layout.tsx
├── components/
│   ├── menu/
│   │   ├── index.tsx                 # Componente principal del menu
│   │   ├── BottomProduct.tsx         # Modal de detalle/personalizacion de producto
│   │   └── BottomCart.tsx            # Modal del carrito + guardado de orden en Firestore
│   ├── delivery/index.tsx            # Vista de delivery con mapa Leaflet
│   ├── share-location/index.tsx      # Componente para compartir ubicacion
│   └── ui/                           # Componentes reutilizables (button, card, badge, etc.)
├── data/
│   └── menu.ts                       # Toda la data del menu (sabores, categorias, precios, toppings)
└── lib/
    ├── firebase.ts                   # Config de Firebase (usa variables de entorno)
    ├── loyalty.ts                    # Operaciones Firestore para tarjetas de fidelidad
    └── utils.ts                      # Utilidades (cn, etc.)
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

## Brand tokens (colores)

Definidos en `src/components/menu/index.tsx` como objeto `C`:

```ts
const C = {
  dark:  "#CD576A",  // header, botones primarios
  rose:  "#CD576A",  // CTAs, estados activos
  olive: "#79874C",  // acentos secundarios, precios
  pink:  "#F298AA",  // highlights suaves
  cream: "#F8F5F1",  // fondo de pagina
  text:  "#2A2019",  // texto principal
  muted: "#8A7A6E",  // texto secundario
};
```

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
```

## Firebase

Tres colecciones en Firestore:

| Coleccion       | Descripcion                                         |
|-----------------|-----------------------------------------------------|
| `sessions`      | Sesiones de delivery en vivo (lat/long/timestamp)   |
| `orders`        | Ordenes guardadas al hacer pedido por WhatsApp      |
| `loyalty_cards` | Tarjetas de fidelidad indexadas por telefono        |

La config se lee desde variables de entorno `NEXT_PUBLIC_FIREBASE_*`. Ver `src/lib/firebase.ts`.

## Flujo de pedido (WhatsApp)

Al confirmar en `BottomCart.tsx`:
1. Guarda la orden en Firestore coleccion `orders` (con timestamp y `status: "success"`)
2. Abre WhatsApp al numero `529969634631` con el pedido formateado en texto
3. Incluye telefono de fidelidad en el mensaje si el cliente lo ingreso

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

Protegido por PIN via server action (`actions.ts` → `validateAdminPin()`). El `ADMIN_PIN` vive en el servidor y nunca se expone al cliente.

Funcionalidades:
- Buscar tarjeta por telefono
- Agregar sello
- Canjear bebida gratis
- Generar link de WhatsApp para enviarle la tarjeta al cliente

## Notas de desarrollo

- Los sabores comentados en `menu.ts` son los que estan **temporalmente deshabilitados** (Durazno, Mango, Taro, etc.) — no eliminar, solo comentar/descomentar para activarlos.
- La categoria `milkTea` existe en los datos pero esta comentada en el array `categories` — los sabores con esa categoria siguen en el array `flavors`.
- El carrito muestra una barra fija en el footer solo cuando `cartItemCount > 0`.
- Las imagenes de productos son `PNG`/`JPEG` en `src/assets/images/` organizadas por categoria.
