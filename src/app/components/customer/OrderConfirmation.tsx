import { CheckCircle2, MapPin, Clock, Phone, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { formatOrderReference } from "@/utils/orderDisplay";

interface Order {
  id: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  reservationFee?: number;
  total: number;
  deliveryAddress?: string;
  phoneNumber: string;
  customerName: string;
  paymentMethod: string;
  branchName: string;
  estimatedTime: string;
  orderType?: 'delivery' | 'dine-in' | 'pickup';
}

interface OrderConfirmationProps {
  order: Order;
  onTrackOrder: () => void;
  onBackToMenu: () => void;
}

export function OrderConfirmation({ order, onTrackOrder, onBackToMenu }: OrderConfirmationProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'var(--sage-green)' }}>
            <CheckCircle2 className="w-12 h-12" style={{ color: 'var(--white)' }} />
          </div>
          <h1 className="text-3xl sm:text-4xl mb-2" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
            Order Confirmed!
          </h1>
          <p className="text-lg" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
            Your order has been placed successfully
          </p>
        </div>

        <Card className="border-[var(--espresso)]/10 mb-6" style={{ backgroundColor: 'var(--white)' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle style={{ color: 'var(--espresso)' }}>Order {formatOrderReference(order.id)}</CardTitle>
              <Badge className="border-0" style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}>
                Processing
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md" style={{ backgroundColor: 'rgba(240, 165, 0, 0.12)' }}>
                  <Clock className="w-5 h-5" style={{ color: 'var(--golden-amber)' }} />
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                    Estimated Time
                  </p>
                  <p style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                    {order.estimatedTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md" style={{ backgroundColor: 'rgba(240, 165, 0, 0.12)' }}>
                  <MapPin className="w-5 h-5" style={{ color: 'var(--golden-amber)' }} />
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                    Branch
                  </p>
                  <p style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                    {order.branchName}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg mb-3" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                {order.orderType === 'dine-in' ? 'Dine-In Information'
                  : order.orderType === 'pickup' ? 'Pickup Information'
                  : 'Delivery Information'}
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-1" style={{ color: 'var(--espresso)', opacity: 0.6 }} />
                  <div>
                    <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                      Contact
                    </p>
                    <p style={{ color: 'var(--espresso)' }}>
                      {order.customerName} • {order.phoneNumber}
                    </p>
                  </div>
                </div>
                {(order.orderType === 'dine-in' || order.orderType === 'pickup') ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1" style={{ color: 'var(--espresso)', opacity: 0.6 }} />
                    <div>
                      <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                        Branch
                      </p>
                      <p style={{ color: 'var(--espresso)' }}>
                        {order.branchName}
                      </p>
                    </div>
                  </div>
                ) : order.deliveryAddress ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1" style={{ color: 'var(--espresso)', opacity: 0.6 }} />
                    <div>
                      <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                        Delivery Address
                      </p>
                      <p style={{ color: 'var(--espresso)' }}>
                        {order.deliveryAddress}
                      </p>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-start gap-2">
                  <CreditCard className="w-4 h-4 mt-1" style={{ color: 'var(--espresso)', opacity: 0.6 }} />
                  <div>
                    <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                      Payment Method
                    </p>
                    <p style={{ color: 'var(--espresso)', textTransform: 'capitalize' }}>
                      {order.paymentMethod === 'card' ? 'Card Payment' :
                       order.paymentMethod === 'cash' ? (order.orderType === 'delivery' ? 'Cash on Delivery' : 'Cash Payment') :
                       'Bank Transfer'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg mb-3" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                Order Items
              </h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span style={{ color: 'var(--espresso)' }}>
                      {item.name} × {item.quantity}
                    </span>
                    <span style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--espresso)', opacity: 0.7 }}>Subtotal</span>
                <span style={{ color: 'var(--espresso)' }}>₦{order.subtotal.toLocaleString()}</span>
              </div>
              {order.orderType === 'delivery' && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--espresso)', opacity: 0.7 }}>Delivery Fee</span>
                  <span style={{ color: 'var(--espresso)' }}>₦{order.deliveryFee.toLocaleString()}</span>
                </div>
              )}
              {(order.reservationFee ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--espresso)', opacity: 0.7 }}>Reservation Fee</span>
                  <span style={{ color: 'var(--espresso)' }}>₦{(order.reservationFee ?? 0).toLocaleString()}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between text-xl">
              <span style={{ color: 'var(--espresso)', fontWeight: 600 }}>Total</span>
              <span style={{ color: 'var(--golden-amber)', fontWeight: 600 }}>
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
              backgroundColor: 'var(--golden-amber)',
              color: 'var(--charcoal)'
            }}
          >
            Track Order
          </Button>
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="w-full border-[var(--espresso)]/20"
            style={{
              color: 'var(--espresso)'
            }}
          >
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
