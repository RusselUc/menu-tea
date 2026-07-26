"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart2, Heart, UtensilsCrossed, Receipt, ClipboardList, Package, MoreHorizontal, HelpCircle, Ticket } from "lucide-react";
import logoPink from "@/assets/images/logo-pink.png";
import { checkAdminSession } from "../session";

const NAV_PRIMARY = [
  { href: "/admin/comanda", label: "Comanda", icon: ClipboardList },
  { href: "/admin/dashboard", label: "Métricas", icon: BarChart2 },
  { href: "/admin/loyalty", label: "Fidelidad", icon: Heart },
];

const NAV_MORE = [
  { href: "/admin/gastos", label: "Gastos", icon: Receipt },
  { href: "/admin/insumos", label: "Insumos", icon: Package },
  { href: "/admin/menu", label: "Menú", icon: UtensilsCrossed },
  { href: "/admin/dinamica", label: "Dinámica Express", icon: HelpCircle },
  { href: "/admin/cupones", label: "Cupones", icon: Ticket },
];

const NAV = [...NAV_PRIMARY, ...NAV_MORE];

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = NAV_MORE.some((n) => n.href === pathname);

  useEffect(() => {
    if (!checkAdminSession()) {
      router.replace("/admin");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .admin-shell {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: var(--font-poppins);
          display: flex;
        }

        /* ── Sidebar (hidden on mobile) ── */
        .admin-sidebar {
          display: none;
        }

        /* ── Main content ── */
        .admin-main {
          flex: 1;
          min-width: 0;
          padding-bottom: 72px;
        }

        /* ── Bottom nav (mobile only) ── */
        .admin-bottom-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 64px;
          background: #ffffff;
          border-top: 1px solid #E2E8F0;
          display: flex;
          z-index: 50;
        }
        .bottom-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }

        /* ── More sheet overlay ── */
        .more-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          z-index: 60;
          animation: fadeIn 0.18s ease;
        }
        .more-sheet {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: #ffffff;
          border-radius: 20px 20px 0 0;
          border-top: 1px solid #E2E8F0;
          z-index: 61;
          padding: 12px 0 calc(env(safe-area-inset-bottom) + 16px);
          animation: slideUp 0.22s cubic-bezier(0.32,0.72,0,1);
        }
        .more-sheet-handle {
          width: 36px; height: 4px;
          background: #E2E8F0;
          border-radius: 2px;
          margin: 0 auto 16px;
        }
        .more-sheet-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 24px;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          font-family: var(--font-poppins);
          color: #334155;
          transition: background 0.12s;
        }
        .more-sheet-item:active {
          background: #F1F5F9;
        }
        .more-sheet-item.active {
          color: #2563EB;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }

        /* ── Sidebar nav items ── */
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          color: #64748B;
          transition: background 0.12s, color 0.12s;
          font-family: var(--font-poppins);
        }
        .sidebar-item:hover {
          background: #F1F5F9;
          color: #1E293B;
        }
        .sidebar-item.active {
          background: #EFF6FF;
          color: #2563EB;
          font-weight: 600;
        }

        /* ── Desktop breakpoint ── */
        @media (min-width: 768px) {
          .admin-sidebar {
            display: flex;
            flex-direction: column;
            width: 220px;
            min-height: 100vh;
            background: #ffffff;
            border-right: 1px solid #E2E8F0;
            position: fixed;
            top: 0; left: 0; bottom: 0;
            z-index: 40;
            flex-shrink: 0;
          }
          .admin-main {
            margin-left: 220px;
            padding-bottom: 0;
          }
          .admin-bottom-nav {
            display: none;
          }
        }
      `}</style>

      <div className="admin-shell">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div style={{ padding: "18px 14px 16px", borderBottom: "1px solid #F1F5F9" }}>
            <img src={logoPink.src} alt="Té Sueño" style={{ height: 32, width: "auto" }} />
          </div>

          <nav style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            <p style={{
              margin: "0 0 6px 4px",
              fontSize: 10, fontWeight: 600,
              color: "#CBD5E1", letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              General
            </p>
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-item${active ? " active" : ""}`}
                >
                  <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="admin-main">{children}</main>

        {/* Bottom nav */}
        <nav className="admin-bottom-nav">
          {NAV_PRIMARY.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="bottom-nav-item"
                style={{ color: active ? "#2563EB" : "#94A3B8" }}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, fontFamily: "var(--font-poppins)" }}>
                  {label}
                </span>
              </Link>
            );
          })}

          <button
            className="bottom-nav-item"
            style={{ color: isMoreActive ? "#2563EB" : "#94A3B8" }}
            onClick={() => setMoreOpen(true)}
          >
            <MoreHorizontal size={20} strokeWidth={isMoreActive ? 2.2 : 1.6} />
            <span style={{ fontSize: 10, fontWeight: isMoreActive ? 600 : 400, fontFamily: "var(--font-poppins)" }}>
              Más
            </span>
          </button>
        </nav>

        {/* More sheet */}
        {moreOpen && (
          <>
            <div className="more-overlay" onClick={() => setMoreOpen(false)} />
            <div className="more-sheet">
              <div className="more-sheet-handle" />
              {NAV_MORE.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`more-sheet-item${active ? " active" : ""}`}
                    onClick={() => setMoreOpen(false)}
                  >
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
