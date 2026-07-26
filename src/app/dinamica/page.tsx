"use client";
import { useEffect, useState } from "react";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import { User, MessageCircle, Info, Play, Loader2, Send, Pencil, ArrowRight, PartyPopper, Trophy, Medal, Star } from "lucide-react";
import logoPink from "@/assets/images/logo-pink.png";
import { normalizePhone } from "@/lib/loyalty";
import {
  ExpressAnswer,
  ExpressDynamic,
  ExpressParticipant,
  getActiveDynamic,
  getDynamic,
  getMostRecentClosed,
  getTopWinners,
  hasParticipated,
  maskParticipantName,
  registerParticipant,
} from "@/lib/express";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
});
const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
});

// Paleta cálida propia de /dinamica (crema + magenta), separada del sistema
// T de rose/olive que usa el resto del sitio — esta pantalla es su propia
// mini-experiencia, ligada a la marca solo por el logo y el vaso ilustrado.
const T = {
  bg: "#FFF9F0",
  white: "#FFFFFF",
  border: "#E3BDC2",
  text: "#1D1B16",
  muted: "#5B3F43",
  mutedLight: "#8F6F73",
  primary: "#AD0044",
  primaryContainer: "#D81159",
  onPrimaryContainer: "#FFEFF0",
  primaryFixed: "#FFD9DE",
  primarySoft: "rgba(173,0,68,0.10)",
  secondary: "#A43C12",
  secondaryContainerSoft: "rgba(254,126,79,0.22)",
  secondaryContainerSolid: "#FE7E4F",
  onSecondaryContainer: "#6B1F00",
  tertiarySoft: "rgba(149,49,90,0.22)",
  tertiarySolid: "#95315A",
  popShadow: "rgba(144,0,55,1)",
  surfaceVariant: "#E7E2D9",
};

const INK = T.text;
const PEARL = "#3D2A20";
const WHATSAPP_GREEN = "#22C55E";
const WHATSAPP_SHADOW = "rgba(21,128,61,1)";
const WHATSAPP_NUMBER = "529969634631";

type Stage = "loading" | "none" | "register" | "questions" | "already" | "closed" | "result";

// ── Vaso ilustrado — el hilo visual de toda la pagina ───────────────────
// Se "llena" con cada pregunta respondida y se sella con listón al ganar:
// una bebida real sirviéndose mientras juegas, en vez de una barra de
// progreso o un icono genérico.

const PEARL_POSITIONS = [
  { dx: -20, dy: -2, r: 7 },
  { dx: -4, dy: 6, r: 8 },
  { dx: 15, dy: -4, r: 6.5 },
  { dx: -29, dy: 14, r: 6 },
  { dx: 5, dy: 18, r: 7.5 },
  { dx: 25, dy: 10, r: 6 },
  { dx: -11, dy: 24, r: 6.5 },
  { dx: 19, dy: 24, r: 6 },
];

const CONFETTI = [
  { x: 22, y: 14, r: 6, color: T.primaryContainer },
  { x: 136, y: 22, r: 5, color: T.secondary },
  { x: 46, y: -4, r: 4.5, color: PEARL },
  { x: 114, y: 0, r: 6, color: T.primary },
  { x: 80, y: -12, r: 5, color: T.secondary },
  { x: 158, y: 40, r: 4, color: PEARL },
];

interface TeaCupProps {
  fillPercent: number;
  pearlCount: number;
  variant: "sealed" | "opened" | "empty";
  muted?: boolean;
  sash?: boolean;
  celebrate?: boolean;
  size?: number;
}

