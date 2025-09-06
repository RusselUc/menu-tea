import { Description } from "@radix-ui/react-dialog";

export type SizeId = "mini" | "grande" | "pandi";
type PriceTable = Record<SizeId, number>;
export interface Flavor {
  id: string;
  name: string;
  categories: string[];
  tier?: "classic" | "premium";
  customPrice?: PriceTable;
}

// Sizes
export const sizes = [
  { name: "Mini (16oz)", ounces: 16, price: 65, id: "mini" },
  { name: "Grande (24oz)", ounces: 24, price: 75, id: "grande" },
  {
    name: "Pandi (24oz)",
    ounces: 24,
    price: 80,
    id: "pandi",
  },
];

export const categories = [
  { id: "frappe", name: "Frappe", emoji: "🧋" },
  { id: "milkTea", name: "Milk Tea", emoji: "🥛" },
  { id: "tea", name: "Té Frutal", emoji: "🍵" },
  { id: "sodaItaliana", name: "Soda Italiana", emoji: "🥤" },
  { id: "specialty", name: "Especiales", emoji: "🌟" },
];

// Flavors
// export const flavors = [
//   "Fresa",
//   "Kiwi",
//   "Durazno",
//   "Mango",
//   "Taro",
//   "Lichi",
//   "Mora azul",
//   "Maracuyá",
//   "Mix de frutas",
//   "Vainilla",
// ];

export const flavors = [
  {
    id: "fresa",
    name: "🍓 Fresa",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
  },
  {
    id: "kiwi",
    name: "🥝 Kiwi",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
  },
  {
    id: "durazno",
    name: "🍑 Durazno",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
  },
  {
    id: "mango",
    name: "🥭 Mango",
    tier: "premium",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
  },
  {
    id: "taro",
    name: "🟣 Taro",
    categories: ["frappe", "milkTea"],
    tier: "classic",
  },
  {
    id: "lichi",
    name: "Lichi",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
  },
  {
    id: "mora-azul",
    name: "🫐 Mora azul",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
  },
  {
    id: "maracuya",
    name: "Maracuyá",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
  },
  {
    id: "mix-de-frutas",
    name: "Mix de frutas",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "classic",
  },
  {
    id: "vainilla",
    name: "✿ Vainilla",
    categories: ["frappe", "milkTea"],
    tier: "classic",
  },
  {
    id: "chocolate",
    name: "🍫 Chocolate Blanco",
    categories: ["frappe", "milkTea"],
    tier: "premium",
  },
  {
    id: "capuchino",
    name: "☕️ Capuchino",
    categories: ["frappe", "milkTea"],
    tier: "classic",
  },
  {
    id: "moca",
    name: "Moca",
    categories: ["frappe", "milkTea"],
    tier: "classic",
  },
  {
    id: "Tiramisú",
    name: "Tiramisú",
    categories: ["frappe", "milkTea"],
    tier: "premium",
  },
  {
    id: "Frambuesa",
    name: "Frambuesa",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
  },
  {
    id: "manzana-verde",
    name: "🍏 Manzana verde",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
  },
  {
    id: "chocho-berry",
    name: "Chocho Berry",
    description: "Chocolate blanco con fresa",
    categories: ["specialty"],
    tier: "premium",
  },
  {
    id: "Mazapán",
    name: "Mazapán",
    categories: ["frappe", "milkTea"],
    tier: "premium",
  },
  {
    id: "pumpkin-horchata",
    name: "🎃 Pumpkin Horchata",
    description: "Milk de pay de calabaza",
    categories: ["specialty"],
    tier: "premium",
  },
  {
    id: "vainilla-cookies-cream",
    name: "🍪 Vainilla Cookies & Cream",
    description: "Milk de vainilla con galleta oreo y cheese foam",
    categories: ["milkTea", "specialty"],
    tier: "premium",
  },
];

// Toppings
export const toppings = {
  poppingBoba: ["Mora", "Manzana verde", "Fresa", "Chicle", "Mango"],
  jellys: ["Mix de frutas tropicales", "Jelly de Café"],
  crystalBoba: ["Matcha"],
};

export const priceRules: Record<
  "frappeClassic" | "frappePremium" | "tea" | "sodaItaliana" | "specialty",
  PriceTable
> = {
  frappeClassic: { mini: 65, grande: 75, pandi: 80 },
  frappePremium: { mini: 70, grande: 80, pandi: 85 },
  tea: { mini: 65, grande: 75, pandi: 80 },
  sodaItaliana: { mini: 65, grande: 75, pandi: 80 },
  specialty: { mini: 70, grande: 80, pandi: 85 },
};
