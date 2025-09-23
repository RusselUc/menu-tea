"use client";
import Image from "next/image";
import logo from "@/assets/images/logo.png";

import { Button } from "../ui/button";
import { categories, Flavor, flavors, priceRules, SizeId } from "@/data/menu";
import { Card, CardContent } from "../ui/card";

import { Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";

import BottomProduct from "./BottomProduct";
import BottomCart from "./BottomCart";
import frappeFresa from "@/assets/images/frappe-fresa.png";
import { Badge } from "../ui/badge";

export interface Product {
  id: string;
  name: string;
  categories: string[];
  // emoji: string
  //   basePrice: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  flavor: string;
  size: string;
  // iceLevel: string
  category: string;
  toppings: string[];
  price: number;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;

  // emoji: string
}

export function getPrice(
  flavor: Flavor,
  sizeId: SizeId,
  category: string
): number | null {
  // Si el sabor tiene precio personalizado
  if (flavor.customPrice) {
    return flavor.customPrice[sizeId];
  }

  if (category === "frappe") {
    return priceRules[
      flavor.tier === "premium" ? "frappePremium" : "frappeClassic"
    ][sizeId];
  }

  if (
    category === "tea" ||
    category === "sodaItaliana" ||
    category === "milkTea"
  ) {
    return priceRules.tea[sizeId];
  }

  if (category === "specialty") {
    return priceRules.specialty[sizeId];
  }

  return null;
}

const getImageForProduct = (product: Flavor, categoryId: string) => {
  if (!product.images) return null;
  const imageMap: { [key: string]: string } = product.images;
  return imageMap[categoryId] || null;
};

const getDescriptionForProduct = (product: Flavor, categoryId: string) => {
  if (!product.description) return null;
  const descriptionMap: { [key: string]: string } = product.description;
  return descriptionMap[categoryId] || null;
};
const Menu = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>({
    id: "frappe",
    name: "frappe",
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const cartItemCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  console.log(cartItems);
  console.log(cartItemCount);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAddToCart = (item: Omit<CartItem, "id">) => {
    const newItem: CartItem = {
      ...item,
      id: Date.now().toString(),
    };
    setCartItems((prev) => [...prev, newItem]);
    setIsProductModalOpen(false);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  return (
    <div className="bg-[#FFF7F9] min-h-screen">
      <header className="sticky top-0 z-40 bg-main-dream">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Image src={logo} className="w-32 h-full " alt="té sueño logo" />
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-[70px] z-30  bg-main-dream rounded-b-[28px]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory.id === category.id ? "default" : "outline"
                }
                // size="sm"
                onClick={() => setSelectedCategory(category)}
                className="flex flex-col items-center rounded-sm gap-1 whitespace-nowrap border h-auto border-main-dream hover:bg-main-dream/30 transition-all text-xs"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  className="w-5 h-5 object-cover"
                />

                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flavors
            .filter((flavor) => flavor.categories.includes(selectedCategory.id))
            .map((product) => (
              <div
                className="flex gap-4 justify-between p-4 "
                key={product.id}
                onClick={() => handleProductClick(product)}
              >
                <div className="flex-1 flex flex-col gap-2 justify-between">
                  <h3 className="text-xl font-medium tracking-widest mb-2">
                    {product.name}
                  </h3>

                  {(() => {
                    const description = getDescriptionForProduct(
                      product as Flavor,
                      selectedCategory.id
                    );

                    return description ? (
                      <p className="text-sm text-muted-foreground mb-3 text-pretty">
                        {description}
                      </p>
                    ) : null;
                  })()}
                  <Button
                    // onClick={() => handleProductClick(product)}
                    className="w-full h-6 rounded-sm bg-main-dream/80 text-sm uppercase font-bold "
                  >
                    Ordenar
                  </Button>
                </div>
                <div className="flex-1">
                  {(() => {
                    const imageSrc = getImageForProduct(
                      product as Flavor,
                      selectedCategory.id
                    );
                    return imageSrc ? (
                      <Image
                        src={imageSrc}
                        className="w-40 h-full object-cover rounded-3xl"
                        alt={product.name}
                        quality={100}
                      />
                    ) : (
                      <div className="h-40 w-40 bg-gray-200 rounded-3xl flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          Sin imagen
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
        </div>
      </div>

      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--main-dream)] text-white p-6 shadow-lg">
          <div className="container mx-auto">
            <Button
              onClick={() => setIsCartModalOpen(true)}
              className="w-full bg-white text-[var(--main-dream)] hover:bg-gray-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span>
                  {cartItemCount} Bebida{cartItemCount !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="font-semibold">${cartTotal.toFixed(2)}</span>
            </Button>
          </div>
        </div>
      )}

      {selectedProduct && (
        <BottomProduct
          product={selectedProduct}
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          category={selectedCategory}
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
    </div>
  );
};
export default Menu;
