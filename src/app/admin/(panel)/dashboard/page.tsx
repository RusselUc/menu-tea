"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  getOrders,
  updateOrderStatus,
  getOrderTotal,
  getOrderLabel,
  Order,
  OrderStatus,
} from "@/lib/orders";

// ── Tokens ─────────────────────────────────────────────
const T = {
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  secondary: "#334155",
  muted: "#64748B",
  mutedLight: "#94A3B8",
  blue: "#2563EB",
  blueBg: "#EFF6FF",
  blueBorder: "#BFDBFE",
  green: "#059669",
  greenBg: "#ECFDF5",
  greenBorder: "#A7F3D0",
  amber: "#D97706",
  amberBg: "#FFFBEB",
  amberBorder: "#FCD34D",
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FECACA",
  slate: "#F1F5F9",
  slateBorder: "#E2E8F0",
  slateText: "#64748B",
};

const STATUS = {
  pending:   { label: "Pendiente", bg: T.amberBg,  color: T.amber,  border: T.amberBorder,  bar: T.amber  },
  success:   { label: "Pendiente", bg: T.amberBg,  color: T.amber,  border: T.amberBorder,  bar: T.amber  },
  delivered: { label: "Entregado", bg: T.greenBg,  color: T.green,  border: T.greenBorder,  bar: T.green  },
  cancelled: { label: "Cancelado", bg: T.slate,     color: T.muted,  border: T.slateBorder,  bar: "#CBD5E1" },
};

// ── Period filter ────────────────────────────────────────
type Period = "today" | "week" | "month" | "all" | "date";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "week",  label: "Semana" },
  { id: "month", label: "Mes" },
  { id: "all",   label: "Todo" },
  { id: "date",  label: "Fecha" },
];

// ── Helpers ─────────────────────────────────────────────
function timeAgo(ts: { toDate: () => Date }): string {
  const diff = Date.now() - ts.toDate().getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function getRangeStart(period: Period, selectedDate?: string): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "today") return today;
  if (period === "week")  { const d = new Date(today); d.setDate(d.getDate() - 6); return d; }
  if (period === "month") { const d = new Date(today); d.setDate(d.getDate() - 29); return d; }
  if (period === "date" && selectedDate) {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(0);
}

function computeStats(orders: Order[], period: Period, selectedDate?: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const rangeStart = getRangeStart(period, selectedDate);

  const allActive = orders.filter((o) => o.status !== "cancelled");

  let periodOrders: Order[];
  if (period === "all") {
    periodOrders = orders;
  } else if (period === "date" && selectedDate) {
    const dayEnd = new Date(rangeStart); dayEnd.setDate(dayEnd.getDate() + 1);
    periodOrders = orders.filter((o) => {
      const od = o.timestamp?.toDate() ?? new Date(0);
      return od >= rangeStart && od < dayEnd;
    });
  } else {
    periodOrders = orders.filter((o) => (o.timestamp?.toDate() ?? new Date(0)) >= rangeStart);
  }

  const periodActive = periodOrders.filter((o) => o.status !== "cancelled");
  const periodDelivered = periodOrders.filter((o) => o.status === "delivered");
  const periodCancelled = periodOrders.filter((o) => o.status === "cancelled");

  const count    = periodActive.length;
  const revenue  = periodDelivered.reduce((s, o) => s + getOrderTotal(o), 0);
  const pending  = orders.filter((o) => o.status === "pending" || o.status === "success").length;
  const cancelled = periodCancelled.length;

  // ── Chart data ──
  const todayLabel = todayStart
    .toLocaleDateString("es-MX", { weekday: "short" })
    .slice(0, 3)
    .toLowerCase();

  let chartData: { label: string; count: number; isToday: boolean }[];

  if (period === "date" && selectedDate) {
    // 7 days centered on selected date (3 before, selected, 3 after)
    const [y, m, d] = selectedDate.split("-").map(Number);
    const selDay = new Date(y, m - 1, d);
    chartData = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(selDay); day.setDate(day.getDate() - 3 + i);
      const next = new Date(day); next.setDate(next.getDate() + 1);
      const label = day.toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(" de ", "/").slice(0, 5);
      const isSel = i === 3;
      return {
        label,
        isToday: isSel,
        count: allActive.filter((o) => {
          const od = o.timestamp?.toDate();
          return od && od >= day && od < next;
        }).length,
      };
    });
  } else if (period === "today" || period === "week") {
    // 7 days
    chartData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - (6 - i));
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const label = d.toLocaleDateString("es-MX", { weekday: "short" }).slice(0, 3);
      return {
        label,
        isToday: label.toLowerCase() === todayLabel,
        count: allActive.filter((o) => {
          const od = o.timestamp?.toDate();
          return od && od >= d && od < next;
        }).length,
      };
    });
  } else if (period === "month") {
    // Last 5 weeks
    chartData = Array.from({ length: 5 }, (_, i) => {
      const wEnd = new Date(todayStart); wEnd.setDate(wEnd.getDate() - i * 7 + 1);
      const wStart = new Date(wEnd); wStart.setDate(wStart.getDate() - 7);
      return {
        label: i === 0 ? "Esta" : `S-${i}`,
        isToday: i === 0,
        count: allActive.filter((o) => {
          const od = o.timestamp?.toDate();
          return od && od >= wStart && od < wEnd;
        }).length,
      };
    }).reverse();
  } else {
    // Last 12 months
    chartData = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      return {
        label: d.toLocaleDateString("es-MX", { month: "short" }).slice(0, 3),
        isToday: i === 11,
        count: allActive.filter((o) => {
          const od = o.timestamp?.toDate();
          return od && od >= d && od < next;
        }).length,
      };
    });
  }

  // ── Top flavors (from period) ──
  const flavors: Record<string, number> = {};
  periodActive.forEach((o) => {
    if (o.items) o.items.forEach((i) => { flavors[i.flavor] = (flavors[i.flavor] || 0) + i.quantity; });
    else if (o.flavor) flavors[o.flavor] = (flavors[o.flavor] || 0) + (o.quantity || 1);
  });
  const topFlavors = Object.entries(flavors).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return { count, revenue, pending, cancelled, chartData, topFlavors, periodOrders };
}

