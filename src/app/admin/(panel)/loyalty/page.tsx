"use client";
import { useState, useEffect } from "react";
import {
  addStamp,
  getCard,
  getRecentCards,
  getTotalCards,
  getLoyaltyStats,
  LoyaltyCard,
  LoyaltyStats,
  normalizePhone,
  redeemFreeDrink,
  STAMPS_FOR_FREE,
} from "@/lib/loyalty";

const T = {
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  secondary: "#334155",
  muted: "#64748B",
  mutedLight: "#94A3B8",
  slate: "#F1F5F9",
  rose: "#E11D48",
  roseBg: "#FFF1F2",
  roseBorder: "#FECDD3",
  green: "#059669",
  greenBg: "#ECFDF5",
  greenBorder: "#A7F3D0",
  whatsapp: "#16A34A",
  whatsappBg: "#F0FDF4",
  whatsappBorder: "#BBF7D0",
  olive: "#65A30D",
  oliveBg: "#F7FEE7",
  oliveBorder: "#BEF264",
};

function StampsGrid({ stamps }: { stamps: number }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: 8,
      margin: "16px 0",
    }}>
      {Array.from({ length: STAMPS_FOR_FREE }).map((_, i) => (
        <div key={i} style={{
          aspectRatio: "1",
          borderRadius: "50%",
          backgroundColor: i < stamps ? T.roseBg : T.slate,
          border: `1.5px solid ${i < stamps ? T.roseBorder : T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          transition: "all 0.2s",
        }}>
          {i < stamps ? "🌸" : ""}
        </div>
      ))}
    </div>
  );
}

export default function LoyaltyPage() {
  const [view, setView] = useState<"list" | "detail">("list");
  const [searchPhone, setSearchPhone] = useState("");
  const [card, setCard] = useState<LoyaltyCard | null>(null);
  const [currentPhone, setCurrentPhone] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "free" } | null>(null);
  const [recentCards, setRecentCards] = useState<LoyaltyCard[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [totalCards, setTotalCards] = useState<number | null>(null);
  const [loyaltyStats, setLoyaltyStats] = useState<LoyaltyStats | null>(null);

  useEffect(() => {
    getRecentCards(10)
      .then(setRecentCards)
      .catch(() => {})
      .finally(() => setRecentLoading(false));
    getTotalCards().then(setTotalCards).catch(() => {});
    getLoyaltyStats().then(setLoyaltyStats).catch(() => {});
  }, []);

  function showToast(msg: string, type: "success" | "free") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function goBack() {
    setView("list");
    setCard(null);
    setNotFound(false);
    setCurrentPhone("");
    setSearchPhone("");
  }

  async function openCard(phone: string) {
    const n = normalizePhone(phone);
    setLoading(true);
    setNotFound(false);
    setCard(null);
    setCurrentPhone(n);
    setSearchPhone(phone);
    const result = await getCard(n);
    setLoading(false);
    if (!result) setNotFound(true);
    else setCard(result);
    setView("detail");
  }

  async function handleSearch() {
    const n = normalizePhone(searchPhone);
    if (n.length < 10) return;
    await openCard(searchPhone);
  }

  async function handleStamp() {
    const n = notFound ? normalizePhone(searchPhone) : currentPhone;
    setActionLoading(true);
    const { card: updated, earnedFree } = await addStamp(n);
    setCard(updated);
    setCurrentPhone(n);
    setNotFound(false);
    setActionLoading(false);
    if (earnedFree) showToast(`Completo ${STAMPS_FOR_FREE} pedidos. Gano bebida gratis`, "free");
    else showToast(`Sello agregado · ${updated.stamps} de ${STAMPS_FOR_FREE}`, "success");
  }

  async function handleRedeem() {
    if (!card || card.freedrinks <= 0) return;
    setActionLoading(true);
    await redeemFreeDrink(currentPhone);
    const updated = await getCard(currentPhone);
    if (updated) setCard(updated);
    setActionLoading(false);
    showToast("Bebida gratis canjeada", "success");
  }

  const canStamp = normalizePhone(searchPhone).length >= 10 || currentPhone.length >= 10;

  function sendWhatsAppLink() {
    const phone = currentPhone || normalizePhone(searchPhone);
    const cardUrl = `${window.location.origin}/mi-tarjeta?tel=${phone}`;
    const msg = encodeURIComponent(
      `Hola! 🫢 Tu pedido fue entregado.\n\nYa tienes tu flor registrada en tu tarjeta de fidelidad de Té Sueño 🌸. Con ${STAMPS_FOR_FREE} pedidos ganas una bebida gratis.\n\nVe tu tarjeta aqui: ${cardUrl}`
    );
    window.open(`https://wa.me/52${phone}?text=${msg}`, "_blank");
  }

  return (
    <div style={{
      padding: "28px 24px 32px",
      maxWidth: 560,
      margin: "0 auto",
      fontFamily: "var(--font-poppins)",
    }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Tarjetas registradas",  value: loyaltyStats?.totalCards },
          { label: "Con sellos activos",    value: loyaltyStats?.activeCards },
          { label: "Bebidas gratis disp.",  value: loyaltyStats?.freeDrinksAvailable },
          { label: "Sellos dados hoy",      value: loyaltyStats?.stampsTodayCount },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: "12px 14px", background: T.white, borderRadius: 10, border: `1px solid ${T.border}` }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: T.muted, fontWeight: 500 }}>{label}</p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: value === undefined ? T.mutedLight : T.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {value === undefined ? "—" : value}
            </p>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          top: 20, left: "50%",
          transform: "translateX(-50%)",
          background: toast.type === "free" ? T.oliveBg : T.white,
          color: toast.type === "free" ? T.olive : T.text,
          border: `1px solid ${toast.type === "free" ? T.oliveBorder : T.border}`,
          padding: "10px 20px",
          borderRadius: 10,
          fontSize: 13, fontWeight: 600,
          zIndex: 100,
          boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          whiteSpace: "nowrap",
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── LIST VIEW ─────────────────────────────────── */}
      {view === "list" && (
        <>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
              Fidelidad
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: T.muted }}>
              Gestiona las tarjetas de los clientes
            </p>
          </div>

          {/* Stat card */}
          <div style={{
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "18px 20px",
            marginBottom: 12,
          }}>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: T.muted, fontWeight: 500 }}>
              Tarjetas registradas
            </p>
            <p style={{
              margin: 0,
              fontSize: totalCards === null ? 24 : 32,
              fontWeight: 700,
              color: totalCards === null ? T.mutedLight : T.text,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}>
              {totalCards === null ? "—" : totalCards}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: T.mutedLight }}>
              clientes con tarjeta de fidelidad
            </p>
          </div>

          {/* Search */}
          <div style={{
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "18px 20px",
            marginBottom: 12,
          }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: T.muted }}>
              Buscar cliente
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="tel"
                placeholder="Número de teléfono"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                style={{
                  flex: 1, height: 40,
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: T.bg,
                  padding: "0 12px",
                  fontSize: 14, color: T.text,
                  outline: "none",
                  fontFamily: "var(--font-poppins)",
                }}
              />
              <button
                onClick={handleSearch}
                disabled={loading || normalizePhone(searchPhone).length < 10}
                style={{
                  height: 40, padding: "0 16px",
                  borderRadius: 8, border: "none",
                  background: normalizePhone(searchPhone).length < 10 ? T.slate : T.text,
                  color: normalizePhone(searchPhone).length < 10 ? T.mutedLight : T.white,
                  fontSize: 13, fontWeight: 600,
                  cursor: normalizePhone(searchPhone).length < 10 ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-poppins)",
                  transition: "all 0.15s",
                }}
              >
                {loading ? "..." : "Buscar"}
              </button>
            </div>
          </div>

          {/* Recent cards list */}
          <div style={{
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 20px",
              borderBottom: `1px solid ${T.border}`,
            }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>
                Clientes recientes
              </p>
            </div>

            {recentLoading ? (
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: 52, borderRadius: 8, background: T.slate }} />
                ))}
              </div>
            ) : recentCards.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 13, color: T.mutedLight }}>
                  Aún no hay tarjetas registradas
                </p>
              </div>
            ) : (
              recentCards.map((c, idx) => (
                <button
                  key={c.phone}
                  onClick={() => openCard(c.phone)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 20px",
                    borderBottom: idx < recentCards.length - 1 ? `1px solid ${T.border}` : "none",
                    background: "transparent",
                    border: "none",
                    borderBottomWidth: idx < recentCards.length - 1 ? 1 : 0,
                    borderBottomStyle: "solid",
                    borderBottomColor: T.border,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "var(--font-poppins)",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.slate)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: T.roseBg,
                    border: `1px solid ${T.roseBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15,
                  }}>
                    🌸
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                        {c.phone}
                      </span>
                      {c.freedrinks > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: T.oliveBg, color: T.olive,
                          border: `1px solid ${T.oliveBorder}`,
                          borderRadius: 4, padding: "1px 6px",
                        }}>
                          {c.freedrinks} gratis
                        </span>
                      )}
                    </div>
                    {/* Mini progress bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ display: "flex", gap: 2, flex: 1 }}>
                        {Array.from({ length: STAMPS_FOR_FREE }).map((_, i) => (
                          <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 2,
                            background: i < c.stamps ? T.rose : T.border,
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 10, color: T.mutedLight, flexShrink: 0 }}>
                        {c.stamps}/{STAMPS_FOR_FREE}
                      </span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.mutedLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {/* ── DETAIL VIEW ───────────────────────────────── */}
      {view === "detail" && (
        <>
          {/* Back + header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button
              onClick={goBack}
              style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                border: `1px solid ${T.border}`,
                background: T.white,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: T.muted, fontWeight: 500 }}>Fidelidad</p>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
                {currentPhone}
              </h1>
            </div>
          </div>

          {/* Card result */}
          {loading ? (
            <div style={{
              background: T.white, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: "32px 20px",
              textAlign: "center",
            }}>
              <p style={{ margin: 0, fontSize: 13, color: T.mutedLight }}>Cargando...</p>
            </div>
          ) : (
            <div style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "18px 20px",
              marginBottom: 12,
            }}>
              {notFound ? (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: T.text }}>
                    Cliente nuevo
                  </p>
                  <p style={{ margin: "5px 0 0", fontSize: 12, color: T.muted }}>
                    Sin tarjeta. El primer sello la creará automáticamente.
                  </p>
                </div>
              ) : card ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>
                        {currentPhone}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: T.muted }}>
                        {card.totalOrders} pedido{card.totalOrders !== 1 ? "s" : ""} en total
                      </p>
                    </div>
                    {card.freedrinks > 0 && (
                      <span style={{
                        background: T.oliveBg, color: T.olive,
                        border: `1px solid ${T.oliveBorder}`,
                        padding: "4px 12px", borderRadius: 100,
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {card.freedrinks} gratis
                      </span>
                    )}
                  </div>

                  <StampsGrid stamps={card.stamps} />

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 12,
                    borderTop: `1px solid ${T.border}`,
                  }}>
                    <span style={{ fontSize: 12, color: T.muted }}>
                      {card.stamps} de {STAMPS_FOR_FREE} sellos
                    </span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {Array.from({ length: STAMPS_FOR_FREE }).map((_, i) => (
                        <div key={i} style={{
                          width: 20, height: 4, borderRadius: 2,
                          background: i < card.stamps ? T.rose : T.border,
                          transition: "background 0.2s",
                        }} />
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* Actions */}
          {(card || notFound) && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={handleStamp}
                disabled={actionLoading || !canStamp}
                style={{
                  width: "100%", height: 44,
                  borderRadius: 9, border: "none",
                  background: actionLoading || !canStamp ? T.slate : T.text,
                  color: actionLoading || !canStamp ? T.mutedLight : T.white,
                  fontSize: 14, fontWeight: 600,
                  cursor: actionLoading || !canStamp ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-poppins)",
                  transition: "all 0.15s",
                }}
              >
                {actionLoading ? "Guardando..." : "Agregar sello"}
              </button>

              {card && card.freedrinks > 0 && (
                <button
                  onClick={handleRedeem}
                  disabled={actionLoading}
                  style={{
                    width: "100%", height: 40,
                    borderRadius: 9,
                    border: `1px solid ${T.oliveBorder}`,
                    background: T.oliveBg, color: T.olive,
                    fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-poppins)",
                    opacity: actionLoading ? 0.6 : 1,
                  }}
                >
                  Canjear bebida gratis
                </button>
              )}

              {canStamp && (
                <button
                  onClick={sendWhatsAppLink}
                  style={{
                    width: "100%", height: 40,
                    borderRadius: 9,
                    border: `1px solid ${T.whatsappBorder}`,
                    background: T.whatsappBg, color: T.whatsapp,
                    fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-poppins)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Enviar tarjeta por WhatsApp
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
