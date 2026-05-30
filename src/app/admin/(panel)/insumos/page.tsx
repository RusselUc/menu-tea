"use client";
import { useEffect, useRef, useState } from "react";
import { Pencil, X, Check, Package } from "lucide-react";
import { getInsumos, setVasos, SizeId } from "@/lib/insumos";

const T = {
  bg:          "#F8FAFC",
  white:       "#FFFFFF",
  border:      "#E2E8F0",
  text:        "#0F172A",
  secondary:   "#334155",
  muted:       "#64748B",
  mutedLight:  "#94A3B8",
  slate:       "#F1F5F9",
  green:       "#059669",
  greenBg:     "#ECFDF5",
  greenBorder: "#A7F3D0",
  amber:       "#D97706",
  amberBg:     "#FFFBEB",
  amberBorder: "#FCD34D",
  red:         "#DC2626",
  redBg:       "#FEF2F2",
  redBorder:   "#FECACA",
  blue:        "#2563EB",
  blueBg:      "#EFF6FF",
  blueBorder:  "#BFDBFE",
};

const SIZES: { id: SizeId; label: string; oz: string }[] = [
  { id: "mediano", label: "Mediano", oz: "16 oz" },
  { id: "grande",  label: "Grande",  oz: "24 oz" },
  { id: "pandi",   label: "Pandi",   oz: "24 oz" },
];

function getStatus(n: number): { label: string; color: string; bg: string; border: string } {
  if (n <= 0)  return { label: "Sin stock", color: T.red,   bg: T.redBg,   border: T.redBorder };
  if (n <= 10) return { label: "Crítico",   color: T.red,   bg: T.redBg,   border: T.redBorder };
  if (n <= 30) return { label: "Bajo",      color: T.amber, bg: T.amberBg, border: T.amberBorder };
  return             { label: "OK",         color: T.green, bg: T.greenBg, border: T.greenBorder };
}

