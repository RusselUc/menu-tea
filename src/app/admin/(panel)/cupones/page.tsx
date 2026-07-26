"use client";
import { useEffect, useState } from "react";
import {
  Coupon,
  DiscountType,
  createCoupon,
  deleteCoupon,
  generateCouponSuffix,
  getCoupons,
  updateCoupon,
} from "@/lib/coupons";
import { categories } from "@/data/menu";
import { Tag, Percent, DollarSign, Gift, Shuffle } from "lucide-react";

const CATEGORY_NAMES = categories.map((c) => c.name);

const T = {
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  secondary: "#334155",
  muted: "#64748B",
  mutedLight: "#94A3B8",
  slate: "#F1F5F9",
  rose: "#E11D48",
  roseBg: "#FFF1F2",
  roseBorder: "#FECDD3",
  green: "#059669",
  greenBg: "#ECFDF5",
  greenBorder: "#A7F3D0",
  olive: "#65A30D",
  oliveBg: "#F7FEE7",
  oliveBorder: "#BEF264",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: T.muted,
  textTransform: "uppercase", letterSpacing: "0.04em",
};
const inputStyle: React.CSSProperties = {
  width: "100%", height: 38, borderRadius: 8, border: `1px solid ${T.border}`,
  background: T.bg, padding: "0 12px", fontSize: 13, color: T.text,
  outline: "none", fontFamily: "var(--font-poppins)", boxSizing: "border-box",
};

