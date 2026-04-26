"use client";
import Image from "next/image";

import { categories, Flavor, flavors, priceRules, SizeId, sizes } from "@/data/menu";
import { useState, useEffect } from "react";
import { getMenuItems, getPriceRules, getToppings, PriceRules, DEFAULT_PRICE_RULES, ToppingGroup, DEFAULT_TOPPINGS, MenuItem } from "@/lib/menu-items";

import BottomProduct from "./BottomProduct";
import BottomCart from "./BottomCart";
import { Drawer, DrawerContent } from "../ui/drawer";

/* ─── Brand tokens ─────────────────────────────────────── */
const C = {
  dark: "#CD576A", // deep forest green — header, primary buttons
  olive: "#79874C", // olive green — secondary accents, counts
  rose: "#CD576A", // rose — CTAs, active states
  pink: "#F298AA", // blush pink — prices, soft highlights
  cream: "#F8F5F1", // soft warm white — page background
  white: "#FFFFFF",
  text: "#2A2019", // warm near-black
  muted: "#8A7A6E", // warm muted brown-gray
  border: "rgba(59,89,53,0.1)",
};

/* ─── Interfaces ───────────────────────────────────────── */
export interface Product {
  id: string;
  name: string;
  categories: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  flavor: string;
  size: string;
  category: string;
  toppings: string[];
  price: number;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
}

/* ─── Helpers ──────────────────────────────────────────── */
export function getPrice(
  flavor: Flavor,
  sizeId: SizeId,
  category: string,
  rules: typeof priceRules = priceRules
): number | null {
  if (flavor.customPrice) return flavor.customPrice[sizeId];
  if (category === "frappe")
    return rules[flavor.tier === "premium" ? "frappePremium" : "frappeClassic"][sizeId];
  if (["tea", "sodaItaliana", "milkTea"].includes(category))
    return rules.tea[sizeId];
  if (category === "specialty") return rules.specialty[sizeId];
  return null;
}

const getImage = (p: Flavor, cat: string) =>
  p.images ? (p.images as Record<string, string>)[cat] ?? null : null;

const getDesc = (p: Flavor, cat: string) =>
  p.description ? (p.description as Record<string, string>)[cat] ?? null : null;

function getMinPrice(p: Flavor, cat: string, rules: typeof priceRules = priceRules): number {
  if (p.customPrice) return Math.min(...Object.values(p.customPrice));
  if (cat === "sodaItaliana") return rules.sodaItaliana.mediano;
  if (cat === "frappe")
    return rules[p.tier === "premium" ? "frappePremium" : "frappeClassic"].mediano;
  if (cat === "specialty") return rules.specialty.mediano;
  return rules.tea.mediano;
}

/* ─── Leaf decoration (SVG) ───────────────────────────── */
const LeafIcon = ({
  size = 20,
  opacity = 0.18,
}: {
  size?: number;
  opacity?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ opacity }}
  >
    <path
      d="M12 2C7 2 3 6 3 11c0 3.5 2 6.5 5 8l4 3 4-3c3-1.5 5-4.5 5-8 0-5-4-9-9-9z"
      fill="currentColor"
    />
  </svg>
);