function TeaCup({ fillPercent, pearlCount, variant, muted, sash, celebrate, size = 128 }: TeaCupProps) {
  const cupTop = 50;
  const cupBottom = 178;
  const clamped = Math.max(0, Math.min(1, fillPercent));
  const liquidY = cupBottom - clamped * (cupBottom - cupTop);
  const cupPath = "M30,48 L130,48 L113,174 Q112,180 106,180 L54,180 Q48,180 47,174 Z";
  const pearls = PEARL_POSITIONS.slice(0, Math.min(pearlCount, PEARL_POSITIONS.length));

  return (
    <svg
      width={size}
      height={size * (230 / 200)}
      viewBox="-20 -30 200 230"
      style={{ filter: muted ? "grayscale(0.55) opacity(0.8)" : undefined, display: "block" }}
      role="img"
      aria-label={variant === "empty" ? "Vaso vacío" : variant === "opened" ? "Vaso ya disfrutado" : "Vaso de té sirviéndose"}
    >
      <defs>
        <clipPath id="cupClip"><path d={cupPath} /></clipPath>
        <linearGradient id="liquidGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.primaryFixed} />
          <stop offset="100%" stopColor={T.primaryContainer} />
        </linearGradient>
      </defs>

      {celebrate && CONFETTI.map((c, i) => (
        <circle
          key={i}
          className="cup-confetti"
          cx={c.x} cy={c.y} r={c.r} fill={c.color}
          style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: `${i * 0.06}s` }}
        />
      ))}

      {/* Cuerpo del vaso */}
      <path d={cupPath} fill="#FFFDF7" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />

      {/* Líquido */}
      <rect
        className="cup-liquid"
        x={0} y={liquidY} width={160} height={200 - liquidY}
        fill="url(#liquidGradient)"
        clipPath="url(#cupClip)"
      />
      {clamped > 0.03 && (
        <ellipse
          className="cup-liquid-surface"
          cx={80} cy={liquidY} rx={48} ry={3}
          fill="rgba(255,255,255,0.35)" clipPath="url(#cupClip)"
        />
      )}

      {/* Perlas de tapioca */}
      {pearls.map((p, i) => (
        <g
          key={i}
          className="cup-pearl"
          style={{
            transformBox: "fill-box", transformOrigin: "center",
            animationDelay: `${i * 0.08}s`,
          }}
        >
          <circle cx={80 + p.dx} cy={168 + p.dy} r={p.r} fill={PEARL} />
          <ellipse
            cx={80 + p.dx - p.r * 0.3} cy={168 + p.dy - p.r * 0.35}
            rx={p.r * 0.35} ry={p.r * 0.22} fill="rgba(255,255,255,0.4)"
          />
        </g>
      ))}

      {/* Contorno nítido por encima del líquido */}
      <path d={cupPath} fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse cx={80} cy={48} rx={50} ry={8} fill="none" stroke={INK} strokeWidth={2} />

      {variant === "sealed" && (
        <>
          <path d="M30,48 Q80,30 130,48 L130,52 Q80,36 30,52 Z" fill="#FFFDF7" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          <line x1={100} y1={2} x2={84} y2={62} stroke={T.secondary} strokeWidth={9} strokeLinecap="round" />
        </>
      )}
      {variant === "opened" && (
        <line x1={126} y1={152} x2={150} y2={126} stroke={T.secondary} strokeWidth={9} strokeLinecap="round" opacity={0.85} />
      )}

      {sash && (
        <g transform="rotate(-16 80 112)">
          <rect x={12} y={100} width={136} height={24} rx={5} fill={T.primaryContainer} />
          <text
            x={80} y={116} textAnchor="middle" fontSize={11} fontWeight={700}
            fill={T.onPrimaryContainer} letterSpacing={1.5} style={{ fontFamily: "var(--font-body)" }}
          >
            COMPLETO
          </text>
        </g>
      )}
    </svg>
  );
}

function CupStage({ cup, badges }: { cup: React.ReactNode; badges?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, minHeight: 148 }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        {cup}
        {badges}
      </div>
    </div>
  );
}

function FloatingBadge({
  icon, top, bottom, left, right, rotate, bg, delay = 0,
}: {
  icon: React.ReactNode;
  top?: number; bottom?: number; left?: number; right?: number;
  rotate: number; bg: string; delay?: number;
}) {
  return (
    <div
      aria-hidden
      className="badge-pop"
      style={{
        position: "absolute", top, bottom, left, right,
        width: 38, height: 38, borderRadius: "50%",
        background: bg, color: T.white,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 0 0 rgba(0,0,0,0.15)",
        animationDelay: `${delay}s`,
        "--badge-rotate": `${rotate}deg`,
      } as React.CSSProperties}
    >
      {icon}
    </div>
  );
}

// Ráfaga de confeti de un solo disparo — solo para la pantalla de victoria.
// Posiciones fijas (no Math.random) para que el render del servidor y el del
// cliente coincidan durante la hidratación.
const BURST_PIECES = Array.from({ length: 22 }).map((_, i) => ({
  left: (i * 43) % 100,
  delay: (i % 7) * 0.12,
  duration: 2.3 + (i % 5) * 0.3,
  size: 6 + (i % 4) * 2,
  rotate: 180 + (i % 6) * 90,
  color: [T.primaryContainer, T.secondaryContainerSolid, T.tertiarySolid, PEARL, T.primaryFixed][i % 5],
}));

