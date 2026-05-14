import { useState, useEffect } from "react";
import { Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getManagerLiveOrders, type Order, type WsOrderUpdate } from "@/services/api";
import { useManagerOrders } from "@/hooks/useManagerOrders";
import { useAuth } from "@/context/AuthContext";

interface LiveOrder {
  id: string;
  status: 'received' | 'preparing' | 'ready' | 'out-for-delivery';
  items: Array<{ id: string; name: string; quantity: number }>;
  itemCount?: number;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  receivedAt: string;
  customerName?: string;
  total?: number;
}

type StatusFilter = 'all' | LiveOrder['status'];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'received', label: 'Received' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'out-for-delivery', label: 'Out for Delivery' },
];

const STATUS_COLORS: Record<LiveOrder['status'], { bg: string; text: string }> = {
  received: { bg: 'var(--espresso)', text: 'var(--warm-white)' },
  preparing: { bg: 'var(--golden-amber)', text: 'var(--charcoal)' },
  ready: { bg: 'var(--sage-green)', text: 'var(--white)' },
  'out-for-delivery': { bg: 'var(--burnt-orange)', text: 'var(--white)' },
};

const PAGE_SIZE = 20;

function mapOrderStatus(status: string): LiveOrder['status'] {
  const map: Record<string, LiveOrder['status']> = {
    RECEIVED: 'received', PREPARING: 'preparing', READY: 'ready', PICKED_UP: 'out-for-delivery',
  };
  return map[status] ?? 'received';
}

function mapApiOrder(o: Order): LiveOrder {
  return {
    id: o.id,
    status: mapOrderStatus(o.status),
    items: o.items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })),
    itemCount: o.itemCount,
    orderType: o.orderType,
    tableNumber: o.tableNumber ?? undefined,
    receivedAt: o.placedAt,
    customerName: o.customerName || undefined,
    total: o.total,
  };
}

export function LiveOrders() {
  const { user } = useAuth();
  const branchId = user?.branchId ?? '';

  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getManagerLiveOrders();
      setOrders(data.map(mapApiOrder));
    } catch {
      setError("Failed to load live orders");
      toast.error("Failed to load live orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useManagerOrders(branchId, (data) => {
    const msg = data as WsOrderUpdate;
    if (msg.orderId && msg.newStatus) {
      const TERMINAL = new Set(['SERVED', 'PICKED_UP', 'CANCELLED', 'COMPLETED']);
      if (TERMINAL.has(msg.newStatus)) {
        setOrders(prev => prev.filter(o => o.id !== msg.orderId));
      } else {
        setOrders(prev => prev.map(o =>
          o.id === msg.orderId ? { ...o, status: mapOrderStatus(msg.newStatus) } : o
        ));
      }
    } else {
      fetchOrders();
    }
  });

  const getElapsedTime = (receivedAt: string) => {
    return Math.floor((Date.now() - new Date(receivedAt).getTime()) / 60000);
  };

  const statusCounts: Record<StatusFilter, number> = {
    all: orders.length,
    received: orders.filter(o => o.status === 'received').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    'out-for-delivery': orders.filter(o => o.status === 'out-for-delivery').length,
  };

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const renderOrderCard = (order: LiveOrder) => {
    const elapsedMinutes = getElapsedTime(order.receivedAt);
    const colors = STATUS_COLORS[order.status];

    return (
      <Card
        key={order.id}
        className="border-[var(--espresso)]/10"
        style={{ backgroundColor: 'var(--white)' }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm mb-1" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                #{order.id.split('-')[2] ?? order.id}
              </p>
              {order.customerName && (
                <p className="text-xs mb-2" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                  {order.customerName}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className="border-0 text-xs"
                  style={{
                    backgroundColor: order.orderType === 'dine-in'
                      ? 'var(--sage-green)'
                      : order.orderType === 'delivery'
                        ? 'var(--golden-amber)'
                        : 'var(--espresso)',
                    color: 'var(--white)'
                  }}
                >
                  {order.orderType === 'dine-in' ? 'Dine-In' : order.orderType === 'delivery' ? 'Delivery' : 'Takeaway'}
                </Badge>
                {order.tableNumber && (
                  <Badge className="border-0 text-xs" style={{ backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' }}>
                    Table {order.tableNumber}
                  </Badge>
                )}
                <Badge className="border-0 text-xs" style={{ backgroundColor: colors.bg, color: colors.text }}>
                  {order.status === 'out-for-delivery' ? 'Out for Delivery' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 text-sm">
                <Clock className="w-4 h-4" style={{ color: 'var(--espresso)', opacity: 0.6 }} />
                <span style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                  {elapsedMinutes}m
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {order.items.length > 0
              ? order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--golden-amber)' }} />
                    <span style={{ color: 'var(--espresso)' }}>
                      {item.quantity}× {item.name}
                    </span>
                  </div>
                ))
              : (
                <div className="flex items-center gap-2 text-sm">
                  <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--golden-amber)' }} />
                  <span style={{ color: 'var(--espresso)', opacity: 0.7 }}>
                    {order.itemCount ?? '—'} {(order.itemCount ?? 0) === 1 ? 'item' : 'items'}
                    {order.total ? ` · ₦${order.total.toLocaleString()}` : ''}
                  </span>
                </div>
              )
            }
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="p-6 sm:p-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72 mb-6" />
          <Skeleton className="h-10 w-56 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-36 w-full rounded-lg" />)}
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
          <Button onClick={fetchOrders} variant="outline" className="border-[var(--espresso)]/20" style={{ color: 'var(--espresso)' }}>
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
          <h1 className="text-3xl mb-8" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
            Live Orders
          </h1>
          <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardContent className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'var(--espresso)', opacity: 0.1 }}>
                <Clock className="w-10 h-10" style={{ color: 'var(--espresso)' }} />
              </div>
              <h3 className="text-xl mb-2" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                No Active Orders
              </h3>
              <p style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                Active orders will appear here
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
            <h1 className="text-3xl mb-1" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
              Live Orders
            </h1>
            <p style={{ color: 'var(--espresso)', opacity: 0.7 }}>
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} in progress
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value as StatusFilter)}
              className="rounded-md px-3 py-2 text-sm border outline-none cursor-pointer"
              style={{
                borderColor: 'color-mix(in srgb, var(--espresso) 20%, transparent)',
                backgroundColor: 'var(--white)',
                color: 'var(--espresso)',
              }}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({statusCounts[opt.value]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardContent className="text-center py-12">
              <p style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                No {statusFilter === 'all' ? '' : STATUS_OPTIONS.find(o => o.value === statusFilter)?.label.toLowerCase() + ' '}orders right now
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {paginated.map(renderOrderCard)}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} orders
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="border-[var(--espresso)]/20 gap-1"
                    style={{ color: 'var(--espresso)' }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </Button>
                  <span className="text-sm px-2" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPages}
                    className="border-[var(--espresso)]/20 gap-1"
                    style={{ color: 'var(--espresso)' }}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
