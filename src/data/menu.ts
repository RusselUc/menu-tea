import { Description } from "@radix-ui/react-dialog";

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
    name: "Fresa",
    categories: ["frappe", "milkTea", "tea"],
  },
  {
    id: "kiwi",
    name: "Kiwi",
    categories: ["frappe", "milkTea", "tea"],
  },
  {
    id: "durazno",
    name: "Durazno",
    categories: ["frappe", "milkTea", "tea"],
  },
  {
    id: "mango",
    name: "Mango",
    categories: ["frappe", "milkTea", "tea"],
  },
  {
    id: "taro",
    name: "Taro",
    categories: ["frappe", "milkTea"],
  },
  {
    id: "lichi",
    name: "Lichi",
    categories: ["frappe", "milkTea", "tea"],
  },
  {
    id: "mora-azul",
    name: "Mora azul",
    categories: ["frappe", "milkTea", "tea"],
  },
  {
    id: "maracuya",
    name: "Maracuyá",
    categories: ["frappe", "milkTea", "tea"],
  },
  {
    id: "mix-de-frutas",
    name: "Mix de frutas",
    categories: ["frappe", "milkTea", "tea"],
  },
  {
    id: "vainilla",
    name: "Vainilla",
    categories: ["frappe", "milkTea"],
  },
  {
    id: "chocolate",
    name: "Chocolate Blanco",
    categories: ["frappe", "milkTea"],
  },
  {
    id: "capuchino",
    name: "Capuchino",
    categories: ["frappe", "milkTea"],
  },
  {
    id: "moca",
    name: "Moca",
    categories: ["frappe", "milkTea"],
  },
  {
    id: "Tiramisú",
    name: "Tiramisú",
    categories: ["frappe", "milkTea"],
  },
  {
    id: "Frambuesa",
    name: "Frambuesa",
    categories: ["frappe", "milkTea", "tea"],
  },
  {
    id: "manzana-verde",
    name: "Manzana verde",
    categories: ["frappe", "milkTea", "tea"],
  },
  {
    id: "chocho-berry",
    name: "Chocho Berry",
    description: "Chocolate blanco con fresa",
    categories: ["frappe", "specialty"],
  },
  {
    id: "Mazapán",
    name: "Mazapán",
    categories: ["frappe", "milkTea"],
  },
  {
    id: "pumpkin-horchata",
    name: "Pumpkin Horchata",
    description: "Milk de pay de calabaza",
    categories: ["milkTea", "specialty"],
  },
  {
    id: "vainilla-cookies-cream",
    name: "Vainilla Cookies & Cream",
    description: "Milk de vainilla con galleta oreo y cheese foam",
    categories: ["milkTea", "specialty"],
  },
];

// Toppings
export const toppings = {
  poppingBoba: ["Mora", "Manzana verde", "Fresa", "Chicle", "Mango"],
  jellys: ["Mix de frutas tropicales", "Jelly de Café"],
  crystalBoba: ["Matcha"],
};
