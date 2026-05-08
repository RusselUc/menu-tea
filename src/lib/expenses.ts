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
  cardDueDate?: Timestamp;
  cardPaid?: boolean;
  // meses sin intereses
  installments?: number;       // total de meses (si aplica)
  installmentsPaid?: number;   // cuántos meses se han pagado
  timestamp: Timestamp;
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

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, "expenses", id));
}
