import { Flavor, SizeId, priceRules } from "@/data/menu";

// Funciones puras del menu — viven aparte de index.tsx para que BottomProduct.tsx
// (y cualquier otro componente hijo) las pueda importar sin crear un import
// circular con el barrel ("."). Un ciclo de imports que cruza un valor en
// tiempo de ejecucion (no solo tipos) es fragil bajo Fast Refresh: el modulo
// puede quedar con un binding stale tras un hot-reload.

export function getPrice(
  flavor: Flavor,
  sizeId: SizeId,
  category: string,
  rules: typeof priceRules = priceRules
): number | null {
  if (flavor.customPrice) return flavor.customPrice[sizeId];
  if (category === "frappe")
    return rules[flavor.tier === "premium" ? "frappePremium" : "frappeClassic"][sizeId];
  if (["tea", "sodaItaliana", "milkTea"].includes(category))
    return rules.tea[sizeId];
  if (category === "specialty") return rules.specialty[sizeId];
  return null;
}

export function getMinPrice(p: Flavor, cat: string, rules: typeof priceRules = priceRules): number {
  if (p.customPrice) return Math.min(...Object.values(p.customPrice));
  if (cat === "sodaItaliana") return rules.sodaItaliana.mediano;
  if (cat === "frappe")
    return rules[p.tier === "premium" ? "frappePremium" : "frappeClassic"].mediano;
  if (cat === "specialty") return rules.specialty.mediano;
  return rules.tea.mediano;
}

export const getImage = (p: Flavor, cat: string) =>
  p.images ? (p.images as Record<string, string>)[cat] ?? null : null;

export const getDesc = (p: Flavor, cat: string) =>
  p.description ? (p.description as Record<string, string>)[cat] ?? null : null;
