"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle, signOutAdmin, useAdminAuth } from "./session";

const C = {
  dark: "#CD576A",
  rose: "#CD576A",
  cream: "#F8F5F1",
  white: "#FFFFFF",
  text: "#2A2019",
  muted: "#8A7A6E",
  border: "rgba(205,87,106,0.18)",
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

// ── Login screen ────────────────────────────────────────
function LoginScreen() {
  const router = useRouter();
  const { state, user } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state === "admin") router.replace("/admin/dashboard");
    if (state === "unauthorized") {
      setError(`${user?.email ?? "Esta cuenta"} no tiene acceso al panel.`);
      signOutAdmin();
    }
  }, [state, user, router]);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError("No se pudo iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || state === "loading" || state === "admin";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: C.cream,
        fontFamily: "var(--font-poppins)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: C.dark,
            letterSpacing: "-0.02em",
          }}
        >
          Admin
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: C.muted }}>
          Te Sueno · Dashboard
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 320 }}>
        <button
          onClick={handleGoogle}
          disabled={busy}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 14,
            border: `1.5px solid ${C.border}`,
            backgroundColor: C.white,
            color: C.text,
            fontSize: 14,
            fontWeight: 600,
            cursor: busy ? "not-allowed" : "pointer",
            fontFamily: "var(--font-poppins)",
            opacity: busy ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <GoogleIcon />
          {busy ? "Verificando..." : "Continuar con Google"}
        </button>
        {error && (
          <p
            style={{
              fontSize: 12,
              color: C.rose,
              textAlign: "center",
              marginTop: 10,
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────
export default function AdminPage() {
  return <LoginScreen />;
}
