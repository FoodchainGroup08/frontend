import { useState } from "react";
import { MapPin, Phone, User, CreditCard, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { placeOrder, type Order } from "@/services/api";
import { LocationPicker } from "../auth/LocationPicker";
import { getSavedDeliveryLocation, saveDeliveryLocation } from "@/services/locationService";
import { isNetworkError, saveDemoActiveOrder } from "@/utils/demoData";
import { useAuth } from "@/context/AuthContext";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutProps {
  cart: CartItem[];
  branchId: string;
  branchName: string;
  onPlaceOrder: (formData: OrderDetails, order: Order) => void;
  onGoBack: () => void;
}

export interface OrderDetails {
  deliveryAddress: string;
  phoneNumber: string;
  customerName: string;
  paymentMethod: string;
  specialInstructions: string;
  total: number;
}

export function Checkout({ cart, branchId, branchName, onPlaceOrder, onGoBack }: CheckoutProps) {
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [phoneNumber, setPhoneNumber] = useState(localStorage.getItem('foodchain_phone_number') || "");
  const [deliveryAddress, setDeliveryAddress] = useState(getSavedDeliveryLocation());
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 500;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const payload = {
      branchId,
      orderType: "delivery" as const,
      deliveryAddress,
      items: cart.map(item => ({ menuItemId: item.id, quantity: item.quantity })),
      customerName,
      phoneNumber,
      paymentMethod,
      specialInstructions,
    };

    try {
      let order: Order;

      try {
        order = await placeOrder(payload);
      } catch (apiErr: any) {
        if (isNetworkError(apiErr)) {
          // Demo fallback — create an in-memory order
          order = {
            id: `demo_order_${Date.now()}`,
            status: "RECEIVED",
            items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
            subtotal,
            deliveryFee,
            total,
            branchId,
            branchName,
            orderType: "delivery",
            deliveryAddress,
            customerName,
            phoneNumber,
            paymentMethod,
            specialInstructions,
            estimatedTime: "45 mins",
            placedAt: new Date().toISOString(),
          };
          // Persist so OrderTracker can pick it up
          saveDemoActiveOrder(order);
        } else {
          throw apiErr;
        }
      }

      // Persist the address for future orders
      saveDeliveryLocation(deliveryAddress);

      const formData: OrderDetails = {
        customerName,
        phoneNumber,
        deliveryAddress,
        paymentMethod,
        specialInstructions,
        total,
      };
      onPlaceOrder(formData, order);
      toast.success("Order placed successfully!", { description: `Order #${order.id}` });
    } catch {
      toast.error("Failed to place order", { description: "Please try again" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--foodchain-warm-white)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onGoBack}
            className="p-2 rounded-md hover:bg-[var(--foodchain-espresso)]/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: "var(--foodchain-espresso)" }} />
          </button>
          <h1
            className="text-2xl sm:text-3xl"
            style={{ color: "var(--foodchain-espresso)", fontWeight: 600 }}
          >
            Checkout
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card
                className="border-[var(--foodchain-espresso)]/10"
                style={{ backgroundColor: "var(--foodchain-white)" }}
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-2"
                    style={{ color: "var(--foodchain-espresso)" }}
                  >
                    <User className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" style={{ color: "var(--foodchain-espresso)" }}>
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="border-[var(--foodchain-espresso)]/20"
                      style={{ backgroundColor: "var(--foodchain-white)" }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" style={{ color: "var(--foodchain-espresso)" }}>
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                        style={{ color: "var(--foodchain-espresso)", opacity: 0.4 }}
                      />
                      <Input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="080 1234 5678"
                        required
                        className="pl-10 border-[var(--foodchain-espresso)]/20"
                        style={{ backgroundColor: "var(--foodchain-white)" }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card
                className="border-[var(--foodchain-espresso)]/10"
                style={{ backgroundColor: "var(--foodchain-white)" }}
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-2"
                    style={{ color: "var(--foodchain-espresso)" }}
                  >
                    <MapPin className="w-5 h-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <LocationPicker
                    value={deliveryAddress}
                    onChange={setDeliveryAddress}
                    placeholder="Search for your delivery address…"
                  />
                  {deliveryAddress && (
                    <div
                      className="p-3 rounded-md"
                      style={{ backgroundColor: "rgba(240,165,0,0.08)" }}
                    >
                      <p className="text-sm" style={{ color: "var(--foodchain-espresso)" }}>
                        Delivering from{" "}
                        <span style={{ fontWeight: 600 }}>{branchName}</span>
                      </p>
                    </div>
                  )}
                  {/* Hidden required input so form validation works */}
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={() => {}}
                    required
                    className="sr-only"
                    aria-hidden="true"
                  />
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card
                className="border-[var(--foodchain-espresso)]/10"
                style={{ backgroundColor: "var(--foodchain-white)" }}
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-2"
                    style={{ color: "var(--foodchain-espresso)" }}
                  >
                    <CreditCard className="w-5 h-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    {[
                      { value: "card", label: "Card Payment" },
                      { value: "cash", label: "Cash on Delivery" },
                      { value: "transfer", label: "Bank Transfer" },
                    ].map(opt => (
                      <div
                        key={opt.value}
                        className="flex items-center space-x-2 p-3 rounded-md border border-[var(--foodchain-espresso)]/10 hover:bg-[var(--foodchain-espresso)]/5 transition-colors"
                      >
                        <RadioGroupItem value={opt.value} id={opt.value} />
                        <Label
                          htmlFor={opt.value}
                          className="flex-1 cursor-pointer"
                          style={{ color: "var(--foodchain-espresso)" }}
                        >
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Special Instructions */}
              <Card
                className="border-[var(--foodchain-espresso)]/10"
                style={{ backgroundColor: "var(--foodchain-white)" }}
              >
                <CardHeader>
                  <CardTitle style={{ color: "var(--foodchain-espresso)" }}>
                    Special Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={specialInstructions}
                    onChange={e => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requests? (e.g., extra spicy, no onions)"
                    rows={3}
                    className="border-[var(--foodchain-espresso)]/20 resize-none"
                    style={{ backgroundColor: "var(--foodchain-white)" }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card
                className="border-[var(--foodchain-espresso)]/10 sticky top-20"
                style={{ backgroundColor: "var(--foodchain-white)" }}
              >
                <CardHeader>
                  <CardTitle style={{ color: "var(--foodchain-espresso)" }}>
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span style={{ color: "var(--foodchain-espresso)", opacity: 0.7 }}>
                          {item.name} × {item.quantity}
                        </span>
                        <span style={{ color: "var(--foodchain-espresso)", fontWeight: 600 }}>
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--foodchain-espresso)", opacity: 0.7 }}>
                        Subtotal
                      </span>
                      <span style={{ color: "var(--foodchain-espresso)", fontWeight: 600 }}>
                        ₦{subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--foodchain-espresso)", opacity: 0.7 }}>
                        Delivery Fee
                      </span>
                      <span style={{ color: "var(--foodchain-espresso)", fontWeight: 600 }}>
                        ₦{deliveryFee.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg">
                    <span style={{ color: "var(--foodchain-espresso)", fontWeight: 600 }}>
                      Total
                    </span>
                    <span style={{ color: "var(--foodchain-golden-amber)", fontWeight: 600 }}>
                      ₦{total.toLocaleString()}
                    </span>
                  </div>

                  <Button
                    type="submit"
                    disabled={isProcessing || !deliveryAddress.trim()}
                    className="w-full transition-all hover:opacity-90 hover:shadow-lg"
                    style={{
                      backgroundColor: "var(--foodchain-golden-amber)",
                      color: "var(--foodchain-charcoal)",
                    }}
                  >
                    {isProcessing ? "Processing…" : "Place Order"}
                  </Button>
                  {!deliveryAddress.trim() && (
                    <p
                      className="text-xs text-center"
                      style={{ color: "var(--foodchain-espresso)", opacity: 0.5 }}
                    >
                      Please enter a delivery address to continue
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
