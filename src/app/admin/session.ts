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
import { isOwnerEmail, requestAdminAccess, subscribeToAdminUser } from "@/lib/admins";

// signed-out → no hay sesion de Google
// pending    → inicio sesion pero un admin aun no le da acceso (queda registrado en admin_users)
// unauthorized → correo no verificado o error leyendo permisos
export type AdminAuthState = "loading" | "admin" | "pending" | "unauthorized" | "signed-out";

// Firebase persiste la sesion en IndexedDB; sobrevive a cerrar la pestaña/PWA.
// Escucha admin_users/{email} en tiempo real: si un admin lo aprueba, entra sin recargar;
// si le quitan el acceso, sale del panel.
export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let unsubRecord: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      unsubRecord?.();
      unsubRecord = undefined;
      setUser(u);

      if (!u) return setState("signed-out");
      if (!u.email || !u.emailVerified) return setState("unauthorized");
      if (isOwnerEmail(u.email)) return setState("admin");

      setState("loading");
      let requested = false;
      unsubRecord = subscribeToAdminUser(
        u.email,
        (record) => {
          if (record) return setState(record.status === "approved" ? "admin" : "pending");
          setState("pending");
          // Primera vez que entra (o lo eliminaron y volvio a iniciar sesion): se registra
          if (!requested) {
            requested = true;
            requestAdminAccess({ email: u.email!, displayName: u.displayName, photoURL: u.photoURL })
              .catch(() => setState("unauthorized"));
          }
        },
        () => setState("unauthorized")
      );
    });

    return () => {
      unsubRecord?.();
      unsubAuth();
    };
  }, []);

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
