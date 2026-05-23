"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, X, ChevronRight, Check, RotateCcw } from "lucide-react";
import {
  subscribeToCommandaOrders,
  updateOrderStatus,
  saveFullOrder,
  getNextOrderNumber,
  getOrderTotal,
  Order,
  OrderItem,
  OrderStatus,
} from "@/lib/orders";
import {
  getMenuItems,
  getPriceRules,
  getToppings,
  MenuItem,
  PriceRules,
  ToppingGroup,
} from "@/lib/menu-items";

// ── Tokens ────────────────────────────────────────────────
const T = {
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  secondary: "#334155",
  muted: "#64748B",
  mutedLight: "#94A3B8",
  slate: "#F1F5F9",
  green: "#059669",
  greenBg: "#ECFDF5",
  greenBorder: "#A7F3D0",
  amber: "#D97706",
  amberBg: "#FFFBEB",
  amberBorder: "#FCD34D",
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FECACA",
  blue: "#2563EB",
  blueBg: "#EFF6FF",
  blueBorder: "#BFDBFE",
  purple: "#7C3AED",
  purpleBg: "#F5F3FF",
  purpleBorder: "#DDD6FE",
};

const SIZE_LABELS: Record<string, string> = {
  mediano: "Mediano · 16oz",
  grande:  "Grande · 24oz",
  pandi:   "Pandi · 24oz",
};

const SIZE_IDS = ["mediano", "grande", "pandi"] as const;

const CAT_LABELS: Record<string, string> = {
  frappe: "Frappe", tea: "Té Frutal",
  sodaItaliana: "Soda Italiana", specialty: "Especiales",
};

// ── Helpers ───────────────────────────────────────────────
function timeAgo(ts: { toDate: () => Date }): string {
  const diff = Date.now() - ts.toDate().getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

function getPrice(item: MenuItem, sizeId: string, category: string, rules: PriceRules): number {
  if (item.customPrice) return (item.customPrice as Record<string, number>)[sizeId] ?? 0;
  const s = sizeId as "mediano" | "grande" | "pandi";
  if (category === "frappe") return rules[item.tier === "premium" ? "frappePremium" : "frappeClassic"][s];
  if (category === "sodaItaliana") return rules.sodaItaliana[s];
  if (category === "specialty") return rules.specialty[s];
  return rules.tea[s];
}

function toppingPrice(count: number): number {
  return Math.max(0, count - 1) * 10;
}

// ── Toast ─────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      background: T.text, color: T.white, padding: "11px 20px",
      borderRadius: 10, fontSize: 13, fontWeight: 600,
      zIndex: 300, boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
      whiteSpace: "nowrap", fontFamily: "var(--font-poppins)",
      animation: "slideDown 0.2s ease",
    }}>
      {message}
    </div>
  );
}