// Podio público de una dinámica ya concluida. El ranking es simplemente el
// orden en que se ganó (maxWinners ya limita quién puede ganar, así que no
// hace falta un sistema de puntajes aparte). Los nombres se muestran
// enmascarados y el teléfono nunca se expone aquí.
function Podium({ winners }: { winners: ExpressParticipant[] }) {
  const barHeight = [92, 64, 48];
  const barBg = [T.primaryFixed, T.surfaceVariant, T.surfaceVariant];
  const badgeBg = [T.primaryContainer, T.secondaryContainerSolid, T.tertiarySolid];
  const visualOrder = [1, 0, 2].filter((rank) => winners[rank]);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 10 }}>
      {visualOrder.map((rank) => {
        const w = winners[rank];
        return (
          <div key={w.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: 108 }}>
            <div style={{
              width: rank === 0 ? 40 : 32, height: rank === 0 ? 40 : 32, borderRadius: "50%",
              background: badgeBg[rank], color: T.white,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 8, boxShadow: "0 3px 0 0 rgba(0,0,0,0.12)", flexShrink: 0,
            }}>
              {rank === 0 ? <Trophy size={20} /> : <Medal size={16} />}
            </div>
            <div style={{
              width: "100%", height: barHeight[rank], borderRadius: "12px 12px 0 0",
              background: barBg[rank],
              display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 10,
            }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: rank === 0 ? 22 : 17, color: rank === 0 ? T.primary : T.muted }}>
                {rank + 1}
              </span>
            </div>
            <span style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: T.text, whiteSpace: "nowrap" }}>
              {maskParticipantName(w.name)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ConfettiBurst() {
  return (
    <div aria-hidden className="confetti-burst" style={{ position: "fixed", inset: 0, zIndex: 5, overflow: "hidden", pointerEvents: "none" }}>
      {BURST_PIECES.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            position: "absolute", top: -20, left: `${p.left}%`,
            width: p.size, height: p.size * 0.4,
            backgroundColor: p.color, borderRadius: 2,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            "--rotate-end": `${p.rotate}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function LogoHero() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
      <div style={{ position: "relative", width: 108, height: 108 }}>
        <div aria-hidden style={{
          position: "absolute", inset: -14, borderRadius: "50%",
          background: T.primarySoft, filter: "blur(18px)",
        }} />
        <img
          src={logoPink.src}
          alt="Té Sueño"
          style={{
            position: "relative", zIndex: 1, width: "100%", height: "100%",
            objectFit: "contain", filter: "drop-shadow(0 8px 20px rgba(29,27,22,0.15))",
          }}
        />
      </div>
    </div>
  );
}

function TrophyCard() {
  return (
    <div style={{
      width: 200, height: 200, borderRadius: 26,
      background: T.white,
      border: `1px solid ${T.border}`,
      boxShadow: `0 8px 0 0 ${T.popShadow}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 34, boxSizing: "border-box",
    }}>
      <img
        src={logoPink.src}
        alt="Té Sueño"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

function PageHeader() {
  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 10,
      backgroundColor: "rgba(255,249,240,0.75)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1px solid ${T.border}`,
      padding: "0 20px",
      height: 58,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <img src={logoPink.src} alt="Té Sueño" style={{ height: 34, width: "auto" }} />
    </header>
  );
}

const SHARED_STYLE = `
  @keyframes cupFadeIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pearlDrop {
    0%   { transform: translateY(-60px) scale(0.3); opacity: 0; }
    65%  { transform: translateY(3px) scale(1.08); opacity: 1; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }
  @keyframes confettiPop {
    0%   { transform: scale(0); opacity: 0; }
    70%  { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes floatShape {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50%      { transform: translateY(-16px) rotate(4deg); }
  }
  @keyframes dinamicaSpin {
    to { transform: rotate(360deg); }
  }
  @keyframes badgePop {
    0%   { transform: scale(0) rotate(0deg); opacity: 0; }
    70%  { transform: scale(1.15) rotate(var(--badge-rotate, 0deg)); opacity: 1; }
    100% { transform: scale(1) rotate(var(--badge-rotate, 0deg)); opacity: 1; }
  }
  @keyframes confettiFall {
    0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(105vh) rotate(var(--rotate-end)); opacity: 0; }
  }
  .dinamica-stage { animation: cupFadeIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
  .cup-liquid, .cup-liquid-surface { transition: y 0.6s cubic-bezier(0.4,0,0.2,1), height 0.6s cubic-bezier(0.4,0,0.2,1), cy 0.6s cubic-bezier(0.4,0,0.2,1); }
  .cup-pearl { animation: pearlDrop 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
  .cup-confetti { animation: confettiPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
  .float-shape { animation: floatShape 6s ease-in-out infinite; }
  .dinamica-spin { animation: dinamicaSpin 0.8s linear infinite; }
  .badge-pop { animation: badgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
  .confetti-piece { animation-name: confettiFall; animation-timing-function: linear; animation-fill-mode: forwards; }
  .field-input:focus {
    border-color: ${T.primaryContainer} !important;
    box-shadow: 0 0 0 3px rgba(216,17,89,0.15);
    outline: none;
  }
  .pop-btn { transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.2s; }
  .pop-btn:active:not(:disabled) { transform: translate(3px, 3px); box-shadow: none !important; }
  @media (prefers-reduced-motion: reduce) {
    .dinamica-stage, .cup-pearl, .cup-confetti, .float-shape, .dinamica-spin, .badge-pop { animation: none !important; }
    .cup-liquid, .cup-liquid-surface, .pop-btn { transition: none !important; }
    .confetti-burst { display: none !important; }
  }
`;

function Atmosphere() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "60%", height: "40%", background: T.primarySoft, filter: "blur(100px)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: "-5%", right: "-10%", width: "50%", height: "40%", background: T.secondaryContainerSoft, filter: "blur(100px)", borderRadius: "50%" }} />
      <div className="float-shape" style={{ position: "absolute", top: "15%", right: "8%", width: 44, height: 44, border: `4px solid ${T.tertiarySoft}`, borderRadius: 14 }} />
      <div className="float-shape" style={{ position: "absolute", bottom: "18%", left: "6%", width: 60, height: 60, background: "rgba(164,60,18,0.06)", borderRadius: "50%", animationDelay: "2s" }} />
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${body.variable}`} style={{
      minHeight: "100vh",
      backgroundColor: T.bg,
      fontFamily: "var(--font-body)",
      display: "flex",
      flexDirection: "column",
      position: "relative",
    }}>
      <style>{SHARED_STYLE}</style>
      <Atmosphere />
      <div style={{ position: "relative", zIndex: 1 }}><PageHeader /></div>
      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div className="dinamica-stage" style={{ width: "100%", maxWidth: 420 }}>{children}</div>
      </div>
    </div>
  );
}

function Panel({ children, glass = true }: { children: React.ReactNode; glass?: boolean }) {
  return (
    <section style={{
      background: glass ? "rgba(255,249,240,0.72)" : T.white,
      backdropFilter: glass ? "blur(20px)" : undefined,
      WebkitBackdropFilter: glass ? "blur(20px)" : undefined,
      border: `1px solid ${glass ? "rgba(227,189,194,0.6)" : T.border}`,
      borderRadius: 18,
      padding: "26px 22px",
      boxShadow: glass ? "0 20px 60px rgba(29,27,22,0.08)" : "0 1px 3px rgba(29,27,22,0.04)",
    }}>
      {children}
    </section>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      margin: "0 0 16px",
      fontSize: 27,
      fontWeight: 800,
      color: T.primary,
      letterSpacing: "-0.02em",
      lineHeight: 1.2,
      fontFamily: "var(--font-display)",
      textAlign: "center",
    }}>
      {children}
    </h1>
  );
}

const fieldWrapStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const fieldLabelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: T.text, marginLeft: 2 };
const fieldStyle: React.CSSProperties = {
  width: "100%",
  height: 50,
  borderRadius: 13,
  border: `1px solid ${T.border}`,
  backgroundColor: T.white,
  padding: "0 16px 0 42px",
  fontSize: 14.5,
  color: T.text,
  outline: "none",
  fontFamily: "var(--font-body)",
  boxSizing: "border-box",
};
const fieldIconStyle: React.CSSProperties = { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" };

function popButtonStyle(disabled: boolean, bg: string, color: string, shadow: string): React.CSSProperties {
  return {
    width: "100%",
    height: 50,
    borderRadius: 13,
    border: "none",
    backgroundColor: bg,
    color,
    fontSize: 14.5,
    fontWeight: 700,
    fontFamily: "var(--font-body)",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    boxShadow: disabled ? "none" : `4px 4px 0px 0px ${shadow}`,
  };
}

export default function DinamicaPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [dynamic, setDynamic] = useState<ExpressDynamic | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [checking, setChecking] = useState(false);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [participant, setParticipant] = useState<ExpressParticipant | null>(null);
  const [topWinners, setTopWinners] = useState<ExpressParticipant[]>([]);

  useEffect(() => {
    if (stage !== "closed" || !dynamic?.showPodium) return;
    getTopWinners(dynamic.id, 3)
      .then(setTopWinners)
      .catch(() => setTopWinners([]));
  }, [stage, dynamic]);

  useEffect(() => {
    getActiveDynamic()
      .then(async (d) => {
        if (d) { setDynamic(d); setStage("register"); return; }
        const closed = await getMostRecentClosed();
        if (closed) { setDynamic(closed); setStage("closed"); return; }
        setStage("none");
      })
      .catch(() => setStage("none"));
  }, []);

  const canStart = name.trim().length > 0 && normalizePhone(phone).length >= 10;

  async function handleStart() {
    if (!dynamic || !canStart || checking) return;
    setChecking(true);
    const [already, fresh] = await Promise.all([
      hasParticipated(dynamic.id, phone),
      getDynamic(dynamic.id),
    ]);
    setChecking(false);
    if (already) { setStage("already"); return; }
    if (fresh) setDynamic(fresh);
    if (!fresh || !fresh.active) { setStage("closed"); return; }
    setCurrentIndex(0);
    setStage("questions");
  }

  const answeredCount = dynamic
    ? dynamic.questions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length
    : 0;
  const allAnswered = !!dynamic && answeredCount === dynamic.questions.length;

  async function handleSubmit() {
    if (!dynamic || !allAnswered || submitting) return;
    setSubmitting(true);
    const payload: ExpressAnswer[] = dynamic.questions.map((q) => ({
      questionId: q.id,
      value: answers[q.id] ?? "",
    }));
    const { participant: result, duplicate, closed } = await registerParticipant({
      dynamicId: dynamic.id,
      name,
      phone,
      answers: payload,
    });
    setSubmitting(false);
    if (duplicate) { setStage("already"); return; }
    if (closed || !result) { setStage("closed"); return; }
    setParticipant(result);
    setStage("result");
  }

  function handleNext() {
    if (!dynamic) return;
    const current = dynamic.questions[currentIndex];
    const answered = (answers[current.id] ?? "").trim().length > 0;
    if (!answered) return;
    if (currentIndex === dynamic.questions.length - 1) {
      handleSubmit();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  const whatsappHref = dynamic
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `¡Hola! Gané la dinámica "${dynamic.title}" 🎉 Mi nombre es ${name.trim()} y mi número es ${normalizePhone(phone)}. ¡Quiero reclamar mi premio!`
      )}`
    : "#";

  if (stage === "loading") {
    return (
      <Shell>
        <CupStage cup={<TeaCup variant="empty" fillPercent={0} pearlCount={0} muted />} />
        <p style={{ margin: 0, fontSize: 13, color: T.mutedLight, textAlign: "center" }}>
          Preparando tu ronda…
        </p>
      </Shell>
    );
  }

  if (stage === "none") {
    return (
      <Shell>
        <CupStage cup={<TeaCup variant="empty" fillPercent={0} pearlCount={0} muted />} />
        <Panel>
          <Headline>Aún no hay una ronda abierta</Headline>
          <p style={{ margin: 0, fontSize: 13.5, color: T.muted, textAlign: "center", lineHeight: 1.6 }}>
            Vuelve pronto — en cualquier momento abrimos una nueva ronda de preguntas.
          </p>
        </Panel>
      </Shell>
    );
  }

  if (!dynamic) return null;

  if (stage === "already") {
    return (
      <Shell>
        <CupStage cup={<TeaCup variant="opened" fillPercent={0.08} pearlCount={0} muted />} />
        <Panel>
          <Headline>Ya jugaste esta ronda</Headline>
          <p style={{ margin: 0, fontSize: 13.5, color: T.muted, textAlign: "center", lineHeight: 1.6 }}>
            Solo se permite un registro por número de teléfono. Gracias por participar.
          </p>
        </Panel>
      </Shell>
    );
  }

  if (stage === "closed") {
    return (
      <Shell>
        <CupStage cup={<TeaCup variant="empty" fillPercent={0} pearlCount={0} muted sash />} />
        <Panel>
          <Headline>&quot;{dynamic.title}&quot; ya llegó a su fin</Headline>
          <p style={{ margin: dynamic.showPodium && topWinners.length > 0 ? "0 0 22px" : 0, fontSize: 13.5, color: T.muted, textAlign: "center", lineHeight: 1.6 }}>
            {dynamic.concludedAt
              ? "Gracias a quienes participaron — ya se alcanzó el cupo de ganadores y se entregaron los premios de esta ronda."
              : dynamic.showPodium
              ? "Gracias a quienes participaron en esta ronda — aquí están los ganadores."
              : "No está disponible en este momento. Síguenos para la próxima ronda."}
          </p>
          {dynamic.showPodium && topWinners.length > 0 && <Podium winners={topWinners} />}
        </Panel>
      </Shell>
    );
  }

  if (stage === "result" && participant) {
    if (participant.won) {
      return (
        <Shell>
          <ConfettiBurst />
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <span className="badge-pop" style={{
              fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
              color: T.onPrimaryContainer, background: T.primaryContainer,
              padding: "5px 16px", borderRadius: 999,
            }}>
              Ronda ganada
            </span>
          </div>
          <Headline>¡Felicidades, ganaste!</Headline>
          <CupStage
            cup={<TrophyCard />}
            badges={
              <>
                <FloatingBadge icon={<Star size={19} fill="currentColor" />} top={2} right={2} rotate={14} bg={T.secondaryContainerSolid} delay={0.15} />
                <FloatingBadge icon={<PartyPopper size={17} />} bottom={6} left={2} rotate={-14} bg={T.tertiarySolid} delay={0.3} />
              </>
            }
          />
          <Panel>
            {dynamic.showClaimButton ? (
              <>
                <p style={{ margin: "0 0 20px", fontSize: 13.5, color: T.muted, textAlign: "center", lineHeight: 1.6 }}>
                  Acertaste todo. Escríbenos por WhatsApp para reclamar tu premio.
                </p>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pop-btn"
                  style={{ ...popButtonStyle(false, WHATSAPP_GREEN, T.white, WHATSAPP_SHADOW), textDecoration: "none" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Reclamar premio en WhatsApp
                </a>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 13.5, color: T.muted, textAlign: "center", lineHeight: 1.6 }}>
                Acertaste todo. Nos pondremos en contacto contigo pronto para entregarte tu premio.
              </p>
            )}
          </Panel>
        </Shell>
      );
    }

    return (
      <Shell>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <span style={{
            fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
            color: T.secondary, background: T.secondaryContainerSoft,
            padding: "5px 16px", borderRadius: 999,
          }}>
            Ronda completada
          </span>
        </div>
        <Headline>Gracias por jugar</Headline>
        <CupStage cup={<TrophyCard />} />
        <Panel>
          {participant.totalGraded > 0 ? (
            <p style={{ margin: "0 0 20px", fontSize: 13.5, color: T.muted, textAlign: "center", lineHeight: 1.6 }}>
              Acertaste {participant.correctCount} de {participant.totalGraded}. Esta ronda no traía premio para ti, pero síguenos para la próxima.
            </p>
          ) : (
            <p style={{ margin: "0 0 20px", fontSize: 13.5, color: T.muted, textAlign: "center", lineHeight: 1.6 }}>
              Tu respuesta ya quedó registrada. Síguenos para la próxima ronda.
            </p>
          )}
          <a
            href="/menu"
            className="pop-btn"
            style={{ ...popButtonStyle(false, T.primaryContainer, T.onPrimaryContainer, T.popShadow), textDecoration: "none" }}
          >
            Ver el menú
            <ArrowRight size={16} />
          </a>
        </Panel>
      </Shell>
    );
  }

  if (stage === "questions") {
    const total = dynamic.questions.length;
    const current = dynamic.questions[currentIndex];
    const currentAnswered = (answers[current.id] ?? "").trim().length > 0;
    const isLast = currentIndex === total - 1;
    const progressPct = ((currentIndex + 1) / total) * 100;

    return (
      <Shell>
        <section style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span style={{
              fontSize: 12.5, fontWeight: 700, color: T.primary,
              background: T.primaryFixed, padding: "5px 16px", borderRadius: 999,
            }}>
              Pregunta {currentIndex + 1} de {total}
            </span>
          </div>
          <div style={{ width: "100%", height: 10, background: T.surfaceVariant, borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progressPct}%`,
              background: T.primaryContainer, borderRadius: 999,
              transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
        </section>

        <div style={{ position: "relative", marginBottom: 18 }}>
          <div aria-hidden style={{
            position: "absolute", top: -22, right: -10, width: 64, height: 64, borderRadius: "50%",
            background: T.secondaryContainerSoft, filter: "blur(20px)",
          }} />
          <Panel>
            <h2 style={{
              margin: "0 0 18px", fontSize: 19, fontWeight: 700, color: T.text, lineHeight: 1.35,
              fontFamily: "var(--font-display)", position: "relative",
            }}>
              {current.text}
            </h2>

            {current.imageUrl && (
              <div style={{
                width: "100%", height: 160, borderRadius: 14, overflow: "hidden",
                marginBottom: 18, border: `1px solid ${T.border}`, position: "relative",
              }}>
                <img
                  src={current.imageUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            )}

            {current.type === "multiple" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
                {(current.options ?? []).map((opt, optIdx) => {
                  const selected = answers[current.id] === String(optIdx);
                  return (
                    <button
                      key={optIdx}
                      onClick={() => setAnswers((a) => ({ ...a, [current.id]: String(optIdx) }))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        textAlign: "left",
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: `1px solid ${selected ? T.primaryContainer : T.border}`,
                        background: selected ? T.primarySoft : T.white,
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      <span style={{
                        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${selected ? T.primaryContainer : T.border}`,
                        background: selected ? T.primaryContainer : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.15s, border-color 0.15s",
                      }}>
                        {selected && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.white }} />}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: selected ? 700 : 500, color: selected ? T.primary : T.muted }}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
                <label style={fieldLabelStyle}>Escribe tu respuesta aquí:</label>
                <div style={{ position: "relative" }}>
                  <input
                    autoComplete="off"
                    type="text"
                    placeholder="Escribe tu respuesta"
                    value={answers[current.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [current.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && currentAnswered && handleNext()}
                    className="field-input"
                    style={{ ...fieldStyle, height: 52, padding: "0 44px 0 16px" }}
                  />
                  <Pencil size={17} color={T.mutedLight} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>
            )}
          </Panel>
        </div>

        <button
          onClick={handleNext}
          disabled={!currentAnswered || submitting}
          className="pop-btn"
          style={popButtonStyle(!currentAnswered || submitting, T.primaryContainer, T.onPrimaryContainer, T.popShadow)}
        >
          {submitting ? (
            <>
              <Loader2 size={17} className="dinamica-spin" />
              Enviando…
            </>
          ) : isLast ? (
            <>
              Enviar respuestas
              <Send size={16} />
            </>
          ) : (
            <>
              Siguiente pregunta
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </Shell>
    );
  }

  // stage === "register"
  return (
    <Shell>
      <LogoHero />
      <Panel>
        <div style={{ textAlign: "center" }}>
          <Headline>{dynamic.title}</Headline>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: T.muted, lineHeight: 1.55 }}>
            {dynamic.description || "Responde y participa por tu premio."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={fieldWrapStyle}>
            <label style={fieldLabelStyle}>Tu nombre</label>
            <div style={{ position: "relative" }}>
              <User size={18} color={T.mutedLight} style={fieldIconStyle} />
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field-input"
                style={fieldStyle}
              />
            </div>
          </div>

          <div style={fieldWrapStyle}>
            <label style={fieldLabelStyle}>Tu número de WhatsApp</label>
            <div style={{ position: "relative" }}>
              <MessageCircle size={18} color={T.mutedLight} style={fieldIconStyle} />
              <input
                type="tel"
                placeholder="+52 000 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                className="field-input"
                style={fieldStyle}
              />
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!canStart || checking}
            className="pop-btn"
            style={{ ...popButtonStyle(!canStart || checking, T.primaryContainer, T.onPrimaryContainer, T.popShadow), marginTop: 6 }}
          >
            {checking ? (
              <>
                <Loader2 size={17} className="dinamica-spin" />
                Verificando…
              </>
            ) : (
              <>
                Empezar a jugar
                <Play size={16} fill="currentColor" />
              </>
            )}
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Info size={14} color={T.secondary} />
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: T.secondary }}>
              Solo se permite un registro por número de teléfono
            </p>
          </div>
        </div>
      </Panel>
    </Shell>
  );
}
