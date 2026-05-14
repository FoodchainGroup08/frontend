import { useEffect, useState } from "react";
import { Clock, CheckCircle2, Package, Truck, Home, UtensilsCrossed, ChevronRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getOrderById, cancelOrder, type Order, type OrderStatus, type WsOrderUpdate } from "@/services/api";
import { useOrderTracker } from "@/hooks/useOrderTracker";
import { useAuth } from "@/context/AuthContext";

// Mirrors the backend status lifecycle exactly.
type LocalStatus =
  | 'received'    // RECEIVED  — order placed, awaiting branch confirmation
  | 'confirmed'   // CONFIRMED — branch confirmed, not yet cooking
  | 'preparing'   // PREPARING — kitchen started
  | 'ready'       // READY     — food done, awaiting handoff
  | 'picked-up'   // PICKED_UP — takeaway / delivery collected
  | 'served'      // SERVED    — dine-in handed to table
  | 'completed';  // COMPLETED — legacy terminal

interface TrackedOrder {
  id: string;
  status: LocalStatus;
  items: Array<{ id: string; name: string; quantity: number }>;
  total: number;
  branchName: string;
  estimatedTime: string;
  placedAt: string;
  deliveryAddress?: string;
  orderType?: string;
}

interface OrderTrackerProps {
  orderId: string;
  onGoBack?: () => void;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<OrderStatus, LocalStatus> = {
  RECEIVED:  'received',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY:     'ready',
  PICKED_UP: 'picked-up',
  SERVED:    'served',
  COMPLETED: 'completed',
  CANCELLED: 'received', // terminal — OrderTracker navigates away on cancel
};

// Canonical index used for progress bar and step highlighting.
// PICKED_UP, SERVED, and COMPLETED all represent the final step (index 4).
const STATUS_INDEX: Record<LocalStatus, number> = {
  'received':  0,
  'confirmed': 1,
  'preparing': 2,
  'ready':     3,
  'picked-up': 4,
  'served':    4,
  'completed': 4,
};

function mapApiStatus(s: OrderStatus): LocalStatus {
  return STATUS_MAP[s] ?? 'received';
}

// Step definitions differ by order type for the last two steps.
function getSteps(orderType?: string) {
  const isDineIn  = orderType === 'dine-in';
  const isPickup  = orderType === 'takeaway' || orderType === 'pickup';

  return [
    { key: 'received'  as LocalStatus, label: 'Order Placed',      icon: CheckCircle2    },
    { key: 'confirmed' as LocalStatus, label: 'Order Confirmed',    icon: CheckCircle2    },
    { key: 'preparing' as LocalStatus, label: 'Being Prepared',     icon: Package         },
    {
      key:   'ready' as LocalStatus,
      label: isDineIn ? 'Ready to Serve' : 'Ready for Pickup',
      icon:  UtensilsCrossed,
    },
    {
      key:   (isDineIn ? 'served' : 'picked-up') as LocalStatus,
      label: isDineIn ? 'Served at Table' : isPickup ? 'Ready for Pickup!' : 'Out for Delivery',
      icon:  isDineIn ? Home : isPickup ? Package : Truck,
    },
  ];
}

function stepSubtext(status: LocalStatus, orderType?: string): string {
  const isPickup = orderType === 'takeaway' || orderType === 'pickup';
  switch (status) {
    case 'received':  return 'Waiting for the branch to confirm your order…';
    case 'confirmed': return 'The kitchen is about to start on your order…';
    case 'preparing': return 'The kitchen is preparing your order…';
    case 'ready':
      if (orderType === 'dine-in') return 'Your food is ready — a server is on the way!';
      if (isPickup)                return 'Head to the counter — your order is ready!';
      return 'A rider is collecting your order…';
    case 'picked-up':
      return isPickup ? 'Your order is ready to collect!' : 'Your order is on its way to you!';
    case 'served':    return 'Enjoy your meal!';
    case 'completed': return 'Order complete!';
    default:          return 'In progress…';
  }
}

function badgeStyle(status: LocalStatus): React.CSSProperties {
  if (['served', 'picked-up', 'completed'].includes(status))
    return { backgroundColor: 'var(--sage-green)', color: 'var(--white)' };
  if (status === 'ready')
    return { backgroundColor: 'var(--sage-green)', color: 'var(--white)' };
  if (status === 'preparing')
    return { backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' };
  return { backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' };
}

function badgeLabel(status: LocalStatus, orderType?: string): string {
  if (status === 'picked-up' && (orderType === 'takeaway' || orderType === 'pickup')) {
    return 'Ready for Pickup';
  }
  const labels: Record<LocalStatus, string> = {
    'received':  'Order Placed',
    'confirmed': 'Confirmed',
    'preparing': 'Preparing',
    'ready':     'Ready',
    'picked-up': 'Out for Delivery',
    'served':    'Served',
    'completed': 'Completed',
  };
  return labels[status];
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapApiOrder(order: Order): TrackedOrder {
  return {
    id: order.id,
    status: mapApiStatus(order.status),
    items: order.items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })),
    total: order.total,
    branchName: order.branchName,
    estimatedTime: order.estimatedTime ?? '—',
    placedAt: order.placedAt,
    deliveryAddress: order.deliveryAddress,
    orderType: order.orderType,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderTracker({ orderId, onGoBack }: OrderTrackerProps) {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState<TrackedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError('');
    try {
      const order = await getOrderById(orderId);
      setActiveOrder(mapApiOrder(order));
    } catch {
      setError('Failed to load order');
      toast.error('Failed to load order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeOrder) return;
    setIsCancelling(true);
    try {
      await cancelOrder(activeOrder.id, user?.id, 'Cancelled by customer');
      toast.success('Order cancelled');
      onGoBack?.();
    } catch {
      toast.error('Cannot cancel — the kitchen may have already started preparing your order');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  // Real-time status updates via WebSocket
  useOrderTracker(activeOrder?.id ?? '', (data) => {
    const msg = data as WsOrderUpdate;
    if (msg.newStatus && activeOrder) {
      setActiveOrder(prev => prev ? { ...prev, status: mapApiStatus(msg.newStatus) } : prev);
    }
  });

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <Skeleton className="h-72 w-full rounded-lg mb-6" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="mb-4" style={{ color: 'var(--burnt-orange)' }}>{error}</p>
          <Button onClick={fetchOrder} variant="outline" className="border-[var(--espresso)]/20" style={{ color: 'var(--espresso)' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!activeOrder) return null;

  // ─── Derived display values ──────────────────────────────────────────────────

  const steps = getSteps(activeOrder.orderType);
  const currentIndex = STATUS_INDEX[activeOrder.status] ?? 0;
  const progress = ((currentIndex + 1) / steps.length) * 100;
  const canCancel = activeOrder.status === 'received' || activeOrder.status === 'confirmed';
  const placedTime = new Date(activeOrder.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {onGoBack && (
            <Button onClick={onGoBack} variant="ghost" size="sm" className="gap-2" style={{ color: 'var(--espresso)' }}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <h1 className="text-2xl sm:text-3xl" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
            Track Order
          </h1>
        </div>

        {/* Status tracker card */}
        <Card className="border-[var(--espresso)]/10 mb-6" style={{ backgroundColor: 'var(--white)' }}>
          <CardHeader>
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base font-mono" style={{ color: 'var(--espresso)' }}>
                  #{activeOrder.id.slice(-8).toUpperCase()}
                </CardTitle>
                <p className="text-sm mt-0.5" style={{ color: 'var(--espresso)', opacity: 0.55 }}>
                  Placed at {placedTime} · {activeOrder.branchName}
                </p>
              </div>
              <Badge className="border-0" style={badgeStyle(activeOrder.status)}>
                {badgeLabel(activeOrder.status, activeOrder.orderType)}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--espresso)', opacity: 0.6 }}>Progress</span>
                <span style={{ color: 'var(--golden-amber)', fontWeight: 600 }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step-by-step tracker */}
            <div className="relative">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentIndex;
                const isCurrent   = index === currentIndex;
                const isPending   = index > currentIndex;

                return (
                  <div key={step.key} className="relative">
                    {index > 0 && (
                      <div
                        className="absolute left-5 -top-6 w-0.5 h-6"
                        style={{
                          backgroundColor: isCompleted
                            ? 'var(--sage-green)'
                            : 'var(--espresso)',
                          opacity: isCompleted ? 1 : 0.15,
                        }}
                      />
                    )}
                    <div className="flex items-center gap-4 py-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          backgroundColor: isCompleted
                            ? 'var(--sage-green)'
                            : isCurrent
                            ? 'var(--golden-amber)'
                            : 'var(--espresso)',
                          opacity: isPending ? 0.18 : 1,
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ color: 'var(--white)' }} />
                      </div>

                      <div className="flex-1">
                        <p
                          className="text-base"
                          style={{
                            color: 'var(--espresso)',
                            fontWeight: isCurrent ? 600 : 400,
                            opacity: isPending ? 0.4 : 1,
                          }}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm mt-0.5" style={{ color: 'var(--golden-amber)' }}>
                            {stepSubtext(activeOrder.status, activeOrder.orderType)}
                          </p>
                        )}
                      </div>

                      {isCompleted && (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--sage-green)' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Estimated time */}
            {activeOrder.estimatedTime && activeOrder.estimatedTime !== '—' && (
              <div className="p-4 rounded-md" style={{ backgroundColor: 'rgba(240,165,0,0.1)' }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <Clock className="w-4 h-4" style={{ color: 'var(--espresso)' }} />
                  <span className="text-sm" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                    Estimated Time
                  </span>
                </div>
                <p className="text-lg" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                  {activeOrder.estimatedTime}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order details card */}
        <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--espresso)' }}>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>Branch</p>
              <p style={{ color: 'var(--espresso)', fontWeight: 600 }}>{activeOrder.branchName || '—'}</p>
            </div>

            {activeOrder.orderType && (
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>Order Type</p>
                <p style={{ color: 'var(--espresso)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {activeOrder.orderType.replace('-', ' ')}
                </p>
              </div>
            )}

            {activeOrder.deliveryAddress && (
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>Delivery Address</p>
                <p style={{ color: 'var(--espresso)', fontWeight: 600 }}>{activeOrder.deliveryAddress}</p>
              </div>
            )}

            <div>
              <p className="text-sm mb-2" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                Items ({activeOrder.items.length})
              </p>
              <div className="space-y-1">
                {activeOrder.items.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--golden-amber)' }} />
                    <span style={{ color: 'var(--espresso)' }}>
                      {item.name || 'Unknown item'} × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--espresso)]/10">
              <div className="flex justify-between">
                <span style={{ color: 'var(--espresso)', fontWeight: 600 }}>Total</span>
                <span style={{ color: 'var(--golden-amber)', fontWeight: 600 }}>
                  ₦{activeOrder.total.toLocaleString()}
                </span>
              </div>
            </div>

            {canCancel && (
              <Button
                onClick={handleCancel}
                disabled={isCancelling}
                variant="outline"
                className="w-full"
                style={{ borderColor: 'var(--burnt-orange)', color: 'var(--burnt-orange)' }}
              >
                {isCancelling ? 'Cancelling…' : 'Cancel Order'}
              </Button>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
