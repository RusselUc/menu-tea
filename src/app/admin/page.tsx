"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { validateAdminPin } from "./actions";

const AUTH_KEY = "tea_admin_auth";
const SESSION_DAYS = 30;

export function setAdminSession() {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(AUTH_KEY, JSON.stringify({ v: "1", exp }));
}

export function checkAdminSession(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    const { v, exp } = JSON.parse(raw);
    if (v !== "1" || Date.now() > exp) {
      localStorage.removeItem(AUTH_KEY);
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return false;
  }
}

const C = {
  dark: "#CD576A",
  rose: "#CD576A",
  cream: "#F8F5F1",
  white: "#FFFFFF",
  text: "#2A2019",
  muted: "#8A7A6E",
  border: "rgba(205,87,106,0.18)",
};

// ── PIN screen ──────────────────────────────────────────
function PinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(false);
    const ok = await validateAdminPin(pin);
    setLoading(false);
    if (ok) {
      setAdminSession();
      router.push("/admin/dashboard");
    } else {
      setError(true);
      setPin("");
    }
  };

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
        <div style={{ position: "relative" }}>
          <input
            type={showPin ? "text" : "password"}
            placeholder="PIN de acceso"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 14,
              border: `1.5px solid ${error ? C.rose : C.border}`,
              backgroundColor: C.white,
              padding: "0 48px 0 16px",
              fontSize: 18,
              letterSpacing: showPin ? "0.05em" : "0.3em",
              color: C.text,
              outline: "none",
              fontFamily: "var(--font-poppins)",
              boxSizing: "border-box",
              textAlign: "center",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPin((v) => !v)}
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.muted,
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && (
          <p
            style={{
              fontSize: 12,
              color: C.rose,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            PIN incorrecto
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading || pin.length === 0}
          style={{
            width: "100%",
            height: 52,
            marginTop: 12,
            borderRadius: 14,
            border: "none",
            backgroundColor: C.rose,
            color: C.white,
            fontSize: 14,
            fontWeight: 600,
            cursor: pin.length === 0 ? "not-allowed" : "pointer",
            fontFamily: "var(--font-poppins)",
            opacity: pin.length === 0 ? 0.45 : 1,
          }}
        >
          {loading ? "Verificando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────
export default function AdminPage() {
  return <PinScreen />;
}
