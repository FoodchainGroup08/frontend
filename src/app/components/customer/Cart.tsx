import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
}

interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
}

export function Cart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onContinueShopping
}: CartProps) {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 0 ? 500 : 0;
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl mb-8" style={{ color: '#3B2314', fontWeight: 600 }}>
            Shopping Cart
          </h1>

          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardContent className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#F0A500', opacity: 0.1 }}>
                <ShoppingBag className="w-10 h-10" style={{ color: '#F0A500' }} />
              </div>
              <h3 className="text-xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
                Your cart is empty
              </h3>
              <p className="mb-6" style={{ color: '#3B2314', opacity: 0.6 }}>
                Add items from the menu to get started
              </p>
              <Button
                onClick={onContinueShopping}
                className="transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#F0A500',
                  color: '#1E1E1E'
                }}
              >
                Browse Menu
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onContinueShopping}
            className="p-2 rounded-md hover:bg-[#3B2314]/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: '#3B2314' }} />
          </button>
          <h1 className="text-2xl sm:text-3xl" style={{ color: '#3B2314', fontWeight: 600 }}>
            Shopping Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <Card key={item.id} className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg mb-1" style={{ color: '#3B2314', fontWeight: 600 }}>
                        {item.name}
                      </h3>
                      <CardDescription className="text-sm mb-3" style={{ color: '#3B2314', opacity: 0.6 }}>
                        {item.description}
                      </CardDescription>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border rounded-md" style={{ borderColor: '#3B2314', opacity: 0.2 }}>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-[#3B2314]/5 transition-colors"
                          >
                            <Minus className="w-4 h-4" style={{ color: '#3B2314' }} />
                          </button>
                          <span className="px-4 text-center min-w-[3rem]" style={{ color: '#3B2314', fontWeight: 600 }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-[#3B2314]/5 transition-colors"
                          >
                            <Plus className="w-4 h-4" style={{ color: '#3B2314' }} />
                          </button>
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-2 rounded-md hover:bg-[#E8622A]/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" style={{ color: '#E8622A' }} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg" style={{ color: '#F0A500', fontWeight: 600 }}>
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#3B2314', opacity: 0.6 }}>
                        ₦{item.price.toLocaleString()} each
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="border-[#3B2314]/10 sticky top-20" style={{ backgroundColor: 'white' }}>
              <CardHeader>
                <CardTitle style={{ color: '#3B2314' }}>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: '#3B2314', opacity: 0.7 }}>Subtotal</span>
                    <span style={{ color: '#3B2314', fontWeight: 600 }}>
                      ₦{subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#3B2314', opacity: 0.7 }}>Delivery Fee</span>
                    <span style={{ color: '#3B2314', fontWeight: 600 }}>
                      ₦{deliveryFee.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg">
                  <span style={{ color: '#3B2314', fontWeight: 600 }}>Total</span>
                  <span style={{ color: '#F0A500', fontWeight: 600 }}>
                    ₦{total.toLocaleString()}
                  </span>
                </div>

                <Button
                  onClick={onProceedToCheckout}
                  className="w-full transition-all hover:opacity-90 hover:shadow-lg"
                  style={{
                    backgroundColor: '#F0A500',
                    color: '#1E1E1E'
                  }}
                >
                  Proceed to Checkout
                </Button>

                <Button
                  onClick={onContinueShopping}
                  variant="outline"
                  className="w-full border-[#3B2314]/20"
                  style={{
                    color: '#3B2314'
                  }}
                >
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
