"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bricolage_Grotesque } from "next/font/google";
import Link from "next/link";
import logoPink from "@/assets/images/logo-pink.png";
import {
  Coupon,
  CouponStatusLabel,
  getCouponById,
  getCouponStatusLabel,
} from "@/lib/coupons";
import { Gift, Check, Copy, Clock, Ban, ArrowRight, BadgeCheck } from "lucide-react";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-bricolage" });

/* ─── Paleta propia de esta pagina — calida y editorial, pensada como
   "gift card premium" en vez de la pantalla utilitaria del resto del sitio.
   Los acentos siguen siendo el rose/olive de marca para que se sienta Té
   Sueño en cuanto se hace click a "Ver el menú". ─────────────────────── */
const T = {
  pageBg:     "#FFF9F0",
  surface:    "#FFFFFF",
  ink:        "#241016",
  muted:      "#6B4A50",
  mutedLight: "#A98D92",
  border:     "#EEDCDF",
  rose:       "#CD576A",
  roseDeep:   "#7A0F30",
  roseMid:    "#A6274A",
  roseTint:   "#FBEEF0",
  olive:      "#79874C",
  flat:       "#B6ACA1",
  flatDeep:   "#847A6F",
  flatTint:   "#F1ECE4",
};

const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function discountHeadline(c: Coupon): string {
  if (c.discountType === "fixed") return `$${c.discountValue}`;
  if (c.discountType === "percentage") return `${c.discountValue}%`;
  const n = c.maxFreeItems ?? 1;
  return `${n} gratis`;
}

function discountCaption(c: Coupon): string {
  if (c.discountType === "fixed") return "de descuento en tu pedido";
  if (c.discountType === "percentage") return "de descuento en tu pedido";
  const n = c.maxFreeItems ?? 1;
  return `bebida${n !== 1 ? "s" : ""} de regalo`;
}

const STATUS_LABEL: Record<CouponStatusLabel, string> = {
  VIGENTE: "Disponible",
  PROGRAMADO: "Aún no empieza",
  EXPIRADO: "Expiró",
  AGOTADO: "Agotado",
  DESACTIVADO: "No disponible",
};

const STATUS_MESSAGE: Record<Exclude<CouponStatusLabel, "VIGENTE">, string> = {
  PROGRAMADO: "Este regalo se activa el",
  EXPIRADO: "Este regalo expiró el",
  AGOTADO: "Este regalo ya alcanzó su límite de usos.",
  DESACTIVADO: "Este regalo ya no está disponible.",
};

const STEPS = [
  { title: "Copia tu código", body: "Toca la caja de arriba para copiarlo." },
  { title: "Arma tu pedido", body: "Abre el menú y elige lo que se te antoje." },
  { title: "Pégalo en el carrito", body: "En “¿Tienes un cupón?”, antes de enviar." },
];

function PageHeader() {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 10,
      backgroundColor: "#FFFFFF", borderBottom: `1px solid ${T.border}`,
      padding: "0 20px", height: 58, display: "flex", alignItems: "center",
    }}>
      <img src={logoPink.src} alt="Té Sueño" style={{ height: 36, width: "auto" }} />
    </header>
  );
}

function StatusIcon({ status, size = 14 }: { status: CouponStatusLabel; size?: number }) {
  if (status === "VIGENTE") return <BadgeCheck size={size} />;
  if (status === "PROGRAMADO") return <Clock size={size} />;
  return <Ban size={size} />;
}

