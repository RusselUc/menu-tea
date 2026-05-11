import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type PaymentMethod = "cash" | "card";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  cardName?: string;           // nombre de la tarjeta (ej. "BBVA", "Banamex")
  cardDueDay?: number;         // legacy: día del mes en que se paga
  cardDueDate?: Timestamp;     // legacy: fecha específica de pago
  cardPaid?: boolean;
  // meses sin intereses
  installments?: number;       // total de meses (si aplica)
  firstPaymentMonth?: string;  // mes de primer pago "YYYY-MM" (ej. "2026-06")
  installmentsPaid?: number;   // legacy: contador simple
  paidMonths?: string[];       // meses pagados como "YYYY-MM" (ej. ["2026-05", "2026-06"])
  purchaseDate?: Timestamp;    // fecha real de la compra (solo TDC nuevos)
  timestamp: Timestamp;        // cash = fecha compra; TDC = fecha de pago (usado para filtros)
}

export async function getExpenses(from?: Date, to?: Date, limitCount?: number): Promise<Expense[]> {
  let q = query(collection(db, "expenses"), orderBy("timestamp", "desc"));
  if (from) q = query(q, where("timestamp", ">=", Timestamp.fromDate(from)));
  if (to) {
    const toEnd = new Date(to);
    toEnd.setDate(toEnd.getDate() + 1);
    q = query(q, where("timestamp", "<", Timestamp.fromDate(toEnd)));
  }
  if (limitCount) q = query(q, limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
}

export async function addExpense(expense: Omit<Expense, "id">): Promise<void> {
  await addDoc(collection(db, "expenses"), expense);
}

export async function updateExpenseCardPaid(id: string, cardPaid: boolean): Promise<void> {
  await updateDoc(doc(db, "expenses", id), { cardPaid });
}

export async function updateExpenseInstallmentPaid(id: string, installmentsPaid: number, cardPaid: boolean): Promise<void> {
  await updateDoc(doc(db, "expenses", id), { installmentsPaid, cardPaid });
}

export async function updateExpensePaidMonths(id: string, paidMonths: string[], cardPaid: boolean): Promise<void> {
  await updateDoc(doc(db, "expenses", id), { paidMonths, installmentsPaid: paidMonths.length, cardPaid });
}

export async function updateExpense(id: string, data: Partial<Omit<Expense, "id">>): Promise<void> {
  await updateDoc(doc(db, "expenses", id), data as Record<string, unknown>);
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, "expenses", id));
}
