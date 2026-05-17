import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
export { uploadMenuImageSupabase } from "./supabase";
import { flavors } from "@/data/menu";

export interface MenuItem {
  id: string;
  name: string;
  categories: string[];
  tier: "classic" | "premium";
  customPrice?: { mediano: number; grande: number; pandi: number };
  imageUrls?: Record<string, string>; // categoryId -> Supabase URL
  descriptions: Record<string, string>; // categoryId -> description
  active: boolean;
  createdAt: number;
  order: number;
}

const COL = "menu_items";

export async function getMenuItems(): Promise<MenuItem[]> {
  const q = query(collection(db, COL), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem));
}

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export async function saveMenuItem(item: Omit<MenuItem, "createdAt" | "order"> & { order?: number }): Promise<void> {
  const docRef = doc(db, COL, item.id);
  const existing = await getDoc(docRef);
  if (existing.exists()) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = item;
    await updateDoc(docRef, stripUndefined(rest) as Record<string, unknown>);
  } else {
    const items = await getMenuItems();
    const maxOrder = items.reduce((m, i) => Math.max(m, i.order ?? 0), 0);
    await setDoc(docRef, stripUndefined({
      ...item,
      createdAt: Date.now(),
      order: item.order ?? maxOrder + 1,
    }));
  }
}

export async function toggleMenuItem(id: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, COL, id), { active });
}

export async function deleteMenuItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

/** Seed Firestore from static menu.ts data. Safe to call multiple times — skips existing docs. */
export async function seedMenuFromStatic(): Promise<number> {
  const existing = await getDocs(collection(db, COL));
  const existingIds = new Set(existing.docs.map((d) => d.id));

  let seeded = 0;
  for (let i = 0; i < flavors.length; i++) {
    const f = flavors[i];
    if (existingIds.has(f.id)) continue;

    const descriptions: Record<string, string> = {};
    if (f.description) {
      for (const [cat, desc] of Object.entries(f.description)) {
        if (desc) descriptions[cat] = desc;
      }
    }

    await setDoc(doc(db, COL, f.id), {
      name: f.name,
      categories: f.categories,
      tier: f.tier ?? "classic",
      ...(f.customPrice ? { customPrice: f.customPrice } : {}),
      descriptions,
      active: true,
      createdAt: Date.now(),
      order: i,
    });
    seeded++;
  }
  return seeded;
}

export const CATEGORY_LABELS: Record<string, string> = {
  frappe: "Frappe",
  milkTea: "Milk Tea",
  tea: "Té Frutal",
  sodaItaliana: "Soda Italiana",
  specialty: "Especiales",
};

export const ALL_CATEGORIES = ["frappe", "tea", "sodaItaliana", "specialty", "milkTea"];

// ── Price rules ────────────────────────────────────────────

export type PriceTable = { mediano: number; grande: number; pandi: number };
export type PriceRules = {
  frappeClassic: PriceTable;
  frappePremium: PriceTable;
  tea: PriceTable;
  sodaItaliana: PriceTable;
  specialty: PriceTable;
};

export const DEFAULT_PRICE_RULES: PriceRules = {
  frappeClassic:  { mediano: 70, grande: 80, pandi: 85 },
  frappePremium:  { mediano: 70, grande: 80, pandi: 85 },
  tea:            { mediano: 70, grande: 80, pandi: 85 },
  sodaItaliana:   { mediano: 65, grande: 75, pandi: 80 },
  specialty:      { mediano: 70, grande: 80, pandi: 85 },
};

export const PRICE_RULE_LABELS: Record<string, string> = {
  frappeClassic: "Frappe Classic",
  frappePremium: "Frappe Premium",
  tea:           "Té / Soda Italiana",
  sodaItaliana:  "Soda Italiana",
  specialty:     "Especiales",
};

export async function getPriceRules(): Promise<PriceRules> {
  const snap = await getDoc(doc(db, "settings", "price_rules"));
  if (!snap.exists()) return DEFAULT_PRICE_RULES;
  return snap.data() as PriceRules;
}

export async function savePriceRules(rules: PriceRules): Promise<void> {
  await setDoc(doc(db, "settings", "price_rules"), rules);
}

// ── Toppings ───────────────────────────────────────────────

export interface ToppingItem {
  name: string;
  active: boolean;
}

export interface ToppingGroup {
  id: string;
  label: string;
  items: ToppingItem[];
}

export const DEFAULT_TOPPINGS: ToppingGroup[] = [
  { id: "poppingBoba", label: "Balas Explosivas", items: [
    { name: "Mora", active: true },
    { name: "Manzana verde", active: true },
    { name: "Fresa", active: true },
    { name: "Chicle", active: true },
  ]},
  { id: "jellys", label: "Jelly's", items: [
    { name: "Mix de frutas tropicales", active: true },
    { name: "Jelly de Café", active: true },
  ]},
];

export async function getToppings(): Promise<ToppingGroup[]> {
  const snap = await getDoc(doc(db, "settings", "toppings"));
  if (!snap.exists()) return DEFAULT_TOPPINGS;
  const groups = snap.data().groups ?? DEFAULT_TOPPINGS;
  // Normalize: migrate old string[] format to ToppingItem[]
  return groups.map((g: ToppingGroup) => ({
    ...g,
    items: g.items.map((item) =>
      typeof item === "string"
        ? { name: item, active: true }
        : item
    ),
  }));
}

export async function saveToppings(groups: ToppingGroup[]): Promise<void> {
  await setDoc(doc(db, "settings", "toppings"), { groups });
}

// ── Banner ─────────────────────────────────────────────────

export interface BannerSettings {
  enabled: boolean;
  message: string;
}

export async function getBanner(): Promise<BannerSettings> {
  const snap = await getDoc(doc(db, "settings", "banner"));
  if (!snap.exists()) return { enabled: false, message: "" };
  return snap.data() as BannerSettings;
}

export async function saveBanner(banner: BannerSettings): Promise<void> {
  await setDoc(doc(db, "settings", "banner"), banner);
}

// ── Ruleta prize counter — settings/ruleta ────────────────
// { count: number, date: "YYYY-MM-DD" }
// count auto-resets to 0 when date changes.

function ruletaToday() { return new Date().toISOString().slice(0, 10); }
const RULETA_REF = () => doc(db, "settings", "ruleta");

export function subscribeToRuletaCount(cb: (count: number) => void): () => void {
  return onSnapshot(RULETA_REF(), (snap) => {
    if (!snap.exists()) { cb(0); return; }
    const { count, date } = snap.data() as { count: number; date: string };
    cb(date === ruletaToday() ? count : 0);
  });
}

export async function incrementRuletaCount(): Promise<void> {
  const today = ruletaToday();
  const snap  = await getDoc(RULETA_REF());
  if (!snap.exists() || (snap.data() as { date: string }).date !== today) {
    await setDoc(RULETA_REF(), { count: 1, date: today });
  } else {
    await updateDoc(RULETA_REF(), { count: increment(1) });
  }
}

export async function resetRuletaCount(): Promise<void> {
  await setDoc(RULETA_REF(), { count: 0, date: ruletaToday() });
}
