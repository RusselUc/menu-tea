import { FC, useState } from "react";
import Image from "next/image";
import { CartItem, Category, Product } from ".";
import { getDesc, getImage, getPrice } from "./utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { Flavor, SizeId, sizes, priceRules as staticPriceRules } from "@/data/menu";
import { ToppingGroup, ToppingItem, DEFAULT_TOPPINGS } from "@/lib/menu-items";
import { Minus, Plus, ShoppingCart, Sparkles } from "lucide-react";

const T = {
  bg:          "#F8FAFC",
  white:       "#FFFFFF",
  border:      "#E2E8F0",
  text:        "#0F172A",
  secondary:   "#334155",
  muted:       "#64748B",
  mutedLight:  "#94A3B8",
  slate:       "#F1F5F9",
  rose:        "#CD576A",
  roseBg:      "#FFF1F2",
  roseBorder:  "#FECDD3",
  roseDeep:    "#B8465A",
  olive:       "#79874C",
};

interface BottomProductProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  category: Category;
  onAddToCart: (item: Omit<CartItem, "id">) => void;
  priceRules?: typeof staticPriceRules;
  toppingGroups?: ToppingGroup[];
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    margin: "0 0 10px",
    fontSize: 11, fontWeight: 600,
    letterSpacing: "0.1em", textTransform: "uppercase",
    color: T.muted, fontFamily: "var(--font-poppins)",
  }}>
    {children}
  </p>
);

