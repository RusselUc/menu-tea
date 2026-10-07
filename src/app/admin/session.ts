"use client";
import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAdminEmails, isOwnerEmail, normalizeEmail } from "@/lib/admins";

// Dueños (NEXT_PUBLIC_ADMIN_EMAILS) + correos dados de alta en /admin/accesos (settings/admins)
export async function isAdminUser(user: User | null): Promise<boolean> {
  if (!user?.email || !user.emailVerified) return false;
  if (isOwnerEmail(user.email)) return true;
  try {
    return (await getAdminEmails()).includes(normalizeEmail(user.email));
  } catch {
    return false;
  }
}

export type AdminAuthState = "loading" | "admin" | "unauthorized" | "signed-out";

// Firebase persiste la sesion en IndexedDB; sobrevive a cerrar la pestaña/PWA.
export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (!u) return setState("signed-out");
        setState("loading");
        setState((await isAdminUser(u)) ? "admin" : "unauthorized");
      }),
    []
  );

  return { state, user };
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    // En PWAs instaladas (iOS standalone) los popups suelen bloquearse
    const code = (err as { code?: string }).code;
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw err;
  }
}

export function signOutAdmin() {
  return signOut(auth);
}
