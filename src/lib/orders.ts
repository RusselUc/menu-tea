import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type OrderStatus = "pending" | "delivered" | "cancelled" | "success";

export interface OrderItem {
  flavor: string;
  size: string;
  category: string;
  toppings: string[];
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  // new format
  items?: OrderItem[];
  total?: number;
  phone?: string;
  // legacy single-item format
  flavor?: string;
  size?: string;
  category?: string;
  toppings?: string[];
  price?: number;
  quantity?: number;
  // common
  timestamp: Timestamp;
  status: OrderStatus;
}

export function getOrderTotal(order: Order): number {
  if (order.total !== undefined) return order.total;
  if (order.items) return order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  if (order.price !== undefined && order.quantity !== undefined)
    return order.price * order.quantity;
  return 0;
}

export function getOrderLabel(order: Order): string {
  if (order.items && order.items.length > 0) {
    const first = order.items[0];
    return order.items.length === 1
      ? `${first.quantity}× ${first.flavor}`
      : `${first.flavor} +${order.items.length - 1} más`;
  }
  if (order.flavor) return order.flavor;
  return "Pedido";
}

export async function getOrders(from?: Date, to?: Date, limitCount?: number): Promise<Order[]> {
  let q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
  if (from) q = query(q, where("timestamp", ">=", Timestamp.fromDate(from)));
  if (to) {
    const toEnd = new Date(to);
    toEnd.setDate(toEnd.getDate() + 1);
    q = query(q, where("timestamp", "<", Timestamp.fromDate(toEnd)));
  }
  if (limitCount) q = query(q, limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
}

export async function getPendingCount(): Promise<number> {
  const q = query(
    collection(db, "orders"),
    where("status", "in", ["pending", "success"])
  );
  const snap = await getDocs(q);
  return snap.size;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  await updateDoc(doc(db, "orders", orderId), { status });
}

export async function saveFullOrder(order: {
  items: OrderItem[];
  total: number;
  phone?: string;
}): Promise<void> {
  await addDoc(collection(db, "orders"), {
    ...order,
    timestamp: Timestamp.now(),
    status: "pending",
  });
}
