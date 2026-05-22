import { useTimerTick } from "@/hooks/useTimerTick";
import { formatOrderReference } from "@/utils/orderDisplay";
import { computeOrderCountdown, toUtcDate } from "@/utils/orderTimer";
import { AlertCircle, Clock, Flame } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Separator } from "../ui/separator";

interface KitchenOrderDetail {
  id: string;
  status: 'received' | 'preparing' | 'ready';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    specialInstructions?: string;
  }>;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  receivedAt: string;
  notes?: string;
  customerName?: string;
  isUrgent?: boolean;
}

interface KitchenOrderDetailProps {
  order: KitchenOrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: 'preparing' | 'ready') => void;
}

export function KitchenOrderDetail({ order, isOpen, onClose, onStatusChange }: KitchenOrderDetailProps) {
  const now = useTimerTick();

  if (!order) return null;

  const { display, isOverdue } = computeOrderCountdown(order.receivedAt, now);
  const isUrgentOrOverdue = isOverdue || !!order.isUrgent;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full max-h-[88vh] flex flex-col overflow-hidden p-0" style={{ backgroundColor: 'var(--white)', border: '2px solid var(--brown)' }}>
        <DialogHeader className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl mb-2" style={{ color: 'var(--brown)' }}>
                Order {formatOrderReference(order.id)}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className="border-0"
                  style={{
                    backgroundColor: order.orderType === 'dine-in' ? 'var(--sage-green)' : order.orderType === 'delivery' ? 'var(--golden-amber)' : 'var(--brown)',
                    color: 'var(--white)'
                  }}
                >
                  {order.orderType === 'dine-in' ? 'Dine-In' : order.orderType === 'delivery' ? 'Delivery' : 'Takeaway'}
                </Badge>
                {order.tableNumber && (
                  <Badge className="border-0" style={{ backgroundColor: 'var(--brown)', color: 'var(--warm-white)' }}>
                    Table {order.tableNumber}
                  </Badge>
                )}
                <Badge
                  className="border-0"
                  style={{
                    backgroundColor: order.status === 'ready' ? 'var(--sage-green)' : order.status === 'preparing' ? 'var(--golden-amber)' : 'var(--brown)',
                    color: 'var(--white)'
                  }}
                >
                  {order.status === 'ready' ? 'Ready' : order.status === 'preparing' ? 'Preparing' : 'Received'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center gap-2 text-xl ${isUrgentOrOverdue ? 'animate-pulse' : ''}`}>
                {isUrgentOrOverdue && <Flame className="w-6 h-6" style={{ color: 'var(--burnt-orange)' }} />}
                <Clock className="w-6 h-6" style={{ color: isUrgentOrOverdue ? 'var(--burnt-orange)' : 'var(--brown)' }} />
                <span style={{ color: isUrgentOrOverdue ? 'var(--burnt-orange)' : 'var(--brown)', fontWeight: 600 }}>
                  {display}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--brown)', opacity: 0.6 }}>
                Time Elapsed
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 overflow-y-auto flex-1 min-h-0 px-5">
          {isUrgentOrOverdue && (
            <div className="p-4 rounded-md flex items-start gap-3" style={{ backgroundColor: 'var(--burnt-orange)', opacity: 0.9 }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--white)' }} />
              <div>
                <p style={{ color: 'var(--white)', fontWeight: 600 }}>
                  {isOverdue ? 'Order Overdue!' : 'Urgent Order'}
                </p>
                <p className="text-sm" style={{ color: 'var(--white)', opacity: 0.9 }}>
                  {isOverdue ? 'This order has exceeded the 30-minute target.' : 'This order requires immediate attention.'}
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-base mb-3" style={{ color: 'var(--brown)', fontWeight: 600 }}>
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-md"
                  style={{ backgroundColor: 'var(--warm-white)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--golden-amber)' }}>
                      <span style={{ color: 'var(--charcoal)', fontWeight: 600 }}>{item.quantity}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg mb-1" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                        {item.name}
                      </p>
                      {item.specialInstructions && (
                        <div className="mt-2 p-2 rounded" style={{ backgroundColor: 'var(--golden-amber)', opacity: 0.2 }}>
                          <p className="text-sm flex items-center gap-2" style={{ color: 'var(--brown)' }}>
                            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--golden-amber)' }} />
                            <span style={{ fontWeight: 600 }}>Note:</span> {item.specialInstructions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator style={{ backgroundColor: 'var(--brown)' }} />

          <div>
            <h3 className="text-lg mb-3" style={{ color: 'var(--brown)', fontWeight: 600 }}>
              Order Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span style={{ color: 'var(--brown)', opacity: 0.7 }}>Order ID</span>
                <span style={{ color: 'var(--brown)', fontWeight: 600 }}>{formatOrderReference(order.id)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--brown)', opacity: 0.7 }}>Received At</span>
                <span style={{ color: 'var(--brown)', fontWeight: 600 }}>
                  {toUtcDate(order.receivedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {order.customerName && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--brown)', opacity: 0.7 }}>Customer</span>
                  <span style={{ color: 'var(--brown)', fontWeight: 600 }}>{order.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: 'var(--brown)', opacity: 0.7 }}>Total Items</span>
                <span style={{ color: 'var(--brown)', fontWeight: 600 }}>
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              {order.notes && (
                <div className="flex flex-col gap-1 pt-1">
                  <span style={{ color: 'var(--brown)', opacity: 0.7 }}>Special Instructions</span>
                  <p className="text-sm italic px-3 py-2 rounded-md" style={{ backgroundColor: 'color-mix(in srgb, var(--golden-amber) 15%, transparent)', color: 'var(--brown)' }}>
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 flex-shrink-0 border-t" style={{ borderColor: 'var(--brown)', borderOpacity: 0.1 }}>
          {order.status === 'received' && (
            <>
              <Button
                onClick={() => {
                  onStatusChange(order.id, 'preparing');
                  onClose();
                }}
                className="flex-1 transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}
              >
                Start Preparing
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="border-2"
                style={{ borderColor: 'var(--brown)', color: 'var(--brown)' }}
              >
                Close
              </Button>
            </>
          )}

          {order.status === 'preparing' && (
            <>
              <Button
                onClick={() => {
                  onStatusChange(order.id, 'ready');
                  onClose();
                }}
                className="flex-1 transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--sage-green)', color: 'var(--white)' }}
              >
                Mark as Ready
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="border-2"
                style={{ borderColor: 'var(--brown)', color: 'var(--brown)' }}
              >
                Close
              </Button>
            </>
          )}

          {order.status === 'ready' && (
            <Button
              onClick={onClose}
              className="w-full"
              style={{ backgroundColor: 'var(--brown)', color: 'var(--white)' }}
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
