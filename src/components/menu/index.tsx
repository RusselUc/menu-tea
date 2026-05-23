"use client";
import Image from "next/image";
import logoPink from "@/assets/images/logo-pink.png";

import { categories, Flavor, flavors, priceRules, SizeId, sizes } from "@/data/menu";
import { useState, useEffect } from "react";
import { getMenuItems, getPriceRules, getToppings, getBanner, PriceRules, DEFAULT_PRICE_RULES, ToppingGroup, DEFAULT_TOPPINGS, MenuItem, BannerSettings } from "@/lib/menu-items";

import BottomProduct from "./BottomProduct";
import BottomCart from "./BottomCart";
import { Drawer, DrawerContent } from "../ui/drawer";

/* ─── Design tokens — aligned with loyalty card ────────── */
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
  oliveBg:     "rgba(121,135,76,0.08)",
  oliveBorder: "rgba(121,135,76,0.2)",
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

/* ─── Placeholder ──────────────────────────────────────── */
const Placeholder = ({ name }: { name: string }) => (
  <div style={{
    width: 84, height: 84, borderRadius: 14, flexShrink: 0,
    backgroundColor: T.roseBg,
    border: `1px solid ${T.roseBorder}`,
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <span style={{
      fontSize: 26, fontWeight: 700,
      color: T.rose, opacity: 0.55,
      fontFamily: "var(--font-poppins)",
    }}>
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

/* ─── Firestore → Flavor ───────────────────────────────── */
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
  const [selectedCategory, setSelectedCategory] = useState<Category>({ id: "frappe", name: "Frappe" });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [firestoreFlavors, setFirestoreFlavors] = useState<Flavor[] | null>(null);
  const [firestorePrices, setFirestorePrices] = useState<PriceRules>(DEFAULT_PRICE_RULES);
  const [firestoreToppings, setFirestoreToppings] = useState<ToppingGroup[]>(DEFAULT_TOPPINGS);
  const [randomDraw, setRandomDraw] = useState<RandomDraw | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [banner, setBanner] = useState<BannerSettings | null>(null);

  useEffect(() => {
    Promise.all([getMenuItems(), getPriceRules(), getToppings(), getBanner()])
      .then(([items, prices, toppings, bannerData]) => {
        if (items.length > 0) {
          setFirestoreFlavors(items.filter((i) => i.active).map(menuItemToFlavor));
        }
        setFirestorePrices(prices);
        setFirestoreToppings(toppings);
        setBanner(bannerData);
      })
      .catch(() => {})
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

  const visible = activeFlavors.filter((f) => f.categories.includes(selectedCategory.id));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: T.bg, fontFamily: "var(--font-poppins)" }}>

      {/* ── Header ─────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        backgroundColor: T.white,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{
          padding: "0 20px", height: 58,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <img src={logoPink.src} alt="Té Sueño" style={{ height: 34, width: "auto" }} />
          <div style={{
            height: 28, padding: "0 10px",
            borderRadius: 100,
            backgroundColor: T.roseBg,
            border: `1px solid ${T.roseBorder}`,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill={T.rose}>
              <path d="M12 2C7 2 3 6 3 11c0 3.5 2 6.5 5 8l4 3 4-3c3-1.5 5-4.5 5-8 0-5-4-9-9-9z" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.rose, letterSpacing: "0.04em" }}>
              Menú
            </span>
          </div>
        </div>
      </header>

      {/* ── Category tabs ───────────────────────────── */}
      <div style={{
        position: "sticky", top: 58, zIndex: 30,
        backgroundColor: T.white,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div
          className="scrollbar-hide"
          style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 16px 12px" }}
        >
          {categories.map((cat) => {
            const active = selectedCategory.id === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  flexShrink: 0,
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 100,
                  border: active ? `1.5px solid ${T.rose}` : `1.5px solid ${T.border}`,
                  background: active ? T.rose : T.white,
                  color: active ? "#FFF" : T.muted,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                <Image
                  src={cat.image} alt={cat.name} width={15} height={15}
                  style={{
                    objectFit: "contain",
                    filter: active
                      ? "brightness(0) invert(1)"
                      : "brightness(0) opacity(0.4)",
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Banner informativo ──────────────────────── */}
      {banner?.enabled && banner.message && (
        <div style={{
          margin: "14px 16px 0",
          padding: "11px 14px", borderRadius: 12,
          backgroundColor: T.roseBg,
          border: `1px solid ${T.roseBorder}`,
          display: "flex", alignItems: "flex-start", gap: 9,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{ color: T.rose, flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p style={{ margin: 0, fontSize: 13, color: T.rose, fontWeight: 500, lineHeight: 1.5 }}>
            {banner.message}
          </p>
        </div>
      )}

      {/* ── Section heading ─────────────────────────── */}
      <div style={{ padding: "18px 20px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{
              margin: 0, fontSize: 22, fontWeight: 700,
              color: T.text, letterSpacing: "-0.025em",
            }}>
              {categories.find((c) => c.id === selectedCategory.id)?.name}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: T.muted }}>
              {menuLoading ? "Cargando..." : `${visible.length} opciones disponibles`}
            </p>
          </div>
          <button
            onClick={handleSurprise}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 13px", borderRadius: 100,
              border: `1.5px solid ${T.roseBorder}`,
              background: T.roseBg,
              color: T.rose, cursor: "pointer",
              fontSize: 11, fontWeight: 600,
              fontFamily: "var(--font-poppins)",
              transition: "background 0.15s",
            }}
          >
            🎲 Sorpréndeme
          </button>
        </div>
      </div>

      {/* ── Product list ────────────────────────────── */}
      <div style={{
        padding: "4px 16px",
        paddingBottom: cartItemCount > 0 ? 108 : 48,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {menuLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: 14, backgroundColor: T.white,
              borderRadius: 16, border: `1px solid ${T.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: 84, height: 84, borderRadius: 12, flexShrink: 0,
                background: `linear-gradient(90deg, ${T.slate} 25%, #e8edf2 50%, ${T.slate} 75%)`,
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite",
              }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {[["55%", 0], ["80%", 0.1], ["35%", 0.2]].map(([w, d], j) => (
                  <div key={j} style={{
                    height: j === 0 ? 14 : 11, borderRadius: 6, width: w as string,
                    background: `linear-gradient(90deg, ${T.slate} 25%, #e8edf2 50%, ${T.slate} 75%)`,
                    backgroundSize: "200% 100%",
                    animation: `shimmer 1.4s ${i * 0.1 + (d as number)}s infinite`,
                  }} />
                ))}
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
                display: "flex", alignItems: "center", gap: 14,
                padding: 14,
                backgroundColor: T.white,
                borderRadius: 16,
                border: `1px solid ${T.border}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                cursor: "pointer",
                opacity: 0,
                animation: "fadeUp 0.38s ease forwards",
                animationDelay: `${idx * 0.04}s`,
                transition: "box-shadow 0.2s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.09)";
                el.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                el.style.transform = "translateY(0)";
              }}
            >
              {imageSrc ? (
                <Image
                  src={imageSrc} alt={product.name}
                  width={84} height={84} quality={90}
                  style={{ borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <Placeholder name={product.name} />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  margin: "0 0 3px", fontSize: 15, fontWeight: 600,
                  color: T.text, letterSpacing: "-0.01em",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {product.name}
                </h3>

                {description && (
                  <p style={{
                    margin: "0 0 10px", fontSize: 12, fontWeight: 400,
                    color: T.muted, lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {description}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.olive }}>
                    Desde ${minPrice}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: "#FFFFFF", backgroundColor: T.rose,
                    padding: "5px 13px", borderRadius: 100,
                  }}>
                    Ordenar
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Keyframes ───────────────────────────────── */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* ── Cart bar ────────────────────────────────── */}
      {cartItemCount > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          zIndex: 50,
          padding: "10px 16px 24px",
          background: T.bg,
          borderTop: `1px solid ${T.border}`,
          boxShadow: "0 -2px 20px rgba(0,0,0,0.07)",
          animation: "fadeUp 0.28s ease",
        }}>
          <button
            onClick={() => setIsCartModalOpen(true)}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 18px", borderRadius: 14, border: "none",
              cursor: "pointer", background: "#22C55E", color: "#FFFFFF",
              fontFamily: "var(--font-poppins)",
              boxShadow: "0 4px 16px rgba(34,197,94,0.28)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Revisar y pedir</span>
                <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.88, lineHeight: 1.1 }}>
                  {cartItemCount} bebida{cartItemCount !== 1 ? "s" : ""} · confirmar antes de enviar
                </span>
              </div>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>${cartTotal.toFixed(2)}</span>
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

/* ─── SurpriseDrawer ───────────────────────────────────── */
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
  const price = base;

  const imgSrc = getImage(flavor, category.id);
  const desc = getDesc(flavor, category.id);
  const sizeLabels: Record<string, string> = {
    mediano: "Mediano",
    grande: "Grande",
    pandi: "Pandi",
  };

  return (
    <Drawer open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent style={{ backgroundColor: T.white, borderTop: `3px solid ${T.rose}` }}>
        <div style={{ width: 36, height: 3, borderRadius: 2, backgroundColor: T.border, margin: "12px auto 0" }} />

        <div style={{ padding: "18px 20px 36px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>

          <p style={{
            margin: 0, textAlign: "center", fontSize: 12, fontWeight: 600,
            color: T.olive, letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Tu bebida del destino ✨
          </p>

          {/* Product card */}
          <div style={{
            background: T.white, borderRadius: 16,
            border: `1px solid ${T.border}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}>
            {imgSrc ? (
              <>
                <div style={{ position: "relative", height: 190 }}>
                  <Image src={imgSrc} alt={flavor.name} fill quality={90}
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 600px) 100vw, 600px"
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to bottom, transparent 35%, rgba(15,8,4,0.78) 100%)",
                  }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px 14px" }}>
                    <div style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                        color: "#FFF", background: "rgba(205,87,106,0.7)", backdropFilter: "blur(4px)",
                        padding: "3px 9px", borderRadius: 100, fontFamily: "var(--font-poppins)",
                      }}>{category.name}</span>
                      {topping && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: "#FFF",
                          background: "rgba(121,135,76,0.7)", backdropFilter: "blur(4px)",
                          padding: "3px 9px", borderRadius: 100, fontFamily: "var(--font-poppins)",
                        }}>{topping}</span>
                      )}
                    </div>
                    <p style={{
                      margin: 0, fontSize: 22, fontWeight: 700, color: "#FFF",
                      letterSpacing: "-0.025em", lineHeight: 1.15,
                      textShadow: "0 1px 8px rgba(0,0,0,0.4)",
                      fontFamily: "var(--font-poppins)",
                    }}>{flavor.name}</p>
                  </div>
                </div>
                {desc && (
                  <div style={{ padding: "10px 14px 12px" }}>
                    <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.5, fontFamily: "var(--font-poppins)" }}>{desc}</p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: "14px 16px" }}>
                <p style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: "-0.02em", fontFamily: "var(--font-poppins)" }}>{flavor.name}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: desc ? 10 : 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#FFF", background: T.rose, padding: "3px 9px", borderRadius: 100, fontFamily: "var(--font-poppins)" }}>{category.name}</span>
                  {topping && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.olive, background: T.oliveBg, padding: "3px 9px", borderRadius: 100, fontFamily: "var(--font-poppins)" }}>{topping}</span>
                  )}
                </div>
                {desc && <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.5, fontFamily: "var(--font-poppins)" }}>{desc}</p>}
              </div>
            )}
          </div>

          {/* Size selector */}
          <div>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Elige tu tamaño
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {sizes.map((s) => {
                const sizePrice = getPrice(flavor, s.id as SizeId, category.id, firestorePrices) ?? 0;
                const active = selectedSize === s.id;
                return (
                  <button key={s.id} onClick={() => setSelectedSize(s.id as SizeId)} style={{
                    flex: 1, padding: "10px 6px", borderRadius: 12,
                    border: active ? `2px solid ${T.rose}` : `1.5px solid ${T.border}`,
                    background: active ? T.roseBg : T.white,
                    cursor: "pointer", fontFamily: "var(--font-poppins)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    transition: "all 0.15s ease",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: active ? T.rose : T.muted }}>
                      {sizeLabels[s.id]}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: active ? T.rose : T.text }}>
                      ${sizePrice}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <button
              onClick={() => onAdd({
                productId: flavor.id, name: flavor.name, flavor: flavor.name,
                size: selectedSize, category: category.name,
                toppings: topping ? [topping] : [], price, quantity: 1,
              })}
              style={{
                height: 52, borderRadius: 14, border: "none",
                background: T.rose, color: "#FFF",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-poppins)",
                boxShadow: "0 2px 12px rgba(205,87,106,0.25)",
                transition: "background 0.15s",
              }}
            >
              Agregar al carrito · ${price.toFixed(2)}
            </button>
            <button
              onClick={onReshuffle}
              style={{
                height: 44, borderRadius: 12,
                border: `1.5px solid ${T.roseBorder}`,
                background: T.roseBg, color: T.rose,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-poppins)",
                transition: "background 0.15s",
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
