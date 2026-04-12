"use client";
import { useEffect, useState } from "react";
import {
  getCard,
  LoyaltyCard,
  normalizePhone,
  STAMPS_FOR_FREE,
} from "@/lib/loyalty";

const C = {
  dark: "#CD576A",
  olive: "#79874C",
  rose: "#CD576A",
  pink: "#F298AA",
  cream: "#F8F5F1",
  white: "#FFFFFF",
  text: "#2A2019",
  muted: "#8A7A6E",
  border: "rgba(205,87,106,0.18)",
};

function StampsGrid({ stamps }: { stamps: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        margin: "20px 0",
      }}
    >
      {Array.from({ length: STAMPS_FOR_FREE }).map((_, i) => (
        <div
          key={i}
          style={{
            aspectRatio: "1",
            borderRadius: "50%",
            backgroundColor: i < stamps ? C.rose : "transparent",
            border: `2px solid ${i < stamps ? C.rose : "rgba(205,87,106,0.22)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            transition: "all 0.3s ease",
          }}
        >
          {i < stamps ? "🧋" : ""}
        </div>
      ))}
    </div>
  );
}

function CardView({
  card,
  phone,
}: {
  card: LoyaltyCard;
  phone: string;
}) {
  const [copied, setCopied] = useState(false);
  const stampsLeft = STAMPS_FOR_FREE - card.stamps;

  const copyLink = () => {
    const url = `${window.location.origin}/mi-tarjeta?tel=${normalizePhone(phone)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        padding: "40px 20px 32px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.muted,
            fontWeight: 500,
          }}
        >
          Té Sueño · Bobba Tea
        </p>
        <h1
          style={{
            margin: "6px 0 0",
            fontSize: 26,
            fontWeight: 700,
            color: C.dark,
            letterSpacing: "-0.02em",
          }}
        >
          Mi Tarjeta
        </h1>
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          backgroundColor: C.white,
          borderRadius: 24,
          padding: "24px 22px",
          boxShadow: "0 8px 32px rgba(205,87,106,0.1), 0 2px 8px rgba(0,0,0,0.06)",
          marginBottom: 14,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: C.muted,
            }}
          >
            {card.stamps} de {STAMPS_FOR_FREE} sellos
          </p>
        </div>

        <StampsGrid stamps={card.stamps} />

        {/* Progress message */}
        <div
          style={{
            padding: "14px 16px",
            backgroundColor: C.cream,
            borderRadius: 14,
            textAlign: "center",
          }}
        >
          {card.freedrinks > 0 ? (
            <>
              <p style={{ margin: 0, fontSize: 22 }}>🎉</p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.dark,
                }}
              >
                ¡Tienes {card.freedrinks} bebida
                {card.freedrinks !== 1 ? "s" : ""} gratis!
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: C.muted,
                  fontWeight: 400,
                }}
              >
                Mencionalo en tu próximo pedido
              </p>
            </>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: C.muted,
                lineHeight: 1.5,
              }}
            >
              Te {stampsLeft === 1 ? "falta" : "faltan"}{" "}
              <strong style={{ color: C.dark }}>
                {stampsLeft} pedido{stampsLeft !== 1 ? "s" : ""}
              </strong>{" "}
              para tu bebida gratis
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: C.white,
            borderRadius: 16,
            padding: "14px 12px",
            textAlign: "center",
            boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: C.dark,
              letterSpacing: "-0.02em",
            }}
          >
            {card.totalOrders}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: C.muted }}>
            Pedidos totales
          </p>
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: C.white,
            borderRadius: 16,
            padding: "14px 12px",
            textAlign: "center",
            boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: C.olive,
              letterSpacing: "-0.02em",
            }}
          >
            {card.freedrinks}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: C.muted }}>
            Bebidas gratis
          </p>
        </div>
      </div>

      {/* Copy link */}
      <button
        onClick={copyLink}
        style={{
          width: "100%",
          maxWidth: 360,
          height: 48,
          borderRadius: 14,
          border: `1.5px solid ${C.border}`,
          background: "transparent",
          color: C.dark,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--font-poppins)",
          transition: "background 0.15s ease",
        }}
      >
        {copied ? "✓ Link copiado" : "Copiar mi link de tarjeta"}
      </button>
    </div>
  );
}

export default function MiTarjetaPage() {
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState<LoyaltyCard | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-search if URL has ?tel=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tel = params.get("tel");
    if (tel && normalizePhone(tel).length >= 10) {
      setPhone(tel);
      search(tel);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(value?: string) {
    const target = normalizePhone(value ?? phone);
    if (target.length < 10) return;
    setLoading(true);
    setNotFound(false);
    setCard(null);
    const result = await getCard(target);
    setLoading(false);
    if (!result) setNotFound(true);
    else setCard(result);
  }

  if (card) return <CardView card={card} phone={phone} />;

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
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🧋</div>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.muted,
            fontWeight: 500,
          }}
        >
          Té Sueño · Bobba Tea
        </p>
        <h1
          style={{
            margin: "8px 0 0",
            fontSize: 28,
            fontWeight: 700,
            color: C.dark,
            letterSpacing: "-0.02em",
          }}
        >
          Mi Tarjeta
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 13,
            color: C.muted,
            lineHeight: 1.6,
          }}
        >
          Acumula {STAMPS_FOR_FREE} pedidos y{" "}
          <strong style={{ color: C.dark }}>gana una bebida gratis</strong>
        </p>
      </div>

      {/* Input */}
      <div style={{ width: "100%", maxWidth: 360 }}>
        <input
          type="tel"
          placeholder="Tu número de teléfono"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setNotFound(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && search()}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 14,
            border: `1.5px solid ${notFound ? C.rose : C.border}`,
            backgroundColor: C.white,
            padding: "0 16px",
            fontSize: 16,
            color: C.text,
            outline: "none",
            fontFamily: "var(--font-poppins)",
            boxSizing: "border-box",
            transition: "border-color 0.2s ease",
          }}
        />

        {notFound && (
          <p
            style={{
              fontSize: 12,
              color: C.muted,
              textAlign: "center",
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            No encontramos tu tarjeta.{" "}
            <strong style={{ color: C.dark }}>
              Incluye tu número en tu próximo pedido
            </strong>{" "}
            para empezar a acumular.
          </p>
        )}

        <button
          onClick={() => search()}
          disabled={loading || normalizePhone(phone).length < 10}
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
            cursor:
              normalizePhone(phone).length < 10 ? "not-allowed" : "pointer",
            fontFamily: "var(--font-poppins)",
            opacity: normalizePhone(phone).length < 10 ? 0.45 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          {loading ? "Buscando..." : "Ver mi tarjeta"}
        </button>
      </div>
    </div>
  );
}
