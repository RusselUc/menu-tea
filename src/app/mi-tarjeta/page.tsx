"use client";
import { useEffect, useState } from "react";
import flowerSrc from "@/assets/f-2.png";
import logoPink from "@/assets/images/logo-pink.png";
import {
  getCard,
  LoyaltyCard,
  normalizePhone,
  STAMPS_FOR_FREE,
} from "@/lib/loyalty";

// Dashboard design tokens
const T = {
  bg:          "#F8FAFC",
  white:       "#FFFFFF",
  border:      "#E2E8F0",
  text:        "#0F172A",
  secondary:   "#334155",
  muted:       "#64748B",
  mutedLight:  "#94A3B8",
  slate:       "#F1F5F9",
  // Brand accent
  rose:        "#CD576A",
  roseBg:      "#FFF1F2",
  roseBorder:  "#FECDD3",
  roseDeep:    "#B8465A",
  // Green for WhatsApp / free drinks
  green:       "#059669",
  greenBg:     "#ECFDF5",
  greenBorder: "#A7F3D0",
};

const FLOWER_POSITIONS = [
  { cx: 32,  cy: 58  },
  { cx: 65,  cy: 30  },
  { cx: 100, cy: 20  },
  { cx: 135, cy: 30  },
  { cx: 168, cy: 58  },
  { cx: 50,  cy: 97  },
  { cx: 100, cy: 88  },
  { cx: 150, cy: 97  },
  { cx: 42,  cy: 130 },
  { cx: 158, cy: 130 },
];

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

function PageHeader() {
  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 10,
      backgroundColor: T.white,
      borderBottom: `1px solid ${T.border}`,
      padding: "0 20px",
      height: 58,
      display: "flex",
      alignItems: "center",
    }}>
      <img
        src={logoPink.src}
        alt="Té Sueño"
        style={{ height: 36, width: "auto" }}
      />
    </header>
  );
}

function FlowerBud() {
  return (
    <g opacity={0.3}>
      <path d="M -1.5 -2 C -3 -5 -3 -8 0 -10" stroke="#79874C" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M  1.5 -2 C  3 -5  3 -8 0 -10" stroke="#79874C" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M 0 -2 C -4.5 -3 -5.5 -9 0 -14 C 5.5 -9 4.5 -3 0 -2 Z" fill="#CD576A" />
    </g>
  );
}

// Half the image size in SVG units — adjust to scale flowers in the bouquet
const FLOWER_HALF = 14;

function SingleFlower({ bloomed, delay }: { bloomed: boolean; delay: number }) {
  return (
    <g>
      {/* Bud visible when not yet bloomed */}
      <g style={{ opacity: bloomed ? 0 : 1, transition: `opacity 0.25s ease ${delay}s` }}>
        <FlowerBud />
      </g>

      {/* Full flower using the brand asset PNG */}
      <g style={{
        transformBox: "fill-box",
        transformOrigin: "center",
        transform: bloomed ? "scale(1)" : "scale(0.05)",
        opacity: bloomed ? 1 : 0,
        transition: `transform 0.55s cubic-bezier(0.34,1.56,0.64,1) ${delay}s, opacity 0.35s ease ${delay}s`,
      }}>
        {/* mix-blend-mode multiply makes the white background of the PNG invisible
            against the white card, leaving only the flower shape */}
        <image
          href={flowerSrc.src}
          x={-FLOWER_HALF} y={-FLOWER_HALF}
          width={FLOWER_HALF * 2} height={FLOWER_HALF * 2}
          style={{ mixBlendMode: "multiply" }}
        />
      </g>
    </g>
  );
}