/* ─── La tarjeta ────────────────────────────────────────────────────── */
function GiftCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const status = getCouponStatusLabel(coupon);
  const isUsable = status === "VIGENTE";

  function copyCode() {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <style>{`
        @keyframes giftFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        .gift-card-float { animation: giftFloat 4.5s ease-in-out infinite; }
        .gift-cta:hover  { transform: translate(2px, 2px); box-shadow: 4px 4px 0 0 rgba(122,15,48,0.35) !important; }
        .gift-cta        { transition: transform 0.12s, box-shadow 0.12s; }
        .gift-code:hover { transform: translate(2px, 2px); box-shadow: 2px 2px 0 0 rgba(122,15,48,0.28) !important; }
        .gift-code       { transition: transform 0.12s, box-shadow 0.12s; }
        @media (prefers-reduced-motion: reduce) {
          .gift-card-float { animation: none !important; }
        }
      `}</style>

      {/* Pill de contexto */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 100,
          background: T.roseTint, color: T.roseDeep,
          fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          <Gift size={13} /> Regalo de Té Sueño
        </span>
      </div>

      {/* Tarjeta con sombra dura tipo sticker */}
      <div style={{ position: "relative" }} className={isUsable ? "gift-card-float" : undefined}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: 28,
          background: isUsable ? T.roseDeep : T.flatDeep, opacity: 0.28,
          transform: "translate(7px, 7px)",
        }} />
        <div style={{
          position: "relative", borderRadius: 28, overflow: "hidden",
          border: `1px solid ${isUsable ? "rgba(255,255,255,0.14)" : T.border}`,
          background: isUsable
            ? "linear-gradient(155deg, #D9647A 0%, #B0325A 45%, #7A0F30 100%)"
            : `linear-gradient(155deg, ${T.flat} 0%, ${T.flatDeep} 100%)`,
        }}>
          {/* blobs decorativos */}
          <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.14)", filter: "blur(2px)" }} />
          <div style={{ position: "absolute", bottom: -50, left: -30, width: 150, height: 150, borderRadius: "50%", background: T.olive, opacity: isUsable ? 0.16 : 0, filter: "blur(30px)" }} />

          <div style={{ position: "relative", padding: "20px 22px 22px" }}>
            {/* fila superior: marca + badge de estado */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className={display.className} style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
                Té Sueño
              </span>
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(255,255,255,0.18)", color: "#fff",
              }}>
                <StatusIcon status={status} size={16} />
              </span>
            </div>

            {/* numero grande — el protagonista */}
            <div style={{ margin: "22px 0 4px" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Regalo exclusivo
              </p>
              <p className={display.className} style={{ margin: "2px 0 0", fontSize: 46, fontWeight: 800, lineHeight: 1, color: "#fff", letterSpacing: "-0.02em" }}>
                {discountHeadline(coupon)}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 13.5, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
                {discountCaption(coupon)}
              </p>
              {coupon.discountType === "free_items" && (coupon.excludedCategories?.length ?? 0) > 0 && (
                <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.65)" }}>
                  No aplica en: {coupon.excludedCategories!.join(", ")}
                </p>
              )}
            </div>

            {/* pie: divisor + validez + status */}
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: 0, fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Válido hasta
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  {formatDate(coupon.endDate)}
                </p>
              </div>
              <span style={{
                padding: "5px 11px", borderRadius: 100,
                background: "rgba(255,255,255,0.16)", color: "#fff",
                fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                {STATUS_LABEL[status]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso de estado no disponible */}
      {!isUsable && (
        <div style={{
          marginTop: 16, display: "flex", alignItems: "center", gap: 8,
          padding: "11px 14px", borderRadius: 12, background: T.flatTint, color: T.muted,
          fontSize: 12.5, fontWeight: 600,
        }}>
          <StatusIcon status={status} size={15} />
          {STATUS_MESSAGE[status as Exclude<CouponStatusLabel, "VIGENTE">]}
          {status === "PROGRAMADO" ? ` ${formatDate(coupon.startDate)}` : ""}
          {status === "EXPIRADO" ? ` ${formatDate(coupon.endDate)}` : ""}
        </div>
      )}

      {/* Codigo para copiar */}
      <button onClick={copyCode} className="gift-code" style={{
        width: "100%", marginTop: 16, padding: "14px 16px",
        borderRadius: 14, border: `1.5px dashed ${isUsable ? T.roseMid : T.border}`,
        background: isUsable ? T.surface : T.flatTint,
        boxShadow: isUsable ? `3px 3px 0 0 rgba(122,15,48,0.16)` : "none",
        cursor: "pointer", textAlign: "left",
      }}>
        <p style={{ margin: "0 0 4px", fontFamily: "var(--font-poppins)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: isUsable ? T.mutedLight : T.mutedLight }}>
          Tu código
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, letterSpacing: "0.08em", color: isUsable ? T.roseDeep : T.muted }}>
            {coupon.code}
          </span>
          <span style={{
            display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
            width: 34, height: 34, borderRadius: 9, justifyContent: "center",
            background: isUsable ? T.roseDeep : T.flat, color: "#fff",
          }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </span>
        </div>
        {copied && (
          <p style={{ margin: "6px 0 0", fontSize: 11, fontWeight: 600, color: T.roseDeep }}>
            Copiado al portapapeles
          </p>
        )}
      </button>

      {/* Como usarlo — pasos reales del flujo, no decorativos */}
      {isUsable && (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontFamily: "var(--font-poppins)", fontSize: 12.5, fontWeight: 700, color: T.ink }}>
            Cómo usarlo
          </p>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{
                flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
                background: T.roseTint, color: T.roseDeep,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
              }}>
                {i + 1}
              </span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.ink }}>{s.title}</p>
                <p style={{ margin: "1px 0 0", fontSize: 12, color: T.muted }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      {isUsable ? (
        <Link
          href={`/menu?cupon=${encodeURIComponent(coupon.id)}`}
          className="gift-cta"
          style={{
            marginTop: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            width: "100%", height: 50, borderRadius: 14, background: T.roseDeep, color: "#fff",
            fontSize: 14.5, fontWeight: 700, textDecoration: "none", boxSizing: "border-box",
            boxShadow: "5px 5px 0 0 rgba(122,15,48,0.3)",
          }}
        >
          Usar mi regalo ahora <ArrowRight size={16} />
        </Link>
      ) : (
        <Link
          href="/menu"
          style={{
            marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            width: "100%", height: 46, borderRadius: 14, border: `1px solid ${T.border}`,
            background: T.surface, color: T.ink, fontSize: 13.5, fontWeight: 600,
            textDecoration: "none", boxSizing: "border-box",
          }}
        >
          Ver el menú
        </Link>
      )}
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%", background: T.roseTint,
        display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
      }}>
        <Gift size={24} color={T.mutedLight} />
      </div>
      <p className={display.className} style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: T.ink }}>
        No encontramos este regalo
      </p>
      <p style={{ margin: "0 0 18px", fontSize: 13, color: T.muted }}>
        Puede que el enlace esté incompleto o el código ya no exista.
      </p>
      <Link
        href="/menu"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          height: 42, padding: "0 22px", borderRadius: 12, background: T.ink,
          color: "#fff", fontSize: 13.5, fontWeight: 600, textDecoration: "none",
        }}
      >
        Ver el menú
      </Link>
    </div>
  );
}

export default function GiftPage() {
  const { code } = useParams<{ code: string }>();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getCouponById(String(code)).then((c) => {
      if (active) { setCoupon(c); setLoading(false); }
    });
    return () => { active = false; };
  }, [code]);

  return (
    <div style={{
      minHeight: "100vh", fontFamily: "var(--font-poppins)",
      backgroundColor: T.pageBg,
      backgroundImage:
        "radial-gradient(at 15% 0%, rgba(205,87,106,0.14) 0px, transparent 55%), " +
        "radial-gradient(at 100% 10%, rgba(121,135,76,0.10) 0px, transparent 50%)",
    }}>
      <PageHeader />
      <div style={{ padding: "34px 20px 56px", maxWidth: 400, margin: "0 auto" }}>
        {loading ? (
          <div style={{ height: 220, borderRadius: 28, background: T.border, opacity: 0.5 }} />
        ) : coupon ? (
          <GiftCard coupon={coupon} />
        ) : (
          <NotFound />
        )}
      </div>
    </div>
  );
}
