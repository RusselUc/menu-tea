"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CalendarIcon, RefreshCw, Megaphone, Check, X, Copy, MessageCircle, Pencil } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  getOrders,
  updateOrderStatus,
  getOrderTotal,
  getOrderLabel,
  Order,
  OrderStatus,
} from "@/lib/orders";
import { getExpenses, Expense } from "@/lib/expenses";
import { getBanner, saveBanner, BannerSettings } from "@/lib/menu-items";

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
type Period = "today" | "week" | "month" | "all" | "range";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "week",  label: "Semana" },
  { id: "month", label: "Mes" },
  { id: "all",   label: "Todo" },
  { id: "range", label: "Rango" },
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

const ALL_LIMIT = 500;

function getDateBounds(period: Period, dateRange?: DateRange): { from?: Date; to?: Date; limitCount?: number } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "today") return { from: today, to: today };
  if (period === "week")  { const d = new Date(today); d.setDate(d.getDate() - 6); return { from: d, to: today }; }
  if (period === "month") { const d = new Date(today); d.setDate(d.getDate() - 29); return { from: d, to: today }; }
  if (period === "range") return { from: dateRange?.from, to: dateRange?.to };
  return { limitCount: ALL_LIMIT };
}

function computeStats(orders: Order[], period: Period, dateRange?: DateRange) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const allActive = orders.filter((o) => o.status !== "cancelled");
  const periodDelivered = orders.filter((o) => o.status === "delivered");
  const periodCancelled = orders.filter((o) => o.status === "cancelled");

  const count     = allActive.length;
  const revenue   = periodDelivered.reduce((s, o) => s + getOrderTotal(o), 0);
  const pending   = orders.filter((o) => o.status === "pending" || o.status === "success").length;
  const cancelled = periodCancelled.length;

  const todayLabel = todayStart
    .toLocaleDateString("es-MX", { weekday: "short" })
    .slice(0, 3)
    .toLowerCase();

  let chartData: { label: string; count: number; isToday: boolean }[];

  if (period === "range" && dateRange?.from) {
    const from = dateRange.from;
    const to = dateRange.to ?? from;
    const diffDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;

    if (diffDays <= 31) {
      chartData = Array.from({ length: diffDays }, (_, i) => {
        const day = new Date(from); day.setDate(day.getDate() + i);
        const next = new Date(day); next.setDate(next.getDate() + 1);
        const isToday = day.toDateString() === todayStart.toDateString();
        const label = day.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
          .replace(" de ", "/").slice(0, 5);
        return {
          label, isToday,
          count: allActive.filter((o) => {
            const od = o.timestamp?.toDate();
            return od && od >= day && od < next;
          }).length,
        };
      });
    } else if (diffDays <= 90) {
      const weeks = Math.ceil(diffDays / 7);
      chartData = Array.from({ length: weeks }, (_, i) => {
        const wStart = new Date(from); wStart.setDate(wStart.getDate() + i * 7);
        const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate() + 7);
        const label = wStart.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
          .replace(" de ", "/").slice(0, 5);
        const isToday = todayStart >= wStart && todayStart < wEnd;
        return {
          label, isToday,
          count: allActive.filter((o) => {
            const od = o.timestamp?.toDate();
            return od && od >= wStart && od < wEnd;
          }).length,
        };
      });
    } else {
      // Rango grande: agrupar por mes
      const months: Date[] = [];
      let cur = new Date(from.getFullYear(), from.getMonth(), 1);
      const toMonth = new Date(to.getFullYear(), to.getMonth(), 1);
      while (cur <= toMonth) { months.push(new Date(cur)); cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); }
      chartData = months.map((m) => {
        const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 1);
        const isToday = todayStart >= m && todayStart < mEnd;
        const label = m.toLocaleDateString("es-MX", { month: "short" }).slice(0, 3);
        return {
          label, isToday,
          count: allActive.filter((o) => {
            const od = o.timestamp?.toDate();
            return od && od >= m && od < mEnd;
          }).length,
        };
      });
    }
  } else if (period === "today" || period === "week") {
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

  const flavors: Record<string, number> = {};
  allActive.forEach((o) => {
    if (o.items) o.items.forEach((i) => { flavors[i.flavor] = (flavors[i.flavor] || 0) + i.quantity; });
    else if (o.flavor) flavors[o.flavor] = (flavors[o.flavor] || 0) + (o.quantity || 1);
  });
  const topFlavors = Object.entries(flavors).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return { count, revenue, pending, cancelled, chartData, topFlavors, periodOrders: orders };
}

