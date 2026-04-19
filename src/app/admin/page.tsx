"use client";
import { useState } from "react";
import {
  addStamp,
  getCard,
  LoyaltyCard,
  normalizePhone,
  redeemFreeDrink,
  STAMPS_FOR_FREE,
} from "@/lib/loyalty";
import { validateAdminPin } from "./actions";

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
  green: "#4CAF50",
};

function StampsGrid({ stamps }: { stamps: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10,
        margin: "16px 0",
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
            fontSize: 18,
            transition: "all 0.3s ease",
          }}
        >
          {i < stamps ? "🧋" : ""}
        </div>
      ))}
    </div>
  );
}

// ── PIN screen ──────────────────────────────────────────
function PinScreen({ onVerified }: { onVerified: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(false);
    const ok = await validateAdminPin(pin);
    setLoading(false);
    if (ok) onVerified();
    else {
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
          Té Sueño · Panel de fidelidad
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

// ── Admin panel ─────────────────────────────────────────
function AdminPanel() {
  const [searchPhone, setSearchPhone] = useState("");
  const [card, setCard] = useState<LoyaltyCard | null>(null);
  const [currentPhone, setCurrentPhone] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "free" } | null>(null);
  const [stamped, setStamped] = useState(false);

  function showToast(msg: string, type: "success" | "free") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSearch() {
    const normalized = normalizePhone(searchPhone);
    if (normalized.length < 10) return;
    setLoading(true);
    setNotFound(false);
    setCard(null);
    setStamped(false);
    const result = await getCard(normalized);
    setLoading(false);
    if (!result) {
      setNotFound(true);
    } else {
      setCard(result);
      setCurrentPhone(normalized);
    }
  }

  async function handleStamp() {
    const normalized = notFound
      ? normalizePhone(searchPhone)
      : currentPhone;
    setActionLoading(true);
    const { card: updated, earnedFree } = await addStamp(normalized);
    setCard(updated);
    setCurrentPhone(normalized);
    setNotFound(false);
    setActionLoading(false);
    setStamped(true);
    if (earnedFree) {
      showToast("🎉 ¡Completó 8 pedidos! Ganó una bebida gratis", "free");
    } else {
      showToast(`✓ Sello agregado · ${updated.stamps} de ${STAMPS_FOR_FREE}`, "success");
    }
  }

  async function handleRedeem() {
    if (!card || card.freedrinks <= 0) return;
    setActionLoading(true);
    await redeemFreeDrink(currentPhone);
    const updated = await getCard(currentPhone);
    if (updated) setCard(updated);
    setActionLoading(false);
    showToast("✓ Bebida gratis canjeada", "success");
  }

  const canStamp =
    normalizePhone(searchPhone).length >= 10 || currentPhone.length >= 10;

  function sendWhatsAppLink() {
    const phone = currentPhone || normalizePhone(searchPhone);
    const cardUrl = `${window.location.origin}/mi-tarjeta?tel=${phone}`;
    const msg = encodeURIComponent(
      `¡Hola! 🌸 Tu pedido fue entregado.\n\nYa tienes tu flor registrada en tu tarjeta de fidelidad de Té Sueño. Con ${STAMPS_FOR_FREE} pedidos ganas una bebida gratis.\n\nVe tu tarjeta aquí: ${cardUrl}`
    );
    window.open(`https://wa.me/52${phone}?text=${msg}`, "_blank");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: C.cream,
        fontFamily: "var(--font-poppins)",
        padding: "32px 20px",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: toast.type === "free" ? C.olive : C.text,
            color: C.white,
            padding: "12px 22px",
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 100,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            whiteSpace: "nowrap",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: C.muted,
            fontWeight: 500,
          }}
        >
          Té Sueño · Admin
        </p>
        <h1
          style={{
            margin: "4px 0 0",
            fontSize: 26,
            fontWeight: 700,
            color: C.dark,
            letterSpacing: "-0.02em",
          }}
        >
          Tarjetas de fidelidad
        </h1>
      </div>

      {/* Search */}
      <div
        style={{
          backgroundColor: C.white,
          borderRadius: 20,
          padding: "20px 18px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          marginBottom: 16,
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 12,
            fontWeight: 600,
            color: C.muted,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Buscar cliente
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="tel"
            placeholder="Número de teléfono"
            value={searchPhone}
            onChange={(e) => {
              setSearchPhone(e.target.value);
              setNotFound(false);
              setCard(null);
              setCurrentPhone("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 12,
              border: `1.5px solid ${C.border}`,
              backgroundColor: C.cream,
              padding: "0 14px",
              fontSize: 15,
              color: C.text,
              outline: "none",
              fontFamily: "var(--font-poppins)",
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading || normalizePhone(searchPhone).length < 10}
            style={{
              height: 46,
              padding: "0 18px",
              borderRadius: 12,
              border: "none",
              backgroundColor: C.dark,
              color: C.white,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-poppins)",
              opacity: normalizePhone(searchPhone).length < 10 ? 0.4 : 1,
            }}
          >
            {loading ? "..." : "Buscar"}
          </button>
        </div>
      </div>

      {/* Card result */}
      {(card || notFound) && (
        <div
          style={{
            backgroundColor: C.white,
            borderRadius: 20,
            padding: "20px 18px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            marginBottom: 16,
          }}
        >
          {notFound ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.dark }}>
                Cliente nuevo
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: C.muted }}>
                No tiene tarjeta aún. Al agregar el primer sello se creará automáticamente.
              </p>
            </div>
          ) : card ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 4,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 700,
                      color: C.text,
                    }}
                  >
                    {currentPhone}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>
                    {card.totalOrders} pedido{card.totalOrders !== 1 ? "s" : ""} totales
                  </p>
                </div>
                {card.freedrinks > 0 && (
                  <div
                    style={{
                      backgroundColor: C.olive,
                      color: C.white,
                      padding: "4px 12px",
                      borderRadius: 100,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    🎉 {card.freedrinks} gratis
                  </div>
                )}
              </div>

              <StampsGrid stamps={card.stamps} />

              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: C.muted,
                  textAlign: "center",
                }}
              >
                {card.stamps} de {STAMPS_FOR_FREE} sellos
              </p>
            </>
          ) : null}
        </div>
      )}

      {/* Actions */}
      {(card || notFound) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={handleStamp}
            disabled={actionLoading || !canStamp}
            style={{
              width: "100%",
              height: 54,
              borderRadius: 16,
              border: "none",
              backgroundColor: C.rose,
              color: C.white,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-poppins)",
              letterSpacing: "-0.01em",
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            {actionLoading ? "Guardando..." : "✦ Agregar sello"}
          </button>

          {card && card.freedrinks > 0 && (
            <button
              onClick={handleRedeem}
              disabled={actionLoading}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 16,
                border: `2px solid ${C.olive}`,
                backgroundColor: "transparent",
                color: C.olive,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-poppins)",
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              🎁 Canjear bebida gratis
            </button>
          )}

          {stamped && (
            <button
              onClick={sendWhatsAppLink}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 16,
                border: "none",
                backgroundColor: "#25D366",
                color: C.white,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-poppins)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar tarjeta al cliente
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────
export default function AdminPage() {
  const [verified, setVerified] = useState(false);

  if (!verified) return <PinScreen onVerified={() => setVerified(true)} />;
  return <AdminPanel />;
}