function formatDateInput(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function startOfDay(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getTime();
}

function endOfDay(dateStr: string): number {
  const d = new Date(`${dateStr}T23:59:59.999`);
  return d.getTime();
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function couponStatus(c: Coupon): { label: string; bg: string; border: string; color: string } {
  const now = Date.now();
  if (!c.active) return { label: "DESACTIVADO", bg: T.slate, border: T.border, color: T.muted };
  if (now < c.startDate) return { label: "PROGRAMADO", bg: T.roseBg, border: T.roseBorder, color: T.rose };
  if (now > c.endDate) return { label: "EXPIRADO", bg: T.slate, border: T.border, color: T.mutedLight };
  if (c.usesCount >= c.maxUses) return { label: "AGOTADO", bg: T.slate, border: T.border, color: T.mutedLight };
  return { label: "VIGENTE", bg: T.greenBg, border: T.greenBorder, color: T.green };
}

const emptyForm = {
  code: "",
  discountType: "fixed" as DiscountType,
  discountValue: "",
  maxFreeItems: "",
  excludedCategories: [] as string[],
  startDate: formatDateInput(Date.now()),
  endDate: formatDateInput(Date.now() + 7 * 24 * 60 * 60 * 1000),
  maxUses: "",
};

export default function CuponesPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const list = await getCoupons();
    setCoupons(list);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function openEdit(c: Coupon) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue !== undefined ? String(c.discountValue) : "",
      maxFreeItems: c.maxFreeItems !== undefined ? String(c.maxFreeItems) : "",
      excludedCategories: c.excludedCategories ?? [],
      startDate: formatDateInput(c.startDate),
      endDate: formatDateInput(c.endDate),
      maxUses: String(c.maxUses),
    });
    setError(null);
    setShowForm(true);
  }

  function handleGenerateCode() {
    const prefix = form.code.trim().replace(/-+$/, "");
    const suffix = generateCouponSuffix();
    setForm((f) => ({ ...f, code: prefix ? `${prefix}-${suffix}` : suffix }));
  }

  function toggleExcludedCategory(name: string) {
    setForm((f) => ({
      ...f,
      excludedCategories: f.excludedCategories.includes(name)
        ? f.excludedCategories.filter((c) => c !== name)
        : [...f.excludedCategories, name],
    }));
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError(null);
  }

  const canSave =
    form.code.trim().length > 0 &&
    (form.discountType === "free_items" ? Number(form.maxFreeItems) > 0 : Number(form.discountValue) > 0) &&
    Number(form.maxUses) > 0 &&
    form.startDate.length > 0 &&
    form.endDate.length > 0 &&
    startOfDay(form.startDate) <= endOfDay(form.endDate);

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const shared = {
        discountType: form.discountType,
        startDate: startOfDay(form.startDate),
        endDate: endOfDay(form.endDate),
        maxUses: Number(form.maxUses),
        ...(form.discountType === "free_items"
          ? { maxFreeItems: Number(form.maxFreeItems), excludedCategories: form.excludedCategories }
          : { discountValue: Number(form.discountValue) }),
      };
      if (editingId) {
        await updateCoupon(editingId, shared);
        showToast("Cupón actualizado");
      } else {
        await createCoupon({ code: form.code, ...shared });
        showToast("Cupón creado");
      }
      await load();
      closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el cupón");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(c: Coupon) {
    await updateCoupon(c.id, { active: !c.active });
    setCoupons((prev) => prev.map((x) => x.id === c.id ? { ...x, active: !x.active } : x));
  }

  async function handleDelete(c: Coupon) {
    if (!confirm(`¿Eliminar el cupón "${c.code}"? Esta acción no se puede deshacer.`)) return;
    await deleteCoupon(c.id);
    setCoupons((prev) => prev.filter((x) => x.id !== c.id));
    if (editingId === c.id) closeForm();
  }

  return (
    <div style={{ padding: "28px 24px 32px", maxWidth: 640, margin: "0 auto", fontFamily: "var(--font-poppins)" }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: T.white, color: T.text, border: `1px solid ${T.border}`,
          padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          zIndex: 100, boxShadow: "0 4px 24px rgba(0,0,0,0.1)", whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
            Cupones
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: T.muted }}>
            Códigos de descuento para el pedido por WhatsApp
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openCreate}
            style={{
              height: 38, padding: "0 16px", borderRadius: 9, border: "none",
              background: T.text, color: T.white, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--font-poppins)", flexShrink: 0,
            }}
          >
            + Nuevo
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>
            {editingId ? "Editar cupón" : "Nuevo cupón"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={labelStyle}>Código</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="Ej. VERANO10 o TS-TRIVIA-1ER"
                disabled={!!editingId}
                style={{ ...inputStyle, textTransform: "uppercase", opacity: editingId ? 0.6 : 1 }}
              />
              {!editingId && (
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  title="Generar código aleatorio"
                  style={{
                    display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                    height: 38, padding: "0 12px", borderRadius: 8,
                    border: `1px solid ${T.border}`, background: T.slate, color: T.secondary,
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)",
                  }}
                >
                  <Shuffle size={14} />
                  Generar
                </button>
              )}
            </div>
            {editingId ? (
              <p style={{ margin: 0, fontSize: 10.5, color: T.mutedLight }}>El código no se puede cambiar una vez creado.</p>
            ) : (
              <p style={{ margin: 0, fontSize: 10.5, color: T.mutedLight }}>
                Escribe un prefijo (opcional) y presiona &quot;Generar&quot; para agregarle un sufijo aleatorio.
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={labelStyle}>Tipo de descuento</label>
            <div style={{ display: "flex", background: T.slate, borderRadius: 8, padding: 3, gap: 2, width: "fit-content", flexWrap: "wrap" }}>
              {(["fixed", "percentage", "free_items"] as DiscountType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, discountType: type }))}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    height: 34, padding: "0 14px", borderRadius: 6, border: "none",
                    background: form.discountType === type ? T.white : "transparent",
                    color: form.discountType === type ? T.text : T.muted,
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    fontFamily: "var(--font-poppins)",
                    boxShadow: form.discountType === type ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {type === "fixed" ? <DollarSign size={14} /> : type === "percentage" ? <Percent size={14} /> : <Gift size={14} />}
                  {type === "fixed" ? "Monto fijo" : type === "percentage" ? "Porcentaje" : "Bebidas gratis"}
                </button>
              ))}
            </div>
          </div>

          {form.discountType === "free_items" ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={labelStyle}>Cantidad de bebidas gratis</label>
                <input
                  type="number" min={1}
                  value={form.maxFreeItems}
                  onChange={(e) => setForm((f) => ({ ...f, maxFreeItems: e.target.value }))}
                  placeholder="Ej. 2"
                  style={{ ...inputStyle, width: 140 }}
                />
                <p style={{ margin: 0, fontSize: 10.5, color: T.mutedLight }}>
                  Se regalan las bebidas elegibles más económicas del pedido.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={labelStyle}>Categorías que NO entran</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {CATEGORY_NAMES.map((name) => {
                    const excluded = form.excludedCategories.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleExcludedCategory(name)}
                        style={{
                          padding: "6px 12px", borderRadius: 100,
                          border: excluded ? `1.5px solid ${T.rose}` : `1.5px solid ${T.border}`,
                          background: excluded ? T.roseBg : T.white,
                          color: excluded ? T.rose : T.secondary,
                          fontSize: 12, fontWeight: excluded ? 600 : 400,
                          cursor: "pointer", fontFamily: "var(--font-poppins)",
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
                <p style={{ margin: 0, fontSize: 10.5, color: T.mutedLight }}>
                  Marca las categorías que quedan excluidas del regalo. Deja todo sin marcar si aplica a cualquier bebida.
                </p>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={labelStyle}>
                {form.discountType === "fixed" ? "Monto a descontar ($)" : "Porcentaje a descontar (%)"}
              </label>
              <input
                type="number" min={1} max={form.discountType === "percentage" ? 100 : undefined}
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === "fixed" ? "Ej. 20" : "Ej. 10"}
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={labelStyle}>Válido desde</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={labelStyle}>Válido hasta</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={labelStyle}>Máximo de usos</label>
            <input
              type="number" min={1}
              value={form.maxUses}
              onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
              placeholder="Ej. 20"
              style={{ ...inputStyle, width: 140 }}
            />
            <p style={{ margin: 0, fontSize: 10.5, color: T.mutedLight }}>
              Una vez alcanzado, el cupón deja de funcionar aunque siga dentro de las fechas.
            </p>
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 12, color: T.rose, fontWeight: 600 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              style={{
                flex: 1, height: 42, borderRadius: 9, border: "none",
                background: !canSave || saving ? T.slate : T.text,
                color: !canSave || saving ? T.mutedLight : T.white,
                fontSize: 13, fontWeight: 600, cursor: !canSave || saving ? "not-allowed" : "pointer",
                fontFamily: "var(--font-poppins)",
              }}
            >
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear cupón"}
            </button>
            <button
              onClick={closeForm}
              style={{
                height: 42, padding: "0 16px", borderRadius: 9,
                border: `1px solid ${T.border}`, background: T.white, color: T.muted,
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2].map((i) => <div key={i} style={{ height: 60, borderRadius: 8, background: T.slate }} />)}
          </div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <Tag size={20} color={T.mutedLight} style={{ marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13, color: T.mutedLight }}>
              Aún no has creado ningún cupón
            </p>
          </div>
        ) : (
          coupons.map((c, idx) => {
            const status = couponStatus(c);
            return (
              <div key={c.id} style={{
                padding: "14px 20px", borderBottom: idx < coupons.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: "0.02em" }}>
                      {c.code}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "1px 6px", flexShrink: 0,
                      background: status.bg, color: status.color, border: `1px solid ${status.border}`,
                    }}>
                      {status.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.olive, flexShrink: 0 }}>
                    {c.discountType === "fixed"
                      ? `-$${c.discountValue}`
                      : c.discountType === "percentage"
                      ? `-${c.discountValue}%`
                      : `${c.maxFreeItems ?? 1} gratis`}
                  </span>
                </div>
                {c.discountType === "free_items" && (c.excludedCategories?.length ?? 0) > 0 && (
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: T.rose }}>
                    No aplica en: {c.excludedCategories!.join(", ")}
                  </p>
                )}
                <p style={{ margin: "0 0 10px", fontSize: 11.5, color: T.mutedLight }}>
                  {formatDate(c.startDate)} – {formatDate(c.endDate)} · {c.usesCount}/{c.maxUses} usos
                </p>
                <div style={{ display: "flex", gap: 14 }}>
                  <button
                    onClick={() => openEdit(c)}
                    style={{ border: "none", background: "transparent", color: T.text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)", padding: 0 }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleActive(c)}
                    style={{ border: "none", background: "transparent", color: T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)", padding: 0 }}
                  >
                    {c.active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    style={{ border: "none", background: "transparent", color: T.rose, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)", padding: 0 }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
