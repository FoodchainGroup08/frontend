import { useState } from "react";
import { MapPin, Phone, User, CreditCard, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Textarea } from "../ui/textarea";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutProps {
  cart: CartItem[];
  branchName: string;
  onPlaceOrder: (orderDetails: OrderDetails) => void;
  onGoBack: () => void;
}

export interface OrderDetails {
  deliveryAddress: string;
  phoneNumber: string;
  customerName: string;
  paymentMethod: string;
  specialInstructions: string;
}

export function Checkout({ cart, branchName, onPlaceOrder, onGoBack }: CheckoutProps) {
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 500;
  const total = subtotal + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      onPlaceOrder({
        customerName,
        phoneNumber,
        deliveryAddress,
        paymentMethod,
        specialInstructions
      });
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onGoBack}
            className="p-2 rounded-md hover:bg-[#3B2314]/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: '#3B2314' }} />
          </button>
          <h1 className="text-2xl sm:text-3xl" style={{ color: '#3B2314', fontWeight: 600 }}>
            Checkout
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: '#3B2314' }}>
                    <User className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" style={{ color: '#3B2314' }}>Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="border-[#3B2314]/20"
                      style={{ backgroundColor: 'white' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" style={{ color: '#3B2314' }}>Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#3B2314', opacity: 0.4 }} />
                      <Input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="080 1234 5678"
                        required
                        className="pl-10 border-[#3B2314]/20"
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: '#3B2314' }}>
                    <MapPin className="w-5 h-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" style={{ color: '#3B2314' }}>Street Address</Label>
                    <Textarea
                      id="address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter your delivery address"
                      required
                      rows={3}
                      className="border-[#3B2314]/20 resize-none"
                      style={{ backgroundColor: 'white' }}
                    />
                  </div>
                  <div className="p-3 rounded-md" style={{ backgroundColor: '#F0A500', opacity: 0.1 }}>
                    <p className="text-sm" style={{ color: '#3B2314' }}>
                      Delivering from <span style={{ fontWeight: 600 }}>{branchName}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: '#3B2314' }}>
                    <CreditCard className="w-5 h-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 p-3 rounded-md border border-[#3B2314]/10 hover:bg-[#3B2314]/5 transition-colors">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer" style={{ color: '#3B2314' }}>
                        Card Payment
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-md border border-[#3B2314]/10 hover:bg-[#3B2314]/5 transition-colors">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer" style={{ color: '#3B2314' }}>
                        Cash on Delivery
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-md border border-[#3B2314]/10 hover:bg-[#3B2314]/5 transition-colors">
                      <RadioGroupItem value="transfer" id="transfer" />
                      <Label htmlFor="transfer" className="flex-1 cursor-pointer" style={{ color: '#3B2314' }}>
                        Bank Transfer
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
                <CardHeader>
                  <CardTitle style={{ color: '#3B2314' }}>Special Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requests? (e.g., extra spicy, no onions)"
                    rows={3}
                    className="border-[#3B2314]/20 resize-none"
                    style={{ backgroundColor: 'white' }}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="border-[#3B2314]/10 sticky top-20" style={{ backgroundColor: 'white' }}>
                <CardHeader>
                  <CardTitle style={{ color: '#3B2314' }}>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span style={{ color: '#3B2314', opacity: 0.7 }}>
                          {item.name} × {item.quantity}
                        </span>
                        <span style={{ color: '#3B2314', fontWeight: 600 }}>
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#3B2314', opacity: 0.7 }}>Subtotal</span>
                      <span style={{ color: '#3B2314', fontWeight: 600 }}>
                        ₦{subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
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
                    type="submit"
                    disabled={isProcessing}
                    className="w-full transition-all hover:opacity-90 hover:shadow-lg"
                    style={{
                      backgroundColor: '#F0A500',
                      color: '#1E1E1E'
                    }}
                  >
                    {isProcessing ? "Processing..." : "Place Order"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
