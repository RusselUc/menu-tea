import { FC, useState } from "react";
import { CartItem, Category, getPrice, Product } from ".";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { Flavor, SizeId, sizes, toppings } from "@/data/menu";
import { Minus, Plus } from "lucide-react";

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

interface BottomProductProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  category: Category;
  onAddToCart: (item: Omit<CartItem, "id">) => void;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      margin: "0 0 10px",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: C.muted,
      fontFamily: "var(--font-poppins)",
    }}
  >
    {children}
  </p>
);

const BottomProduct: FC<BottomProductProps> = ({
  isOpen,
  onClose,
  product,
  category,
  onAddToCart,
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
    getPrice(product as unknown as Flavor, selectedSize, category.id) ?? 0;

  const getPriceWithToppings = () => {
    const base = getBasePrice();
    return selectedToppings.length > 1
      ? base + (selectedToppings.length - 1) * 10
      : base;
  };

  const getTotalPrice = () => getPriceWithToppings() * quantity;

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
        style={{ backgroundColor: C.cream, borderTop: `3px solid ${C.rose}` }}
        className="flex flex-col"
      >
        {/* Rose accent top bar */}
        <div
          style={{
            height: 4,
            backgroundColor: C.rose,
            borderRadius: "4px 4px 0 0",
            margin: "0 0 0",
          }}
        />

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
            {product?.name}
          </DrawerTitle>
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
            {category.name}
          </p>
        </DrawerHeader>

        {/* Scrollable body */}
        <div
          style={{
            padding: "16px 20px 0",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {/* Size */}
          <div>
            <SectionLabel>Tamaño</SectionLabel>
            <div style={{ display: "flex", gap: 8 }}>
              {sizes.map((size) => {
                const active = selectedSize === size.id;
                const price =
                  getPrice(
                    product as unknown as Flavor,
                    size.id as SizeId,
                    category.id
                  ) ?? size.price;
                return (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id as SizeId)}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      padding: "10px 6px",
                      borderRadius: 14,
                      border: active
                        ? `2px solid ${C.dark}`
                        : `2px solid ${C.border}`,
                      background: active ? C.dark : C.white,
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: active ? "#FFF" : C.text,
                      }}
                    >
                      {size.name.split(" ")[0]}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 300,
                        color: active ? "rgba(255,255,255,0.6)" : C.muted,
                      }}
                    >
                      {size.name.match(/\(.*\)/)?.[0] ?? ""}
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: active ? "#FFF" : C.dark,
                        marginTop: 4,
                      }}
                    >
                      ${price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topping note */}
          <div
            style={{
              padding: "9px 13px",
              borderRadius: 12,
              background: "rgba(205,87,106,0.06)",
              border: "1px solid rgba(205,87,106,0.15)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 400,
                color: C.rose,
                fontFamily: "var(--font-poppins)",
                lineHeight: 1.5,
              }}
            >
              Incluye 1 topping gratis · Cada topping adicional +$10
            </p>
          </div>

          {/* Balas Explosivas */}
          <div>
            <SectionLabel>Balas Explosivas</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {toppings.poppingBoba.map((t) => {
                const active = selectedToppings.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTopping(t)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 100,
                      border: active
                        ? `1.5px solid ${C.rose}`
                        : `1.5px solid ${C.border}`,
                      background: active ? C.rose : C.white,
                      color: active ? "#FFF" : C.text,
                      fontSize: 12,
                      fontWeight: active ? 500 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jellys */}
          <div>
            <SectionLabel>Jelly&apos;s</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {toppings.jellys.map((t) => {
                const active = selectedToppings.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTopping(t)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 100,
                      border: active
                        ? `1.5px solid ${C.rose}`
                        : `1.5px solid ${C.border}`,
                      background: active ? C.rose : C.white,
                      color: active ? "#FFF" : C.text,
                      fontSize: 12,
                      fontWeight: active ? 500 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <SectionLabel>Cantidad</SectionLabel>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  border: `1.5px solid ${C.border}`,
                  background: C.white,
                  color: quantity <= 1 ? "#ccc" : C.dark,
                  cursor: quantity <= 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <Minus size={14} />
              </button>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: C.dark,
                  minWidth: 32,
                  textAlign: "center",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  border: "none",
                  background: C.dark,
                  color: "#FFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div
          style={{
            padding: "14px 20px 32px",
            borderTop: `1px solid ${C.border}`,
            backgroundColor: C.cream,
          }}
        >
          <button
            onClick={handleAdd}
            style={{
              width: "100%",
              height: 54,
              borderRadius: 16,
              border: "none",
              background: C.dark,
              color: "#FFF",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "var(--font-poppins)",
              letterSpacing: "-0.01em",
            }}
          >
            <Plus size={16} />
            Añadir al carrito — ${getTotalPrice().toFixed(2)}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BottomProduct;
