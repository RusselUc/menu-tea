"use client";

import { useState, useRef, useEffect } from "react";
import { Trophy, Star, ArrowRight, RefreshCcw } from "lucide-react";

// ── Wheel config ──────────────────────────────────────────
const WHEEL_SIZE = 308;

const SEGMENTS = [
  { label: ["Bebida",  "Gratis"],   isPrize: true,  bg: "#CD576A", fg: "#FFF8F4" },
  { label: ["Mejor",   "suerte"],   isPrize: false, bg: "#F5EBE6", fg: "#7A3A2E" },
  { label: ["Casi",    "casi"],     isPrize: false, bg: "#79874C", fg: "#F4F7EC" },
  { label: ["La",      "proxima"],  isPrize: false, bg: "#EEF0E6", fg: "#4A5530" },
  { label: ["Bebida",  "Gratis"],   isPrize: true,  bg: "#CD576A", fg: "#FFF8F4" },
  { label: ["Sigue",   "adelante"], isPrize: false, bg: "#F5EBE6", fg: "#7A3A2E" },
  { label: ["Uy,",     "casi"],     isPrize: false, bg: "#79874C", fg: "#F4F7EC" },
  { label: ["Animo",   "campeon"],  isPrize: false, bg: "#EEF0E6", fg: "#4A5530" },
];

const N           = SEGMENTS.length;
const MAX_PRIZES  = 2;
const SPIN_MS     = 5000;
const EXTRA_SPINS = 7;

// ── Persistence ───────────────────────────────────────────
function todayKey() { return "ruleta_" + new Date().toISOString().slice(0, 10); }
function readCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(todayKey()) ?? "0", 10);
}
function saveCount(n: number) { localStorage.setItem(todayKey(), String(n)); }

// ── Canvas draw ───────────────────────────────────────────
function drawWheel(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2, cy = size / 2, r = cx - 2;
  const arc = (2 * Math.PI) / N;
  ctx.clearRect(0, 0, size, size);

  for (let i = 0; i < N; i++) {
    const a0 = i * arc - Math.PI / 2, a1 = a0 + arc;
    const { bg, fg, label } = SEGMENTS[i];

    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath();
    ctx.fillStyle = bg; ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,0.50)"; ctx.lineWidth = 2.5; ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(a0 + arc / 2);
    ctx.fillStyle = fg;
    ctx.font = "bold 11px -apple-system,'Helvetica Neue',sans-serif";
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    label.forEach((line, j) =>
      ctx.fillText(line, r - 13, (j - (label.length - 1) / 2) * 14)
    );
    ctx.restore();
  }

  // center hub
  ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = "#0F172A"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2);
  ctx.fillStyle = "#CD576A"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF"; ctx.fill();
}

// ── Types ─────────────────────────────────────────────────
type Phase = "idle" | "spinning" | "won" | "lost";