/* ─── Placeholder ──────────────────────────────────────── */
const Placeholder = ({ name }: { name: string }) => (
  <div
    style={{
      width: 84,
      height: 84,
      borderRadius: 16,
      flexShrink: 0,
      backgroundColor: "rgba(59,89,53,0.07)",
      border: `1px solid rgba(59,89,53,0.12)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <span
      style={{
        fontSize: 26,
        fontWeight: 700,
        color: C.rose,
        opacity: 0.6,
        fontFamily: "var(--font-poppins)",
      }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  </div>
);

/* ─── Random drink ─────────────────────────────────────── */
interface RandomDraw {
  flavor: Flavor;
  category: { id: string; name: string };
  topping: string;
}

function pickRandom(
  activeFlavors: Flavor[],
  activeCategories: typeof categories,
  toppingGroups: ToppingGroup[],
): RandomDraw | null {
  const cat = activeCategories[Math.floor(Math.random() * activeCategories.length)];
  const available = activeFlavors.filter((f) => f.categories.includes(cat.id));
  if (!available.length) return null;
  const flavor = available[Math.floor(Math.random() * available.length)];
  const allToppings = toppingGroups.flatMap((g) =>
    g.items.filter((t) => t.active && t.name).map((t) => t.name)
  );
  const topping = allToppings[Math.floor(Math.random() * allToppings.length)] ?? "";
  return { flavor, category: cat, topping };
}

/* ─── Helpers to map Firestore items → Flavor ─────────── */
function menuItemToFlavor(item: MenuItem): Flavor {
  const staticFlavor = flavors.find((f) => f.id === item.id);
  const images = (item.imageUrls && Object.keys(item.imageUrls).length > 0)
    ? item.imageUrls
    : (staticFlavor?.images ?? {});

  return {
    id: item.id,
    name: item.name,
    categories: item.categories,
    tier: item.tier,
    customPrice: item.customPrice,
    images,
    description: item.descriptions,
  } as Flavor;
}

/* ─── Menu ─────────────────────────────────────────────── */
const Menu = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>({
    id: "frappe",
    name: "Frappe",
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [firestoreFlavors, setFirestoreFlavors] = useState<Flavor[] | null>(null);
  const [firestorePrices, setFirestorePrices] = useState<PriceRules>(DEFAULT_PRICE_RULES);
  const [firestoreToppings, setFirestoreToppings] = useState<ToppingGroup[]>(DEFAULT_TOPPINGS);
  const [randomDraw, setRandomDraw] = useState<RandomDraw | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMenuItems(), getPriceRules(), getToppings()])
      .then(([items, prices, toppings]) => {
        if (items.length > 0) {
          setFirestoreFlavors(items.filter((i) => i.active).map(menuItemToFlavor));
        }
        setFirestorePrices(prices);
        setFirestoreToppings(toppings);
      })
      .catch(() => { /* silently fall back to static */ })
      .finally(() => setMenuLoading(false));
  }, []);

  const activeFlavors = firestoreFlavors ?? flavors;

  const cartTotal = cartItems.reduce((t, i) => t + i.price * i.quantity, 0);
  const cartItemCount = cartItems.reduce((c, i) => c + i.quantity, 0);

  const handleProductClick = (p: Product) => {
    setSelectedProduct(p);
    setIsProductModalOpen(true);
  };

  const handleAddToCart = (item: Omit<CartItem, "id">) =>
    setCartItems((prev) => [...prev, { ...item, id: Date.now().toString() }]);

  const handleRemoveFromCart = (id: string) =>
    setCartItems((prev) => prev.filter((i) => i.id !== id));

  const handleClearCart = () => setCartItems([]);

  function handleSurprise() {
    setRandomDraw(pickRandom(activeFlavors as Flavor[], categories, firestoreToppings));
  }

  const visible = activeFlavors.filter((f) =>
    f.categories.includes(selectedCategory.id)
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: C.cream,
        fontFamily: "var(--font-poppins)",
      }}
    >
      {/* ── Header ─────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backgroundColor: C.dark,
          boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
        }}
      >
        {/* Decorative leaf pattern at top */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            style={{ position: "absolute", right: 12, top: -4, color: "white" }}
          >
            <LeafIcon size={52} opacity={0.07} />
          </div>
          <div
            style={{ position: "absolute", right: 36, top: 4, color: "white" }}
          >
            <LeafIcon size={28} opacity={0.05} />
          </div>
        </div>

        <div
          style={{
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 21,
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Té Sueño
            </p>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 10,
                fontWeight: 400,
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.55)",
                textTransform: "uppercase",
              }}
            >
              Bobba Tea
            </p>
          </div>

          {/* Starbucks-style circular emblem */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <LeafIcon size={22} opacity={1} />
          </div>
        </div>
      </header>

      {/* ── Category tabs ───────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 65,
          zIndex: 30,
          backgroundColor: C.dark,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        }}
      >
        <div
          className="scrollbar-hide"
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            padding: "10px 16px 14px",
          }}
        >
          {categories.map((cat) => {
            const active = selectedCategory.id === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 100,
                  border: active
                    ? "1.5px solid transparent"
                    : "1.5px solid rgba(255,255,255,0.18)",
                  background: active ? "#FFFFFF" : "rgba(255,255,255,0.08)",
                  color: active ? C.dark : "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  width={16}
                  height={16}
                  style={{
                    objectFit: "contain",
                    filter: active
                      ? `brightness(0) saturate(100%) invert(27%) sepia(20%) saturate(600%) hue-rotate(95deg)`
                      : "brightness(0) invert(1)",
                    opacity: active ? 1 : 0.7,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section heading ─────────────────────────── */}
      <div style={{ padding: "24px 20px 8px", animation: "fadeIn 0.3s ease" }}>
        <h2
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: C.dark,
            letterSpacing: "-0.025em",
          }}
        >
          {categories.find((c) => c.id === selectedCategory.id)?.name}
        </h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <p style={{ margin: 0, fontSize: 12, color: C.muted, fontWeight: 400 }}>
            {menuLoading ? "Cargando..." : `${visible.length} opciones disponibles`}
          </p>
          <button
            onClick={handleSurprise}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 100,
              border: `1.5px solid ${C.pink}`,
              background: "rgba(242,152,170,0.1)",
              color: C.dark, cursor: "pointer",
              fontSize: 11, fontWeight: 600,
              fontFamily: "var(--font-poppins)",
              letterSpacing: "0.02em",
            }}
          >
            🎲 Sorpréndeme
          </button>
        </div>
      </div>

      {/* ── Product list ────────────────────────────── */}
      <div
        style={{
          padding: "4px 16px",
          paddingBottom: cartItemCount > 0 ? 108 : 48,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {menuLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: 14,
                backgroundColor: C.white,
                borderRadius: 18,
                boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{
                width: 84,
                height: 84,
                borderRadius: 14,
                background: `linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.06) 75%)`,
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite",
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{
                  height: 14,
                  borderRadius: 6,
                  width: "55%",
                  background: `linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.06) 75%)`,
                  backgroundSize: "200% 100%",
                  animation: `shimmer 1.4s ${i * 0.1}s infinite`,
                }} />
                <div style={{
                  height: 11,
                  borderRadius: 6,
                  width: "80%",
                  background: `linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.06) 75%)`,
                  backgroundSize: "200% 100%",
                  animation: `shimmer 1.4s ${i * 0.1 + 0.1}s infinite`,
                }} />
                <div style={{
                  height: 11,
                  borderRadius: 6,
                  width: "40%",
                  background: `linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.06) 75%)`,
                  backgroundSize: "200% 100%",
                  animation: `shimmer 1.4s ${i * 0.1 + 0.2}s infinite`,
                }} />
              </div>
            </div>
          ))
        ) : visible.map((product, idx) => {
          const imageSrc = getImage(product as Flavor, selectedCategory.id);
          const description = getDesc(product as Flavor, selectedCategory.id);
          const minPrice = getMinPrice(product as Flavor, selectedCategory.id, firestorePrices);

          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: 14,
                backgroundColor: C.white,
                borderRadius: 18,
                boxShadow:
                  "0 1px 6px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                cursor: "pointer",
                opacity: 0,
                animation: "fadeUp 0.38s ease forwards",
                animationDelay: `${idx * 0.04}s`,
                transition: "box-shadow 0.2s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow =
                  "0 4px 20px rgba(0,0,0,0.1), 0 1px 6px rgba(0,0,0,0.06)";
                el.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow =
                  "0 1px 6px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)";
                el.style.transform = "translateY(0)";
              }}
            >
              {/* Image left */}
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={product.name}
                  width={84}
                  height={84}
                  quality={90}
                  style={{
                    borderRadius: 14,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <Placeholder name={product.name} />
              )}

              {/* Text right */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    margin: "0 0 3px",
                    fontSize: 15,
                    fontWeight: 600,
                    color: C.dark,
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {product.name}
                </h3>

                {description && (
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: 12,
                      fontWeight: 300,
                      color: C.muted,
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {description}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.olive,
                    }}
                  >
                    Desde ${minPrice}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      color: "#FFFFFF",
                      backgroundColor: C.rose,
                      padding: "5px 13px",
                      borderRadius: 100,
                    }}
                  >
                    Ordenar
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Shimmer keyframe ────────────────────────── */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ── Cart bar ────────────────────────────────── */}
      {cartItemCount > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: "12px 16px 28px",
            backgroundColor: C.dark,
            boxShadow: "0 -4px 24px rgba(0,0,0,0.16)",
            animation: "fadeUp 0.28s ease",
          }}
        >
          <button
            onClick={() => setIsCartModalOpen(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderRadius: 16,
              border: "none",
              cursor: "pointer",
              backgroundColor: C.rose,
              color: "#FFFFFF",
              fontFamily: "var(--font-poppins)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {cartItemCount}
              </div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {cartItemCount} Bebida{cartItemCount !== 1 ? "s" : ""}
              </span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              ${cartTotal.toFixed(2)}
            </span>
          </button>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────── */}
      {selectedProduct && (
        <BottomProduct
          product={selectedProduct}
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          category={selectedCategory}
          priceRules={firestorePrices}
          toppingGroups={firestoreToppings}
          onAddToCart={handleAddToCart}
        />
      )}

      <BottomCart
        items={cartItems}
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* ── Sorpréndeme drawer ───────────────────────── */}
      {randomDraw && (
        <SurpriseDrawer
          draw={randomDraw}
          firestorePrices={firestorePrices}
          onAdd={(item) => { handleAddToCart(item); setRandomDraw(null); }}
          onReshuffle={handleSurprise}
          onClose={() => setRandomDraw(null)}
        />
      )}
    </div>
  );
};

function SurpriseDrawer({
  draw,
  firestorePrices,
  onAdd,
  onReshuffle,
  onClose,
}: {
  draw: RandomDraw;
  firestorePrices: typeof priceRules;
  onAdd: (item: Omit<CartItem, "id">) => void;
  onReshuffle: () => void;
  onClose: () => void;
}) {
  const { flavor, category, topping } = draw;
  const [selectedSize, setSelectedSize] = useState<SizeId>("mediano");

  const base = getPrice(flavor, selectedSize, category.id, firestorePrices) ?? 0;
  const price = base + (topping ? 0 : 0); // 1 topping is always free

  const imgSrc = getImage(flavor, category.id);
  const desc = getDesc(flavor, category.id);
  const sizeLabels: Record<string, string> = {
    mediano: "Mediano · 16oz",
    grande: "Grande · 24oz",
    pandi: "Pandi · 24oz",
  };

  return (
    <Drawer open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent style={{ backgroundColor: C.cream, borderTop: `3px solid ${C.rose}` }}>
        <div style={{ height: 4, backgroundColor: C.rose }} />
        <div style={{ width: 36, height: 3, borderRadius: 2, backgroundColor: C.border, margin: "10px auto 0" }} />

        <div style={{ padding: "20px 24px 36px", display: "flex", flexDirection: "column", gap: 18, overflowY: "auto" }}>
          {/* Title */}
          <p style={{ margin: 0, textAlign: "center", fontSize: 13, fontWeight: 600, color: C.olive, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Tu bebida del destino ✨
          </p>

          {/* Card */}
          <div style={{ background: C.white, borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden", border: `1px solid ${C.border}` }}>
            {imgSrc ? (
              <>
                {/* Image with name overlaid via gradient scrim */}
                <div style={{ position: "relative", height: 200 }}>
                  <Image
                    src={imgSrc}
                    alt={flavor.name}
                    fill
                    quality={90}
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 600px) 100vw, 600px"
                  />
                  {/* Deep gradient scrim from bottom */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, transparent 30%, rgba(15,8,4,0.82) 100%)",
                  }} />
                  {/* Name + chips overlaid */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px 14px" }}>
                    {/* Category + topping chips */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#FFFFFF",
                        background: "rgba(205,87,106,0.75)",
                        backdropFilter: "blur(4px)",
                        padding: "3px 9px",
                        borderRadius: 100,
                        fontFamily: "var(--font-poppins)",
                      }}>
                        {category.name}
                      </span>
                      {topping && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          color: "#FFFFFF",
                          background: "rgba(121,135,76,0.75)",
                          backdropFilter: "blur(4px)",
                          padding: "3px 9px",
                          borderRadius: 100,
                          fontFamily: "var(--font-poppins)",
                        }}>
                          {topping}
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.15,
                      textShadow: "0 1px 8px rgba(0,0,0,0.4)",
                      fontFamily: "var(--font-poppins)",
                    }}>
                      {flavor.name}
                    </p>
                  </div>
                </div>
                {/* Below image: desc only */}
                {desc && (
                  <div style={{ padding: "12px 16px 14px" }}>
                    <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.5, fontFamily: "var(--font-poppins)" }}>{desc}</p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: "14px 16px" }}>
                <p style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", fontFamily: "var(--font-poppins)" }}>{flavor.name}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: desc ? 10 : 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#FFF", background: C.rose, padding: "3px 9px", borderRadius: 100, fontFamily: "var(--font-poppins)" }}>
                    {category.name}
                  </span>
                  {topping && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.olive, background: "rgba(121,135,76,0.12)", padding: "3px 9px", borderRadius: 100, fontFamily: "var(--font-poppins)" }}>
                      {topping}
                    </span>
                  )}
                </div>
                {desc && <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.5, fontFamily: "var(--font-poppins)" }}>{desc}</p>}
              </div>
            )}
          </div>

          {/* Size selector */}
          <div>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Elige tu tamaño
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {sizes.map((s) => {
                const sizePrice = getPrice(flavor, s.id as SizeId, category.id, firestorePrices) ?? 0;
                const active = selectedSize === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSize(s.id as SizeId)}
                    style={{
                      flex: 1, padding: "10px 6px", borderRadius: 12,
                      border: active ? `2px solid ${C.rose}` : `1.5px solid ${C.border}`,
                      background: active ? "rgba(205,87,106,0.06)" : C.white,
                      cursor: "pointer", fontFamily: "var(--font-poppins)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: active ? C.rose : C.muted }}>
                      {sizeLabels[s.id]?.split(" · ")[0]}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: active ? C.dark : C.muted }}>
                      ${sizePrice}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => onAdd({
                productId: flavor.id,
                name: flavor.name,
                flavor: flavor.name,
                size: selectedSize,
                category: category.name,
                toppings: topping ? [topping] : [],
                price,
                quantity: 1,
              })}
              style={{
                height: 52, borderRadius: 14, border: "none",
                background: C.dark, color: "#FFF",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-poppins)",
              }}
            >
              Agregar al carrito · ${price.toFixed(2)}
            </button>
            <button
              onClick={onReshuffle}
              style={{
                height: 44, borderRadius: 12, border: `1.5px solid ${C.pink}`,
                background: "transparent", color: C.dark,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-poppins)",
              }}
            >
              🎲 Otra opción
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default Menu;
