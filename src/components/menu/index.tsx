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
  description?: string;
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
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Image src={logo} className="w-32 h-full " alt="té sueño logo" />
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-[70px] z-30  backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border bg-red-500">
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
                className="flex items-center rounded-sm gap-2 whitespace-nowrap border border-main-dream hover:bg-main-dream/30 transition-all text-base py-4"
              >
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
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] py-4"
                onClick={() => handleProductClick(product)}
              >
                <CardContent className="px-4 py-0 flex flex-col gap-2">
                  {/* <div className="flex items-start justify-between mb-3"></div> */}
                  <div className="flex gap-2 flex-col relative">
                    {(() => {
                      const imageSrc = getImageForProduct(
                        product as Flavor,
                        selectedCategory.id
                      );
                      return imageSrc ? (
                        <Image
                          src={imageSrc}
                          className="w-full h-40 object-cover rounded-t-md"
                          alt={product.name}
                          quality={100}
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-200 rounded-t-md flex items-center justify-center">
                          <span className="text-gray-500 text-sm">
                            Sin imagen
                          </span>
                        </div>
                      );
                    })()}
                    <h3 className="text-xl font-black">{product.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 text-pretty">
                    {product.description}
                  </p>
                  <Button className="w-full h-12 rounded-sm bg-main-dream/80 text-xl uppercase font-bold ">
                    {/* <Plus className="w-4 h-4 mr-2" /> */}
                    Lo quiero
                  </Button>
                </CardContent>
              </Card>
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
