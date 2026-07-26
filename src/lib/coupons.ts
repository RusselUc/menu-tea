import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";

export type DiscountType = "percentage" | "fixed" | "free_items";

export interface Coupon {
  id: string; // = codigo normalizado (mayusculas, sin espacios) — tambien el doc id
  code: string; // codigo tal como lo escribio el admin, para mostrar
  discountType: DiscountType;
  discountValue?: number; // 1-100 si es percentage, pesos si es fixed — no aplica a free_items
  maxFreeItems?: number; // solo free_items — cuantas bebidas elegibles se hacen gratis
  excludedCategories?: string[]; // solo free_items — nombres de categoria (ej. "Especiales") que NO cuentan para el regalo
  startDate: number; // epoch ms — inicio del dia
  endDate: number; // epoch ms — fin del dia
  maxUses: number; // limite total de usos, siempre requerido
  usesCount: number;
  active: boolean;
  createdAt: number;
}

// Item minimo que necesita el calculo de descuento — CartItem ya cumple esta forma.
export interface DiscountableItem {
  price: number;
  quantity: number;
  category: string;
}

const COUPONS_COL = "coupons";

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

// Sin 0/O/1/I — se prestan a confusion cuando el cliente teclea el codigo a mano.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Genera un sufijo aleatorio para armar codigos de cupon (ej. "8XQ4M").
// El admin puede anteponerle cualquier prefijo antes de generarlo.
export function generateCouponSuffix(length = 5): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

// Lectura publica de un cupon por codigo — usada por la pagina /regalo/[code]
// para mostrar la gift card. Solo lee, no valida ni consume uso.
export async function getCouponById(code: string): Promise<Coupon | null> {
  const id = normalizeCouponCode(code);
  if (!id) return null;
  const snap = await getDoc(doc(db, COUPONS_COL, id));
  if (!snap.exists()) return null;
  return snap.data() as Coupon;
}

export async function getCoupons(): Promise<Coupon[]> {
  const q = query(collection(db, COUPONS_COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Coupon);
}

export async function createCoupon(data: {
  code: string;
  discountType: DiscountType;
  discountValue?: number;
  maxFreeItems?: number;
  excludedCategories?: string[];
  startDate: number;
  endDate: number;
  maxUses: number;
}): Promise<void> {
  const id = normalizeCouponCode(data.code);
  if (!id) throw new Error("El código no puede estar vacío");
  const ref = doc(db, COUPONS_COL, id);
  const existing = await getDoc(ref);
  if (existing.exists()) throw new Error("Ya existe un cupón con ese código");
  const coupon: Coupon = {
    id,
    code: data.code.trim(),
    discountType: data.discountType,
    startDate: data.startDate,
    endDate: data.endDate,
    maxUses: data.maxUses,
    usesCount: 0,
    active: true,
    createdAt: Date.now(),
    ...(data.discountType === "free_items"
      ? { maxFreeItems: data.maxFreeItems ?? 1, excludedCategories: data.excludedCategories ?? [] }
      : { discountValue: data.discountValue ?? 0 }),
  };
  await setDoc(ref, coupon);
}

export async function updateCoupon(
  id: string,
  data: Partial<Pick<Coupon, "discountType" | "discountValue" | "maxFreeItems" | "excludedCategories" | "startDate" | "endDate" | "maxUses" | "active">>
): Promise<void> {
  await updateDoc(doc(db, COUPONS_COL, id), data);
}

export async function deleteCoupon(id: string): Promise<void> {
  await deleteDoc(doc(db, COUPONS_COL, id));
}

export type CouponStatusLabel = "VIGENTE" | "PROGRAMADO" | "EXPIRADO" | "AGOTADO" | "DESACTIVADO";

export function getCouponStatusLabel(c: Coupon): CouponStatusLabel {
  const now = Date.now();
  if (!c.active) return "DESACTIVADO";
  if (now < c.startDate) return "PROGRAMADO";
  if (now > c.endDate) return "EXPIRADO";
  if (c.usesCount >= c.maxUses) return "AGOTADO";
  return "VIGENTE";
}

export interface CouponValidation {
  valid: boolean;
  coupon?: Coupon;
  reason?: string;
}

// Solo valida (no consume uso) — para dar feedback mientras el cliente escribe
// el codigo, antes de que decida enviar el pedido.
export async function validateCoupon(code: string): Promise<CouponValidation> {
  const id = normalizeCouponCode(code);
  if (!id) return { valid: false, reason: "Escribe un código" };
  const snap = await getDoc(doc(db, COUPONS_COL, id));
  if (!snap.exists()) return { valid: false, reason: "Ese cupón no existe" };
  const coupon = snap.data() as Coupon;
  const now = Date.now();
  if (!coupon.active) return { valid: false, reason: "Este cupón ya no está disponible", coupon };
  if (now < coupon.startDate) return { valid: false, reason: "Este cupón todavía no está vigente", coupon };
  if (now > coupon.endDate) return { valid: false, reason: "Este cupón ya expiró", coupon };
  if (coupon.usesCount >= coupon.maxUses) return { valid: false, reason: "Este cupón ya alcanzó su límite de usos", coupon };
  return { valid: true, coupon };
}

export function getDiscountAmount(coupon: Coupon, items: DiscountableItem[]): number {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (coupon.discountType === "free_items") {
    const excluded = coupon.excludedCategories ?? [];
    const eligibleUnitPrices: number[] = [];
    items.forEach((item) => {
      if (excluded.includes(item.category)) return;
      for (let i = 0; i < item.quantity; i++) eligibleUnitPrices.push(item.price);
    });
    // Se regalan las unidades elegibles mas baratas primero — es el criterio
    // mas conservador y facil de explicar ("2 bebidas gratis" = las 2 mas
    // economicas que si cuentan, no las que el cliente elija).
    eligibleUnitPrices.sort((a, b) => a - b);
    const freeCount = Math.min(coupon.maxFreeItems ?? 0, eligibleUnitPrices.length);
    const discount = eligibleUnitPrices.slice(0, freeCount).reduce((s, p) => s + p, 0);
    return Math.min(Math.round(discount * 100) / 100, subtotal);
  }

  const value = coupon.discountValue ?? 0;
  const raw = coupon.discountType === "percentage" ? (subtotal * value) / 100 : value;
  return Math.min(Math.round(raw * 100) / 100, subtotal);
}

// Consume un uso de forma atomica justo antes de guardar el pedido — para que
// dos clientes no puedan gastar el mismo ultimo uso en paralelo, y para
// revalidar por si el cupon vencio/se agoto entre que el cliente lo aplico y
// el momento en que realmente envia el pedido.
export async function redeemCoupon(id: string): Promise<{ redeemed: boolean; coupon: Coupon | null }> {
  const ref = doc(db, COUPONS_COL, id);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return { redeemed: false, coupon: null };
    const coupon = snap.data() as Coupon;
    const now = Date.now();
    if (!coupon.active || now < coupon.startDate || now > coupon.endDate || coupon.usesCount >= coupon.maxUses) {
      return { redeemed: false, coupon };
    }
    const usesCount = coupon.usesCount + 1;
    tx.update(ref, { usesCount });
    return { redeemed: true, coupon: { ...coupon, usesCount } };
  });
}
