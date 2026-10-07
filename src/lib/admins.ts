import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// admin_users/{email}: cada cuenta de Google que intenta entrar al panel queda
// registrada como "pending" hasta que un admin la aprueba en /admin/accesos.
// Los dueños (NEXT_PUBLIC_ADMIN_EMAILS) siempre tienen acceso y no viven aqui.
const COL = "admin_users";

export type AdminUserStatus = "pending" | "approved";

export interface AdminUser {
  email: string; // tambien es el doc id (normalizado)
  name?: string | null;
  photoURL?: string | null;
  status: AdminUserStatus;
  createdAt: number;
  approvedAt?: number;
  approvedBy?: string;
}

export const OWNER_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => normalizeEmail(e))
  .filter(Boolean);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isOwnerEmail(email: string): boolean {
  return OWNER_EMAILS.includes(normalizeEmail(email));
}

const userRef = (email: string) => doc(db, COL, normalizeEmail(email));

export function subscribeToAdminUser(
  email: string,
  cb: (user: AdminUser | null) => void,
  onError: (err: Error) => void
): () => void {
  return onSnapshot(
    userRef(email),
    (snap) => cb(snap.exists() ? (snap.data() as AdminUser) : null),
    onError
  );
}

export function subscribeToAdminUsers(
  cb: (users: AdminUser[]) => void,
  onError: (err: Error) => void
): () => void {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as AdminUser)), onError);
}

// La crea el propio usuario al iniciar sesion por primera vez (las reglas solo le permiten "pending")
export async function requestAdminAccess(user: {
  email: string;
  displayName: string | null;
  photoURL: string | null;
}): Promise<void> {
  const record: AdminUser = {
    email: normalizeEmail(user.email),
    name: user.displayName,
    photoURL: user.photoURL,
    status: "pending",
    createdAt: Date.now(),
  };
  await setDoc(userRef(user.email), record);
}

export async function approveAdminUser(email: string, approvedBy: string): Promise<void> {
  await updateDoc(userRef(email), { status: "approved", approvedAt: Date.now(), approvedBy });
}

// Dar acceso a un correo que aun no ha iniciado sesion
export async function grantAdminAccess(email: string, approvedBy: string): Promise<void> {
  const now = Date.now();
  await setDoc(
    userRef(email),
    { email: normalizeEmail(email), status: "approved", createdAt: now, approvedAt: now, approvedBy },
    { merge: true }
  );
}

export async function deleteAdminUser(email: string): Promise<void> {
  await deleteDoc(userRef(email));
}
