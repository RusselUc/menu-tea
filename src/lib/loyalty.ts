import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  collection,
  orderBy,
  query,
  limit,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebase";

export const STAMPS_FOR_FREE = 10;

export interface LoyaltyCard {
  phone: string;
  stamps: number;
  totalOrders: number;
  freedrinks: number;
  history: number[];
  createdAt: number;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function getCard(phone: string): Promise<LoyaltyCard | null> {
  const ref = doc(db, "loyalty_cards", normalizePhone(phone));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as LoyaltyCard;
}

export async function addStamp(
  phone: string
): Promise<{ card: LoyaltyCard; earnedFree: boolean }> {
  const normalized = normalizePhone(phone);
  const ref = doc(db, "loyalty_cards", normalized);
  const snap = await getDoc(ref);
  const now = Date.now();

  if (!snap.exists()) {
    const newCard: LoyaltyCard = {
      phone: normalized,
      stamps: 1,
      totalOrders: 1,
      freedrinks: 0,
      history: [now],
      createdAt: now,
    };
    await setDoc(ref, newCard);
    return { card: newCard, earnedFree: false };
  }

  const card = snap.data() as LoyaltyCard;
  const rawStamps = card.stamps + 1;
  const earnedFree = rawStamps >= STAMPS_FOR_FREE;
  const newStamps = earnedFree ? 0 : rawStamps;
  const newFreeDrinks = card.freedrinks + (earnedFree ? 1 : 0);

  await updateDoc(ref, {
    stamps: newStamps,
    totalOrders: card.totalOrders + 1,
    freedrinks: newFreeDrinks,
    history: arrayUnion(now),
  });

  const updated: LoyaltyCard = {
    ...card,
    stamps: newStamps,
    totalOrders: card.totalOrders + 1,
    freedrinks: newFreeDrinks,
    history: [...(card.history ?? []), now],
  };

  return { card: updated, earnedFree };
}

export async function getTotalCards(): Promise<number> {
  const snap = await getCountFromServer(collection(db, "loyalty_cards"));
  return snap.data().count;
}

export async function getRecentCards(n = 10): Promise<LoyaltyCard[]> {
  const q = query(
    collection(db, "loyalty_cards"),
    orderBy("createdAt", "desc"),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as LoyaltyCard);
}

export async function redeemFreeDrink(phone: string): Promise<void> {
  const normalized = normalizePhone(phone);
  const ref = doc(db, "loyalty_cards", normalized);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Tarjeta no encontrada");
  const card = snap.data() as LoyaltyCard;
  if (card.freedrinks <= 0) throw new Error("Sin bebidas gratis disponibles");
  await updateDoc(ref, { freedrinks: card.freedrinks - 1 });
}

export interface LoyaltyStats {
  totalCards: number;
  activeCards: number;
  freeDrinksAvailable: number;
  stampsTodayCount: number;
}

export async function getLoyaltyStats(): Promise<LoyaltyStats> {
  const snap = await getDocs(collection(db, "loyalty_cards"));
  const cards = snap.docs.map((d) => d.data() as LoyaltyCard);
  const todayTs = new Date().setHours(0, 0, 0, 0);
  return {
    totalCards: cards.length,
    activeCards: cards.filter((c) => c.stamps > 0).length,
    freeDrinksAvailable: cards.reduce((s, c) => s + (c.freedrinks || 0), 0),
    stampsTodayCount: cards.reduce(
      (s, c) => s + (c.history || []).filter((ts) => ts >= todayTs).length,
      0
    ),
  };
}
