import { FC, useState } from "react";
import { CartItem, Category, Product } from ".";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { sizes, toppings } from "@/data/menu";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { MessageCircle, Minus, Plus, Trash2 } from "lucide-react";
interface BottomCartProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
}

// max-h-96
const BottomCart: FC<BottomCartProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearCart,
}) => {
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const generateWhatsAppMessage = () => {
    const shopName = "Té Sueño";
    let message = `¡Hola! Me gustaría hacer un pedido en ${shopName}:\n\n`;

    items.forEach((item) => {
      message += `${item.category} - ${item.name}\n`;
      message += `   • Tamaño: ${item.size}\n`;
      // message += `   • Hielo: ${item.iceLevel}\n`
      if (item.toppings.length > 0) {
        message += `   • Toppings: ${item.toppings.join(", ")}\n`;
      }
      message += `   • Cantidad: ${item.quantity}\n`;
      //   message += `   • Precio: $${(item.price * item.quantity).toFixed(2)}\n\n`;
    });

    // message += `Total: $${total.toFixed(2)}\n\n`;
    message += `¡Gracias!`;

    return encodeURIComponent(message);
  };
  const handleWhatsAppOrder = () => {
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/529969634631?text=${message}`;
    window.open(whatsappUrl, "_blank");
    onClearCart();
    onClose();
  };
  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-popover">
        <DrawerHeader>
          <DrawerTitle className="text-popover-foreground">
            Tu Orden
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6  overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="text-sm text-muted-foreground space-y-1 mt-1">
                        {/* <p>
                          Size: {item.size} • Ice: {item.iceLevel}
                        </p> */}
                        {item.toppings.length > 0 && (
                          <p>Toppings: {item.toppings.join(", ")}</p>
                        )}
                        <p>Cantidad: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* <Badge variant="secondary">${(item.price * item.quantity).toFixed(2)}</Badge> */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  {/* <span>${total.toFixed(2)}</span> */}
                </div>

                <Button
                  onClick={handleWhatsAppOrder}
                  className="w-full"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Order via WhatsApp
                </Button>

                <Button
                  variant="outline"
                  onClick={onClearCart}
                  className="w-full bg-transparent"
                >
                  Limpiar carrito
                </Button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
export default BottomCart;
