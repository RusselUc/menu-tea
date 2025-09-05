import { FC, useState } from "react";
import { CartItem, Category, Product } from ".";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { sizes, toppings } from "@/data/menu";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Minus, Plus } from "lucide-react";

interface BottomProductProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  category: Category;
  onAddToCart: (item: Omit<CartItem, "id">) => void;
}

const BottomProduct: FC<BottomProductProps> = ({
  isOpen,
  onClose,
  product,
  category,
  onAddToCart,
}) => {
  const [selectedSize, setSelectedSize] = useState("mini");
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  const toggleTopping = (topping: string) => {
    setSelectedToppings((prev) =>
      prev.includes(topping)
        ? prev.filter((t) => t !== topping)
        : [...prev, topping]
    );
  };

  const resetForm = () => {
    setSelectedSize("mini");
    setSelectedToppings([]);
    setQuantity(1);
  };

  const handleAdd = () => {
    const item = {
      productId: product.id,
      name: product.name,
      flavor: product.name,
      size: selectedSize,
      category: category.name,
      toppings: selectedToppings,
      price: 50,
      quantity,
    };

    onAddToCart(item);
    resetForm();
    onClose();
    console.log(item);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-popover flex flex-col">
        <DrawerHeader>
          <DrawerTitle className="text-popover-foreground">
            {category.name} - {product?.name}
          </DrawerTitle>
        </DrawerHeader>

        {/* Contenido scrollable */}
        <div className="px-4 pb-6 overflow-y-auto flex-1">
          {product && (
            <>
              <p className="text-muted-foreground mb-6">
                {product.description}
              </p>

              {/* Size Selection */}
              <div className="mb-6">
                <h3 className="font-medium mb-3 text-popover-foreground">
                  Size
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {sizes.map((size) => (
                    <Button
                      key={size.name}
                      variant={selectedSize === size.id ? "default" : "outline"}
                      onClick={() => setSelectedSize(size.id)}
                      className="text-xs flex flex-col h-auto"
                    >
                      {size.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Toppings */}
              <div className="mb-6">
                <h3 className="font-medium mb-3 text-popover-foreground">
                  Balas Explosivas
                </h3>
                <div className="space-y-2">
                  {toppings.poppingBoba.map((popping) => (
                    <div className="flex items-center gap-3" key={popping}>
                      <Checkbox
                        checked={selectedToppings.includes(popping)}
                        onCheckedChange={() => toggleTopping(popping)}
                      />
                      <Label>{popping}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-3 text-popover-foreground">
                  Jelly&apos;s
                </h3>
                <div className="space-y-2">
                  {toppings.jellys.map((jelly) => (
                    <div className="flex items-center gap-3" key={jelly}>
                      <Checkbox
                        checked={selectedToppings.includes(jelly)}
                        onCheckedChange={() => toggleTopping(jelly)}
                      />
                      <Label>{jelly}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-3 text-popover-foreground">
                  Crystal Bobba
                </h3>
                <div className="space-y-2">
                  {toppings.crystalBoba.map((crystal) => (
                    <div className="flex items-center gap-3" key={crystal}>
                      <Checkbox
                        checked={selectedToppings.includes(crystal)}
                        onCheckedChange={() => toggleTopping(crystal)}
                      />
                      <Label>{crystal}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cantidad */}
              <div>
                <h4 className="font-medium mb-3">Cantidad</h4>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-lg font-medium w-8 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer fijo con el botón */}
        <div className="border-t border-border p-4 sticky bottom-0 bg-popover shadow-lg">
          <Button onClick={handleAdd} className="w-full h-12">
            <Plus />
            Añadir al Carrito
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BottomProduct;
