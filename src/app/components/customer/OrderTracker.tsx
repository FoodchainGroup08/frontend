import { useEffect, useState } from "react";
import { Clock, CheckCircle2, Package, Truck, Home, ChevronRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getOrderById, type Order, type OrderStatus, type WsOrderUpdate } from "@/services/api";
import { useOrderTracker } from "@/hooks/useOrderTracker";

type LocalStatus = 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered';

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

const statusSteps = [
  { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'ready', label: 'Ready', icon: Clock },
  { key: 'out-for-delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home }
];

function mapApiStatus(apiStatus: OrderStatus): LocalStatus {
  const map: Record<OrderStatus, LocalStatus> = {
    RECEIVED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    PICKED_UP: 'out-for-delivery',
    SERVED: 'delivered',
  };
  return map[apiStatus] ?? 'confirmed';
}

function mapApiOrder(order: Order): TrackedOrder {
  return {
    id: order.id,
    status: mapApiStatus(order.status),
    items: order.items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })),
    total: order.total,
    branchName: order.branchName,
    estimatedTime: order.estimatedTime ?? '45 mins',
    placedAt: order.placedAt,
    deliveryAddress: order.deliveryAddress,
    orderType: order.orderType,
  };
}

export function OrderTracker({ orderId, onGoBack }: OrderTrackerProps) {
  const [activeOrder, setActiveOrder] = useState<TrackedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError("");
    try {
      const order = await getOrderById(orderId);
      setActiveOrder(mapApiOrder(order));
    } catch {
      setError("Failed to load order");
      toast.error("Failed to load order");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (activeOrder) {
      const currentIndex = statusSteps.findIndex(step => step.key === activeOrder.status);
      setProgress(((currentIndex + 1) / statusSteps.length) * 100);
    }
  }, [activeOrder]);

  useOrderTracker(activeOrder?.id ?? '', (data) => {
    const msg = data as WsOrderUpdate;
    if (msg.newStatus && activeOrder) {
      setActiveOrder(prev => prev ? { ...prev, status: mapApiStatus(msg.newStatus) } : prev);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <Skeleton className="h-64 w-full rounded-lg mb-6" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="mb-4" style={{ color: 'var(--foodchain-burnt-orange)' }}>{error}</p>
          <Button onClick={fetchOrder} variant="outline" className="border-[var(--foodchain-espresso)]/20" style={{ color: 'var(--foodchain-espresso)' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!activeOrder) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-8">
            {onGoBack && (
              <Button
                onClick={onGoBack}
                variant="ghost"
                size="sm"
                className="gap-2"
                style={{ color: 'var(--foodchain-espresso)' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <h1 className="text-2xl sm:text-3xl" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
              Track Order
            </h1>
          </div>

          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardContent className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'var(--foodchain-espresso)', opacity: 0.1 }}>
                <Package className="w-10 h-10" style={{ color: 'var(--foodchain-espresso)' }} />
              </div>
              <h3 className="text-xl mb-2" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                No Active Orders
              </h3>
              <p style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                You don't have any orders in progress
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(step => step.key === activeOrder.status);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          {onGoBack && (
            <Button
              onClick={onGoBack}
              variant="ghost"
              size="sm"
              className="gap-2"
              style={{ color: 'var(--foodchain-espresso)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <h1 className="text-2xl sm:text-3xl" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
            Track Order
          </h1>
        </div>

        <Card className="border-[var(--foodchain-espresso)]/10 mb-6" style={{ backgroundColor: 'var(--foodchain-white)' }}>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle style={{ color: 'var(--foodchain-espresso)' }}>Order #{activeOrder.id}</CardTitle>
                <p className="text-sm mt-1" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                  Placed at {activeOrder.placedAt}
                </p>
              </div>
              <Badge
                className="border-0"
                style={{
                  backgroundColor:
                    activeOrder.status === 'delivered' ? 'var(--foodchain-sage-green)' :
                    activeOrder.status === 'out-for-delivery' ? 'var(--foodchain-golden-amber)' :
                    'var(--foodchain-espresso)',
                  color: 'var(--foodchain-white)'
                }}
              >
                {activeOrder.status === 'out-for-delivery' ? 'Out for Delivery' :
                 activeOrder.status.charAt(0).toUpperCase() + activeOrder.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm mb-2">
                <span style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>Progress</span>
                <span style={{ color: 'var(--foodchain-golden-amber)', fontWeight: 600 }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="relative">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.key} className="relative">
                    {index > 0 && (
                      <div
                        className="absolute left-5 -top-6 w-0.5 h-6"
                        style={{
                          backgroundColor: isCompleted ? 'var(--foodchain-sage-green)' : 'var(--foodchain-espresso)',
                          opacity: isCompleted ? 1 : 0.2
                        }}
                      />
                    )}
                    <div className="flex items-center gap-4 py-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          backgroundColor: isCompleted ? 'var(--foodchain-sage-green)' : isCurrent ? 'var(--foodchain-golden-amber)' : 'var(--foodchain-espresso)',
                          opacity: isCompleted || isCurrent ? 1 : 0.2
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ color: 'var(--foodchain-white)' }} />
                      </div>
                      <div className="flex-1">
                        <p
                          className="text-base"
                          style={{
                            color: 'var(--foodchain-espresso)',
                            fontWeight: isCurrent ? 600 : 400,
                            opacity: isCompleted || isCurrent ? 1 : 0.5
                          }}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm mt-1" style={{ color: 'var(--foodchain-golden-amber)' }}>
                            In progress...
                          </p>
                        )}
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--foodchain-sage-green)' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-md" style={{ backgroundColor: 'rgba(240, 165, 0, 0.12)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4" style={{ color: 'var(--foodchain-espresso)' }} />
                <span className="text-sm" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                  Estimated Delivery
                </span>
              </div>
              <p className="text-lg" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                {activeOrder.estimatedTime}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--foodchain-espresso)' }}>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                Branch
              </p>
              <p style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                {activeOrder.branchName}
              </p>
            </div>

            {activeOrder.orderType && (
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                  Order Type
                </p>
                <p style={{ color: 'var(--foodchain-espresso)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {activeOrder.orderType.replace('-', ' ')}
                </p>
              </div>
            )}

            {activeOrder.deliveryAddress && (
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                  Delivery Address
                </p>
                <p style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                  {activeOrder.deliveryAddress}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm mb-2" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                Items ({activeOrder.items.length})
              </p>
              <div className="space-y-1">
                {activeOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--foodchain-golden-amber)' }} />
                    <span style={{ color: 'var(--foodchain-espresso)' }}>
                      {item.name || 'Unknown item'} × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--foodchain-espresso)]/10">
              <div className="flex justify-between">
                <span style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>Total</span>
                <span style={{ color: 'var(--foodchain-golden-amber)', fontWeight: 600 }}>
                  ₦{activeOrder.total.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}