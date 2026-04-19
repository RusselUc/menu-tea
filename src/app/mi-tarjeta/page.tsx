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

// 8 flower tip positions in the SVG (viewBox 0 0 200 252)
const FLOWER_POSITIONS = [
  { cx: 32,  cy: 58  }, // far left
  { cx: 65,  cy: 30  }, // left
  { cx: 100, cy: 20  }, // center top (tallest)
  { cx: 135, cy: 30  }, // right
  { cx: 168, cy: 58  }, // far right
  { cx: 50,  cy: 97  }, // left mid
  { cx: 100, cy: 88  }, // center mid
  { cx: 150, cy: 97  }, // right mid
  { cx: 42,  cy: 130 }, // lower left
  { cx: 158, cy: 130 }, // lower right
];

// Bezier stem paths from wrap (~y=178) to each flower tip
const STEM_PATHS = [
  "M 95 178 C 68 155 45 112 32 58",
  "M 96 177 C 82 138 74 88 65 30",
  "M 99 176 C 99 138 100 78 100 20",
  "M 103 176 C 118 138 128 88 135 30",
  "M 105 178 C 132 155 155 112 168 58",
  "M 93 178 C 77 158 62 133 50 97",
  "M 100 176 C 100 148 100 120 100 88",
  "M 107 178 C 123 158 138 133 150 97",
  "M 91 178 C 74 168 58 155 42 130",
  "M 109 178 C 126 168 142 155 158 130",
];

function SingleFlower({ bloomed, delay }: { bloomed: boolean; delay: number }) {
  const numPetals = 5;
  const pDist = 6.5;  // distance from center to petal center
  const pRx = 3.2;    // petal half-width
  const pRy = 5.8;    // petal half-height

  return (
    <g
      style={{
        // transformBox keeps scale origin at the flower center
        transformBox: "fill-box",
        transformOrigin: "center",
        transform: bloomed ? "scale(1)" : "scale(0.08)",
        opacity: bloomed ? 1 : 0,
        transition: `transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${delay}s, opacity 0.35s ease ${delay}s`,
      }}
    >
      {Array.from({ length: numPetals }).map((_, i) => {
        // θ starts at top (-90°) and goes clockwise
        const theta = -90 + i * (360 / numPetals);
        const thetaRad = theta * (Math.PI / 180);
        const pcx = pDist * Math.cos(thetaRad);
        const pcy = pDist * Math.sin(thetaRad);
        // rotate so the ellipse long axis points radially outward
        const rotation = theta - 90;
        return (
          <ellipse
            key={i}
            cx={pcx}
            cy={pcy}
            rx={pRx}
            ry={pRy}
            transform={`rotate(${rotation}, ${pcx}, ${pcy})`}
            fill="#CD576A"
          />
        );
      })}
      {/* flower center */}
      <circle cx={0} cy={0} r={4.2} fill="#F8F5F1" />
      <circle cx={0} cy={0} r={2.8} fill="#F298AA" />
    </g>
  );
}

