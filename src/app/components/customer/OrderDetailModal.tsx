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
import { getOrderStatusDisplay } from "./orderStatusDisplay";

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

  const statusDisplay = getOrderStatusDisplay(order.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl" style={{ color: 'var(--espresso)' }}>
                Order #{order.id}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-2">
                <Calendar className="w-4 h-4" />
                <span>Placed on {order.orderDate}</span>
              </DialogDescription>
            </div>
            <Badge
              className="border-0"
              style={statusDisplay.style}
            >
              {statusDisplay.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <h3 className="text-lg mb-3" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: 'var(--white)' }}>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--golden-amber)' }} />
                    <div>
                      <p style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                        {item.name}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                        ₦{item.price.toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p style={{ color: 'var(--golden-amber)', fontWeight: 600 }}>
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 p-3 rounded-md" style={{ backgroundColor: 'var(--white)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--espresso)', opacity: 0.7 }}>Subtotal</span>
                <span style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                  ₦{order.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--espresso)', opacity: 0.7 }}>Delivery Fee</span>
                <span style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                  ₦{order.deliveryFee.toLocaleString()}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span style={{ color: 'var(--espresso)', fontWeight: 600 }}>Total</span>
                <span style={{ color: 'var(--golden-amber)', fontWeight: 600 }}>
                  ₦{order.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg mb-3" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
              Delivery Information
            </h3>
            <div className="space-y-3 p-3 rounded-md" style={{ backgroundColor: 'var(--white)' }}>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--espresso)', opacity: 0.6 }} />
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                    Contact
                  </p>
                  <p style={{ color: 'var(--espresso)' }}>
                    {order.customerName}
                  </p>
                  <p style={{ color: 'var(--espresso)' }}>
                    {order.phoneNumber}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--espresso)', opacity: 0.6 }} />
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                    Delivery Address
                  </p>
                  <p style={{ color: 'var(--espresso)' }}>
                    {order.deliveryAddress}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                    From {order.branchName}
                  </p>
                </div>
              </div>

              {order.deliveryDate && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--espresso)', opacity: 0.6 }} />
                    <div>
                      <p className="text-sm mb-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                        Delivery Date
                      </p>
                      <p style={{ color: 'var(--espresso)' }}>
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
            <h3 className="text-lg mb-3" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
              Payment Information
            </h3>
            <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--white)' }}>
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--espresso)', opacity: 0.6 }} />
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                    Payment Method
                  </p>
                  <p style={{ color: 'var(--espresso)', textTransform: 'capitalize' }}>
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
                <h3 className="text-lg mb-3" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                  Special Instructions
                </h3>
                <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--white)' }}>
                  <p style={{ color: 'var(--espresso)' }}>
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
              backgroundColor: 'var(--espresso)',
              color: 'var(--warm-white)'
            }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
