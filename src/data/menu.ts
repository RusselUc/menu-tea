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

// SODAS
import sodaFresa from "@/assets/images/soda/fresa.png";

// MILK TEA
import milkVainilla from "@/assets/images/milk-tea/vainilla.png";

// CATEGORIES
import milkTea from "@/assets/images/categories/bubble-tea.png";
import tea from "@/assets/images/categories/herbal-tea.png";
import frappe from "@/assets/images/categories/frappe.png";
import sodaItaliana from "@/assets/images/categories/drink.png";
import specialty from "@/assets/images/categories/review.png";

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
  description?: Partial<Record<CategoryId, string>>;
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
  { id: "frappe", name: "Frappe", image: frappe },
  { id: "milkTea", name: "Milk Tea", image: milkTea },
  { id: "tea", name: "Té Frutal", image: tea },
  { id: "sodaItaliana", name: "Soda Italiana", image: sodaItaliana },
  { id: "specialty", name: "Especiales", image: specialty },
];

export const flavors = [
  {
    id: "fresa",
    name: "Fresa",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
    images: {
      frappe: frappeFresa,
      sodaItaliana: sodaFresa,
    },
    description: {
      frappe: "Frappe cremoso con el dulzor natural de la fresa fresca.",
      milkTea: "Té con leche suave con un toque frutal de fresa.",
      tea: "Infusión ligera con notas dulces y frescas de fresa madura.",
      sodaItaliana:
        "Soda chispeante y refrescante con el vibrante sabor de fresa.",
    },
  },
  {
    id: "kiwi",
    name: "Kiwi",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
    images: {
      frappe: frappeKiwi,
    },
    description: {
      frappe: "Frappe refrescante y ácido-dulce con kiwi fresco.",
      milkTea: "Té con leche con un toque tropical y fresco de kiwi.",
      tea: "Té ligero con equilibrio entre acidez y dulzor del kiwi.",
      sodaItaliana: "Soda chispeante con el frescor ácido del kiwi.",
    },
  },
  {
    id: "durazno",
    name: "Durazno",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
    images: {
      frappe: frappeDurazno,
    },
    description: {
      frappe: "Frappe cremoso y dulce con el sabor jugoso del durazno.",
      milkTea: "Té con leche suave con un matiz afrutado de durazno.",
      tea: "Té refrescante con notas dulces de durazno maduro.",
      sodaItaliana: "Soda ligera y chispeante con esencia de durazno.",
    },
  },
  {
    id: "mango",
    name: "Mango",
    tier: "premium",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    images: {
      frappe: frappeMango,
    },
    description: {
      frappe: "Frappe tropical y cremoso con jugo natural de mango.",
      milkTea: "Té con leche con un toque tropical y dulce de mango.",
      tea: "Té refrescante con el sabor jugoso del mango maduro.",
      sodaItaliana: "Soda burbujeante con notas dulces y tropicales de mango.",
    },
  },
  {
    id: "taro",
    name: "Taro",
    categories: ["frappe", "milkTea"],
    tier: "classic",
    images: {
      frappe: frappeTaro,
    },
    description: {
      frappe: "Frappe cremoso con el sabor dulce y único del taro.",
      milkTea: "Té con leche aterciopelado y delicado con esencia de taro.",
    },
  },
  // {
  //   id: "lichi",
  //   name: "Lichi",
  //   categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
  //   tier: "premium",
  //   description: {
  //     frappe: "Frappe exótico y refrescante con dulzor tropical de lichi.",
  //     milkTea: "Té con leche delicado con un toque floral de lichi.",
  //     tea: "Té ligero y fresco con el sabor dulce del lichi.",
  //     sodaItaliana: "Soda chispeante y exótica con esencia de lichi.",
  //   },
  // },
  {
    id: "mora-azul",
    name: "Mora azul",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
    images: {
      frappe: frappeMoraAzul,
    },
    description: {
      frappe: "Frappe vibrante con el sabor intenso de la mora azul.",
      milkTea: "Té con leche con un toque frutal de mora azul.",
      tea: "Té refrescante y ligeramente ácido con notas de mora azul.",
      sodaItaliana: "Soda burbujeante con el frescor dulce de mora azul.",
    },
  },
  {
    id: "maracuya",
    name: "Maracuyá",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
    images: {
      frappe: frappeMaracuya,
    },
    description: {
      frappe: "Frappe tropical y ácido-dulce con maracuyá fresco.",
      milkTea: "Té con leche cremoso con un toque cítrico de maracuyá.",
      tea: "Té ligero y exótico con notas refrescantes de maracuyá.",
      sodaItaliana: "Soda chispeante con el sabor vibrante del maracuyá.",
    },
  },
  {
    id: "mix-de-frutas",
    name: "Mix de frutas",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "classic",
    description: {
      frappe: "Frappe lleno de energía con una mezcla tropical de frutas.",
      milkTea: "Té con leche con un toque frutal variado y refrescante.",
      tea: "Infusión fresca con el equilibrio de varias frutas.",
      sodaItaliana: "Soda chispeante con un mix de frutas tropicales.",
    },
  },
  {
    id: "pina-colada",
    name: "Piña Colada",
    categories: ["frappe"],
    tier: "premium",
    description: {
      frappe: "Frappe tropical con la dulzura de la piña y suavidad del coco.",
    },
  },
  {
    id: "vainilla",
    name: "Vainilla",
    categories: ["frappe", "milkTea"],
    tier: "classic",
    images: {
      milkTea: milkVainilla,
    },
    description: {
      frappe: "Frappe cremoso con la dulzura clásica de la vainilla.",
      milkTea: "Té con leche suave con un toque aterciopelado de vainilla.",
    },
  },
  {
    id: "chocolate",
    name: "Chocolate Blanco",
    categories: ["frappe"],
    tier: "premium",
    description: {
      frappe: "Frappe dulce y cremoso con chocolate blanco fundido.",
    },
  },
  {
    id: "capuchino",
    name: "Capuchino",
    categories: ["frappe", "milkTea"],
    tier: "classic",
    images: {
      frappe: frappeCapuchino,
    },
    description: {
      frappe: "Frappe con el intenso sabor del café capuchino.",
      milkTea: "Té con leche con un toque de café estilo capuchino.",
    },
  },
  {
    id: "moca",
    name: "Moca",
    categories: ["frappe", "milkTea"],
    tier: "classic",
    description: {
      frappe: "Frappe cremoso con la mezcla perfecta de café y chocolate.",
      milkTea: "Té con leche con un balance de café y cacao.",
    },
  },
  {
    id: "Tiramisú",
    name: "Tiramisú",
    categories: ["frappe", "milkTea"],
    tier: "premium",
    images: {
      frappe: frappeTiramisu,
    },
    description: {
      frappe: "Frappe inspirado en el clásico postre tiramisú italiano.",
      milkTea: "Té con leche con un toque dulce y aterciopelado de tiramisú.",
    },
  },
  {
    id: "Frambuesa",
    name: "Frambuesa",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
    description: {
      frappe: "Frappe fresco con el dulzor ácido de la frambuesa.",
      milkTea: "Té con leche con un toque frutal de frambuesa.",
      tea: "Té ligero con un matiz dulce y ácido de frambuesa.",
      sodaItaliana: "Soda burbujeante con la frescura vibrante de frambuesa.",
    },
  },
  {
    id: "manzana-verde",
    name: "Manzana verde",
    categories: ["frappe", "milkTea", "tea", "sodaItaliana"],
    tier: "premium",
    description: {
      frappe: "Frappe refrescante y ácido con manzana verde.",
      milkTea: "Té con leche con un sutil toque ácido de manzana verde.",
      tea: "Té ligero y refrescante con la frescura de la manzana verde.",
      sodaItaliana: "Soda chispeante con el sabor crujiente de manzana verde.",
    },
  },
  {
    id: "chocho-berry",
    name: "Chocho Berry",
    description: {
      specialty: "Frappe de chocolate blanco con fresa",
    },
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
    description: {
      frappe: "Frappe dulce y cremoso con el sabor clásico del mazapán.",
      milkTea: "Té con leche suave con esencia de mazapán.",
    },
  },
  {
    id: "caramel-macchiato",
    name: "Caramel Macchiato",
    categories: ["frappe"],
    tier: "premium",
    description: {
      frappe: "Frappe cremoso con café espresso y un toque de caramelo.",
    },
  },
  {
    id: "pumpkin-horchata",
    name: "Pumpkin Horchata",
    description: {
      specialty: "Milk de pay de calabaza con horchata",
    },
    categories: ["specialty"],
    tier: "premium",
    customPrice: { mediano: 65, grande: 75, pandi: 80 },
    images: {
      specialty: pumpkin,
    },
  },
  {
    id: "vainilla-cookies-cream",
    name: "Vainilla Cookies & Cream",
    description: {
      specialty: "Milk de vainilla con galleta oreo y cheese foam",
    },
    categories: ["specialty"],
    tier: "premium",
    images: {
      specialty: vainillaCookies,
    },
  },
  {
    id: "chocopeach",
    name: "ChocoPeach",
    description: {
      specialty: "Frappe de chocolate blanco con durazno",
    },
    categories: ["specialty"],
    tier: "premium",
    // images: {
    //   specialty: vainillaCookies,
    // },
  },
  {
    id: "pumpkinpie",
    name: "Pumpkin Pie",
    description: {
      specialty:
        "Frappe cremoso, con notas de canela y calabaza que lo hacen irresistible",
    },
    categories: ["specialty"],
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
  frappeClassic: { mediano: 65, grande: 75, pandi: 80 },
  frappePremium: { mediano: 70, grande: 80, pandi: 85 },
  tea: { mediano: 65, grande: 75, pandi: 80 },
  sodaItaliana: { mediano: 65, grande: 75, pandi: 80 },
  specialty: { mediano: 70, grande: 80, pandi: 85 },
};
