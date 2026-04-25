"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateAdminPin } from "./actions";

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
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(false);
    const ok = await validateAdminPin(pin);
    setLoading(false);
    if (ok) {
      sessionStorage.setItem("tea_admin_auth", "1");
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
        <input
          type="password"
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
            padding: "0 16px",
            fontSize: 18,
            letterSpacing: "0.3em",
            color: C.text,
            outline: "none",
            fontFamily: "var(--font-poppins)",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        />
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
