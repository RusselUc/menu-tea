import { arrayRemove, arrayUnion, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// settings/admins: { emails: string[] } — correos con acceso al panel, gestionados desde /admin/accesos.
// Los dueños (NEXT_PUBLIC_ADMIN_EMAILS) siempre tienen acceso y no viven aqui.
const ADMINS_REF = doc(db, "settings", "admins");

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

export async function getAdminEmails(): Promise<string[]> {
  const snap = await getDoc(ADMINS_REF);
  if (!snap.exists()) return [];
  return ((snap.data().emails as string[] | undefined) ?? []).map(normalizeEmail);
}

export async function addAdminEmail(email: string): Promise<void> {
  await setDoc(ADMINS_REF, { emails: arrayUnion(normalizeEmail(email)) }, { merge: true });
}

export async function removeAdminEmail(email: string): Promise<void> {
  await setDoc(ADMINS_REF, { emails: arrayRemove(normalizeEmail(email)) }, { merge: true });
}
