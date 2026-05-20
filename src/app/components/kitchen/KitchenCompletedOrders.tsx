import { getCompletedKitchenOrders, type KitchenOrder } from "@/services/api";
import { formatOrderReference } from "@/utils/orderDisplay";
import { CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const ORDER_TYPE_COLORS: Record<KitchenOrder['orderType'], string> = {
  'dine-in': 'var(--sage-green)',
  'delivery': 'var(--golden-amber)',
  'takeaway': 'var(--brown)',
};

const STATUS_LABELS: Partial<Record<KitchenOrder['status'], string>> = {
  'picked-up': 'Picked Up',
  'served': 'Served',
};

const PAGE_SIZE = 20;

export function KitchenCompletedOrders() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const currentPageRef = useRef(0);

  const fetchCompleted = async (page = 0, silent = false) => {
    if (!silent) setIsLoading(true);
    setError("");
    try {
      const data = await getCompletedKitchenOrders(page, PAGE_SIZE);
      setOrders(data.orders);
      setTotal(data.total);
      setTotalPages(Math.max(1, Math.ceil(data.total / PAGE_SIZE)));
      setCurrentPage(data.page);
      currentPageRef.current = data.page;
    } catch {
      if (!silent) {
        setError("Failed to load completed orders");
        toast.error("Failed to load completed orders");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleted(0);
    const poll = setInterval(() => fetchCompleted(currentPageRef.current, true), 30000);
    return () => clearInterval(poll);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="p-6 sm:p-8">
          <Skeleton className="h-10 w-56 mb-2" />
          <Skeleton className="h-5 w-72 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="p-6 sm:p-8 text-center">
          <p className="mb-4" style={{ color: 'var(--burnt-orange)' }}>{error}</p>
          <Button onClick={() => fetchCompleted(0)} variant="outline" className="border-[var(--brown)]/20" style={{ color: 'var(--brown)' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl mb-8" style={{ color: 'var(--brown)', fontWeight: 600 }}>
            Completed Orders
          </h1>
          <Card className="border-[var(--brown)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardContent className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'var(--sage-green)', opacity: 0.1 }}>
                <CheckCircle2 className="w-10 h-10" style={{ color: 'var(--sage-green)' }} />
              </div>
              <h3 className="text-xl mb-2" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                No Completed Orders
              </h3>
              <p style={{ color: 'var(--brown)', opacity: 0.6 }}>
                Orders marked as served or picked up will appear here
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl mb-1" style={{ color: 'var(--brown)', fontWeight: 600 }}>
              Completed Orders
            </h1>
            <p style={{ color: 'var(--brown)', opacity: 0.7 }}>
              {total} completed {total === 1 ? 'order' : 'orders'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCompleted(currentPage)}
            className="border-[var(--brown)]/20"
            style={{ color: 'var(--brown)' }}
          >
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {orders.map(order => {
            const statusLabel = STATUS_LABELS[order.status] ?? order.status;
            const receivedTime = new Date(order.receivedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            return (
              <Card
                key={order.id}
                className="border-2"
                style={{ backgroundColor: 'var(--warm-white)', borderColor: 'color-mix(in srgb, var(--sage-green) 30%, transparent)' }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm mb-1" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                        {formatOrderReference(order.id)}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className="border-0 text-xs"
                          style={{ backgroundColor: ORDER_TYPE_COLORS[order.orderType], color: 'var(--white)' }}
                        >
                          {order.orderType === 'dine-in' ? 'Dine-In' : order.orderType === 'delivery' ? 'Delivery' : 'Takeaway'}
                        </Badge>
                        {order.tableNumber && (
                          <Badge className="border-0 text-xs" style={{ backgroundColor: 'var(--brown)', color: 'var(--warm-white)' }}>
                            Table {order.tableNumber}
                          </Badge>
                        )}
                        <Badge className="border-0 text-xs" style={{ backgroundColor: 'var(--sage-green)', color: 'var(--white)' }}>
                          {statusLabel}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm flex-shrink-0">
                      <Clock className="w-4 h-4" style={{ color: 'var(--brown)', opacity: 0.6 }} />
                      <span style={{ color: 'var(--brown)', opacity: 0.6, fontWeight: 500 }}>{receivedTime}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {order.items.slice(0, 2).map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--golden-amber)' }} />
                      <span style={{ color: 'var(--brown)' }}>
                        {item.quantity}× {item.name}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs pl-5" style={{ color: 'var(--brown)', opacity: 0.6 }}>
                      +{order.items.length - 2} more items
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCompleted(currentPage - 1)}
              disabled={currentPage === 0}
              className="gap-1 border-[var(--brown)]/20"
              style={{ color: 'var(--brown)' }}
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Prev
            </Button>
            <span className="text-sm px-2" style={{ color: 'var(--brown)', fontWeight: 600 }}>
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCompleted(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="gap-1 border-[var(--brown)]/20"
              style={{ color: 'var(--brown)' }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
