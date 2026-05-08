import { Clock, ChevronRight, Flame, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useEffect, useState } from "react";

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
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!order) return null;

  const elapsedMs = currentTime - new Date(order.receivedAt).getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
  const isOverdue = elapsedMinutes > 15;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" style={{ backgroundColor: 'var(--foodchain-white)', border: '2px solid var(--foodchain-espresso)' }}>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2" style={{ color: 'var(--foodchain-warm-white)' }}>
                Order #{order.id.split('-')[2]}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className="border-0"
                  style={{
                    backgroundColor: order.orderType === 'dine-in' ? 'var(--foodchain-sage-green)' : order.orderType === 'delivery' ? 'var(--foodchain-golden-amber)' : 'var(--foodchain-espresso)',
                    color: 'var(--foodchain-white)'
                  }}
                >
                  {order.orderType === 'dine-in' ? 'Dine-In' : order.orderType === 'delivery' ? 'Delivery' : 'Takeaway'}
                </Badge>
                {order.tableNumber && (
                  <Badge className="border-0" style={{ backgroundColor: 'var(--foodchain-espresso)', color: 'var(--foodchain-warm-white)' }}>
                    Table {order.tableNumber}
                  </Badge>
                )}
                <Badge
                  className="border-0"
                  style={{
                    backgroundColor: order.status === 'ready' ? 'var(--foodchain-sage-green)' : order.status === 'preparing' ? 'var(--foodchain-golden-amber)' : 'var(--foodchain-espresso)',
                    color: 'var(--foodchain-white)'
                  }}
                >
                  {order.status === 'ready' ? 'Ready' : order.status === 'preparing' ? 'Preparing' : 'Received'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center gap-2 text-xl ${isOverdue || order.isUrgent ? 'animate-pulse' : ''}`}>
                {(isOverdue || order.isUrgent) && <Flame className="w-6 h-6" style={{ color: 'var(--foodchain-burnt-orange)' }} />}
                <Clock className="w-6 h-6" style={{ color: isOverdue || order.isUrgent ? 'var(--foodchain-burnt-orange)' : 'var(--foodchain-espresso)' }} />
                <span style={{ color: isOverdue || order.isUrgent ? 'var(--foodchain-burnt-orange)' : 'var(--foodchain-espresso)', fontWeight: 600 }}>
                  {elapsedMinutes}:{elapsedSeconds.toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                Elapsed Time
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {(isOverdue || order.isUrgent) && (
            <div className="p-4 rounded-md flex items-start gap-3" style={{ backgroundColor: 'var(--foodchain-burnt-orange)', opacity: 0.9 }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--foodchain-white)' }} />
              <div>
                <p style={{ color: 'var(--foodchain-white)', fontWeight: 600 }}>
                  {isOverdue ? 'Order Overdue!' : 'Urgent Order'}
                </p>
                <p className="text-sm" style={{ color: 'var(--foodchain-white)', opacity: 0.9 }}>
                  {isOverdue ? 'This order has exceeded the 15-minute target.' : 'This order requires immediate attention.'}
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg mb-4" style={{ color: 'var(--foodchain-warm-white)', fontWeight: 600 }}>
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-md"
                  style={{ backgroundColor: 'var(--foodchain-warm-white)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--foodchain-golden-amber)' }}>
                      <span style={{ color: 'var(--foodchain-charcoal)', fontWeight: 600 }}>{item.quantity}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg mb-1" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                        {item.name}
                      </p>
                      {item.specialInstructions && (
                        <div className="mt-2 p-2 rounded" style={{ backgroundColor: 'var(--foodchain-golden-amber)', opacity: 0.2 }}>
                          <p className="text-sm flex items-center gap-2" style={{ color: 'var(--foodchain-espresso)' }}>
                            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--foodchain-golden-amber)' }} />
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

          <Separator style={{ backgroundColor: 'var(--foodchain-espresso)' }} />

          <div>
            <h3 className="text-lg mb-3" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
              Order Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>Order ID</span>
                <span style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>Received At</span>
                <span style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                  {new Date(order.receivedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {order.customerName && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>Customer</span>
                  <span style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>{order.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>Total Items</span>
                <span style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {order.status === 'received' && (
            <>
              <Button
                onClick={() => {
                  onStatusChange(order.id, 'preparing');
                  onClose();
                }}
                className="flex-1 transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--foodchain-golden-amber)', color: 'var(--foodchain-charcoal)' }}
              >
                Start Preparing
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="border-2"
                style={{ borderColor: 'var(--foodchain-espresso)', color: 'var(--foodchain-warm-white)' }}
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
                style={{ backgroundColor: 'var(--foodchain-sage-green)', color: 'var(--foodchain-white)' }}
              >
                Mark as Ready
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="border-2"
                style={{ borderColor: 'var(--foodchain-espresso)', color: 'var(--foodchain-espresso)' }}
              >
                Close
              </Button>
            </>
          )}

          {order.status === 'ready' && (
            <Button
              onClick={onClose}
              className="w-full"
              style={{ backgroundColor: 'var(--foodchain-espresso)', color: 'var(--foodchain-white)' }}
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
