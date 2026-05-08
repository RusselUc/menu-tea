"use client";
import { useEffect, useState } from "react";
import {
  Plus, Trash2, CreditCard, Banknote, CalendarIcon, RefreshCw,
  TrendingDown, Clock, CheckCircle2,
} from "lucide-react";
import { type DateRange } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  getExpenses,
  addExpense,
  updateExpenseCardPaid,
  updateExpenseInstallmentPaid,
  deleteExpense,
  Expense,
  PaymentMethod,
} from "@/lib/expenses";

// ── Tokens (mismo sistema que el dashboard) ──────────────
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
  purple: "#7C3AED",
  purpleBg: "#F5F3FF",
  purpleBorder: "#DDD6FE",
};

// ── Period filter ─────────────────────────────────────────
type Period = "today" | "week" | "month" | "all" | "range";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "week",  label: "Semana" },
  { id: "month", label: "Mes" },
  { id: "all",   label: "Todo" },
  { id: "range", label: "Rango" },
];

// ── Helpers ──────────────────────────────────────────────
function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDateBounds(period: Period, dateRange?: DateRange): { from?: Date; to?: Date; limitCount?: number } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "today") return { from: today };
  if (period === "week")  { const d = new Date(today); d.setDate(d.getDate() - 6); return { from: d }; }
  if (period === "month") { const d = new Date(today); d.setDate(d.getDate() - 29); return { from: d }; }
  if (period === "range") return { from: dateRange?.from, to: dateRange?.to };
  return { limitCount: 500 };
}