function FlowerBouquet({ stamps }: { stamps: number }) {
  const [show, setShow] = useState(false);
  const isComplete = stamps >= STAMPS_FOR_FREE;

  // slight delay so the transition plays on first render
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "12px 0 16px",
      }}
    >
      {isComplete && (
        <style>{`
          @keyframes sparkle {
            0%, 100% { opacity: 0.45; transform: scale(1); }
            50%       { opacity: 1;    transform: scale(1.55); }
          }
        `}</style>
      )}

      <svg
        viewBox="0 0 200 252"
        style={{ width: "100%", maxWidth: 210, overflow: "visible" }}
      >
        {/* ── Paper wrap ─────────────────────────────── */}
        <path
          d="M 56 182 L 144 182 L 132 244 L 68 244 Z"
          fill="#79874C"
          opacity="0.82"
        />
        {/* Wrap texture lines (convergent to match taper) */}
        <line x1="69"  y1="182" x2="78"  y2="244" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        <line x1="87"  y1="182" x2="90"  y2="244" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        <line x1="104" y1="182" x2="103" y2="244" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        <line x1="122" y1="182" x2="116" y2="244" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />

        {/* Ribbon knot */}
        <ellipse cx={100} cy={183} rx={15} ry={5.5}  fill="#5a6e35" />
        <ellipse cx={88}  cy={181} rx={7}  ry={4.5}  fill="#5a6e35" />
        <ellipse cx={112} cy={181} rx={7}  ry={4.5}  fill="#5a6e35" />

        {/* ── Stems ──────────────────────────────────── */}
        {STEM_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#79874C"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        ))}

        {/* ── Leaves ─────────────────────────────────── */}
        <ellipse cx={52}  cy={132} rx={6} ry={2.8} transform="rotate(-42,52,132)"  fill="#79874C" opacity={0.65} />
        <ellipse cx={148} cy={132} rx={6} ry={2.8} transform="rotate(42,148,132)"  fill="#79874C" opacity={0.65} />
        <ellipse cx={77}  cy={106} rx={5} ry={2.5} transform="rotate(-28,77,106)"  fill="#79874C" opacity={0.65} />
        <ellipse cx={123} cy={106} rx={5} ry={2.5} transform="rotate(28,123,106)"  fill="#79874C" opacity={0.65} />

        {/* ── Flowers ────────────────────────────────── */}
        {FLOWER_POSITIONS.map((pos, i) => (
          <g key={i} transform={`translate(${pos.cx},${pos.cy})`}>
            <SingleFlower bloomed={show && i < stamps} delay={i * 0.07} />
          </g>
        ))}

        {/* ── Celebration sparkles (all 8 earned) ────── */}
        {isComplete && show &&
          [
            { cx: 18,  cy: 38, r: 3.5, d: "0s"    },
            { cx: 182, cy: 38, r: 3.5, d: "0.25s"  },
            { cx: 8,   cy: 90, r: 2.5, d: "0.5s"   },
            { cx: 192, cy: 90, r: 2.5, d: "0.75s"  },
            { cx: 30,  cy: 14, r: 2,   d: "0.12s"  },
            { cx: 170, cy: 14, r: 2,   d: "0.37s"  },
          ].map((s, i) => (
            <circle
              key={i}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill={i % 2 === 0 ? C.pink : C.rose}
              style={{ animation: `sparkle 1.8s ease-in-out ${s.d} infinite` }}
            />
          ))}
      </svg>

      <p
        style={{
          margin: "4px 0 0",
          fontSize: 12,
          color: C.muted,
          fontWeight: 600,
          letterSpacing: "0.06em",
        }}
      >
        {stamps} de {STAMPS_FOR_FREE} flores
      </p>
    </div>
  );
}

function CardView({ card, phone }: { card: LoyaltyCard; phone: string }) {
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
          boxShadow:
            "0 8px 32px rgba(205,87,106,0.1), 0 2px 8px rgba(0,0,0,0.06)",
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
            {card.stamps} de {STAMPS_FOR_FREE} flores
          </p>
        </div>

        <FlowerBouquet stamps={card.stamps} />

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
              <a
                href={`https://wa.me/529969634631?text=${encodeURIComponent(`¡Hola! Quiero canjear mi bebida gratis 🌸 Mi tarjeta está a nombre del número ${normalizePhone(phone)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 12,
                  padding: "10px 20px",
                  backgroundColor: "#25D366",
                  color: C.white,
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                Canjear por WhatsApp
              </a>
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
                {stampsLeft} flor{stampsLeft !== 1 ? "es" : ""}
              </strong>{" "}
              para tu bebida gratis
            </p>
          )}
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
        <div style={{ fontSize: 52, marginBottom: 14 }}>🌸</div>
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
          Por cada pedido, una flor —{" "}
          <strong style={{ color: C.dark }}>8 flores = bebida gratis</strong>
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
