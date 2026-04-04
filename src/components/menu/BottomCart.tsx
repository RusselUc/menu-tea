import { FC } from "react";
import { CartItem } from ".";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { MessageCircle, Trash2 } from "lucide-react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const C = {
  dark: "#CD576A", // deep forest green
  olive: "#79874C", // olive green
  rose: "#CD576A", // rose accent
  pink: "#F298AA", // blush pink
  cream: "#F8F5F1", // soft warm white
  white: "#FFFFFF",
  text: "#2A2019",
  muted: "#8A7A6E",
  border: "rgba(59,89,53,0.1)",
};

interface BottomCartProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
}

export async function saveOrder(order: {
  flavor: string;
  size: "mediano" | "grande" | "pandi";
  category: string;
  toppings: string[];
  price: number;
  quantity: number;
}) {
  try {
    await addDoc(collection(db, "orders"), {
      ...order,
      timestamp: Timestamp.now(),
      status: "success",
    });
  } catch (error) {
    console.error("Error al guardar pedido:", error);
  }
}

const SIZE_LABELS: Record<string, string> = {
  mediano: "Mediano · 16oz",
  grande: "Grande · 24oz",
  pandi: "Pandi · 24oz",
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
      saveOrder({
        flavor: item.name,
        size: item.size as "mediano" | "grande" | "pandi",
        category: item.category,
        toppings: item.toppings,
        price: item.price,
        quantity: item.quantity,
      });
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
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent
        style={{ backgroundColor: C.cream, borderTop: `3px solid ${C.rose}` }}
        className="flex flex-col"
      >
        {/* Green accent bar */}
        <div style={{ height: 4, backgroundColor: C.rose }} />

        {/* Handle */}
        <div
          style={{
            width: 36,
            height: 3,
            borderRadius: 2,
            backgroundColor: C.border,
            margin: "10px auto 0",
          }}
        />

        <DrawerHeader style={{ paddingBottom: 0 }}>
          <DrawerTitle
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: C.dark,
              fontFamily: "var(--font-poppins)",
            }}
          >
            Tu Orden
          </DrawerTitle>
          {items.length > 0 && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 11,
                fontWeight: 500,
                color: C.olive,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "var(--font-poppins)",
              }}
            >
              {items.length} producto{items.length !== 1 ? "s" : ""}
            </p>
          )}
        </DrawerHeader>

        <div style={{ padding: "12px 20px 0", overflowY: "auto", flex: 1 }}>
          {items.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "52px 0",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "rgba(205,87,106,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                🧋
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                  color: C.dark,
                  fontFamily: "var(--font-poppins)",
                }}
              >
                Carrito vacío
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 300,
                  color: C.muted,
                  fontFamily: "var(--font-poppins)",
                }}
              >
                Agrega una bebida para comenzar
              </p>
            </div>
          ) : (
            <>
              {/* Items */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "12px 14px",
                      background: C.white,
                      borderRadius: 14,
                      boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                      borderLeft: `3px solid ${C.pink}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: "0 0 2px",
                          fontSize: 14,
                          fontWeight: 600,
                          color: C.dark,
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        {item.name}
                      </p>
                      <p
                        style={{
                          margin: "0 0 1px",
                          fontSize: 11,
                          fontWeight: 300,
                          color: C.muted,
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        {SIZE_LABELS[item.size] ?? item.size} · {item.category}
                      </p>
                      {item.toppings.length > 0 && (
                        <p
                          style={{
                            margin: "1px 0 0",
                            fontSize: 10.5,
                            fontWeight: 300,
                            color: C.muted,
                            fontFamily: "var(--font-poppins)",
                          }}
                        >
                          {item.toppings.join(" · ")}
                        </p>
                      )}
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 10.5,
                          color: C.muted,
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        Cantidad: {item.quantity}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: C.olive,
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 4,
                          cursor: "pointer",
                          color: "#ccc",
                          display: "flex",
                          alignItems: "center",
                          transition: "color 0.15s ease",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.color =
                            "#e05555")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.color =
                            "#ccc")
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total + actions */}
              <div
                style={{
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 18,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 18,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.muted,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: C.dark,
                      letterSpacing: "-0.03em",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    ${total.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleWhatsAppOrder}
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 14,
                    border: "none",
                    background: C.dark,
                    color: "#FFF",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 10,
                    fontFamily: "var(--font-poppins)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  <MessageCircle size={17} />
                  Enviar Pedido por WhatsApp
                </button>

                <button
                  onClick={onClearCart}
                  style={{
                    width: "100%",
                    height: 42,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    color: C.muted,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "var(--font-poppins)",
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