// ── Order card ────────────────────────────────────────────
function OrderCard({
  order, onAction, updating,
}: {
  order: Order;
  onAction: (id: string, status: OrderStatus) => void;
  updating: boolean;
}) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceUpdate((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const total = getOrderTotal(order);
  const isPending = order.status === "pending" || order.status === "success";
  const isReady = order.status === "ready";
  const isHistory = order.status === "delivered" || order.status === "cancelled";
  const isWhatsApp = order.source === "whatsapp" || !order.source;

  const borderColor = isPending ? T.amber : isReady ? T.green : order.status === "cancelled" ? "#CBD5E1" : T.blue;

  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: 12,
      overflow: "hidden",
      opacity: isHistory ? 0.7 : 1,
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 14px 10px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 22, fontWeight: 800, color: T.text,
            letterSpacing: "-0.03em", lineHeight: 1,
          }}>
            #{String(order.orderNumber ?? "—").padStart(2, "0")}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 100,
            background: isWhatsApp ? T.greenBg : T.purpleBg,
            color: isWhatsApp ? T.green : T.purple,
            border: `1px solid ${isWhatsApp ? T.greenBorder : T.purpleBorder}`,
          }}>
            {isWhatsApp ? "WhatsApp" : "Comanda"}
          </span>
        </div>
        <span style={{ fontSize: 12, color: T.mutedLight, fontWeight: 500 }}>
          {order.timestamp ? timeAgo(order.timestamp) : ""}
        </span>
      </div>

      {/* Items */}
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {order.items?.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: T.white,
              background: T.text, borderRadius: 5,
              padding: "1px 6px", flexShrink: 0, marginTop: 1,
            }}>
              ×{item.quantity}
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>
                {item.flavor}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: T.muted }}>
                {CAT_LABELS[item.category] ?? item.category}
                {" · "}
                {SIZE_LABELS[item.size] ?? item.size}
                {item.toppings?.length > 0 && ` · ${item.toppings.join(", ")}`}
              </p>
            </div>
            <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: T.muted, flexShrink: 0 }}>
              ${item.price * item.quantity}
            </span>
          </div>
        ))}
        {/* Legacy single-item */}
        {!order.items && order.flavor && (
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.white, background: T.text, borderRadius: 5, padding: "1px 6px" }}>
              ×{order.quantity ?? 1}
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>{order.flavor}</p>
              <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{SIZE_LABELS[order.size ?? ""] ?? order.size}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 14px 12px",
        borderTop: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>${total}</span>
          {order.phone && (
            <span style={{ fontSize: 11, color: T.mutedLight, marginLeft: 8 }}>{order.phone}</span>
          )}
        </div>

        {!isHistory && (
          <div style={{ display: "flex", gap: 6 }}>
            {updating ? (
              <span style={{ fontSize: 11, color: T.mutedLight }}>...</span>
            ) : isPending ? (
              <>
                <button
                  onClick={() => onAction(order.id, "ready")}
                  style={{
                    height: 32, padding: "0 14px", borderRadius: 8,
                    border: `1px solid ${T.greenBorder}`, background: T.greenBg, color: T.green,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    fontFamily: "var(--font-poppins)", display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <Check size={13} /> Listo
                </button>
                <button
                  onClick={() => onAction(order.id, "cancelled")}
                  style={{
                    height: 32, padding: "0 10px", borderRadius: 8,
                    border: `1px solid ${T.border}`, background: "transparent", color: T.muted,
                    fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-poppins)",
                  }}
                >
                  Cancelar
                </button>
              </>
            ) : isReady ? (
              <>
                <button
                  onClick={() => onAction(order.id, "delivered")}
                  style={{
                    height: 32, padding: "0 14px", borderRadius: 8,
                    border: `1px solid ${T.blueBorder}`, background: T.blueBg, color: T.blue,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    fontFamily: "var(--font-poppins)", display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <ChevronRight size={13} /> Entregar
                </button>
                <button
                  onClick={() => onAction(order.id, "pending")}
                  style={{
                    height: 32, padding: "0 10px", borderRadius: 8,
                    border: `1px solid ${T.border}`, background: "transparent", color: T.muted,
                    fontSize: 11, cursor: "pointer", fontFamily: "var(--font-poppins)",
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <RotateCcw size={11} />
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// ── New order drawer ───────────────────────────────────────
type DraftItem = { menuItem: MenuItem; category: string; size: string; toppings: string[]; price: number; quantity: number };

function NewOrderDrawer({
  onClose, onSave,
  menuItems, priceRules, toppingGroups,
}: {
  onClose: () => void;
  onSave: (items: DraftItem[]) => Promise<void>;
  menuItems: MenuItem[];
  priceRules: PriceRules | null;
  toppingGroups: ToppingGroup[];
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [configuring, setConfiguring] = useState<{ item: MenuItem; category: string } | null>(null);
  const [selectedSize, setSelectedSize] = useState("grande");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);

  const allToppings = toppingGroups.flatMap((g) => g.items.filter((i) => i.active).map((i) => i.name));

  const categories = ["all", ...Array.from(new Set(menuItems.flatMap((m) => m.categories)))];

  const filtered = menuItems.filter((m) => {
    if (!m.active) return false;
    if (catFilter !== "all" && !m.categories.includes(catFilter)) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function startConfig(item: MenuItem) {
    const cat = catFilter !== "all" && item.categories.includes(catFilter)
      ? catFilter
      : item.categories[0];
    setConfiguring({ item, category: cat });
    setSelectedSize("grande");
    setSelectedToppings([]);
    setQty(1);
  }

  function addToDraft() {
    if (!configuring || !priceRules) return;
    const basePrice = getPrice(configuring.item, selectedSize, configuring.category, priceRules);
    const unitPrice = basePrice + toppingPrice(selectedToppings.length);
    setDraft((d) => {
      const existingIdx = d.findIndex(
        (x) =>
          x.menuItem.id === configuring.item.id &&
          x.category === configuring.category &&
          x.size === selectedSize &&
          JSON.stringify([...x.toppings].sort()) === JSON.stringify([...selectedToppings].sort())
      );
      if (existingIdx >= 0) {
        const updated = [...d];
        updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + qty };
        return updated;
      }
      return [...d, {
        menuItem: configuring.item,
        category: configuring.category,
        size: selectedSize,
        toppings: selectedToppings,
        price: unitPrice,
        quantity: qty,
      }];
    });
    setConfiguring(null);
  }

  function changeQty(idx: number, delta: number) {
    setDraft((d) => {
      const newQty = d[idx].quantity + delta;
      if (newQty <= 0) return d.filter((_, i) => i !== idx);
      const updated = [...d];
      updated[idx] = { ...updated[idx], quantity: newQty };
      return updated;
    });
  }

  const draftTotal = draft.reduce((s, d) => s + d.price * d.quantity, 0);
  const draftCount = draft.reduce((s, d) => s + d.quantity, 0);

  async function handleSave() {
    if (draft.length === 0) return;
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  }

  const inputStyle: React.CSSProperties = {
    height: 38, padding: "0 12px", borderRadius: 8,
    border: `1px solid ${T.border}`, background: T.white,
    fontSize: 13, fontFamily: "var(--font-poppins)", color: T.text, outline: "none",
  };

  const qtyBtnStyle = (active?: boolean): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`,
    background: active ? T.text : T.white, color: active ? T.white : T.text,
    fontSize: 16, fontWeight: 700, cursor: "pointer",
    fontFamily: "var(--font-poppins)", display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", display: "flex", justifyContent: "flex-end" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "min(520px, 100vw)", height: "100vh",
        background: T.bg, display: "flex", flexDirection: "column",
        fontFamily: "var(--font-poppins)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 20px 16px",
          background: T.white, borderBottom: `1px solid ${T.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
        }}>
          {configuring ? (
            <button
              onClick={() => setConfiguring(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, padding: "4px 0", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, fontFamily: "var(--font-poppins)" }}
            >
              ← Volver al catálogo
            </button>
          ) : (
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>Nueva orden</h2>
          )}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Content scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>

          {/* Item configurator */}
          {configuring ? (
            <div style={{
              background: T.white, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: "16px", marginBottom: 12,
            }}>
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{configuring.item.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: T.muted }}>{CAT_LABELS[configuring.category] ?? configuring.category}</p>
              </div>

              {/* Size */}
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tamaño</p>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {SIZE_IDS.map((s) => {
                  const p = priceRules ? getPrice(configuring.item, s, configuring.category, priceRules) : 0;
                  return (
                    <button key={s} onClick={() => setSelectedSize(s)} style={{
                      flex: 1, padding: "8px 4px", borderRadius: 8,
                      border: `1px solid ${selectedSize === s ? T.text : T.border}`,
                      background: selectedSize === s ? T.text : T.white,
                      color: selectedSize === s ? T.white : T.secondary,
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                      fontFamily: "var(--font-poppins)",
                    }}>
                      <div>{s.charAt(0).toUpperCase() + s.slice(1)}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>${p}</div>
                    </button>
                  );
                })}
              </div>

              {/* Toppings */}
              {allToppings.length > 0 && (
                <>
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Toppings <span style={{ fontWeight: 400, textTransform: "none" }}>(1er gratis, +$10 c/u)</span>
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {allToppings.map((t) => {
                      const active = selectedToppings.includes(t);
                      return (
                        <button key={t} onClick={() => setSelectedToppings((prev) =>
                          prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                        )} style={{
                          padding: "5px 12px", borderRadius: 100,
                          border: `1px solid ${active ? T.text : T.border}`,
                          background: active ? T.text : T.white,
                          color: active ? T.white : T.muted,
                          fontSize: 12, fontWeight: active ? 600 : 400,
                          cursor: "pointer", fontFamily: "var(--font-poppins)",
                        }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Quantity stepper */}
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cantidad</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={qtyBtnStyle()}>−</button>
                <span style={{ fontSize: 18, fontWeight: 700, color: T.text, minWidth: 28, textAlign: "center" }}>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} style={qtyBtnStyle()}>+</button>
              </div>

              {/* Price preview + add */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4, borderTop: `1px solid ${T.border}` }}>
                <div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>
                    ${priceRules ? (getPrice(configuring.item, selectedSize, configuring.category, priceRules) + toppingPrice(selectedToppings.length)) * qty : "—"}
                  </span>
                  {qty > 1 && (
                    <span style={{ fontSize: 11, color: T.mutedLight, marginLeft: 6 }}>
                      × {qty} unidades
                    </span>
                  )}
                </div>
                <button onClick={addToDraft} style={{
                  height: 40, padding: "0 20px", borderRadius: 8,
                  border: `1px solid ${T.border}`, background: T.white, color: T.text,
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "var(--font-poppins)", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Plus size={14} /> Agregar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Context banner when draft has items */}
              {draft.length > 0 && (
                <div style={{
                  background: T.blueBg, border: `1px solid ${T.blueBorder}`,
                  borderRadius: 8, padding: "8px 12px", marginBottom: 10,
                  fontSize: 12, color: T.blue, fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Plus size={13} />
                  Elige otro producto para agregar a la orden
                </div>
              )}

              {/* Search */}
              <input
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, width: "100%", marginBottom: 10, boxSizing: "border-box" }}
              />

              {/* Category filter */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {categories.map((c) => (
                  <button key={c} onClick={() => setCatFilter(c)} style={{
                    height: 28, padding: "0 12px", borderRadius: 100,
                    border: `1px solid ${catFilter === c ? T.text : T.border}`,
                    background: catFilter === c ? T.text : T.white,
                    color: catFilter === c ? T.white : T.muted,
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                    fontFamily: "var(--font-poppins)",
                  }}>
                    {c === "all" ? "Todos" : CAT_LABELS[c] ?? c}
                  </button>
                ))}
              </div>

              {/* Product list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {filtered.length === 0 && (
                  <p style={{ fontSize: 13, color: T.mutedLight, textAlign: "center", padding: "20px 0" }}>Sin resultados</p>
                )}
                {filtered.map((item) => (
                  <button key={item.id} onClick={() => startConfig(item)} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "11px 14px", borderRadius: 10,
                    border: `1px solid ${T.border}`, background: T.white,
                    cursor: "pointer", fontFamily: "var(--font-poppins)", textAlign: "left",
                    transition: "border-color 0.12s",
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>{item.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: T.muted }}>
                        {item.categories.map((c) => CAT_LABELS[c] ?? c).join(" · ")}
                      </p>
                    </div>
                    <Plus size={16} style={{ color: T.muted, flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Draft items */}
          {draft.length > 0 && !configuring && (
            <div style={{
              background: T.white, border: `1px solid ${T.border}`,
              borderRadius: 12, overflow: "hidden", marginBottom: 12,
            }}>
              <p style={{ margin: 0, padding: "10px 14px", fontSize: 12, fontWeight: 600, color: T.muted, borderBottom: `1px solid ${T.border}` }}>
                En esta orden · {draftCount} {draftCount === 1 ? "producto" : "productos"}
              </p>
              {draft.map((d, i) => (
                <div key={i} style={{
                  padding: "10px 14px",
                  borderBottom: i < draft.length - 1 ? `1px solid ${T.border}` : "none",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>{d.menuItem.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: T.muted }}>
                      {SIZE_LABELS[d.size] ?? d.size}
                      {d.toppings.length > 0 && ` · ${d.toppings.join(", ")}`}
                    </p>
                  </div>
                  {/* Quantity stepper inline */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => changeQty(i, -1)} style={{
                      width: 24, height: 24, borderRadius: 6, border: `1px solid ${T.border}`,
                      background: T.white, color: T.text, fontSize: 14, fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-poppins)",
                    }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text, minWidth: 18, textAlign: "center" }}>{d.quantity}</span>
                    <button onClick={() => changeQty(i, 1)} style={{
                      width: 24, height: 24, borderRadius: 6, border: `1px solid ${T.border}`,
                      background: T.white, color: T.text, fontSize: 14, fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-poppins)",
                    }}>+</button>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text, flexShrink: 0, minWidth: 36, textAlign: "right" }}>
                    ${d.price * d.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {draft.length > 0 && !configuring && (
          <div style={{
            padding: "14px 16px 20px",
            background: T.white, borderTop: `2px solid ${T.greenBorder}`,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: T.muted, fontFamily: "var(--font-poppins)" }}>
                {draftCount} {draftCount === 1 ? "producto" : "productos"}
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: T.text, fontFamily: "var(--font-poppins)" }}>
                ${draftTotal}
              </span>
            </div>
            <button onClick={handleSave} disabled={saving} style={{
              width: "100%", height: 48, borderRadius: 10, border: "none",
              background: T.green, color: T.white,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-poppins)", opacity: saving ? 0.6 : 1,
              transition: "opacity 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {saving ? "Creando..." : <><Check size={16} /> Crear orden · ${draftTotal}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
type Tab = "new" | "ready" | "history";

export default function ComandaPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("new");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [priceRules, setPriceRules] = useState<PriceRules | null>(null);
  const [toppingGroups, setToppingGroups] = useState<ToppingGroup[]>([]);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Load menu data once
  useEffect(() => {
    getMenuItems().then(setMenuItems);
    getPriceRules().then(setPriceRules);
    getToppings().then(setToppingGroups);
  }, []);

  // Real-time orders
  useEffect(() => {
    const unsub = subscribeToCommandaOrders((incoming) => {
      setOrders(incoming);

      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        prevIdsRef.current = new Set(incoming.map((o) => o.id));
        return;
      }

      // Detect new orders
      const newOrders = incoming.filter(
        (o) => !prevIdsRef.current.has(o.id) && (o.status === "pending" || o.status === "success")
      );
      if (newOrders.length > 0) {
        const n = newOrders[0];
        setToast(`Nueva orden #${String(n.orderNumber ?? "?").padStart(2, "0")}`);
      }
      prevIdsRef.current = new Set(incoming.map((o) => o.id));
    });
    return unsub;
  }, []);

  async function handleAction(id: string, status: OrderStatus) {
    setUpdatingId(id);
    await updateOrderStatus(id, status);
    setUpdatingId(null);
  }

  async function handleNewOrder(draft: DraftItem[]) {
    const orderNumber = await getNextOrderNumber();
    const items: OrderItem[] = draft.map((d) => ({
      flavor: d.menuItem.name,
      size: d.size,
      category: d.category,
      toppings: d.toppings,
      price: d.price,
      quantity: d.quantity,
    }));
    const total = draft.reduce((s, d) => s + d.price * d.quantity, 0);
    await saveFullOrder({ items, total, source: "comanda", orderNumber });
    setShowNewOrder(false);
  }

  // Split orders
  const pendingOrders  = orders.filter((o) => o.status === "pending" || o.status === "success");
  const readyOrders    = orders.filter((o) => o.status === "ready");
  const historyOrders  = orders.filter((o) => o.status === "delivered" || o.status === "cancelled");

  const todayStr = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .comanda-cols { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .comanda-tabs { display: flex; }
        .comanda-desktop-cols { display: none; }
        @media (min-width: 768px) {
          .comanda-tabs { display: none; }
          .comanda-desktop-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        }
      `}</style>

      {toast && <Toast message={toast} onDone={() => setToast("")} />}

      {showNewOrder && (
        <NewOrderDrawer
          onClose={() => setShowNewOrder(false)}
          onSave={handleNewOrder}
          menuItems={menuItems}
          priceRules={priceRules}
          toppingGroups={toppingGroups}
        />
      )}

      <div style={{ padding: "24px 16px 80px", maxWidth: 900, margin: "0 auto", fontFamily: "var(--font-poppins)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>Comanda</h1>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: T.muted, textTransform: "capitalize" }}>{todayStr}</p>
          </div>
          <button
            onClick={() => setShowNewOrder(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 38, padding: "0 16px", borderRadius: 8,
              border: "none", background: T.text, color: T.white,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "var(--font-poppins)",
            }}
          >
            <Plus size={15} /> Nueva orden
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="comanda-tabs" style={{ gap: 4, background: T.slate, borderRadius: 10, padding: 4, marginBottom: 16, overflowX: "auto" }}>
          {([
            ["new",     `Nuevos${pendingOrders.length > 0 ? ` (${pendingOrders.length})` : ""}`],
            ["ready",   `Listos${readyOrders.length > 0 ? ` (${readyOrders.length})` : ""}`],
            ["history", "Historial"],
          ] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, height: 32, borderRadius: 7, border: "none",
              background: tab === id ? T.white : "transparent",
              color: tab === id ? T.text : T.muted,
              fontSize: 12, fontWeight: tab === id ? 600 : 400,
              cursor: "pointer", fontFamily: "var(--font-poppins)",
              boxShadow: tab === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              whiteSpace: "nowrap",
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Mobile content */}
        <div className="comanda-tabs" style={{ flexDirection: "column", gap: 10 }}>
          {(tab === "new" ? pendingOrders : tab === "ready" ? readyOrders : historyOrders).map((o) => (
            <OrderCard key={o.id} order={o} onAction={handleAction} updating={updatingId === o.id} />
          ))}
          {(tab === "new" ? pendingOrders : tab === "ready" ? readyOrders : historyOrders).length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <p style={{ fontSize: 13, color: T.mutedLight, margin: 0 }}>
                {tab === "new" ? "Sin órdenes pendientes" : tab === "ready" ? "Sin órdenes listas" : "Sin historial hoy"}
              </p>
            </div>
          )}
        </div>

        {/* Desktop: two columns */}
        <div className="comanda-desktop-cols">
          {/* Nuevos */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Nuevos</h2>
              {pendingOrders.length > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                  background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBorder}`,
                }}>
                  {pendingOrders.length}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingOrders.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", background: T.white, borderRadius: 12, border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 13, color: T.mutedLight, margin: 0 }}>Sin órdenes pendientes</p>
                </div>
              )}
              {pendingOrders.map((o) => (
                <OrderCard key={o.id} order={o} onAction={handleAction} updating={updatingId === o.id} />
              ))}
            </div>
          </div>

          {/* Listos */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Listos</h2>
              {readyOrders.length > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                  background: T.greenBg, color: T.green, border: `1px solid ${T.greenBorder}`,
                }}>
                  {readyOrders.length}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {readyOrders.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", background: T.white, borderRadius: 12, border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 13, color: T.mutedLight, margin: 0 }}>Sin órdenes listas</p>
                </div>
              )}
              {readyOrders.map((o) => (
                <OrderCard key={o.id} order={o} onAction={handleAction} updating={updatingId === o.id} />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop: historial */}
        {historyOrders.length > 0 && (
          <div className="comanda-desktop-cols" style={{ marginTop: 24 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.muted }}>
                Historial de hoy ({historyOrders.length})
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {historyOrders.map((o) => (
                  <OrderCard key={o.id} order={o} onAction={handleAction} updating={updatingId === o.id} />
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