function StockCard({
  id, label, oz, stock,
  onSave,
}: {
  id: SizeId; label: string; oz: string; stock: number;
  onSave: (id: SizeId, val: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setInputVal(String(stock));
    setEditing(true);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 50);
  }

  function cancel() {
    setEditing(false);
    setInputVal("");
  }

  async function confirm() {
    const val = parseInt(inputVal, 10);
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    await onSave(id, val);
    setSaving(false);
    setEditing(false);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  const status = getStatus(stock);
  const pct = Math.min(100, Math.round((stock / 200) * 100));

  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>{label}</p>
          <p style={{ margin: 0, fontSize: 11, color: T.mutedLight, marginTop: 1 }}>{oz}</p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
          background: status.bg, color: status.color, border: `1px solid ${status.border}`,
        }}>
          {status.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 16px 16px" }}>
        {!editing ? (
          <>
            {/* Stock display */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{
                  fontSize: 52, fontWeight: 800, color: stock === 0 ? T.red : T.text,
                  letterSpacing: "-0.04em", lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {stock}
                </span>
                <span style={{ fontSize: 13, color: T.mutedLight, fontWeight: 500 }}>
                  {stock === 1 ? "unidad" : "unidades"}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{
                marginTop: 12, height: 4, borderRadius: 100,
                background: T.slate, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 100,
                  width: `${pct}%`,
                  background: status.color,
                  transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)",
                }} />
              </div>
              <p style={{ margin: "5px 0 0", fontSize: 10, color: T.mutedLight, fontWeight: 500 }}>
                {pct}% de 200 uds de referencia
              </p>
            </div>

            {/* Edit button */}
            <button
              onClick={startEdit}
              style={{
                width: "100%", height: 36, borderRadius: 9,
                border: `1px solid ${T.border}`,
                background: done ? T.greenBg : T.slate,
                color: done ? T.green : T.secondary,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-poppins)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {done
                ? <><Check size={13} /> Actualizado</>
                : <><Pencil size={12} /> Editar cantidad</>
              }
            </button>
          </>
        ) : (
          <>
            {/* Edit mode */}
            <p style={{
              margin: "0 0 10px", fontSize: 11, fontWeight: 600,
              color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              Nueva cantidad
            </p>
            <input
              ref={inputRef}
              type="number"
              min={0}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")  confirm();
                if (e.key === "Escape") cancel();
              }}
              style={{
                width: "100%", height: 48, padding: "0 16px",
                borderRadius: 10, border: `1.5px solid ${T.blue}`,
                background: T.blueBg,
                fontSize: 28, fontWeight: 800, color: T.text,
                fontFamily: "var(--font-poppins)", outline: "none",
                textAlign: "center", letterSpacing: "-0.02em",
                boxSizing: "border-box",
              }}
            />
            <p style={{
              margin: "6px 0 14px", fontSize: 10, color: T.mutedLight,
              textAlign: "center",
            }}>
              Era <strong style={{ color: T.secondary }}>{stock}</strong> — ingresa el total actual
            </p>

            {/* Quick-add chips */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {[12, 25, 50, 100].map((n) => (
                <button
                  key={n}
                  onClick={() => setInputVal(String(Math.max(0, (parseInt(inputVal, 10) || 0) + n)))}
                  style={{
                    flex: 1, minWidth: 50, height: 30, borderRadius: 8,
                    border: `1px solid ${T.border}`, background: T.white,
                    color: T.secondary, fontSize: 11, fontWeight: 600,
                    cursor: "pointer", fontFamily: "var(--font-poppins)",
                  }}
                >
                  +{n}
                </button>
              ))}
            </div>

            {/* Confirm / Cancel */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={cancel}
                style={{
                  flex: 1, height: 38, borderRadius: 9,
                  border: `1px solid ${T.border}`, background: T.white,
                  color: T.muted, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "var(--font-poppins)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}
              >
                <X size={13} /> Cancelar
              </button>
              <button
                onClick={confirm}
                disabled={saving}
                style={{
                  flex: 2, height: 38, borderRadius: 9,
                  border: "none", background: T.text,
                  color: T.white, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "var(--font-poppins)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Guardando..." : <><Check size={13} /> Confirmar</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function InsumosPage() {
  const [vasos, setVasosState] = useState<Record<SizeId, number>>({ mediano: 0, grande: 0, pandi: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInsumos().then((data) => {
      setVasosState(data.vasos);
      setLoading(false);
    });
  }, []);

  async function handleSave(sizeId: SizeId, val: number) {
    const next = { ...vasos, [sizeId]: val };
    await setVasos(next);
    setVasosState(next);
  }

  const total    = vasos.mediano + vasos.grande + vasos.pandi;
  const lowCount = (Object.values(vasos) as number[]).filter((v) => v <= 30).length;

  if (loading) {
    return (
      <div style={{ padding: "24px 16px", fontFamily: "var(--font-poppins)" }}>
        <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
        <div style={{ height: 28, width: 120, borderRadius: 8, background: T.slate, marginBottom: 8, animation: "pulse 1.4s ease infinite" }} />
        <div style={{ height: 16, width: 240, borderRadius: 6, background: T.slate, marginBottom: 28, animation: "pulse 1.4s ease 0.1s infinite" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 220, borderRadius: 16, background: T.slate, animation: `pulse 1.4s ease ${i * 0.08}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 16px 80px", maxWidth: 860, margin: "0 auto", fontFamily: "var(--font-poppins)" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
          Insumos
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: T.muted }}>
          Los vasos se descuentan automáticamente al entregar un pedido.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{
          background: T.white, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "12px 16px", flex: 1, minWidth: 140,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: T.slate, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Package size={16} color={T.muted} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: T.mutedLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Total
            </p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              {total}
            </p>
          </div>
        </div>

        {lowCount > 0 && (
          <div style={{
            background: T.redBg, border: `1px solid ${T.redBorder}`,
            borderRadius: 12, padding: "12px 16px", flex: 1, minWidth: 140,
          }}>
            <p style={{ margin: 0, fontSize: 11, color: T.red, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Con stock bajo
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: T.red, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              {lowCount} {lowCount === 1 ? "tamaño" : "tamaños"}
            </p>
          </div>
        )}
      </div>

      {/* Vasos label */}
      <p style={{
        margin: "0 0 12px", fontSize: 11, fontWeight: 600,
        color: T.mutedLight, textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        Vasos
      </p>

      {/* Stock cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {SIZES.map(({ id, label, oz }) => (
          <StockCard
            key={id}
            id={id}
            label={label}
            oz={oz}
            stock={vasos[id]}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  );
}
