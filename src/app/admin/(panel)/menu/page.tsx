"use client";

const T = {
  white: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  muted: "#64748B",
  mutedLight: "#94A3B8",
  slate: "#F1F5F9",
};

export default function MenuPage() {
  return (
    <div style={{
      padding: "28px 24px 32px",
      maxWidth: 560,
      margin: "0 auto",
      fontFamily: "var(--font-poppins)",
    }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
          Menú
        </h1>
        <p style={{ margin: "3px 0 0", fontSize: 13, color: T.muted }}>
          Gestiona los productos del menú
        </p>
      </div>

      <div style={{
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: "56px 32px",
        textAlign: "center",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: T.slate,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px",
          fontSize: 22,
        }}>
          🧋
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
          Próximamente
        </p>
        <p style={{
          fontSize: 13, color: T.mutedLight, margin: 0,
          lineHeight: 1.6, maxWidth: 280, marginInline: "auto",
        }}>
          Aquí podrás agregar, editar y desactivar sabores sin modificar el código.
        </p>
      </div>
    </div>
  );
}
