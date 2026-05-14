import { useEffect, useState } from "react";
import { Package, ChevronRight, ArrowLeft, Clock } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getActiveOrders, type Order } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { formatOrderReference } from "@/utils/orderDisplay";

interface ActiveOrdersListProps {
  onSelectOrder: (orderId: string) => void;
  onGoBack: () => void;
}

function statusLabel(s: string): string {
  switch (s) {

    case 'RECEIVED':  return 'Order Placed';
    case 'CONFIRMED': return 'Confirmed';
    case 'PREPARING': return 'Preparing';
    case 'READY':     return 'Ready';
    case 'PICKED_UP': return 'Out for Delivery';
    case 'SERVED':    return 'Delivered';
    case 'COMPLETED': return 'Completed';
    case 'CANCELLED': return 'Cancelled';
    default:          return s;
  }
}

function statusStyle(s: string): React.CSSProperties {
  switch (s) {

    case 'RECEIVED':
    case 'CONFIRMED':  return { backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' };
    case 'PREPARING':  return { backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' };
    case 'READY':
    case 'SERVED':
    case 'COMPLETED':  return { backgroundColor: 'var(--sage-green)', color: 'var(--white)' };
    case 'PICKED_UP':  return { backgroundColor: 'var(--burnt-orange)', color: 'var(--white)' };
    case 'CANCELLED':  return { backgroundColor: '#9CA3AF', color: 'var(--white)' };
    default:           return { backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' };

  }
}

export function ActiveOrdersList({ onSelectOrder, onGoBack }: ActiveOrdersListProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = () => {
    setIsLoading(true);
    setError('');
    getActiveOrders(user?.id)
      .then(setOrders)
      .catch(() => {
        setError('Failed to load active orders');
        toast.error('Failed to load active orders');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button
            onClick={onGoBack}
            variant="ghost"
            size="sm"
            className="gap-2"
            style={{ color: 'var(--espresso)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl sm:text-3xl" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
            Track Orders
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="mb-4" style={{ color: 'var(--burnt-orange)' }}>{error}</p>
            <Button
              onClick={fetchOrders}
              variant="outline"
              className="border-[var(--espresso)]/20"
              style={{ color: 'var(--espresso)' }}
            >
              Retry
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardContent className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'rgba(59,35,20,0.08)' }}>
                <Package className="w-10 h-10" style={{ color: 'var(--espresso)' }} />
              </div>
              <h3 className="text-xl mb-2" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                No Active Orders
              </h3>
              <p style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                You don't have any orders in progress right now.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const items = order.items ?? [];
              const visibleItems = items.slice(0, 2).map(i => i.name || 'Item').join(', ');
              const extra = Math.max(0, items.length - 2);
              const placedTime = new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <Card
                  key={order.id}
                  className="cursor-pointer transition-all hover:shadow-md border-[var(--espresso)]/10"
                  onClick={() => onSelectOrder(order.id)}
                  style={{ backgroundColor: 'var(--white)' }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-mono" style={{ color: 'var(--espresso)', opacity: 0.45 }}>
                            {formatOrderReference(order.id)}
                          </span>
                          <Badge className="border-0 text-xs" style={statusStyle(order.status)}>
                            {statusLabel(order.status)}
                          </Badge>
                        </div>
                        <p className="text-base font-semibold" style={{ color: 'var(--espresso)' }}>
                          {order.branchName}
                        </p>
                        <p className="text-sm truncate mt-0.5" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                          {visibleItems}{extra > 0 ? ` & ${extra} more` : ''}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-sm font-semibold" style={{ color: 'var(--golden-amber)' }}>
                            ₦{order.total.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--espresso)', opacity: 0.45 }}>
                            <Clock className="w-3 h-3" />
                            {placedTime}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--espresso)', opacity: 0.3 }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