const BottomProduct: FC<BottomProductProps> = ({
  isOpen,
  onClose,
  product,
  category,
  onAddToCart,
  priceRules = staticPriceRules,
  toppingGroups = DEFAULT_TOPPINGS,
}) => {
  const [selectedSize, setSelectedSize] = useState<SizeId>("mediano");
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  const toggleTopping = (t: string) =>
    setSelectedToppings((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  const resetForm = () => {
    setSelectedSize("mediano");
    setSelectedToppings([]);
    setQuantity(1);
  };

  const getBasePrice = () =>
    getPrice(product as unknown as Flavor, selectedSize, category.id, priceRules) ?? 0;

  const getPriceWithToppings = () => {
    const base = getBasePrice();
    return selectedToppings.length > 1 ? base + (selectedToppings.length - 1) * 10 : base;
  };

  const getTotalPrice = () => getPriceWithToppings() * quantity;

  const imageSrc = getImage(product as unknown as Flavor, category.id);
  const description = getDesc(product as unknown as Flavor, category.id);

  const handleAdd = () => {
    onAddToCart({
      productId: product.id,
      name: product.name,
      flavor: product.name,
      size: selectedSize,
      category: category.name,
      toppings: selectedToppings,
      price: getPriceWithToppings(),
      quantity,
    });
    resetForm();
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent
        style={{ backgroundColor: T.white, borderTop: `3px solid ${T.rose}` }}
        className="flex flex-col"
      >
        <style>{`
          .size-btn:hover { border-color: ${T.roseBorder} !important; }
          .topping-btn:hover { border-color: ${T.roseBorder} !important; }
          .add-btn:hover { background: ${T.roseDeep} !important; }
          .add-btn { transition: background 0.15s; }
          .qty-btn:hover { box-shadow: 0 0 0 2px ${T.roseBorder}; }
        `}</style>

        {/* Handle */}
        <div style={{
          width: 36, height: 3, borderRadius: 2,
          backgroundColor: T.border,
          margin: "12px auto 0",
        }} />

        {/* Scrollable body */}
        <div style={{
          padding: "16px 20px 0",
          overflowY: "auto", flex: 1,
          display: "flex", flexDirection: "column", gap: 22,
        }}>

          {/* Hero image */}
          {imageSrc && (
            <div style={{
              width: "100%", height: 190, flexShrink: 0,
              borderRadius: 20, overflow: "hidden",
              border: `1px solid ${T.roseBorder}`,
            }}>
              {/* flexShrink:0 es la parte que importa: este div vive dentro
                  de un flex-column con overflow-y:auto — sin esto, flexbox
                  lo encoge a casi 0 para hacerle espacio al texto de abajo
                  en vez de dejar que el contenedor haga scroll. */}
              <Image
                src={imageSrc} alt={product.name}
                width={600} height={190} quality={90}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          )}

          <DrawerHeader style={{ padding: 0, textAlign: "center" }}>
            <p style={{
              margin: 0, fontSize: 11, fontWeight: 600,
              color: T.rose, letterSpacing: "0.1em",
              textTransform: "uppercase", fontFamily: "var(--font-poppins)",
            }}>
              {category.name}
            </p>
            <DrawerTitle style={{
              margin: "4px 0 0", fontSize: 24, fontWeight: 700,
              letterSpacing: "-0.02em", color: T.text,
              fontFamily: "var(--font-poppins)",
            }}>
              {product?.name}
            </DrawerTitle>
            {description && (
              <p style={{
                margin: "8px 0 0", fontSize: 13, color: T.muted,
                lineHeight: 1.55, fontFamily: "var(--font-poppins)",
              }}>
                {description}
              </p>
            )}
          </DrawerHeader>

          {/* Size */}
          <div>
            <SectionLabel>Tamaño</SectionLabel>
            <div style={{ display: "flex", gap: 8 }}>
              {sizes.map((size) => {
                const active = selectedSize === size.id;
                const price =
                  getPrice(product as unknown as Flavor, size.id as SizeId, category.id, priceRules)
                  ?? size.price;
                return (
                  <button
                    key={size.id}
                    className="size-btn"
                    onClick={() => setSelectedSize(size.id as SizeId)}
                    style={{
                      flex: 1,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                      padding: "10px 6px", borderRadius: 14,
                      border: active ? `2px solid ${T.rose}` : `1.5px solid ${T.border}`,
                      background: active ? T.roseBg : T.white,
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: active ? T.rose : T.text }}>
                      {size.name.split(" ")[0]}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 400, color: active ? T.rose : T.muted, opacity: 0.8 }}>
                      {size.name.match(/\(.*\)/)?.[0] ?? ""}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: active ? T.rose : T.text, marginTop: 4 }}>
                      ${price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topping note */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 9,
            padding: "10px 13px", borderRadius: 12,
            background: T.roseBg,
            border: `1px solid ${T.roseBorder}`,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
              background: T.rose, color: "#FFF",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={11} />
            </div>
            <p style={{
              margin: 0, fontSize: 11, fontWeight: 400,
              color: T.rose, fontFamily: "var(--font-poppins)", lineHeight: 1.5,
            }}>
              Incluye <strong style={{ fontWeight: 700 }}>1 topping gratis</strong>. Cada topping adicional tiene un costo de +$10.
            </p>
          </div>

          {/* Toppings */}
          {toppingGroups.map((group) => {
            const visibleItems = group.items.filter((t: ToppingItem) => t.active && t.name);
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.id}>
                <SectionLabel>{group.label}</SectionLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {visibleItems.map((t: ToppingItem) => {
                    const active = selectedToppings.includes(t.name);
                    return (
                      <button
                        key={t.name}
                        className="topping-btn"
                        onClick={() => toggleTopping(t.name)}
                        style={{
                          padding: "7px 15px", borderRadius: 100,
                          border: active ? `1.5px solid ${T.rose}` : `1.5px solid ${T.border}`,
                          background: active ? T.rose : T.white,
                          color: active ? "#FFF" : T.secondary,
                          fontSize: 12, fontWeight: active ? 600 : 400,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Quantity */}
          <div>
            <SectionLabel>Cantidad</SectionLabel>
            <div style={{
              display: "flex", alignItems: "center",
              gap: 24, justifyContent: "center",
            }}>
              <button
                className="qty-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                style={{
                  width: 38, height: 38, borderRadius: "50%",
                  border: `1.5px solid ${T.border}`,
                  background: T.white,
                  color: quantity <= 1 ? T.mutedLight : T.rose,
                  cursor: quantity <= 1 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <Minus size={14} />
              </button>
              <span style={{
                fontSize: 24, fontWeight: 700, color: T.text,
                minWidth: 32, textAlign: "center",
                fontFamily: "var(--font-poppins)",
              }}>
                {quantity}
              </span>
              <button
                className="qty-btn"
                onClick={() => setQuantity(quantity + 1)}
                style={{
                  width: 38, height: 38, borderRadius: "50%",
                  border: "none", background: T.rose,
                  color: "#FFF", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{
          padding: "14px 20px 32px",
          borderTop: `1px solid ${T.border}`,
          backgroundColor: T.white,
        }}>
          <button
            className="add-btn"
            onClick={handleAdd}
            style={{
              width: "100%", height: 54, borderRadius: 14, border: "none",
              background: T.rose, color: "#FFF",
              fontSize: 15, fontWeight: 600,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 20px",
              fontFamily: "var(--font-poppins)",
              letterSpacing: "-0.01em",
              boxShadow: "0 2px 12px rgba(205,87,106,0.25)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingCart size={17} />
              Añadir al carrito
            </span>
            <span>${getTotalPrice().toFixed(2)}</span>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BottomProduct;