// ── Sub-components ──────────────────────────────────────
function StatCard({
  label, value, sub, loading,
}: {
  label: string; value: string; sub: string; loading: boolean;
}) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: "18px 20px",
    }}>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: T.muted, fontWeight: 500 }}>
        {label}
      </p>
      <p style={{
        margin: 0,
        fontSize: loading ? 24 : 32,
        fontWeight: 700,
        color: loading ? T.mutedLight : T.text,
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}>
        {loading ? "—" : value}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: T.mutedLight }}>{sub}</p>
    </div>
  );
}

function BarChart({ data }: { data: { label: string; count: number; isToday: boolean }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, height: "100%" }}>
          {d.count > 0 && (
            <span style={{ fontSize: 11, color: d.isToday ? T.blue : T.muted, fontWeight: 600, lineHeight: 1 }}>
              {d.count}
            </span>
          )}
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
            <div style={{
              width: "100%",
              height: d.count > 0 ? `${Math.max((d.count / max) * 100, 6)}%` : "4px",
              background: d.isToday ? T.blue : d.count > 0 ? "#BFDBFE" : "#F1F5F9",
              borderRadius: "4px 4px 3px 3px",
              minHeight: d.count > 0 ? 6 : 4,
            }} />
          </div>
          <span style={{ fontSize: 10, color: d.isToday ? T.blue : T.mutedLight, fontWeight: d.isToday ? 600 : 400 }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────
export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("today");
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  async function load() {
    const o = await getOrders();
    setOrders(o);
  }

  useEffect(() => { load().then(() => setLoading(false)); }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleStatus(id: string, status: OrderStatus) {
    setUpdatingId(id);
    await updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setUpdatingId(null);
  }

  const { count, revenue, pending, cancelled, chartData, topFlavors, periodOrders } =
    computeStats(orders, period, selectedDate);
  const topFlavorMax = topFlavors[0]?.[1] || 1;

  const periodLabel = period === "date"
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
    : ({ today: "hoy", week: "esta semana", month: "este mes", all: "en total" } as Record<string, string>)[period];
  const todayStr = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const displayOrders = periodOrders.slice().sort(
    (a, b) => (b.timestamp?.toDate().getTime() ?? 0) - (a.timestamp?.toDate().getTime() ?? 0)
  ).slice(0, 40);

  return (
    <>
      <style>{`
        .dash-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .dash-mid   { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 768px) {
          .dash-stats { grid-template-columns: repeat(4, 1fr); }
          .dash-mid   { grid-template-columns: 3fr 2fr; }
        }
      `}</style>

      <div style={{ padding: "28px 24px 32px", maxWidth: 1100, margin: "0 auto", fontFamily: "var(--font-poppins)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
              Dashboard
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: T.muted, textTransform: "capitalize" }}>
              {todayStr}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 36, padding: "0 14px", borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.white,
              color: T.muted, fontSize: 13, fontWeight: 500,
              cursor: "pointer", fontFamily: "var(--font-poppins)",
            }}
          >
            <RefreshCw size={13} style={{ transition: "transform 0.5s", transform: refreshing ? "rotate(360deg)" : "none" }} />
            Actualizar
          </button>
        </div>

        {/* Period filter tabs */}
        <div style={{
          display: "flex", gap: 4,
          background: T.slate, borderRadius: 10,
          padding: 4, marginBottom: 20,
          width: "fit-content",
        }}>
          {PERIODS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPeriod(id)}
              style={{
                height: 32, padding: "0 16px",
                borderRadius: 7, border: "none",
                background: period === id ? T.white : "transparent",
                color: period === id ? T.text : T.muted,
                fontSize: 13, fontWeight: period === id ? 600 : 400,
                cursor: "pointer",
                fontFamily: "var(--font-poppins)",
                boxShadow: period === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date picker — shown only when period === "date" */}
        {period === "date" && (
          <div style={{ marginBottom: 20 }}>
            <input
              type="date"
              value={selectedDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                height: 36, padding: "0 12px",
                borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.white, color: T.text,
                fontSize: 13, fontFamily: "var(--font-poppins)",
                outline: "none", cursor: "pointer",
              }}
            />
          </div>
        )}

        {/* Stat cards */}
        <div className="dash-stats" style={{ marginBottom: 16 }}>
          <StatCard label="Pedidos"    value={String(count)}     sub={`no cancelados ${periodLabel}`} loading={loading} />
          <StatCard label="Ingresos"   value={`$${revenue}`}     sub={`entregados ${periodLabel}`}    loading={loading} />
          <StatCard label="Pendientes" value={String(pending)}   sub="requieren acción ahora"         loading={loading} />
          <StatCard label="Cancelados" value={String(cancelled)} sub={periodLabel}                    loading={loading} />
        </div>

        {/* Mid section */}
        <div className="dash-mid" style={{ marginBottom: 16 }}>
          {/* Bar chart */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>
                {period === "all" ? "Por mes" : period === "month" ? "Por semana" : "Por día"}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: T.blue }} />
                <span style={{ fontSize: 11, color: T.mutedLight }}>
                  {period === "all" ? "mes actual" : "período actual"}
                </span>
              </div>
            </div>
            {loading ? (
              <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, color: T.mutedLight }}>Cargando...</span>
              </div>
            ) : (
              <BarChart data={chartData} />
            )}
          </div>

          {/* Top bebidas */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: T.text }}>
              Top bebidas
            </p>
            {topFlavors.length === 0 ? (
              <p style={{ fontSize: 13, color: T.mutedLight, margin: 0 }}>Sin datos en este período</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {topFlavors.map(([name, cnt], i) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? T.blue : T.mutedLight, width: 14, textAlign: "right", flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: T.secondary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>
                          {name}
                        </span>
                        <span style={{ fontSize: 11, color: T.mutedLight, flexShrink: 0 }}>{cnt}</span>
                      </div>
                      <div style={{ height: 4, background: "#F1F5F9", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${(cnt / topFlavorMax) * 100}%`, background: i === 0 ? T.blue : "#BFDBFE", borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Orders list */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>Pedidos</p>
            <span style={{ fontSize: 12, color: T.mutedLight }}>{displayOrders.length} en este período</span>
          </div>

          {loading ? (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3].map((i) => <div key={i} style={{ height: 56, borderRadius: 8, background: "#F8FAFC" }} />)}
            </div>
          ) : displayOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <p style={{ fontSize: 28, margin: "0 0 8px" }}>🧋</p>
              <p style={{ fontSize: 13, color: T.mutedLight, margin: 0 }}>Sin pedidos en este período</p>
            </div>
          ) : (
            <div>
              {displayOrders.map((order, idx) => {
                const st = STATUS[order.status as keyof typeof STATUS] ?? STATUS.pending;
                const isPending = order.status === "pending" || order.status === "success";
                const isUpdating = updatingId === order.id;
                return (
                  <div key={order.id} style={{
                    padding: "14px 20px",
                    borderBottom: idx < displayOrders.length - 1 ? `1px solid ${T.border}` : "none",
                    borderLeft: `3px solid ${st.bar}`,
                    display: "flex", alignItems: "center", gap: 14,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {getOrderLabel(order)}
                        </p>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: st.bg, color: st.color, border: `1px solid ${st.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {st.label}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 11.5, color: T.mutedLight }}>
                        {order.timestamp ? timeAgo(order.timestamp) : ""}
                        {" · "}
                        <span style={{ color: T.muted, fontWeight: 500 }}>${getOrderTotal(order)}</span>
                        {order.phone && ` · ${order.phone}`}
                      </p>
                      {order.items && order.items.length > 1 && (
                        <p style={{ margin: "3px 0 0", fontSize: 11, color: T.mutedLight }}>
                          {order.items.map((i) => `${i.quantity}× ${i.flavor}`).join("  ·  ")}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {isUpdating ? (
                        <span style={{ fontSize: 11, color: T.mutedLight }}>...</span>
                      ) : isPending ? (
                        <>
                          <button onClick={() => handleStatus(order.id, "delivered")} style={{ height: 30, padding: "0 12px", borderRadius: 7, border: `1px solid ${T.greenBorder}`, background: T.greenBg, color: T.green, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)", whiteSpace: "nowrap" }}>
                            Entregado
                          </button>
                          <button onClick={() => handleStatus(order.id, "cancelled")} style={{ height: 30, padding: "0 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-poppins)", whiteSpace: "nowrap" }}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleStatus(order.id, "pending")} style={{ height: 28, padding: "0 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.mutedLight, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-poppins)" }}>
                          Revertir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