function FlowerBouquet({ stamps }: { stamps: number }) {
  const [show, setShow] = useState(false);
  const isComplete = stamps >= STAMPS_FOR_FREE;

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {isComplete && (
        <style>{`
          @keyframes sparkle {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50%       { opacity: 1;  transform: scale(1.6); }
          }
        `}</style>
      )}
      <svg viewBox="0 0 200 252" style={{ width: "100%", maxWidth: 200, overflow: "visible" }}>

        {/* ── Paper wrap ─────────────────────────── */}
        <path d="M 56 182 L 144 182 L 132 244 L 68 244 Z" fill="#79874C" opacity={0.88} />
        {/* Top fold highlight */}
        <path d="M 56 182 L 144 182 L 141 191 L 59 191 Z" fill="#93a85e" opacity={0.55} />
        {/* Texture lines */}
        <line x1="72"  y1="191" x2="79"  y2="244" stroke="rgba(255,255,255,0.13)" strokeWidth="1.2" />
        <line x1="89"  y1="191" x2="91"  y2="244" stroke="rgba(255,255,255,0.13)" strokeWidth="1.2" />
        <line x1="106" y1="191" x2="104" y2="244" stroke="rgba(255,255,255,0.13)" strokeWidth="1.2" />
        <line x1="123" y1="191" x2="117" y2="244" stroke="rgba(255,255,255,0.13)" strokeWidth="1.2" />

        {/* ── Ribbon bow ────────────────────────── */}
        {/* Left loop */}
        <path d="M 100 182 C 90 174 75 174 79 180 C 83 186 95 183 100 182 Z" fill="#4d6028" />
        {/* Right loop */}
        <path d="M 100 182 C 110 174 125 174 121 180 C 117 186 105 183 100 182 Z" fill="#4d6028" />
        {/* Ribbon tails */}
        <path d="M 96 184 Q 89 193 85 200" stroke="#4d6028" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <path d="M 104 184 Q 111 193 115 200" stroke="#4d6028" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        {/* Knot */}
        <ellipse cx={100} cy={181.5} rx={7.5} ry={5.5} fill="#3d4e20" />
        <ellipse cx={100} cy={181}   rx={4.5} ry={3.2} fill="#5c7232" />

        {/* ── Stems ─────────────────────────────── */}
        {STEM_PATHS.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#79874C" strokeWidth={1.8} strokeLinecap="round" />
        ))}

        {/* ── Leaves ────────────────────────────── */}
        <ellipse cx={52}  cy={132} rx={7}   ry={3}   transform="rotate(-42,52,132)"   fill="#79874C" opacity={0.7} />
        <ellipse cx={148} cy={132} rx={7}   ry={3}   transform="rotate(42,148,132)"   fill="#79874C" opacity={0.7} />
        <ellipse cx={77}  cy={106} rx={6}   ry={2.5} transform="rotate(-28,77,106)"   fill="#79874C" opacity={0.6} />
        <ellipse cx={123} cy={106} rx={6}   ry={2.5} transform="rotate(28,123,106)"   fill="#79874C" opacity={0.6} />
        <ellipse cx={60}  cy={157} rx={5.5} ry={2.3} transform="rotate(-52,60,157)"   fill="#79874C" opacity={0.5} />
        <ellipse cx={140} cy={157} rx={5.5} ry={2.3} transform="rotate(52,140,157)"   fill="#79874C" opacity={0.5} />
        <ellipse cx={86}  cy={142} rx={5}   ry={2.2} transform="rotate(-18,86,142)"   fill="#79874C" opacity={0.5} />
        <ellipse cx={114} cy={142} rx={5}   ry={2.2} transform="rotate(18,114,142)"   fill="#79874C" opacity={0.5} />
        {FLOWER_POSITIONS.map((pos, i) => (
          <g key={i} transform={`translate(${pos.cx},${pos.cy})`}>
            <SingleFlower bloomed={show && i < stamps} delay={i * 0.07} />
          </g>
        ))}
        {isComplete && show && [
          { cx: 18,  cy: 38, r: 3.5, d: "0s"    },
          { cx: 182, cy: 38, r: 3.5, d: "0.25s"  },
          { cx: 8,   cy: 90, r: 2.5, d: "0.5s"   },
          { cx: 192, cy: 90, r: 2.5, d: "0.75s"  },
          { cx: 30,  cy: 14, r: 2,   d: "0.12s"  },
          { cx: 170, cy: 14, r: 2,   d: "0.37s"  },
        ].map((s, i) => (
          <circle
            key={i}
            cx={s.cx} cy={s.cy} r={s.r}
            fill={i % 2 === 0 ? "#F298AA" : "#CD576A"}
            style={{ animation: `sparkle 1.8s ease-in-out ${s.d} infinite` }}
          />
        ))}
      </svg>
    </>
  );
}

