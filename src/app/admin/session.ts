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

// Correos autorizados, separados por coma: NEXT_PUBLIC_ADMIN_EMAILS="a@gmail.com,b@gmail.com"
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminUser(user: User | null): boolean {
  if (!user?.email || !user.emailVerified) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export type AdminAuthState = "loading" | "admin" | "unauthorized" | "signed-out";

// Firebase persiste la sesion en IndexedDB; sobrevive a cerrar la pestaña/PWA.
export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setState(!u ? "signed-out" : isAdminUser(u) ? "admin" : "unauthorized");
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
