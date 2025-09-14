import pumpkin from "@/assets/images/specialty/pumpkin.png";
import chocoberry from "@/assets/images/specialty/chocoberry.png";
import vainillaCookies from "@/assets/images/specialty/vainilla-cookie.png";

// FRAPPES
import frappeFresa from "@/assets/images/frappe/fresa.png";
import frappeKiwi from "@/assets/images/frappe/kiwi.png";
import frappeDurazno from "@/assets/images/frappe/durazno.png";
import frappeMango from "@/assets/images/frappe/mango.png";
import frappeTaro from "@/assets/images/frappe/taro.png";
import frappeMoraAzul from "@/assets/images/frappe/mora.png";
import frappeMaracuya from "@/assets/images/frappe/maracuya.png";
import frappeCapuchino from "@/assets/images/frappe/capuchino.png";
import frappeTiramisu from "@/assets/images/frappe/tiramisu.png";

export type SizeId = "mediano" | "grande" | "pandi";
export type CategoryId =
  | "frappe"
  | "milkTea"
  | "tea"
  | "sodaItaliana"
  | "specialty";

type PriceTable = Record<SizeId, number>;
export interface Flavor {
  id: string;
  name: string;
  categories: string[];
  tier?: "classic" | "premium";
  customPrice?: PriceTable;
  images?: Partial<Record<CategoryId, string>>;
}

// Sizes
export const sizes = [
  { name: "Mediano (16oz)", ounces: 16, price: 65, id: "mediano" },
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

export const flavors = [
  {
    id: "fresa",
    name: "Fresa",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
    images: {
      frappe: frappeFresa,
      // milkTea: "/images/fresa/milkTea.png",
      // tea: "/images/fresa/tea.png",
      // sodaItaliana: "/images/fresa/soda.png"
    },
  },
  {
    id: "kiwi",
    name: "Kiwi",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
    images: {
      frappe: frappeKiwi,
      // milkTea: "/images/kiwi/milkTea.png",
      // tea: "/images/kiwi/tea.png",
      // sodaItaliana: "/images/kiwi/soda.png"
    },
  },
  {
    id: "durazno",
    name: "Durazno",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
    images: {
      frappe: frappeDurazno,
      // milkTea: "/images/durazno/milkTea.png",
      // tea: "/images/durazno/tea.png",
      // sodaItaliana: "/images/durazno/soda.png"
    },
  },
  {
    id: "mango",
    name: "Mango",
    tier: "premium",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    images: {
      frappe: frappeMango,
      // milkTea: "/images/mango/milkTea.png",
      // tea: "/images/mango/tea.png",
      // sodaItaliana: "/images/mango/soda.png"
    },
  },
  {
    id: "taro",
    name: "Taro",
    categories: ["frappe", "milkTea"],
    tier: "classic",
    images: {
      frappe: frappeTaro,
      // milkTea: "/images/taro/milkTea.png",
      // tea: "/images/taro/tea.png",
      // sodaItaliana: "/images/taro/soda.png"
    },
  },
  {
    id: "lichi",
    name: "Lichi",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
  },
  {
    id: "mora-azul",
    name: "Mora azul",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
    images: {
      frappe: frappeMoraAzul,
      // milkTea: "/images/mora-azul/milkTea.png",
      // tea: "/images/mora-azul/tea.png",
      // sodaItaliana: "/images/mora-azul/soda.png"
    },
  },
  {
    id: "maracuya",
    name: "Maracuyá",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
    images: {
      frappe: frappeMaracuya,
      // milkTea: "/images/maracuya/milkTea.png",
      // tea: "/images/maracuya/tea.png",
      // sodaItaliana: "/images/maracuya/soda.png"
    },
  },
  {
    id: "mix-de-frutas",
    name: "Mix de frutas",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "classic",
  },
  {
    id: "vainilla",
    name: "Vainilla",
    categories: ["frappe", "milkTea"],
    tier: "classic",
  },
  {
    id: "chocolate",
    name: "Chocolate Blanco",
    categories: ["frappe"],
    tier: "premium",
  },
  {
    id: "capuchino",
    name: "Capuchino",
    categories: ["frappe", "milkTea"],
    tier: "classic",
    images: {
      frappe: frappeCapuchino,
    },
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
    images: {
      frappe: frappeTiramisu,
    },
  },
  {
    id: "Frambuesa",
    name: "Frambuesa",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
  },
  {
    id: "manzana-verde",
    name: "Manzana verde",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
  },
  {
    id: "chocho-berry",
    name: "Chocho Berry",
    description: "Frappe de chocolate blanco con fresa",
    categories: ["specialty"],
    tier: "premium",
    images: {
      specialty: chocoberry,
    },
  },
  {
    id: "Mazapán",
    name: "Mazapán",
    categories: ["frappe", "milkTea"],
    tier: "premium",
  },
  {
    id: "pumpkin-horchata",
    name: "Pumpkin Horchata",
    description: "Milk de pay de calabaza con horchata",
    categories: ["specialty"],
    tier: "premium",
    customPrice: { mediano: 65, grande: 75, pandi: 80 },
    images: {
      specialty: pumpkin,
      // milkTea: "/images/fresa/milkTea.png",
      // tea: "/images/fresa/tea.png",
      // sodaItaliana: "/images/fresa/soda.png"
    },
  },
  {
    id: "vainilla-cookies-cream",
    name: "Vainilla Cookies & Cream",
    description: "Milk de vainilla con galleta oreo y cheese foam",
    categories: ["specialty"],
    tier: "premium",
    images: {
      specialty: vainillaCookies,
    },
  },
];

// Toppings
export const toppings = {
  poppingBoba: ["Mora", "Manzana verde", "Fresa", "Chicle", "Mango", "Tapioca"],
  jellys: ["Mix de frutas tropicales", "Jelly de Café"],
  crystalBoba: ["Matcha"],
};

export const priceRules: Record<
  "frappeClassic" | "frappePremium" | "tea" | "sodaItaliana" | "specialty",
  PriceTable
> = {
  frappeClassic: { mediano: 65, grande: 75, pandi: 80 },
  frappePremium: { mediano: 70, grande: 80, pandi: 85 },
  tea: { mediano: 65, grande: 75, pandi: 80 },
  sodaItaliana: { mediano: 65, grande: 75, pandi: 80 },
  specialty: { mediano: 70, grande: 80, pandi: 85 },
};
