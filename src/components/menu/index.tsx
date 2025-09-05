"use client";
import Image from "next/image";
import logo from "@/assets/images/logo.png";

import { Button } from "../ui/button";
import { categories, flavors } from "@/data/menu";
import { Card, CardContent } from "../ui/card";

import { Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";

import BottomProduct from "./BottomProduct";
import BottomCart from "./BottomCart";

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
const Menu = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>({
    id: "frappe",
    name: "Frappe",
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
    <div className="bg-background min-h-screen">
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
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="flex items-center gap-2 whitespace-nowrap border border-main-dream hover:bg-main-dream/30 transition-all"
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
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                onClick={() => handleProductClick(product)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3"></div>
                  <h3 className="font-semibold text-lg mb-2 text-balance">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 text-pretty">
                    {product.description}
                  </p>
                  <Button className="w-full h-12 bg-main-dream">
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir Al Carrito
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
                  {cartItemCount} Bebida(s){cartItemCount !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="font-semibold"></span>
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
