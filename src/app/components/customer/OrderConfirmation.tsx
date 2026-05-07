import { CheckCircle2, MapPin, Clock, Phone, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";

interface Order {
  id: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  deliveryAddress: string;
  phoneNumber: string;
  customerName: string;
  paymentMethod: string;
  branchName: string;
  estimatedTime: string;
}

interface OrderConfirmationProps {
  order: Order;
  onTrackOrder: () => void;
  onBackToMenu: () => void;
}

export function OrderConfirmation({ order, onTrackOrder, onBackToMenu }: OrderConfirmationProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#4CAF7D' }}>
            <CheckCircle2 className="w-12 h-12" style={{ color: 'white' }} />
          </div>
          <h1 className="text-3xl sm:text-4xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
            Order Confirmed!
          </h1>
          <p className="text-lg" style={{ color: '#3B2314', opacity: 0.7 }}>
            Your order has been placed successfully
          </p>
        </div>

        <Card className="border-[#3B2314]/10 mb-6" style={{ backgroundColor: 'white' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle style={{ color: '#3B2314' }}>Order #{order.id}</CardTitle>
              <Badge className="border-0" style={{ backgroundColor: '#F0A500', color: '#1E1E1E' }}>
                Processing
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md" style={{ backgroundColor: '#F0A500', opacity: 0.1 }}>
                  <Clock className="w-5 h-5" style={{ color: '#F0A500' }} />
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: '#3B2314', opacity: 0.6 }}>
                    Estimated Time
                  </p>
                  <p style={{ color: '#3B2314', fontWeight: 600 }}>
                    {order.estimatedTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md" style={{ backgroundColor: '#F0A500', opacity: 0.1 }}>
                  <MapPin className="w-5 h-5" style={{ color: '#F0A500' }} />
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: '#3B2314', opacity: 0.6 }}>
                    Branch
                  </p>
                  <p style={{ color: '#3B2314', fontWeight: 600 }}>
                    {order.branchName}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg mb-3" style={{ color: '#3B2314', fontWeight: 600 }}>
                Delivery Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-1" style={{ color: '#3B2314', opacity: 0.6 }} />
                  <div>
                    <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                      Contact
                    </p>
                    <p style={{ color: '#3B2314' }}>
                      {order.customerName} • {order.phoneNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1" style={{ color: '#3B2314', opacity: 0.6 }} />
                  <div>
                    <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                      Delivery Address
                    </p>
                    <p style={{ color: '#3B2314' }}>
                      {order.deliveryAddress}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="w-4 h-4 mt-1" style={{ color: '#3B2314', opacity: 0.6 }} />
                  <div>
                    <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                      Payment Method
                    </p>
                    <p style={{ color: '#3B2314', textTransform: 'capitalize' }}>
                      {order.paymentMethod === 'card' ? 'Card Payment' :
                       order.paymentMethod === 'cash' ? 'Cash on Delivery' :
                       'Bank Transfer'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg mb-3" style={{ color: '#3B2314', fontWeight: 600 }}>
                Order Items
              </h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span style={{ color: '#3B2314' }}>
                      {item.name} × {item.quantity}
                    </span>
                    <span style={{ color: '#3B2314', fontWeight: 600 }}>
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-xl">
              <span style={{ color: '#3B2314', fontWeight: 600 }}>Total</span>
              <span style={{ color: '#F0A500', fontWeight: 600 }}>
                ₦{order.total.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4">
          <Button
            onClick={onTrackOrder}
            className="w-full transition-all hover:opacity-90 hover:shadow-lg"
            style={{
              backgroundColor: '#F0A500',
              color: '#1E1E1E'
            }}
          >
            Track Order
          </Button>
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="w-full border-[#3B2314]/20"
            style={{
              color: '#3B2314'
            }}
          >
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