function formatDate(ts: { toDate: () => Date }): string {
  return ts.toDate().toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

// ── Add form ──────────────────────────────────────────────
const INSTALLMENT_OPTIONS = [3, 6, 9, 12, 18, 24];
const EMPTY = {
  description: "", amount: "", paymentMethod: "cash" as PaymentMethod,
  cardDueDate: "", date: todayDateString(),
  useInstallments: false, installments: "12",
};

function AddExpenseForm({ onSave, onCancel }: {
  onSave: (form: typeof EMPTY) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const inputStyle = {
    height: 40, padding: "0 13px",
    borderRadius: 8, border: `1px solid ${T.border}`,
    background: T.white, fontSize: 13,
    fontFamily: "var(--font-poppins)", color: T.text,
    outline: "none", width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: T.muted,
    textTransform: "uppercase", letterSpacing: "0.06em",
  };

  const monthlyAmount = form.useInstallments && form.amount && parseInt(form.installments) > 0
    ? (parseFloat(form.amount) / parseInt(form.installments)).toFixed(2)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Fecha + Monto */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={labelStyle}>Fecha del gasto</label>
          <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required max={todayDateString()} style={inputStyle} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={labelStyle}>Monto total</label>
          <input type="number" placeholder="$0" value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            required min={0} style={inputStyle} />
        </div>
      </div>

      {/* Descripción */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <label style={labelStyle}>Descripción</label>
        <input placeholder="¿En qué se gastó?" value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          required style={inputStyle} />
      </div>

      {/* Método de pago */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <label style={labelStyle}>Método de pago</label>
        <div style={{ display: "flex", background: T.slate, borderRadius: 8, padding: 3, gap: 2, width: "fit-content" }}>
          {(["cash", "card"] as PaymentMethod[]).map((m) => (
            <button key={m} type="button"
              onClick={() => setForm((f) => ({ ...f, paymentMethod: m, cardDueDate: "", useInstallments: false }))}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                height: 34, padding: "0 16px", borderRadius: 6, border: "none",
                background: form.paymentMethod === m ? T.white : "transparent",
                color: form.paymentMethod === m ? T.text : T.muted,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-poppins)",
                boxShadow: form.paymentMethod === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              {m === "cash" ? <Banknote size={14} /> : <CreditCard size={14} />}
              {m === "cash" ? "Efectivo" : "TDC"}
            </button>
          ))}
        </div>
      </div>

      {/* Opciones TDC */}
      {form.paymentMethod === "card" && (
        <div style={{
          background: T.purpleBg, border: `1px solid ${T.purpleBorder}`,
          borderRadius: 10, padding: "14px 16px",
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          {/* Toggle meses sin intereses */}
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, useInstallments: !f.useInstallments }))}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontFamily: "var(--font-poppins)",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: T.purple }}>
              Meses sin intereses
            </span>
            {/* Toggle pill */}
            <div style={{
              width: 36, height: 20, borderRadius: 10,
              background: form.useInstallments ? T.purple : T.slateBorder,
              position: "relative", transition: "background 0.2s", flexShrink: 0,
            }}>
              <div style={{
                position: "absolute", top: 2,
                left: form.useInstallments ? 18 : 2,
                width: 16, height: 16, borderRadius: "50%",
                background: T.white, transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </div>
          </button>

          {form.useInstallments && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Opciones rápidas */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ ...labelStyle, color: T.purple }}>Número de meses</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {INSTALLMENT_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, installments: String(m) }))}
                      style={{
                        height: 32, padding: "0 14px", borderRadius: 7,
                        border: `1px solid ${form.installments === String(m) ? T.purple : T.purpleBorder}`,
                        background: form.installments === String(m) ? T.purple : T.white,
                        color: form.installments === String(m) ? T.white : T.purple,
                        fontSize: 12, fontWeight: 600,
                        cursor: "pointer", fontFamily: "var(--font-poppins)",
                        transition: "all 0.12s",
                      }}
                    >
                      {m}
                    </button>
                  ))}
                  <input
                    type="number"
                    placeholder="Otro"
                    min={2}
                    value={INSTALLMENT_OPTIONS.includes(parseInt(form.installments)) ? "" : form.installments}
                    onChange={(e) => setForm((f) => ({ ...f, installments: e.target.value }))}
                    style={{
                      height: 32, width: 68, padding: "0 10px", borderRadius: 7,
                      border: `1px solid ${T.purpleBorder}`, background: T.white,
                      fontSize: 12, fontFamily: "var(--font-poppins)", color: T.purple,
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Mensualidad calculada */}
              {monthlyAmount && (
                <div style={{
                  background: T.white, borderRadius: 8, padding: "10px 14px",
                  border: `1px solid ${T.purpleBorder}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 12, color: T.muted }}>Mensualidad aprox.</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.purple }}>
                    ${monthlyAmount} / mes
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Fecha de pago */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ ...labelStyle, color: T.purple }}>
              {form.useInstallments ? "Fecha de primer pago" : "Fecha de pago"}
            </label>
            <input type="date" value={form.cardDueDate}
              onChange={(e) => setForm((f) => ({ ...f, cardDueDate: e.target.value }))}
              style={{ ...inputStyle, width: "auto", borderColor: T.purpleBorder }} />
          </div>
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
        <button type="button" onClick={onCancel} style={{
          height: 40, padding: "0 16px", borderRadius: 8,
          border: `1px solid ${T.border}`, background: T.white, color: T.muted,
          fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-poppins)",
        }}>
          Cancelar
        </button>
        <button type="submit" disabled={saving || !form.description.trim() || !form.amount} style={{
          height: 40, padding: "0 20px", borderRadius: 8, border: "none",
          background: T.text, color: T.white, fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "var(--font-poppins)",
          opacity: saving || !form.description.trim() || !form.amount ? 0.5 : 1,
          transition: "opacity 0.15s",
        }}>
          {saving ? "Guardando..." : "Guardar gasto"}
        </button>
      </div>
    </form>
  );
}

// ── Summary card ──────────────────────────────────────────
function SummaryCard({ icon, label, value, sub, color, bg, border }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  color: string; bg: string; border: string;
}) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: "16px 18px",
      display: "flex", gap: 14, alignItems: "flex-start",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: bg, border: `1px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: "0 0 2px", fontSize: 11, color: T.muted, fontWeight: 500 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{value}</p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: T.mutedLight }}>{sub}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────
export default function GastosPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return { from: today, to: today };
  });
  const [rangeFetching, setRangeFetching] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "cash" | "card">("all");

  async function fetchExpenses(bounds: { from?: Date; to?: Date; limitCount?: number }) {
    return getExpenses(bounds.from, bounds.to, bounds.limitCount);
  }

  useEffect(() => {
    if (period === "range") {
      setExpenses([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const bounds = getDateBounds(period, dateRange);
    fetchExpenses(bounds).then((e) => {
      if (!active) return;
      setExpenses(e);
      setLoading(false);
    });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function handleRangeFetch() {
    if (!dateRange?.from || !dateRange?.to) return;
    setRangeFetching(true);
    const e = await fetchExpenses(getDateBounds("range", dateRange));
    setExpenses(e);
    setRangeFetching(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    const bounds = getDateBounds(period, dateRange);
    const e = await fetchExpenses(bounds);
    setExpenses(e);
    setRefreshing(false);
  }

  async function handleSave(form: typeof EMPTY) {
    const { Timestamp } = await import("firebase/firestore");
    const [year, month, day] = form.date.split("-").map(Number);
    const expenseDate = new Date(year, month - 1, day, 12, 0, 0);
    const expense: Omit<Expense, "id"> = {
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      paymentMethod: form.paymentMethod,
      timestamp: Timestamp.fromDate(expenseDate),
    };
    if (form.paymentMethod === "card") {
      expense.cardPaid = false;
      if (form.cardDueDate) {
        const [y, m, d] = form.cardDueDate.split("-").map(Number);
        expense.cardDueDate = Timestamp.fromDate(new Date(y, m - 1, d, 12, 0, 0));
      }
      if (form.useInstallments && parseInt(form.installments) > 1) {
        expense.installments = parseInt(form.installments);
        expense.installmentsPaid = 0;
      }
    }
    await addExpense(expense);
    setShowForm(false);
    const bounds = getDateBounds(period, dateRange);
    const e = await fetchExpenses(bounds);
    setExpenses(e);
  }

  async function handleTogglePaid(exp: Expense) {
    setTogglingId(exp.id);
    const newPaid = !exp.cardPaid;
    await updateExpenseCardPaid(exp.id, newPaid);
    setExpenses((prev) => prev.map((e) => (e.id === exp.id ? { ...e, cardPaid: newPaid } : e)));
    setTogglingId(null);
  }

  async function handleRegisterInstallment(exp: Expense) {
    if (!exp.installments) return;
    setTogglingId(exp.id);
    const newPaid = (exp.installmentsPaid ?? 0) + 1;
    const fullyPaid = newPaid >= exp.installments;
    await updateExpenseInstallmentPaid(exp.id, newPaid, fullyPaid);
    setExpenses((prev) => prev.map((e) =>
      e.id === exp.id ? { ...e, installmentsPaid: newPaid, cardPaid: fullyPaid } : e
    ));
    setTogglingId(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  }

  // ── Computed ─────────────────────────────────────────
  const totalGastos = expenses.reduce((s, e) => s + e.amount, 0);
  const cashTotal = expenses.filter((e) => e.paymentMethod === "cash").reduce((s, e) => s + e.amount, 0);
  const cardExpenses = expenses.filter((e) => e.paymentMethod === "card");
  const cardTotal = cardExpenses.reduce((s, e) => s + e.amount, 0);
  const pendingCard = cardExpenses.filter((e) => !e.cardPaid);
  // Para meses sin intereses: sólo contar el monto restante (mensualidades pendientes × monto mensual)
  const pendingCardTotal = pendingCard.reduce((s, e) => {
    if (e.installments && e.installments > 1) {
      const remaining = e.installments - (e.installmentsPaid ?? 0);
      return s + (e.amount / e.installments) * remaining;
    }
    return s + e.amount;
  }, 0);

  const displayed = expenses.filter((e) =>
    filter === "all" ? true : e.paymentMethod === (filter === "card" ? "card" : "cash")
  );

  const todayStr = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const periodLabel = period === "range"
    ? dateRange?.from
      ? dateRange.to && dateRange.to.toDateString() !== dateRange.from.toDateString()
        ? `${format(dateRange.from, "d MMM", { locale: es })} – ${format(dateRange.to, "d MMM", { locale: es })}`
        : format(dateRange.from, "d 'de' MMMM", { locale: es })
      : "rango"
    : ({ today: "hoy", week: "esta semana", month: "este mes", all: "en total" } as Record<string, string>)[period];

  return (
    <>
      <style>{`
        .gastos-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .gastos-header { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
        .gastos-header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .period-tabs { display: flex; gap: 4; background: #F1F5F9; border-radius: 10px; padding: 4px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; width: 100%; }
        .period-tabs::-webkit-scrollbar { display: none; }
        @media (min-width: 640px) {
          .gastos-header { flex-direction: row; justify-content: space-between; align-items: flex-end; }
          .gastos-header-actions { flex-wrap: nowrap; }
        }
        @media (min-width: 768px) {
          .gastos-summary { grid-template-columns: repeat(4, 1fr); }
          .period-tabs { width: fit-content; }
        }
      `}</style>

      <div style={{ padding: "28px 24px 40px", maxWidth: 1100, margin: "0 auto", fontFamily: "var(--font-poppins)" }}>

        {/* Header */}
        <div className="gastos-header">
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
              Gastos
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: T.muted, textTransform: "capitalize" }}>
              {todayStr}
            </p>
          </div>
          <div className="gastos-header-actions">
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
            <button
              onClick={() => setShowForm(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                height: 36, padding: "0 16px", borderRadius: 8,
                border: "none", background: T.text, color: T.white,
                fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "var(--font-poppins)",
              }}
            >
              <Plus size={14} />
              Nuevo gasto
            </button>
          </div>
        </div>

        {/* Drawer */}
        {showForm && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "flex-end" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <div style={{
              width: "min(480px, 100vw)", height: "100vh",
              background: T.white, overflowY: "auto",
              padding: "28px 24px 40px",
              display: "flex", flexDirection: "column", gap: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>
                  Nuevo gasto
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: T.muted, padding: 4 }}
                >
                  ×
                </button>
              </div>
              <AddExpenseForm onSave={handleSave} onCancel={() => setShowForm(false)} />
            </div>
          </div>
        )}

        {/* Period tabs */}
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
                cursor: "pointer", fontFamily: "var(--font-poppins)",
                boxShadow: period === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Range picker */}
        {period === "range" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Popover>
              <PopoverTrigger asChild>
                <button style={{
                  display: "flex", alignItems: "center", gap: 8,
                  height: 36, padding: "0 14px",
                  borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.white, color: dateRange?.from ? T.text : T.muted,
                  fontSize: 13, fontFamily: "var(--font-poppins)",
                  cursor: "pointer", minWidth: 220,
                }}>
                  <CalendarIcon size={14} style={{ color: T.muted }} />
                  {dateRange?.from
                    ? dateRange.to && dateRange.to.toDateString() !== dateRange.from.toDateString()
                      ? `${format(dateRange.from, "d MMM yyyy", { locale: es })} – ${format(dateRange.to, "d MMM yyyy", { locale: es })}`
                      : format(dateRange.from, "d MMM yyyy", { locale: es })
                    : "Selecciona un rango"}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" style={{ width: "auto", padding: 0 }}>
                <Calendar mode="range" selected={dateRange} onSelect={setDateRange}
                  numberOfMonths={2} disabled={{ after: new Date() }} locale={es} initialFocus />
              </PopoverContent>
            </Popover>
            <button
              onClick={handleRangeFetch}
              disabled={!dateRange?.from || !dateRange?.to || rangeFetching}
              style={{
                height: 36, padding: "0 16px", borderRadius: 8, border: "none",
                background: dateRange?.from && dateRange?.to ? T.blue : T.slate,
                color: dateRange?.from && dateRange?.to ? "#fff" : T.mutedLight,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-poppins)",
                opacity: rangeFetching ? 0.6 : 1,
              }}
            >
              {rangeFetching ? "Cargando..." : "Consultar"}
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="gastos-summary" style={{ marginBottom: 20 }}>
          <SummaryCard
            icon={<TrendingDown size={16} />}
            label="Total gastos"
            value={loading ? "—" : `$${totalGastos}`}
            sub={`${expenses.length} registro${expenses.length !== 1 ? "s" : ""} ${periodLabel}`}
            color={T.red} bg={T.redBg} border={T.redBorder}
          />
          <SummaryCard
            icon={<Banknote size={16} />}
            label="Efectivo"
            value={loading ? "—" : `$${cashTotal}`}
            sub={`${expenses.filter((e) => e.paymentMethod === "cash").length} gasto${expenses.filter((e) => e.paymentMethod === "cash").length !== 1 ? "s" : ""}`}
            color={T.muted} bg={T.slate} border={T.slateBorder}
          />
          <SummaryCard
            icon={<CreditCard size={16} />}
            label="TDC total"
            value={loading ? "—" : `$${cardTotal}`}
            sub={`${cardExpenses.length} cargo${cardExpenses.length !== 1 ? "s" : ""} registrado${cardExpenses.length !== 1 ? "s" : ""}`}
            color={T.purple} bg={T.purpleBg} border={T.purpleBorder}
          />
          <SummaryCard
            icon={<Clock size={16} />}
            label="TDC por pagar"
            value={loading ? "—" : pendingCardTotal > 0 ? `$${pendingCardTotal}` : "—"}
            sub={pendingCard.length > 0 ? `${pendingCard.length} cargo${pendingCard.length !== 1 ? "s" : ""} pendiente${pendingCard.length !== 1 ? "s" : ""}` : "sin cargos pendientes"}
            color={pendingCardTotal > 0 ? T.amber : T.mutedLight}
            bg={pendingCardTotal > 0 ? T.amberBg : T.slate}
            border={pendingCardTotal > 0 ? T.amberBorder : T.slateBorder}
          />
        </div>

        {/* Expense list */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{
            padding: "14px 20px", borderBottom: `1px solid ${T.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
          }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>
              Registros
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: T.mutedLight }}>
                {displayed.length} de {expenses.length}
              </span>
            </p>
            {/* Filter chips */}
            <div style={{ display: "flex", gap: 4 }}>
              {(["all", "cash", "card"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    height: 28, padding: "0 12px",
                    borderRadius: 100,
                    border: `1px solid ${filter === f ? T.text : T.border}`,
                    background: filter === f ? T.text : "transparent",
                    color: filter === f ? T.white : T.muted,
                    fontSize: 11, fontWeight: 600,
                    cursor: "pointer", fontFamily: "var(--font-poppins)",
                    transition: "all 0.12s",
                  }}
                >
                  {f === "all" ? "Todos" : f === "cash" ? "Efectivo" : "TDC"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3].map((i) => <div key={i} style={{ height: 64, borderRadius: 8, background: T.slate }} />)}
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 0" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: T.slate,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <TrendingDown size={20} style={{ color: T.mutedLight }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.secondary, margin: "0 0 4px" }}>
                Sin gastos registrados
              </p>
              <p style={{ fontSize: 12, color: T.mutedLight, margin: 0 }}>
                {period === "range" ? "Selecciona un rango y presiona Consultar" : `No hay gastos ${periodLabel}`}
              </p>
            </div>
          ) : (
            <div>
              {displayed.map((exp, idx) => {
                const isCard = exp.paymentMethod === "card";
                const dueDate = exp.cardDueDate?.toDate();
                const now = new Date();
                const isOverdue = isCard && !exp.cardPaid && dueDate && dueDate < now;
                const isDueSoon = isCard && !exp.cardPaid && dueDate && dueDate >= now &&
                  dueDate <= new Date(now.getTime() + 7 * 86400000);
                const isDeleting = deletingId === exp.id;
                const isToggling = togglingId === exp.id;
                const hasInstallments = isCard && exp.installments && exp.installments > 1;
                const installmentsPaid = exp.installmentsPaid ?? 0;
                const installmentsLeft = hasInstallments ? exp.installments! - installmentsPaid : 0;
                const monthlyAmount = hasInstallments ? exp.amount / exp.installments! : 0;

                const barColor = isCard
                  ? exp.cardPaid ? T.green : isOverdue ? T.red : isDueSoon ? T.amber : T.purple
                  : "#CBD5E1";

                return (
                  <div key={exp.id} style={{
                    padding: "14px 20px",
                    borderBottom: idx < displayed.length - 1 ? `1px solid ${T.border}` : "none",
                    borderLeft: `3px solid ${barColor}`,
                    display: "flex", alignItems: "center", gap: 14,
                    opacity: isDeleting ? 0.4 : 1,
                    transition: "opacity 0.15s",
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: isCard ? T.purpleBg : T.slate,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isCard
                        ? <CreditCard size={15} style={{ color: T.purple }} />
                        : <Banknote size={15} style={{ color: T.muted }} />
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
                        <p style={{
                          margin: 0, fontSize: 13, fontWeight: 600, color: T.text,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {exp.description}
                        </p>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, flexShrink: 0,
                          background: isCard ? T.purpleBg : T.slate,
                          color: isCard ? T.purple : T.muted,
                          border: `1px solid ${isCard ? T.purpleBorder : T.slateBorder}`,
                        }}>
                          {isCard ? "TDC" : "Efectivo"}
                        </span>
                        {isCard && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, flexShrink: 0,
                            display: "flex", alignItems: "center", gap: 3,
                            background: exp.cardPaid ? T.greenBg : isOverdue ? T.redBg : isDueSoon ? T.amberBg : T.slate,
                            color: exp.cardPaid ? T.green : isOverdue ? T.red : isDueSoon ? T.amber : T.muted,
                            border: `1px solid ${exp.cardPaid ? T.greenBorder : isOverdue ? T.redBorder : isDueSoon ? T.amberBorder : T.slateBorder}`,
                          }}>
                            {exp.cardPaid && <CheckCircle2 size={9} />}
                            {exp.cardPaid ? "Pagado" : isOverdue ? "Vencido" : isDueSoon ? "Próximo" : "Pendiente"}
                          </span>
                        )}
                        {hasInstallments && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, flexShrink: 0,
                            background: T.purpleBg, color: T.purple, border: `1px solid ${T.purpleBorder}`,
                          }}>
                            {installmentsPaid}/{exp.installments} meses
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 11.5, color: T.mutedLight }}>
                        {exp.timestamp ? formatDate(exp.timestamp) : ""}
                        {isCard && dueDate && (
                          <> · vence el {dueDate.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</>
                        )}
                        {hasInstallments && !exp.cardPaid && (
                          <> · siguiente: ${monthlyAmount.toFixed(0)}</>
                        )}
                      </p>
                      {/* Barra de progreso mensualidades */}
                      {hasInstallments && (
                        <div style={{ marginTop: 6, height: 4, background: T.slate, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${(installmentsPaid / exp.installments!) * 100}%`,
                            background: exp.cardPaid ? T.green : T.purple,
                            borderRadius: 2, transition: "width 0.3s",
                          }} />
                        </div>
                      )}
                    </div>

                    {/* Amount + actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.red, letterSpacing: "-0.02em" }}>
                          −${exp.amount}
                        </div>
                        {hasInstallments && (
                          <div style={{ fontSize: 10, color: T.mutedLight, marginTop: 1 }}>
                            ${monthlyAmount.toFixed(0)}/mes
                          </div>
                        )}
                      </div>

                      {isCard && !hasInstallments && (
                        <button
                          onClick={() => handleTogglePaid(exp)}
                          disabled={isToggling}
                          title={exp.cardPaid ? "Marcar como no pagado" : "Marcar como pagado"}
                          style={{
                            height: 30, padding: "0 12px", borderRadius: 7,
                            border: `1px solid ${exp.cardPaid ? T.greenBorder : T.amberBorder}`,
                            background: exp.cardPaid ? T.greenBg : T.amberBg,
                            color: exp.cardPaid ? T.green : T.amber,
                            fontSize: 11, fontWeight: 600,
                            cursor: "pointer", fontFamily: "var(--font-poppins)",
                            opacity: isToggling ? 0.5 : 1,
                            whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4,
                          }}
                        >
                          {exp.cardPaid ? <><CheckCircle2 size={11} /> Pagado</> : "Marcar pagado"}
                        </button>
                      )}

                      {hasInstallments && !exp.cardPaid && (
                        <button
                          onClick={() => handleRegisterInstallment(exp)}
                          disabled={isToggling}
                          style={{
                            height: 30, padding: "0 12px", borderRadius: 7,
                            border: `1px solid ${T.purpleBorder}`,
                            background: T.purpleBg, color: T.purple,
                            fontSize: 11, fontWeight: 600,
                            cursor: "pointer", fontFamily: "var(--font-poppins)",
                            opacity: isToggling ? 0.5 : 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isToggling ? "..." : `+1 mes (${installmentsLeft} rest.)`}
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(exp.id)}
                        disabled={isDeleting}
                        title="Eliminar"
                        style={{
                          width: 30, height: 30, padding: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: 7, border: `1px solid ${T.border}`,
                          background: "transparent", color: T.mutedLight,
                          cursor: "pointer", transition: "all 0.12s",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
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