// ── Sub-components ──────────────────────────────────────
function StatCard({
  label, value, sub, loading, highlight,
}: {
  label: string; value: string; sub: string; loading: boolean; highlight?: "green" | "red";
}) {
  const valueColor = loading ? T.mutedLight : highlight === "green" ? T.green : highlight === "red" ? T.red : T.text;
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
        color: valueColor,
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}>
        {loading ? "—" : value}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: T.mutedLight }}>{sub}</p>
    </div>
  );
}

function OrdersBarChart({ data }: { data: { label: string; count: number; isToday: boolean }[] }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 10, right: 4, left: -28, bottom: 0 }} barCategoryGap="30%">
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: T.mutedLight, fontFamily: "var(--font-poppins)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: T.mutedLight, fontFamily: "var(--font-poppins)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: T.slate }}
          contentStyle={{
            borderRadius: 8, border: `1px solid ${T.border}`,
            fontSize: 12, fontFamily: "var(--font-poppins)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          formatter={(value) => [value, "Pedidos"]}
          labelStyle={{ color: T.text, fontWeight: 600 }}
        />
        <Bar dataKey="count" radius={[4, 4, 3, 3]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.isToday ? T.blue : "#BFDBFE"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Page ────────────────────────────────────────────────
export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return { from: today, to: today };
  });
  const [rangeFetching, setRangeFetching] = useState(false);

  // Expenses state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExp, setLoadingExp] = useState(true);

  // Banner state
  const [banner, setBanner] = useState<BannerSettings>({ enabled: false, message: "" });
  const [bannerDraft, setBannerDraft] = useState<BannerSettings>({ enabled: false, message: "" });
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerSaved, setBannerSaved] = useState(false);
  const [editingBanner, setEditingBanner] = useState(false);

  useEffect(() => {
    getBanner().then((b) => { setBanner(b); setBannerDraft(b); });
  }, []);

  async function handleToggleBanner() {
    const newDraft = { ...bannerDraft, enabled: !bannerDraft.enabled };
    setBannerDraft(newDraft);
    if (newDraft.enabled) {
      setEditingBanner(true);
    } else {
      setEditingBanner(false);
      setBannerSaving(true);
      await saveBanner(newDraft);
      setBanner(newDraft);
      setBannerSaving(false);
    }
  }

  async function handleSaveBanner() {
    setBannerSaving(true);
    await saveBanner(bannerDraft);
    setBanner(bannerDraft);
    setBannerSaving(false);
    setBannerSaved(true);
    setEditingBanner(false);
    setTimeout(() => setBannerSaved(false), 2000);
  }

  // Cierre del día
  const [showCierre, setShowCierre] = useState(false);
  const [cierreOrders, setCierreOrders] = useState<Order[]>([]);
  const [cierreExpenses, setCierreExpenses] = useState<Expense[]>([]);
  const [cierreLoading, setCierreLoading] = useState(false);
  const [cierre_copied, setCierre_copied] = useState(false);

  async function handleOpenCierre() {
    setShowCierre(true);
    setCierreLoading(true);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [o, e] = await Promise.all([getOrders(today, today), getExpenses(today, today)]);
    setCierreOrders(o);
    setCierreExpenses(e);
    setCierreLoading(false);
  }

  function generarTextoCierre(
    delivered: Order[], allCierre: Order[], gastos: Expense[], net: number,
    top: [string, number][]
  ) {
    const fecha = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const activos = allCierre.filter((o) => o.status !== "cancelled").length;
    const pendientes = allCierre.filter((o) => o.status === "pending" || o.status === "success").length;
    const cancelados = allCierre.filter((o) => o.status === "cancelled").length;
    const ingresos = delivered.reduce((s, o) => s + getOrderTotal(o), 0);
    const totalGastos = gastos.reduce((s, e) => s + e.amount, 0);
    let txt = `CIERRE DEL DÍA — Té Sueño\n${fecha}\n\n`;
    txt += `PEDIDOS\n• Activos: ${activos}\n• Entregados: ${delivered.length}\n`;
    if (pendientes > 0) txt += `• Pendientes: ${pendientes}\n`;
    if (cancelados > 0) txt += `• Cancelados: ${cancelados}\n`;
    txt += `• Ingresos: $${ingresos}\n`;
    if (totalGastos > 0) txt += `\nGASTOS: $${totalGastos}\n`;
    txt += `\nGANANCIA NETA: $${net}\n`;
    if (top.length > 0) {
      txt += `\nTOP BEBIDAS\n`;
      top.forEach(([name, cnt], i) => { txt += `${i + 1}. ${name} — ${cnt}\n`; });
    }
    return txt;
  }

  async function handleCopiarCierre(
    delivered: Order[], allCierre: Order[], gastos: Expense[], net: number,
    top: [string, number][]
  ) {
    await navigator.clipboard.writeText(generarTextoCierre(delivered, allCierre, gastos, net, top));
    setCierre_copied(true);
    setTimeout(() => setCierre_copied(false), 2500);
  }

  function handleWhatsAppCierre(
    delivered: Order[], allCierre: Order[], gastos: Expense[], net: number,
    top: [string, number][]
  ) {
    window.open(`https://wa.me/?text=${encodeURIComponent(generarTextoCierre(delivered, allCierre, gastos, net, top))}`, "_blank");
  }

  async function fetchAll(bounds: { from?: Date; to?: Date; limitCount?: number }) {
    const [o, e] = await Promise.all([
      getOrders(bounds.from, bounds.to, bounds.limitCount),
      getExpenses(bounds.from, bounds.to, bounds.limitCount),
    ]);
    return { orders: o, expenses: e };
  }

  // Auto-fetch para periodos fijos
  useEffect(() => {
    if (period === "range") {
      setOrders([]);
      setExpenses([]);
      setLoading(false);
      setLoadingExp(false);
      return;
    }
    let active = true;
    const bounds = getDateBounds(period, dateRange);
    fetchAll(bounds).then(({ orders: o, expenses: e }) => {
      if (!active) return;
      setOrders(o);
      setExpenses(e);
      setLoading(false);
      setLoadingExp(false);
    });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function handleRangeFetch() {
    if (!dateRange?.from || !dateRange?.to) return;
    setRangeFetching(true);
    const bounds = getDateBounds("range", dateRange);
    const { orders: o, expenses: e } = await fetchAll(bounds);
    setOrders(o);
    setExpenses(e);
    setRangeFetching(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    const bounds = getDateBounds(period, dateRange);
    const { orders: o, expenses: e } = await fetchAll(bounds);
    setOrders(o);
    setExpenses(e);
    setRefreshing(false);
  }

  async function handleStatus(id: string, status: OrderStatus) {
    setUpdatingId(id);
    await updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setUpdatingId(null);
  }

  const { count, revenue, pending, cancelled, chartData, topFlavors, periodOrders } =
    computeStats(orders, period, dateRange);
  const topFlavorMax = topFlavors[0]?.[1] || 1;

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netRevenue = revenue - totalExpenses;

  const periodLabel = period === "range"
    ? dateRange?.from
      ? dateRange.to && dateRange.to.toDateString() !== dateRange.from.toDateString()
        ? `${format(dateRange.from, "d MMM", { locale: es })} – ${format(dateRange.to, "d MMM", { locale: es })}`
        : format(dateRange.from, "d 'de' MMMM", { locale: es })
      : "rango seleccionado"
    : ({ today: "hoy", week: "esta semana", month: "este mes", all: "en total" } as Record<string, string>)[period];

  const todayStr = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const displayOrders = periodOrders.slice().sort(
    (a, b) => (b.timestamp?.toDate().getTime() ?? 0) - (a.timestamp?.toDate().getTime() ?? 0)
  ).slice(0, 40);

  const cardExpenses = expenses.filter((e) => e.paymentMethod === "card");
  const pendingCardTotal = cardExpenses.filter((e) => !e.cardPaid).reduce((s, e) => s + e.amount, 0);
  const pendingCardCount = cardExpenses.filter((e) => !e.cardPaid).length;

  // Cierre computed
  const cierreDelivered = cierreOrders.filter((o) => o.status === "delivered");
  const cierreRevenue   = cierreDelivered.reduce((s, o) => s + getOrderTotal(o), 0);
  const cierreGastos    = cierreExpenses.reduce((s, e) => s + e.amount, 0);
  const cierreNet       = cierreRevenue - cierreGastos;
  const cierre_pending  = cierreOrders.filter((o) => o.status === "pending" || o.status === "success").length;
  const topCierre: [string, number][] = (() => {
    const counts: Record<string, number> = {};
    cierreOrders.filter((o) => o.status !== "cancelled").forEach((o) => {
      if (o.items) o.items.forEach((i) => { counts[i.flavor] = (counts[i.flavor] || 0) + i.quantity; });
      else if (o.flavor) counts[o.flavor] = (counts[o.flavor] || 0) + (o.quantity || 1);
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 3);
  })();

  return (
    <>
      <style>{`
        .dash-stats  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .dash-fin    { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .dash-mid    { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .period-tabs { display: flex; gap: 4; background: #F1F5F9; border-radius: 10px; padding: 4px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; width: 100%; }
        .period-tabs::-webkit-scrollbar { display: none; }
        .dash-header { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .dash-header-actions { display: flex; gap: 8px; }
        @media (min-width: 768px) {
          .dash-stats  { grid-template-columns: repeat(4, 1fr); }
          .dash-fin    { grid-template-columns: repeat(3, 1fr); }
          .dash-mid    { grid-template-columns: 3fr 2fr; }
          .period-tabs { width: fit-content; }
          .dash-header { flex-direction: row; justify-content: space-between; align-items: flex-end; }
        }
      `}</style>

      <div style={{ padding: "28px 24px 32px", maxWidth: 1100, margin: "0 auto", fontFamily: "var(--font-poppins)" }}>

        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
              Dashboard
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: T.muted, textTransform: "capitalize" }}>
              {todayStr}
            </p>
          </div>
          <div className="dash-header-actions">
            <button
              onClick={handleOpenCierre}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                height: 36, padding: "0 14px", borderRadius: 8,
                border: "none", background: T.text,
                color: T.white, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "var(--font-poppins)",
              }}
            >
              Cierre del día
            </button>
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
        </div>

        {/* Banner editor — compacto */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: editingBanner ? "10px 10px 0 0" : 10,
          }}>
            <Megaphone size={14} style={{ color: bannerDraft.enabled ? T.blue : T.muted, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: bannerDraft.enabled && bannerDraft.message ? T.text : T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {bannerDraft.enabled && bannerDraft.message ? bannerDraft.message : "Banner del menú"}
            </span>
            {bannerDraft.enabled && !editingBanner && (
              <button onClick={() => setEditingBanner(true)} style={{ background: "none", border: "none", cursor: "pointer", color: T.mutedLight, padding: 4, display: "flex" }}>
                <Pencil size={13} />
              </button>
            )}
            {banner.enabled && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 100, background: T.blueBg, color: T.blue, border: `1px solid ${T.blueBorder}`, flexShrink: 0 }}>
                Activo
              </span>
            )}
            <button
              onClick={handleToggleBanner}
              disabled={bannerSaving}
              style={{ width: 36, height: 20, borderRadius: 10, border: "none", background: bannerDraft.enabled ? T.blue : "#CBD5E1", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, opacity: bannerSaving ? 0.6 : 1 }}
            >
              <span style={{ position: "absolute", top: 2, left: bannerDraft.enabled ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </button>
          </div>
          {editingBanner && (
            <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: T.bg, border: `1px solid ${T.border}`, borderTop: "none", borderRadius: "0 0 10px 10px" }}>
              <textarea
                value={bannerDraft.message}
                onChange={(e) => setBannerDraft((d) => ({ ...d, message: e.target.value }))}
                placeholder="Ej: Esta semana estamos en la Feria — no hay servicio a domicilio"
                rows={2}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, fontSize: 13, color: T.text, fontFamily: "var(--font-poppins)", resize: "none", outline: "none", lineHeight: 1.5 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button onClick={handleSaveBanner} disabled={bannerSaving} style={{ height: 38, padding: "0 14px", borderRadius: 8, border: "none", background: bannerSaved ? T.green : T.text, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                  {bannerSaved ? <><Check size={13} /> Guardado</> : "Guardar"}
                </button>
                <button onClick={() => { setEditingBanner(false); setBannerDraft(banner); }} style={{ height: 28, padding: "0 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-poppins)" }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Period filter tabs */}
        <div className="period-tabs" style={{ marginBottom: 20 }}>
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

        {/* Date range picker */}
        {period === "range" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    height: 36, padding: "0 14px",
                    borderRadius: 8, border: `1px solid ${T.border}`,
                    background: T.white, color: dateRange?.from ? T.text : T.muted,
                    fontSize: 13, fontFamily: "var(--font-poppins)",
                    cursor: "pointer", minWidth: 220, textAlign: "left",
                  }}
                >
                  <CalendarIcon size={14} style={{ flexShrink: 0, color: T.muted }} />
                  {dateRange?.from ? (
                    dateRange.to && dateRange.to.toDateString() !== dateRange.from.toDateString()
                      ? `${format(dateRange.from, "d MMM yyyy", { locale: es })} – ${format(dateRange.to, "d MMM yyyy", { locale: es })}`
                      : format(dateRange.from, "d MMM yyyy", { locale: es })
                  ) : (
                    "Selecciona un rango"
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" style={{ width: "auto", padding: 0 }}>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                  locale={es}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <button
              onClick={handleRangeFetch}
              disabled={!dateRange?.from || !dateRange?.to || rangeFetching}
              style={{
                height: 36, padding: "0 16px",
                borderRadius: 8, border: "none",
                background: dateRange?.from && dateRange?.to ? T.blue : T.slate,
                color: dateRange?.from && dateRange?.to ? "#fff" : T.mutedLight,
                fontSize: 13, fontWeight: 600,
                cursor: dateRange?.from && dateRange?.to ? "pointer" : "default",
                fontFamily: "var(--font-poppins)",
                opacity: rangeFetching ? 0.6 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {rangeFetching ? "Cargando..." : "Consultar"}
            </button>
          </div>
        )}

        {/* Stat cards — pedidos */}
        <div className="dash-stats" style={{ marginBottom: 12 }}>
          <StatCard label="Pedidos"    value={String(count)}     sub={`no cancelados ${periodLabel}`} loading={loading} />
          <StatCard label="Ingresos"   value={`$${revenue}`}     sub={`entregados ${periodLabel}`}    loading={loading} />
          <StatCard label="Pendientes" value={String(pending)}   sub="requieren acción ahora"         loading={loading} />
          <StatCard label="Cancelados" value={String(cancelled)} sub={periodLabel}                    loading={loading} />
        </div>

        {/* Financial summary — gastos y ganancia neta */}
        <div className="dash-fin" style={{ marginBottom: 16 }}>
          <StatCard
            label="Gastos"
            value={`$${totalExpenses}`}
            sub={`${expenses.length} registro${expenses.length !== 1 ? "s" : ""} ${periodLabel}`}
            loading={loadingExp}
            highlight={totalExpenses > 0 ? "red" : undefined}
          />
          <StatCard
            label="TDC por pagar"
            value={pendingCardTotal > 0 ? `$${pendingCardTotal}` : "—"}
            sub={pendingCardTotal > 0 ? `${pendingCardCount} cargo${pendingCardCount !== 1 ? "s" : ""} pendiente${pendingCardCount !== 1 ? "s" : ""}` : "sin cargos pendientes"}
            loading={loadingExp}
            highlight={pendingCardTotal > 0 ? "red" : undefined}
          />
          <StatCard
            label="Ganancia neta"
            value={`$${netRevenue}`}
            sub={`ingresos menos gastos ${periodLabel}`}
            loading={loading || loadingExp}
            highlight={netRevenue >= 0 ? "green" : "red"}
          />
        </div>

        {/* Mid section */}
        <div className="dash-mid" style={{ marginBottom: 16 }}>
          {/* Bar chart */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>
                {period === "all" ? "Por mes" : period === "month" ? "Por semana" : period === "range" && dateRange?.from && dateRange.to && Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000) >= 31 ? "Por semana" : "Por día"}
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
              <OrdersBarChart data={chartData} />
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

      {/* ── Modal cierre del día ──────────────────── */}
      {showCierre && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowCierre(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, fontFamily: "var(--font-poppins)",
          }}
        >
          <div style={{ background: T.white, borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>

            {/* Header */}
            <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text }}>Cierre del día</h2>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: T.muted, textTransform: "capitalize" }}>
                  {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button onClick={() => setShowCierre(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {cierreLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                  <p style={{ color: T.mutedLight, fontSize: 13, margin: 0 }}>Cargando...</p>
                </div>
              ) : (
                <>
                  {/* Stats 2x2 */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    <div style={{ padding: "14px 16px", background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
                      <p style={{ margin: "0 0 4px", fontSize: 11, color: T.muted, fontWeight: 500 }}>Órdenes activas</p>
                      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
                        {cierreOrders.filter((o) => o.status !== "cancelled").length}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: T.mutedLight }}>
                        {cierreDelivered.length} entregadas · {cierre_pending} pendientes
                      </p>
                    </div>
                    <div style={{ padding: "14px 16px", background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
                      <p style={{ margin: "0 0 4px", fontSize: 11, color: T.muted, fontWeight: 500 }}>Ingresos</p>
                      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: T.green, letterSpacing: "-0.02em" }}>${cierreRevenue}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: T.mutedLight }}>órdenes entregadas</p>
                    </div>
                    <div style={{ padding: "14px 16px", background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
                      <p style={{ margin: "0 0 4px", fontSize: 11, color: T.muted, fontWeight: 500 }}>Gastos del día</p>
                      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: cierreGastos > 0 ? T.red : T.mutedLight, letterSpacing: "-0.02em" }}>${cierreGastos}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: T.mutedLight }}>{cierreExpenses.length} registro{cierreExpenses.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div style={{ padding: "14px 16px", background: cierreNet >= 0 ? T.greenBg : T.redBg, borderRadius: 10, border: `1px solid ${cierreNet >= 0 ? T.greenBorder : T.redBorder}` }}>
                      <p style={{ margin: "0 0 4px", fontSize: 11, color: T.muted, fontWeight: 500 }}>Ganancia neta</p>
                      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: cierreNet >= 0 ? T.green : T.red, letterSpacing: "-0.02em" }}>${cierreNet}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: T.mutedLight }}>ingresos − gastos</p>
                    </div>
                  </div>

                  {/* Top bebidas */}
                  {topCierre.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Top bebidas hoy
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {topCierre.map(([name, cnt], i) => (
                          <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: T.bg, borderRadius: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? T.blue : T.mutedLight, width: 14, textAlign: "center" }}>{i + 1}</span>
                              <span style={{ fontSize: 13, color: T.secondary }}>{name}</span>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>{cnt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleCopiarCierre(cierreDelivered, cierreOrders, cierreExpenses, cierreNet, topCierre)}
                      style={{
                        flex: 1, height: 42, borderRadius: 10,
                        border: `1px solid ${T.border}`,
                        background: cierre_copied ? T.greenBg : T.white,
                        color: cierre_copied ? T.green : T.secondary,
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        fontFamily: "var(--font-poppins)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        transition: "all 0.2s",
                      }}
                    >
                      {cierre_copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                    </button>
                    <button
                      onClick={() => handleWhatsAppCierre(cierreDelivered, cierreOrders, cierreExpenses, cierreNet, topCierre)}
                      style={{
                        flex: 1, height: 42, borderRadius: 10,
                        border: "none", background: "#25D366", color: "#fff",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        fontFamily: "var(--font-poppins)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
