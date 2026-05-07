import { Calendar, MapPin, Phone, CreditCard, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";

interface OrderDetail {
  id: string;
  status: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  branchName: string;
  orderDate: string;
  deliveryDate?: string;
  customerName: string;
  phoneNumber: string;
  deliveryAddress: string;
  paymentMethod: string;
  specialInstructions?: string;
}

interface OrderDetailModalProps {
  order: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#FAF7F2' }}>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl" style={{ color: '#3B2314' }}>
                Order #{order.id}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-2">
                <Calendar className="w-4 h-4" />
                <span>Placed on {order.orderDate}</span>
              </DialogDescription>
            </div>
            <Badge
              className="border-0"
              style={{
                backgroundColor:
                  order.status === 'delivered' ? '#4CAF7D' :
                  order.status === 'cancelled' ? '#E8622A' :
                  order.status === 'out-for-delivery' ? '#F0A500' :
                  '#3B2314',
                color: 'white'
              }}
            >
              {order.status === 'out-for-delivery' ? 'Out for Delivery' :
               order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <h3 className="text-lg mb-3" style={{ color: '#3B2314', fontWeight: 600 }}>
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: 'white' }}>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#F0A500' }} />
                    <div>
                      <p style={{ color: '#3B2314', fontWeight: 600 }}>
                        {item.name}
                      </p>
                      <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                        ₦{item.price.toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p style={{ color: '#F0A500', fontWeight: 600 }}>
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 p-3 rounded-md" style={{ backgroundColor: 'white' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#3B2314', opacity: 0.7 }}>Subtotal</span>
                <span style={{ color: '#3B2314', fontWeight: 600 }}>
                  ₦{order.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#3B2314', opacity: 0.7 }}>Delivery Fee</span>
                <span style={{ color: '#3B2314', fontWeight: 600 }}>
                  ₦{order.deliveryFee.toLocaleString()}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span style={{ color: '#3B2314', fontWeight: 600 }}>Total</span>
                <span style={{ color: '#F0A500', fontWeight: 600 }}>
                  ₦{order.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg mb-3" style={{ color: '#3B2314', fontWeight: 600 }}>
              Delivery Information
            </h3>
            <div className="space-y-3 p-3 rounded-md" style={{ backgroundColor: 'white' }}>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#3B2314', opacity: 0.6 }} />
                <div>
                  <p className="text-sm mb-1" style={{ color: '#3B2314', opacity: 0.6 }}>
                    Contact
                  </p>
                  <p style={{ color: '#3B2314' }}>
                    {order.customerName}
                  </p>
                  <p style={{ color: '#3B2314' }}>
                    {order.phoneNumber}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#3B2314', opacity: 0.6 }} />
                <div>
                  <p className="text-sm mb-1" style={{ color: '#3B2314', opacity: 0.6 }}>
                    Delivery Address
                  </p>
                  <p style={{ color: '#3B2314' }}>
                    {order.deliveryAddress}
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#3B2314', opacity: 0.6 }}>
                    From {order.branchName}
                  </p>
                </div>
              </div>

              {order.deliveryDate && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#3B2314', opacity: 0.6 }} />
                    <div>
                      <p className="text-sm mb-1" style={{ color: '#3B2314', opacity: 0.6 }}>
                        Delivery Date
                      </p>
                      <p style={{ color: '#3B2314' }}>
                        {order.deliveryDate}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg mb-3" style={{ color: '#3B2314', fontWeight: 600 }}>
              Payment Information
            </h3>
            <div className="p-3 rounded-md" style={{ backgroundColor: 'white' }}>
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#3B2314', opacity: 0.6 }} />
                <div>
                  <p className="text-sm mb-1" style={{ color: '#3B2314', opacity: 0.6 }}>
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

          {order.specialInstructions && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg mb-3" style={{ color: '#3B2314', fontWeight: 600 }}>
                  Special Instructions
                </h3>
                <div className="p-3 rounded-md" style={{ backgroundColor: 'white' }}>
                  <p style={{ color: '#3B2314' }}>
                    {order.specialInstructions}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={onClose}
            className="transition-all hover:opacity-90"
            style={{
              backgroundColor: '#3B2314',
              color: '#FAF7F2'
            }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