// ── Component ─────────────────────────────────────────────
export default function RuletaPage() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const wheelRef    = useRef<HTMLDivElement>(null);
  const rotRef      = useRef(0);

  const [phase,       setPhase]      = useState<Phase>("idle");
  const [prizeCount,  setPrizeCount] = useState(0);
  const [lossLabel,   setLossLabel]  = useState("");
  const [winExiting,  setWinExiting] = useState(false);

  useEffect(() => { setPrizeCount(readCount()); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width  = WHEEL_SIZE * dpr;
    canvas.height = WHEEL_SIZE * dpr;
    canvas.style.width  = `${WHEEL_SIZE}px`;
    canvas.style.height = `${WHEEL_SIZE}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    drawWheel(ctx, WHEEL_SIZE);
  }, []);

  function spin() {
    if (phase === "spinning") return;
    if (phase === "lost") setLossLabel("");

    const prizesLeft = prizeCount < MAX_PRIZES;
    let target: number;

    if (!prizesLeft) {
      const np = SEGMENTS.flatMap((s, i) => (!s.isPrize ? [i] : []));
      target = np[Math.floor(Math.random() * np.length)];
    } else {
      target = Math.floor(Math.random() * N);
    }

    const seg    = SEGMENTS[target];
    const win    = seg.isPrize && prizesLeft;
    const segDeg = 360 / N;
    const raw    = -((target + 0.5) * segDeg);
    const normT  = ((raw % 360) + 360) % 360;
    const normC  = ((rotRef.current % 360) + 360) % 360;
    let delta    = normT - normC;
    if (delta <= 0) delta += 360;
    const finalRot = rotRef.current + EXTRA_SPINS * 360 + delta;
    rotRef.current = finalRot;

    if (wheelRef.current) {
      wheelRef.current.style.transition = `transform ${SPIN_MS}ms cubic-bezier(0.23,1,0.32,1)`;
      wheelRef.current.style.transform  = `rotate(${finalRot}deg)`;
    }

    setPhase("spinning");

    setTimeout(() => {
      if (wheelRef.current) wheelRef.current.style.transition = "none";
      if (win) {
        const next = prizeCount + 1;
        saveCount(next);
        setPrizeCount(next);
        setPhase("won");
      } else {
        setLossLabel(seg.label.join(" "));
        setPhase("lost");
      }
    }, SPIN_MS);
  }

  function closeWin() {
    setWinExiting(true);
    setTimeout(() => { setPhase("idle"); setWinExiting(false); }, 360);
  }

  return (
    <>
      <style>{`
        :root {
          --ease-expo:    cubic-bezier(0.16,1,0.3,1);
          /* ── Admin palette (T tokens) ── */
          --bg:           #F8FAFC;
          --white:        #FFFFFF;
          --border:       #E2E8F0;
          --text:         #0F172A;
          --secondary:    #334155;
          --muted:        #64748B;
          --muted-lt:     #94A3B8;
          --slate:        #F1F5F9;
          /* ── Brand accent ── */
          --rose:         #CD576A;
          --rose-deep:    #B84459;
          --rose-mid:     #D96278;
          --rose-pale:    #FFF1F3;
          --rose-border:  #FECDD5;
          --olive:        #79874C;
          --olive-bg:     #F3F6EB;
          --olive-border: #C8D8A8;
        }

        /* ── Page stagger ── */
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .s1 { animation: fade-up 400ms var(--ease-expo) 0ms   both; }
        .s2 { animation: fade-up 420ms var(--ease-expo) 55ms  both; }
        .s3 { animation: fade-up 400ms var(--ease-expo) 110ms both; }
        .s4 { animation: fade-up 440ms var(--ease-expo) 170ms both; }
        .s5 { animation: fade-up 400ms var(--ease-expo) 240ms both; }
        .s6 { animation: fade-up 400ms var(--ease-expo) 300ms both; }

        /* ── Spin button: directional fill, no glow ── */
        .spin-btn {
          position: relative; overflow: hidden;
          transition: background 200ms ease, transform 140ms var(--ease-expo), opacity 200ms ease;
        }
        .spin-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.09);
          transform: translateX(-101%);
          transition: transform 290ms var(--ease-expo);
        }
        @media (hover: hover) and (pointer: fine) {
          .spin-btn:not(:disabled):hover::after { transform: translateX(0); }
        }
        .spin-btn:not(:disabled):active { transform: scale(0.97) !important; }

        /* ── Spin icon ── */
        @keyframes spin-loop { to { transform: rotate(360deg); } }
        .spin-loop { animation: spin-loop 0.75s linear infinite; }

        /* ── Loss inline state ── */
        .loss-enter {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 300ms var(--ease-expo), transform 300ms var(--ease-expo);
        }
        @supports (selector(:has(*))) {
          @starting-style { .loss-enter { opacity: 0; transform: translateY(-10px); } }
        }

        /* ── Prize dot pop ── */
        .prize-dot {
          transition:
            background    280ms var(--ease-expo),
            border-color  280ms var(--ease-expo),
            transform     320ms var(--ease-expo),
            opacity       260ms ease;
        }
        @supports (selector(:has(*))) {
          @starting-style { .prize-dot { transform: scale(0.15); opacity: 0; } }
        }

        /* ── Win screen ── */
        .win-screen {
          opacity: 1;
          transition: opacity 300ms var(--ease-expo);
        }
        @supports (selector(:has(*))) {
          @starting-style { .win-screen { opacity: 0; } }
        }
        .win-screen.exiting {
          opacity: 0;
          transition: opacity 280ms ease;
        }

        @keyframes win-rise {
          from { opacity: 0; transform: translateY(22px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        .win-content { animation: win-rise 480ms var(--ease-expo) 100ms both; }

        @keyframes orb-float {
          0%, 100% { transform: translate(30%,-30%) scale(1); }
          50%       { transform: translate(30%,-30%) scale(1.07) translateY(-6px); }
        }
        .win-orb { animation: orb-float 7s ease-in-out infinite; }

        /* ── Misc buttons ── */
        .cta-btn { transition: transform 140ms var(--ease-expo), opacity 160ms ease; }
        .cta-btn:active { transform: scale(0.97); }
        @media (hover: hover) and (pointer: fine) {
          .reset-btn:hover { opacity: 0.62 !important; }
        }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .s1,.s2,.s3,.s4,.s5,.s6 { animation: none; }
          .spin-btn::after         { transition: none; }
          .win-content             { animation: none; }
          .win-orb                 { animation: none; }
          .win-screen              { transition: opacity 140ms ease !important; }
          .loss-enter              { transition: opacity 140ms ease !important; transform: none !important; }
          .prize-dot               { transition: background 200ms ease, border-color 200ms ease !important; }
        }
      `}</style>

      <main
        className="min-h-[100dvh] flex flex-col items-center justify-center px-5 pt-8 pb-12"
        style={{
          backgroundColor:  "var(--bg)",
          fontFamily:       "var(--font-poppins,system-ui,sans-serif)",
          userSelect:       "none",
          WebkitUserSelect: "none",
        }}
      >
        {/* ── Subtle rose accent blob (brand only, no warm tints) ── */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute -top-52 -right-52 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(205,87,106,0.06) 0%, transparent 60%)" }}
          />
        </div>

        <div className="relative w-full max-w-[340px]">

          {/* ── Header ── */}
          <header className="mb-8">
            <h1
              className="s1 font-bold tracking-tight leading-none mb-2"
              style={{ fontSize: "clamp(1.9rem,7.5vw,2.3rem)", color: "var(--text)" }}
            >
              Ruleta{" "}
              <span style={{ color: "var(--rose)" }}>Té&nbsp;Sueño</span>
            </h1>
            <p className="s2" style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>
              Gira y gana una bebida gratis
            </p>
          </header>

          {/* ── Wheel ── */}
          <div className="s3 relative flex justify-center mb-6">
            {/* pointer */}
            <div
              className="absolute z-10"
              style={{
                top: -13, left: "50%", transform: "translateX(-50%)",
                filter: "drop-shadow(0 2px 4px rgba(205,87,106,0.30))",
                lineHeight: 0,
              }}
            >
              <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden="true">
                <path d="M11 18L0 0H22Z" fill="var(--rose)"/>
                <path d="M11 12L4 1H18Z" fill="var(--rose-deep)" opacity="0.4"/>
              </svg>
            </div>

            {/* decorative ring + canvas */}
            <div
              className="rounded-full"
              style={{
                padding: 5,
                background: "var(--rose)",
                boxShadow:
                  "0 0 0 3px var(--white), " +
                  "0 0 0 6px rgba(205,87,106,0.20), " +
                  "0 20px 56px rgba(0,0,0,0.10)",
              }}
            >
              <div className="rounded-full" style={{ padding: 3, background: "var(--white)" }}>
                <div ref={wheelRef} className="rounded-full" style={{ lineHeight: 0 }}>
                  <canvas ref={canvasRef} className="block rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Action area ── */}
          <div className="s4">
            {/* Idle */}
            {phase === "idle" && (
              <button
                className="spin-btn w-full font-bold text-white border-0"
                onClick={spin}
                style={{
                  height: 54, borderRadius: 100, fontSize: 15,
                  letterSpacing: "0.09em",
                  background: "var(--rose)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                GIRAR
              </button>
            )}

            {/* Spinning */}
            {phase === "spinning" && (
              <button
                className="spin-btn w-full font-bold text-white border-0"
                disabled
                style={{
                  height: 54, borderRadius: 100, fontSize: 15,
                  letterSpacing: "0.09em",
                  background: "var(--muted-lt)",
                  cursor: "not-allowed",
                  opacity: 0.65,
                  fontFamily: "inherit",
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <RefreshCcw size={15} className="spin-loop" />
                  Girando...
                </span>
              </button>
            )}

            {/* Loss — inline, no modal */}
            {phase === "lost" && (
              <div className="loss-enter">
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-3"
                  style={{ background: "var(--white)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{
                      width: 38, height: 38,
                      background: "var(--olive-bg)",
                      border: "1px solid var(--olive-border)",
                    }}
                  >
                    <Star size={16} style={{ color: "var(--olive)" }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight" style={{ color: "var(--text)" }}>
                      {lossLabel}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      No fue esta vez
                    </p>
                  </div>
                </div>
                <button
                  className="spin-btn w-full font-bold text-white border-0"
                  onClick={spin}
                  style={{
                    height: 54, borderRadius: 100, fontSize: 15,
                    letterSpacing: "0.09em",
                    background: "var(--rose)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Girar de nuevo
                </button>
              </div>
            )}
          </div>

        </div>

        {/* ── WIN: Full-screen takeover — the climax ── */}
        {phase === "won" && (
          <div
            className={`win-screen${winExiting ? " exiting" : ""} fixed inset-0 z-50 flex flex-col items-center justify-center px-6`}
            style={{
              background:  "linear-gradient(155deg, var(--rose-mid) 0%, var(--rose-deep) 100%)",
              fontFamily:  "var(--font-poppins,system-ui,sans-serif)",
              userSelect:  "none",
            }}
          >
            {/* floating orbs */}
            <div
              className="absolute top-0 right-0 w-80 h-80 rounded-full win-orb pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.11) 0%, transparent 68%)", transform: "translate(30%,-30%)" }}
            />
            <div
              className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 68%)", transform: "translate(-30%,30%)" }}
            />

            <div className="win-content relative w-full max-w-[320px] text-center">
              {/* trophy */}
              <div
                className="inline-flex items-center justify-center rounded-full mx-auto mb-6"
                style={{
                  width: 88, height: 88,
                  background: "rgba(255,255,255,0.14)",
                  border:     "1.5px solid rgba(255,255,255,0.28)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              >
                <Trophy size={38} color="white" strokeWidth={1.5} />
              </div>

              {/* headline: typographic risk */}
              <h2
                className="font-bold leading-none text-white mb-6"
                style={{
                  fontSize:      "clamp(3rem,14vw,4.25rem)",
                  letterSpacing: "-0.03em",
                }}
              >
                Ganaste
              </h2>

              {/* prize detail */}
              <div
                className="px-5 py-4 rounded-2xl mb-6 text-left"
                style={{
                  background: "rgba(255,255,255,0.13)",
                  border:     "1.5px solid rgba(255,255,255,0.22)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                <p
                  className="font-bold tracking-[0.14em] uppercase mb-1"
                  style={{ fontSize: 9.5, color: "rgba(255,255,255,0.58)" }}
                >
                  Tu premio
                </p>
                <p className="font-bold text-white mb-1" style={{ fontSize: 17 }}>
                  Bebida Gratis
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                  Cualquier bebida del menú
                </p>
              </div>

              <p className="mb-6" style={{ fontSize: 13, color: "rgba(255,255,255,0.62)" }}>
                Pasa al mostrador a reclamar
              </p>

              {/* CTA: white pill on rose — inverted for max contrast */}
              <button
                className="cta-btn w-full flex items-center justify-center gap-2 rounded-full font-bold border-0"
                onClick={closeWin}
                style={{
                  height:      54,
                  fontSize:    15,
                  letterSpacing: "0.02em",
                  background:  "white",
                  color:       "var(--rose)",
                  cursor:      "pointer",
                  fontFamily:  "inherit",
                }}
              >
                Voy por mi bebida
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
