"use client";
import { useEffect, useState } from "react";
import {
  Plus, Trash2, CreditCard, Banknote, CalendarIcon, RefreshCw,
  TrendingDown, Clock, CheckCircle2, Pencil,
} from "lucide-react";
import { type DateRange } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  getExpenses,
  addExpense,
  updateExpense,
  updateExpenseCardPaid,
  updateExpensePaidMonths,
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
  if (period === "today") return { from: today, to: today };
  if (period === "week")  { const d = new Date(today); d.setDate(d.getDate() - 6); return { from: d, to: today }; }
  if (period === "month") { const d = new Date(today); d.setDate(d.getDate() - 29); return { from: d, to: today }; }
  if (period === "range") return { from: dateRange?.from, to: dateRange?.to };
  return { limitCount: 500 };
}

function formatDate(ts: { toDate: () => Date }): string {
  return ts.toDate().toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

// ── Form types & helpers ──────────────────────────────────
const INSTALLMENT_OPTIONS = [3, 6, 9, 12, 18, 24];

const EMPTY = {
  description: "", amount: "", paymentMethod: "cash" as PaymentMethod,
  cardName: "", paymentDate: "", date: todayDateString(),
  useInstallments: false, installments: "12",
};

type ExpenseForm = typeof EMPTY;

function expenseToForm(exp: Expense): ExpenseForm {
  function tsToDateStr(ts: { toDate: () => Date } | undefined): string {
    const d = ts?.toDate();
    if (!d) return todayDateString();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Si existe purchaseDate es un registro nuevo: purchaseDate = compra, timestamp = pago
  // Si no, es legacy: timestamp = compra (sin fecha de pago separada)
  const purchaseDateStr = tsToDateStr(exp.purchaseDate ?? exp.timestamp);
  let paymentDateStr = "";
  if (exp.purchaseDate) {
    // Nuevo formato: timestamp tiene la fecha de pago
    paymentDateStr = tsToDateStr(exp.timestamp);
  } else if (exp.paymentMethod === "card" && exp.cardDueDay && exp.firstPaymentMonth) {
    // Legacy: reconstruir desde firstPaymentMonth + cardDueDay
    const [ly, lm] = exp.firstPaymentMonth.split("-").map(Number);
    const legacyPay = new Date(ly, lm - 1, exp.cardDueDay);
    paymentDateStr = `${legacyPay.getFullYear()}-${String(legacyPay.getMonth() + 1).padStart(2, "0")}-${String(legacyPay.getDate()).padStart(2, "0")}`;
  }

  return {
    description: exp.description,
    amount: String(exp.amount),
    paymentMethod: exp.paymentMethod,
    cardName: exp.cardName ?? "",
    date: purchaseDateStr,
    paymentDate: paymentDateStr,
    useInstallments: !!(exp.installments && exp.installments > 1),
    installments: exp.installments ? String(exp.installments) : "12",
  };
}

// Genera los meses de pago dado el mes inicial "YYYY-MM", N meses y el día de pago
function getInstallmentMonths(firstPaymentMonth: string, installments: number, dueDay: number): { key: string; label: string; date: Date }[] {
  const [year, month] = firstPaymentMonth.split("-").map(Number);
  return Array.from({ length: installments }, (_, i) => {
    const d = new Date(year, month - 1 + i, dueDay);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    return { key, label, date: d };
  });
}

function ExpenseFormFields({ form, setForm, saving, onCancel, submitLabel }: {
  form: ExpenseForm;
  setForm: React.Dispatch<React.SetStateAction<ExpenseForm>>;
  saving: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  const inputStyle: React.CSSProperties = {
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

  return (
    <>
      {/* Fecha + Monto */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={labelStyle}>Fecha del gasto</label>
          <input type="date" value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
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
              onClick={() => setForm((f) => ({ ...f, paymentMethod: m, useInstallments: false }))}
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
          borderRadius: 10, padding: "16px",
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          {/* Nombre de tarjeta */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ ...labelStyle, color: T.purple }}>Nombre de tarjeta</label>
            <input
              placeholder="Ej. BBVA, Banamex, Amex..."
              value={form.cardName}
              onChange={(e) => setForm((f) => ({ ...f, cardName: e.target.value }))}
              style={{ ...inputStyle, borderColor: T.purpleBorder }}
            />
          </div>

          {/* Fecha de pago */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ ...labelStyle, color: T.purple }}>Fecha de pago</label>
            <input
              type="date"
              value={form.paymentDate}
              onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
              style={{ ...inputStyle, borderColor: T.purpleBorder }}
              required
            />
          </div>

          {/* Toggle meses sin intereses */}
          <button type="button"
            onClick={() => setForm((f) => ({ ...f, useInstallments: !f.useInstallments }))}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontFamily: "var(--font-poppins)",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: T.purple }}>Meses sin intereses</span>
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
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ ...labelStyle, color: T.purple }}>Número de meses</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {INSTALLMENT_OPTIONS.map((m) => (
                    <button key={m} type="button"
                      onClick={() => setForm((f) => ({ ...f, installments: String(m) }))}
                      style={{
                        height: 32, padding: "0 14px", borderRadius: 7,
                        border: `1px solid ${form.installments === String(m) ? T.purple : T.purpleBorder}`,
                        background: form.installments === String(m) ? T.purple : T.white,
                        color: form.installments === String(m) ? T.white : T.purple,
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "var(--font-poppins)", transition: "all 0.12s",
                      }}
                    >
                      {m}
                    </button>
                  ))}
                  <input type="number" placeholder="Otro" min={2}
                    value={INSTALLMENT_OPTIONS.includes(parseInt(form.installments)) ? "" : form.installments}
                    onChange={(e) => setForm((f) => ({ ...f, installments: e.target.value }))}
                    style={{
                      height: 32, width: 68, padding: "0 10px", borderRadius: 7,
                      border: `1px solid ${T.purpleBorder}`, background: T.white,
                      fontSize: 12, fontFamily: "var(--font-poppins)", color: T.purple, outline: "none",
                    }}
                  />
                </div>
              </div>
              {monthlyAmount && (
                <div style={{
                  background: T.white, borderRadius: 8, padding: "10px 14px",
                  border: `1px solid ${T.purpleBorder}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 12, color: T.muted }}>Mensualidad aprox.</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.purple }}>${monthlyAmount} / mes</span>
                </div>
              )}
            </div>
          )}
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
        <button type="submit" disabled={saving || !form.description.trim() || !form.amount || (form.paymentMethod === "card" && !form.paymentDate)} style={{
          height: 40, padding: "0 20px", borderRadius: 8, border: "none",
          background: T.text, color: T.white, fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "var(--font-poppins)",
          opacity: saving || !form.description.trim() || !form.amount || (form.paymentMethod === "card" && !form.paymentDate) ? 0.5 : 1,
          transition: "opacity 0.15s",
        }}>
          {saving ? "Guardando..." : submitLabel}
        </button>
      </div>
    </>
  );
}

function ExpenseFormWrapper({ initial, onSave, onCancel }: {
  initial?: ExpenseForm;
  onSave: (form: ExpenseForm) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ExpenseForm>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ExpenseFormFields
        form={form} setForm={setForm} saving={saving}
        onCancel={onCancel} submitLabel={initial ? "Guardar cambios" : "Guardar gasto"}
      />
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
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [payingMonthId, setPayingMonthId] = useState<string | null>(null); // id del gasto con picker abierto
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

  async function handleSave(form: ExpenseForm) {
    const { Timestamp } = await import("firebase/firestore");
    const [year, month, day] = form.date.split("-").map(Number);
    const purchaseDateObj = new Date(year, month - 1, day, 12, 0, 0);

    const data: Omit<Expense, "id"> = {
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      paymentMethod: form.paymentMethod,
      timestamp: Timestamp.fromDate(purchaseDateObj),
    };

    if (form.paymentMethod === "card") {
      const [py, pm, pd] = form.paymentDate.split("-").map(Number);
      const paymentDateObj = new Date(py, pm - 1, pd, 12, 0, 0);

      // timestamp = fecha de pago (para filtros por periodo)
      // purchaseDate = fecha real de la compra (para display)
      data.timestamp = Timestamp.fromDate(paymentDateObj);
      data.purchaseDate = Timestamp.fromDate(purchaseDateObj);
      data.cardName = form.cardName.trim() || undefined;
      // Derivar cardDueDay y firstPaymentMonth de la fecha de pago (necesarios para MSI)
      data.cardDueDay = pd;
      data.firstPaymentMonth = `${py}-${String(pm).padStart(2, "0")}`;
      if (!editingExpense) data.cardPaid = false;
      if (form.useInstallments && parseInt(form.installments) > 1) {
        data.installments = parseInt(form.installments);
        if (!editingExpense) data.installmentsPaid = 0;
      }
    }

    if (editingExpense) {
      await updateExpense(editingExpense.id, data);
      setExpenses((prev) => prev.map((e) => e.id === editingExpense.id ? { ...e, ...data, id: editingExpense.id } : e));
      setEditingExpense(null);
    } else {
      await addExpense(data);
      const bounds = getDateBounds(period, dateRange);
      const e = await fetchExpenses(bounds);
      setExpenses(e);
    }
    setShowForm(false);
  }

  async function handleTogglePaid(exp: Expense) {
    setTogglingId(exp.id);
    const newPaid = !exp.cardPaid;
    await updateExpenseCardPaid(exp.id, newPaid);
    setExpenses((prev) => prev.map((e) => (e.id === exp.id ? { ...e, cardPaid: newPaid } : e)));
    setTogglingId(null);
  }

  async function handleToggleMonth(exp: Expense, monthKey: string) {
    if (!exp.installments) return;
    setTogglingId(exp.id);
    const current = exp.paidMonths ?? [];
    const newPaidMonths = current.includes(monthKey)
      ? current.filter((m) => m !== monthKey)
      : [...current, monthKey].sort();
    const fullyPaid = newPaidMonths.length >= exp.installments;
    await updateExpensePaidMonths(exp.id, newPaidMonths, fullyPaid);
    setExpenses((prev) => prev.map((e) =>
      e.id === exp.id ? { ...e, paidMonths: newPaidMonths, installmentsPaid: newPaidMonths.length, cardPaid: fullyPaid } : e
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
            onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingExpense(null); } }}
          >
            <div style={{
              width: "min(480px, 100vw)", height: "100vh",
              background: T.white, overflowY: "auto",
              padding: "28px 24px 40px",
              display: "flex", flexDirection: "column", gap: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>
                  {editingExpense ? "Editar gasto" : "Nuevo gasto"}
                </h2>
                <button
                  onClick={() => { setShowForm(false); setEditingExpense(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: T.muted, padding: 4 }}
                >
                  ×
                </button>
              </div>
              <ExpenseFormWrapper
                initial={editingExpense ? expenseToForm(editingExpense) : undefined}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditingExpense(null); }}
              />
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
                const now = new Date();
                // Para TDC nuevos: timestamp = fecha de pago. Para legacy: cardDueDate o null.
                const paymentDateObj = isCard
                  ? (exp.purchaseDate ? exp.timestamp?.toDate() : exp.cardDueDate?.toDate()) ?? null
                  : null;
                const isOverdue = isCard && !exp.cardPaid && paymentDateObj && paymentDateObj < now;
                const isDueSoon = isCard && !exp.cardPaid && paymentDateObj && paymentDateObj >= now &&
                  paymentDateObj <= new Date(now.getTime() + 7 * 86400000);
                const isDeleting = deletingId === exp.id;
                const isToggling = togglingId === exp.id;
                const hasInstallments = isCard && exp.installments && exp.installments > 1;
                const paidMonths = exp.paidMonths ?? (exp.installmentsPaid ? Array(exp.installmentsPaid).fill("") : []);
                const installmentsPaidCount = paidMonths.length;
                const installmentsLeft = hasInstallments ? exp.installments! - installmentsPaidCount : 0;
                const monthlyAmount = hasInstallments ? exp.amount / exp.installments! : 0;
                const firstPaymentMonth = exp.firstPaymentMonth ?? null;
                const installmentMonths = hasInstallments && firstPaymentMonth && exp.cardDueDay
                  ? getInstallmentMonths(firstPaymentMonth, exp.installments!, exp.cardDueDay)
                  : [];
                const isPickerOpen = payingMonthId === exp.id;

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
                          {isCard ? (exp.cardName || "TDC") : "Efectivo"}
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
                            {installmentsPaidCount}/{exp.installments} meses
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 11.5, color: T.mutedLight }}>
                        {exp.purchaseDate
                          ? <>Compra: {formatDate(exp.purchaseDate)} · Pago: {formatDate(exp.timestamp)}</>
                          : exp.timestamp ? formatDate(exp.timestamp) : ""
                        }
                        {hasInstallments && !exp.cardPaid && (
                          <> · siguiente: ${monthlyAmount.toFixed(0)}</>
                        )}
                      </p>
                      {/* Barra de progreso mensualidades */}
                      {hasInstallments && (
                        <div style={{ marginTop: 6, height: 4, background: T.slate, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${(installmentsPaidCount / exp.installments!) * 100}%`,
                            background: exp.cardPaid ? T.green : T.purple,
                            borderRadius: 2, transition: "width 0.3s",
                          }} />
                        </div>
                      )}
                      {/* Picker de meses */}
                      {isPickerOpen && installmentMonths.length > 0 && (
                        <div style={{
                          marginTop: 10,
                          background: T.white, border: `1px solid ${T.purpleBorder}`,
                          borderRadius: 10, padding: "10px 12px",
                          display: "flex", flexDirection: "column", gap: 4,
                          maxHeight: 220, overflowY: "auto",
                        }}>
                          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: T.purple, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Selecciona el mes pagado
                          </p>
                          {installmentMonths.map(({ key, label }) => {
                            const isPaid = (exp.paidMonths ?? []).includes(key);
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => handleToggleMonth(exp, key)}
                                disabled={isToggling}
                                style={{
                                  display: "flex", alignItems: "center", justifyContent: "space-between",
                                  padding: "7px 10px", borderRadius: 7, border: "none",
                                  background: isPaid ? T.greenBg : T.slate,
                                  cursor: "pointer", fontFamily: "var(--font-poppins)",
                                  opacity: isToggling ? 0.5 : 1,
                                  transition: "background 0.12s",
                                }}
                              >
                                <span style={{ fontSize: 12, color: isPaid ? T.green : T.secondary, fontWeight: isPaid ? 600 : 400 }}>
                                  {label.charAt(0).toUpperCase() + label.slice(1)}
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: isPaid ? T.green : T.mutedLight, fontWeight: 600 }}>
                                  {isPaid ? <><CheckCircle2 size={12} /> Pagado</> : `$${monthlyAmount.toFixed(0)}`}
                                </span>
                              </button>
                            );
                          })}
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

                      {hasInstallments && (
                        <button
                          onClick={() => setPayingMonthId(isPickerOpen ? null : exp.id)}
                          style={{
                            height: 30, padding: "0 12px", borderRadius: 7,
                            border: `1px solid ${isPickerOpen ? T.purple : T.purpleBorder}`,
                            background: isPickerOpen ? T.purple : T.purpleBg,
                            color: isPickerOpen ? T.white : T.purple,
                            fontSize: 11, fontWeight: 600,
                            cursor: "pointer", fontFamily: "var(--font-poppins)",
                            whiteSpace: "nowrap", transition: "all 0.15s",
                          }}
                        >
                          {exp.cardPaid ? `${installmentsPaidCount}/${exp.installments} ✓` : `Registrar pago (${installmentsLeft} rest.)`}
                        </button>
                      )}

                      <button
                        onClick={() => { setEditingExpense(exp); setShowForm(true); }}
                        title="Editar"
                        style={{
                          width: 30, height: 30, padding: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: 7, border: `1px solid ${T.border}`,
                          background: "transparent", color: T.mutedLight,
                          cursor: "pointer",
                        }}
                      >
                        <Pencil size={13} />
                      </button>
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
