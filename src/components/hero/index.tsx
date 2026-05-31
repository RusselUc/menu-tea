"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logoPink from "@/assets/images/logo-pink.png";
import heroImg from "@/assets/images/hero.svg";

export default function Hero() {
  const router = useRouter();
  const goToMenu = () => router.push("/menu");

  return (
    <>
      <style>{`
        @keyframes hero-slide-down {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-pop {
          0%   { opacity: 0; transform: scale(0.88) translateY(8px); }
          70%  { transform: scale(1.03) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes hero-float-card {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes hero-float-badge-a {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%      { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes hero-float-badge-b {
          0%, 100% { transform: translateY(0px) rotate(1deg); }
          50%      { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes hero-glow-pulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%      { opacity: 0.65; transform: scale(1.06); }
        }
        @keyframes hero-bounce-arrow {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(5px); }
        }

        .hero-nav    { animation: hero-slide-down 0.5s ease both; }
        .hero-tag    { animation: hero-fade-up 0.55s ease both; animation-delay: 80ms; }
        .hero-h1     { animation: hero-fade-up 0.6s ease both;  animation-delay: 160ms; }
        .hero-p      { animation: hero-fade-up 0.6s ease both;  animation-delay: 240ms; }
        .hero-cta    { animation: hero-fade-up 0.6s ease both;  animation-delay: 310ms; }
        .hero-card   { animation: hero-fade-up 0.7s ease both, hero-float-card 6s ease-in-out 1s infinite; animation-delay: 200ms, 0s; }
        .hero-badge-a { animation: hero-pop 0.55s ease both, hero-float-badge-a 5s ease-in-out 1.4s infinite; animation-delay: 500ms, 0s; }
        .hero-badge-b { animation: hero-pop 0.55s ease both, hero-float-badge-b 5.5s ease-in-out 1.8s infinite; animation-delay: 620ms, 0s; }
        .hero-glow   { animation: hero-glow-pulse 4s ease-in-out infinite; }
        .hero-arrow  { animation: hero-bounce-arrow 1.6s ease-in-out infinite; }

        .hero-badge-hover {
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .hero-badge-hover:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }

      `}</style>

      <section className="min-h-dvh bg-slate-50 flex flex-col overflow-hidden">

        {/* ── Nav ─────────────────────────────────── */}
        <nav className="hero-nav flex items-center justify-between px-6 sm:px-8 h-16 bg-white border-b border-slate-200 shrink-0">
          <Image src={logoPink} alt="Té Sueño" height={30} style={{ width: "auto" }} />

          {/* Links — solo desktop */}
          <div className="hidden sm:flex items-center gap-8">
            <button
              onClick={goToMenu}
              className="text-sm font-semibold text-[#BB5862] border-b-2 border-[#BB5862] pb-0.5 cursor-pointer bg-transparent"
            >
              Menú
            </button>
          </div>

          <button
            onClick={goToMenu}
            className="px-4 py-2 sm:px-5 rounded-full bg-[#BB5862] hover:bg-[#a34954] text-white text-xs sm:text-sm font-semibold cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(187,88,98,0.4)] hover:-translate-y-px active:translate-y-0"
          >
            Pedir Ahora
          </button>
        </nav>

        {/* ── Hero body ────────────────────────────── */}
        <div className="flex-1 flex items-center justify-around px-8 py-10 gap-12 w-full max-w-9/12 mx-auto max-sm:flex-col max-sm:px-5 max-sm:gap-8 max-sm:text-center">

          {/* Left */}
          <div className="">

            <p className="hero-tag text-xs font-semibold text-[#BB5862] tracking-widest uppercase mb-4 max-sm:text-center">
              Té Sueño · Bobba Tea
            </p>

            <h1 className="hero-h1 text-[clamp(36px,5vw,58px)] font-extrabold leading-[1.12] tracking-tight text-slate-900 mb-5">
              Tu Momento{" "}
              <em className="text-[#BB5862] not-italic">Dulce</em>
              <br />
              Comienza con un
              <br />
              <span className="text-[#BB5862]">Sueño</span>
            </h1>

            <p className="hero-p text-sm leading-relaxed text-slate-500 max-w-sm mb-9 max-sm:mx-auto">
              Descubre el sabor mágico de nuestro bubble tea, hecho con amor.
              Una explosión de texturas y dulzura en cada sorbo.
            </p>

            <button
              onClick={goToMenu}
              className="hero-cta inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#BB5862] hover:bg-[#a34954] text-white text-sm font-bold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(187,88,98,0.4)] active:translate-y-0 shadow-[0_4px_20px_rgba(187,88,98,0.35)] max-sm:mx-auto"
            >
              Ver Menú
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-1">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Right — product card */}
          <div className="relative flex justify-center flex-1 max-w-[420px] max-sm:max-w-[260px] max-sm:w-full">

            {/* Glow orb behind card */}
            <div className="hero-glow absolute inset-0 rounded-full bg-[#BB5862] opacity-[0.08] blur-[60px] scale-90 pointer-events-none" />

            {/* Badge — Favorito */}
            <div className="hero-badge-a hero-badge-hover absolute -left-2 top-[22%] z-10 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-md cursor-default">
              <div className="w-7 h-7 rounded-full bg-[#FFF1F2] flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#BB5862">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-900 leading-tight">Favorito</div>
                <div className="text-[10px] text-slate-500 leading-tight">Lotus</div>
              </div>
            </div>

            {/* Product image */}
            <div className="hero-card relative w-full aspect-square rounded-3xl overflow-hidden bg-transparent">
              <Image
                src={heroImg}
                alt="Té Sueño"
                fill
                className="object-contain p-4"
                priority
              />
            </div>

            {/* Badge — Perlas */}
            <div className="hero-badge-b hero-badge-hover absolute -right-2 bottom-[22%] z-10 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-md cursor-default">
              <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#6366F1">
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="4" cy="12" r="3" />
                  <circle cx="20" cy="12" r="3" />
                  <circle cx="12" cy="4" r="3" />
                  <circle cx="12" cy="20" r="3" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-900 leading-tight">Perlas</div>
                <div className="text-[10px] text-slate-500 leading-tight">Perlas explosivas</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 pb-6 shrink-0">
          <p className="text-[11px] text-slate-400 tracking-wide">
            © Té Sueño &nbsp;·&nbsp; <span className="font-medium text-slate-500">Calkiní, Campeche, México</span>
          </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-[11px] font-medium tracking-widest uppercase text-slate-400">Síguenos</span>
          <div className="w-px h-3 bg-slate-300" />
          <a
            href="https://www.facebook.com/share/1BUQCLtEKY/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#BB5862] hover:bg-[#FFF1F2] transition-all duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/tesuenobobbatea/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#BB5862] hover:bg-[#FFF1F2] transition-all duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
          </a>
        </div>
        </div>

      </section>
    </>
  );
}
