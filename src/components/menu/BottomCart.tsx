import { FC } from "react";
import { CartItem } from ".";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { Trash2 } from "lucide-react";
import { saveFullOrder, getNextOrderNumber } from "@/lib/orders";

const T = {
  bg:         "#F8FAFC",
  white:      "#FFFFFF",
  border:     "#E2E8F0",
  text:       "#0F172A",
  secondary:  "#334155",
  muted:      "#64748B",
  mutedLight: "#94A3B8",
  slate:      "#F1F5F9",
  rose:       "#CD576A",
  roseBg:     "#FFF1F2",
  roseBorder: "#FECDD3",
  roseDeep:   "#B8465A",
  olive:      "#79874C",
  wa:         "#22C55E",
  waDeep:     "#16A34A",
};

const WaIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface BottomCartProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
}

const SIZE_LABELS: Record<string, string> = {
  mediano: "Mediano · 16oz",
  grande:  "Grande · 24oz",
  pandi:   "Pandi · 24oz",
};

const BottomCart: FC<BottomCartProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearCart,
}) => {
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const generateWhatsAppMessage = () => {
    let msg = `¡Hola! Me gustaría hacer un pedido en Té Sueño:\n\n`;
    items.forEach((item) => {
      msg += `${item.category} — ${item.name}\n`;
      msg += `   • ${SIZE_LABELS[item.size] ?? item.size}\n`;
      if (item.toppings.length > 0)
        msg += `   • Toppings: ${item.toppings.join(", ")}\n`;
      msg += `   • Cantidad: ${item.quantity}\n\n`;
    });
    msg += `Total: $${total.toFixed(2)}\n\n¡Gracias!`;
    return encodeURIComponent(msg);
  };

  const handleWhatsAppOrder = () => {
    window.open(
      `https://wa.me/529969634631?text=${generateWhatsAppMessage()}`,
      "_blank"
    );
    onClearCart();
    onClose();

    getNextOrderNumber()
      .catch(() => undefined)
      .then((orderNumber) =>
        saveFullOrder({
          items: items.map((item) => ({
            flavor:   item.name,
            size:     item.size,
            category: item.category,
            toppings: item.toppings,
            price:    item.price,
            quantity: item.quantity,
          })),
          total,
          source: "whatsapp",
          ...(orderNumber ? { orderNumber } : {}),
        }).catch(console.error)
      );
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent
        style={{ backgroundColor: T.white, borderTop: `3px solid ${T.rose}` }}
        className="flex flex-col"
      >
        <style>{`
          .wa-send-btn:not(:disabled):hover { background: ${T.waDeep} !important; }
          .wa-send-btn { transition: background 0.15s; }
          .clear-btn:hover { background: ${T.slate} !important; }
          .clear-btn { transition: background 0.15s; }
          .remove-btn:hover { color: #e05555 !important; }
          .remove-btn { transition: color 0.15s; }
        `}</style>

        {/* Handle */}
        <div style={{
          width: 36, height: 3, borderRadius: 2,
          backgroundColor: T.border,
          margin: "12px auto 0",
        }} />

        <DrawerHeader style={{ paddingBottom: 0 }}>
          <DrawerTitle style={{
            fontSize: 22, fontWeight: 700,
            letterSpacing: "-0.02em", color: T.text,
            fontFamily: "var(--font-poppins)",
          }}>
            Tu Orden
          </DrawerTitle>
          {items.length > 0 && (
            <p style={{
              margin: "4px 0 0", fontSize: 11, fontWeight: 500,
              color: T.olive, letterSpacing: "0.1em",
              textTransform: "uppercase", fontFamily: "var(--font-poppins)",
            }}>
              {items.length} producto{items.length !== 1 ? "s" : ""}
            </p>
          )}
        </DrawerHeader>

        <div style={{ padding: "12px 20px 0", overflowY: "auto", flex: 1 }}>
          {items.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "52px 0", gap: 10,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                backgroundColor: T.roseBg,
                border: `1px solid ${T.roseBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
              }}>
                🧋
              </div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: T.text, fontFamily: "var(--font-poppins)" }}>
                Carrito vacío
              </p>
              <p style={{ margin: 0, fontSize: 12, color: T.muted, fontFamily: "var(--font-poppins)" }}>
                Agrega una bebida para comenzar
              </p>
            </div>
          ) : (
            <>
              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {items.map((item) => (
                  <div key={item.id} style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", gap: 12,
                    padding: "12px 14px",
                    background: T.white,
                    borderRadius: 14,
                    border: `1px solid ${T.border}`,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: T.text, fontFamily: "var(--font-poppins)" }}>
                        {item.name}
                      </p>
                      <p style={{ margin: "0 0 1px", fontSize: 11, color: T.muted, fontFamily: "var(--font-poppins)" }}>
                        {SIZE_LABELS[item.size] ?? item.size} · {item.category}
                      </p>
                      {item.toppings.length > 0 && (
                        <p style={{ margin: "1px 0 0", fontSize: 10.5, color: T.muted, fontFamily: "var(--font-poppins)" }}>
                          {item.toppings.join(" · ")}
                        </p>
                      )}
                      <p style={{ margin: "4px 0 0", fontSize: 10.5, color: T.mutedLight, fontFamily: "var(--font-poppins)" }}>
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.olive, fontFamily: "var(--font-poppins)" }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        className="remove-btn"
                        onClick={() => onRemoveItem(item.id)}
                        style={{
                          background: "none", border: "none", padding: 4,
                          cursor: "pointer", color: T.border,
                          display: "flex", alignItems: "center",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total + actions */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, marginBottom: 8 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "baseline", marginBottom: 16,
                }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: T.muted,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    fontFamily: "var(--font-poppins)",
                  }}>
                    Total
                  </span>
                  <span style={{
                    fontSize: 28, fontWeight: 700, color: T.text,
                    letterSpacing: "-0.03em", fontFamily: "var(--font-poppins)",
                  }}>
                    ${total.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleWhatsAppOrder}
                  className="wa-send-btn"
                  style={{
                    width: "100%", height: 54, borderRadius: 14, border: "none",
                    background: T.wa, color: "#FFF",
                    fontSize: 15, fontWeight: 700,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                    marginBottom: 10,
                    fontFamily: "var(--font-poppins)",
                    letterSpacing: "-0.01em",
                    boxShadow: "0 4px 16px rgba(34,197,94,0.28)",
                  }}
                >
                  <WaIcon size={18} />
                  Enviar pedido por WhatsApp
                </button>

                <button
                  onClick={onClearCart}
                  className="clear-btn"
                  style={{
                    width: "100%", height: 40, borderRadius: 10,
                    border: `1px solid ${T.border}`,
                    background: "transparent",
                    color: T.muted, fontSize: 12, fontWeight: 500,
                    cursor: "pointer", fontFamily: "var(--font-poppins)",
                  }}
                >
                  Limpiar carrito
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{ height: 20 }} />
      </DrawerContent>
    </Drawer>
  );
};

export default BottomCart;