function CardView({ card, phone }: { card: LoyaltyCard; phone: string }) {
  const [copied, setCopied] = useState(false);
  const stampsLeft = STAMPS_FOR_FREE - card.stamps;
  const isComplete = card.stamps >= STAMPS_FOR_FREE;

  const copyLink = () => {
    const url = `${window.location.origin}/mi-tarjeta?tel=${normalizePhone(phone)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: T.bg, fontFamily: "var(--font-poppins)" }}>
      <style>{`
        .copy-btn:hover { background: ${T.slate} !important; }
        .wa-btn:hover   { opacity: 0.88; }
        .wa-btn         { transition: opacity 0.15s; }
      `}</style>

      <PageHeader />

      <div style={{ padding: "20px 20px 40px", maxWidth: 480, margin: "0 auto" }}>

        {/* Bouquet card */}
        <div style={{
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 10,
        }}>
          {/* Card header */}
          <div style={{
            padding: "14px 20px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>
              Progreso del ramo
            </p>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 100,
              background: isComplete ? T.greenBg : T.roseBg,
              color: isComplete ? T.green : T.rose,
              border: `1px solid ${isComplete ? T.greenBorder : T.roseBorder}`,
            }}>
              {card.stamps} / {STAMPS_FOR_FREE}
            </span>
          </div>

          {/* Bouquet */}
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 20px 6px" }}>
            <FlowerBouquet stamps={card.stamps} />
          </div>

          {/* Status message */}
          <div style={{ padding: "0 20px 20px" }}>
            {card.freedrinks > 0 ? (
              <div style={{
                background: T.greenBg,
                border: `1px solid ${T.greenBorder}`,
                borderRadius: 10,
                padding: "14px 16px",
                textAlign: "center",
              }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.green }}>
                  Tienes {card.freedrinks} bebida{card.freedrinks !== 1 ? "s" : ""} gratis
                </p>
                <a
                  href={`https://wa.me/529969634631?text=${encodeURIComponent(
                    `¡Hola! Quiero canjear mi bebida gratis 🌸 Mi tarjeta está a nombre del número ${normalizePhone(phone)}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wa-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    marginTop: 10,
                    padding: "9px 18px",
                    backgroundColor: "#22C55E",
                    color: T.white,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Canjear por WhatsApp
                </a>
              </div>
            ) : (
              <div style={{
                background: T.slate,
                borderRadius: 10,
                padding: "12px 16px",
                textAlign: "center",
              }}>
                <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
                  {isComplete
                    ? "¡Ramo completo! Muéstrale esta pantalla al vendedor."
                    : <>Te {stampsLeft === 1 ? "falta" : "faltan"} <strong style={{ color: T.text }}>{stampsLeft} flor{stampsLeft !== 1 ? "es" : ""}</strong> para tu bebida gratis</>
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Terms */}
        <p style={{ margin: "0 0 10px", fontSize: 11, color: T.mutedLight, textAlign: "center", lineHeight: 1.6 }}>
          Aplica en vasos mediano y grande. Vasos Pandi y bebidas especiales no entran en la promoción.
        </p>

        {/* Copy link */}
        <button
          className="copy-btn"
          onClick={copyLink}
          style={{
            width: "100%",
            height: 40,
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.white,
            color: T.muted,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "var(--font-poppins)",
            transition: "background 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
          }}
        >
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Link copiado
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copiar mi link de tarjeta
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function MiTarjetaPage() {
  const [phone, setPhone] = useState("");
  const [card, setCard]   = useState<LoyaltyCard | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading]   = useState(false);

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
    <div style={{
      minHeight: "100vh",
      backgroundColor: T.bg,
      fontFamily: "var(--font-poppins)",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        .tel-input:focus {
          border-color: ${T.rose} !important;
          box-shadow: 0 0 0 3px rgba(205,87,106,0.1) !important;
          outline: none;
        }
        .search-btn:not(:disabled):hover { background: ${T.roseDeep} !important; }
        .search-btn { transition: background 0.15s, opacity 0.2s, box-shadow 0.2s; }
      `}</style>

      <PageHeader />

      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
      }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Search intro */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
            Mi Tarjeta
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
            Por cada pedido, una flor —{" "}
            <strong style={{ color: T.text, fontWeight: 600 }}>
              {STAMPS_FOR_FREE} flores = bebida gratis
            </strong>
          </p>
        </div>

        {/* Search card */}
        <div style={{
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: "24px 20px",
        }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: T.text }}>
            Consultar tarjeta
          </p>

          <input
            type="tel"
            placeholder="Tu número de teléfono"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setNotFound(false); }}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="tel-input"
            style={{
              width: "100%",
              height: 40,
              borderRadius: 8,
              border: `1px solid ${notFound ? T.rose : T.border}`,
              backgroundColor: T.bg,
              padding: "0 12px",
              fontSize: 14,
              color: T.text,
              outline: "none",
              fontFamily: "var(--font-poppins)",
              boxSizing: "border-box",
              transition: "border-color 0.2s, box-shadow 0.2s",
              marginBottom: notFound ? 8 : 12,
            }}
          />

          {notFound && (
            <div style={{
              marginBottom: 12,
              padding: "9px 12px",
              background: T.roseBg,
              borderRadius: 8,
              border: `1px solid ${T.roseBorder}`,
            }}>
              <p style={{ margin: 0, fontSize: 12, color: T.rose }}>
                No encontramos tu tarjeta.{" "}
                <strong>Haz tu primer pedido</strong> para empezar a acumular.
              </p>
            </div>
          )}

          <button
            onClick={() => search()}
            disabled={loading || normalizePhone(phone).length < 10}
            className="search-btn"
            style={{
              width: "100%",
              height: 40,
              borderRadius: 8,
              border: "none",
              backgroundColor: T.rose,
              color: T.white,
              fontSize: 13,
              fontWeight: 600,
              cursor: normalizePhone(phone).length < 10 ? "not-allowed" : "pointer",
              fontFamily: "var(--font-poppins)",
              opacity: normalizePhone(phone).length < 10 ? 0.45 : 1,
              boxShadow: normalizePhone(phone).length >= 10 ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {loading ? "Buscando..." : "Ver mi tarjeta"}
          </button>
        </div>

        <p style={{ marginTop: 14, fontSize: 11, color: T.mutedLight, textAlign: "center", lineHeight: 1.6 }}>
          Aplica en vasos mediano y grande. Vasos Pandi y bebidas especiales no incluidos.
        </p>
      </div>
      </div>
    </div>
  );
}
