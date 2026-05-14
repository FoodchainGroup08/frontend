import { useState, useEffect } from "react";
import { Clock, ChevronRight, Flame, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getKitchenQueue, acceptKitchenOrder, readyKitchenOrder, pickupKitchenOrder, serveKitchenOrder, type KitchenOrder, type WsOrderUpdate } from "@/services/api";
import { useKitchenQueue } from "@/hooks/useKitchenQueue";
import { useAuth } from "@/context/AuthContext";
import { isNetworkError, DEMO_KITCHEN_ORDERS } from "@/utils/demoData";
import { playKitchenAlert } from "@/utils/kitchenAlert";

interface KitchenQueueProps {
  onOrderClick: (order: KitchenOrder) => void;
  onStatusChange: (orderId: string, newStatus: 'preparing' | 'ready') => void;
}

// Only the three active statuses live in the kitchen queue.
// picked-up and served are terminal — the backend removes them from the queue immediately.
type StatusFilter = 'all' | 'received' | 'preparing' | 'ready';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'received', label: 'Received' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
];

const STATUS_COLORS: Record<'received' | 'preparing' | 'ready', { bg: string; text: string }> = {
  received: { bg: 'var(--foodchain-espresso)', text: 'var(--foodchain-warm-white)' },
  preparing: { bg: 'var(--foodchain-golden-amber)', text: 'var(--foodchain-charcoal)' },
  ready:     { bg: 'var(--foodchain-sage-green)', text: 'var(--foodchain-white)' },
};

const mapKitchenStatus = (status: string): KitchenOrder['status'] => {
  const value = status.toLowerCase().replace('_', '-');
  if (value === 'preparing' || value === 'ready' || value === 'picked-up' || value === 'served') return value;
  return 'received';
};

export function KitchenQueue({ onOrderClick, onStatusChange }: KitchenQueueProps) {
  const { user } = useAuth();
  const branchId = user?.branchId ?? '';

  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  // Server-reported totals for the three paginated statuses (received/preparing/ready).
  // Server-reported totals for the three paginated statuses (received/preparing/ready).
  // Used for accurate badge counts even before all pages are loaded.
  const [serverTotals, setServerTotals] = useState({ received: 0, preparing: 0, ready: 0 });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const QUEUE_SIZE = 10; // orders per status group per request

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const applyQueuePage = (data: Awaited<ReturnType<typeof getKitchenQueue>>) => {
    const serverOrders = [
      ...data.received.orders,
      ...data.preparing.orders,
      ...data.ready.orders,
    ];
    setOrders(serverOrders);
    const totals = {
      received: data.received.total,
      preparing: data.preparing.total,
      ready: data.ready.total,
    };
    setServerTotals(totals);
    setTotalPages(Math.max(1,
      Math.ceil(totals.received / QUEUE_SIZE),
      Math.ceil(totals.preparing / QUEUE_SIZE),
      Math.ceil(totals.ready / QUEUE_SIZE),
    ));
    setCurrentPage(data.page);
  };

  const fetchQueue = async (page = 0) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getKitchenQueue(page, QUEUE_SIZE);
      applyQueuePage(data);
    } catch (err: any) {
      if (isNetworkError(err)) {
        setOrders(DEMO_KITCHEN_ORDERS);
        setServerTotals({ received: 0, preparing: 0, ready: 0 });
        setTotalPages(1);
      } else {
        setError("Failed to load kitchen queue");
        toast.error("Failed to load kitchen queue");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue(0);
  }, []);

  useKitchenQueue(branchId, (data) => {
    const msg = data as WsOrderUpdate;
    if (msg.orderId && msg.newStatus) {
      const mapped = mapKitchenStatus(msg.newStatus);
      if (mapped === 'received') {
        // New order — play alert and refetch so it appears in the list
        playKitchenAlert();
        fetchQueue(currentPage);
      } else if (mapped === 'picked-up' || mapped === 'served') {
        // Terminal — remove from queue (backend already dropped it)
        setOrders(prev => prev.filter(o => o.id !== msg.orderId));
      } else {
        setOrders(prev => prev.map(o =>
          o.id === msg.orderId ? { ...o, status: mapped, isNew: false } : o
        ));
      }
    } else {
      fetchQueue(currentPage);
    }
  });

  const handleStatusChange = async (orderId: string, newStatus: 'preparing' | 'ready' | 'picked-up' | 'served') => {
    if (updatingOrders.has(orderId)) return;
    const staffId = user?.id ?? '';
    setUpdatingOrders(prev => new Set(prev).add(orderId));

    const isTerminal = newStatus === 'picked-up' || newStatus === 'served';

    const applyLocally = () => {
      if (isTerminal) {
        // Backend marks COMPLETED and drops it from the queue
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setServerTotals(prev => ({ ...prev, ready: Math.max(0, prev.ready - 1) }));
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (newStatus === 'preparing') {
          setServerTotals(prev => ({
            ...prev,
            received: Math.max(0, prev.received - 1),
            preparing: prev.preparing + 1,
          }));
        } else if (newStatus === 'ready') {
          setServerTotals(prev => ({
            ...prev,
            preparing: Math.max(0, prev.preparing - 1),
            ready: prev.ready + 1,
          }));
          onStatusChange(orderId, 'ready');
        }
      }
    };

    try {
      if (newStatus === 'preparing') await acceptKitchenOrder(orderId, staffId);
      else if (newStatus === 'ready')     await readyKitchenOrder(orderId, staffId);
      else if (newStatus === 'picked-up') await pickupKitchenOrder(orderId, staffId);
      else if (newStatus === 'served')    await serveKitchenOrder(orderId, staffId);
      applyLocally();
      toast.success(isTerminal ? 'Order completed' : `Order marked as ${newStatus}`);
    } catch (err: any) {
      if (isNetworkError(err)) {
        applyLocally();
        toast.success(isTerminal ? 'Order completed' : `Order marked as ${newStatus}`);
      } else if (err?.response?.status === 409) {
        toast.info('Order already updated — refreshing queue');
        fetchQueue();
      } else {
        toast.error('Failed to update order status');
      }
    } finally {
      setUpdatingOrders(prev => { const s = new Set(prev); s.delete(orderId); return s; });
    }
  };

  const getElapsedTime = (receivedAt: string) => {
    return Math.floor((currentTime - new Date(receivedAt).getTime()) / 60000);
  };

  const statusCounts: Record<StatusFilter, number> = {
    all: serverTotals.received + serverTotals.preparing + serverTotals.ready,
    received: serverTotals.received,
    preparing: serverTotals.preparing,
    ready: serverTotals.ready,
  };

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  const handleFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
  };

  const renderOrderCard = (order: KitchenOrder) => {
    const elapsedMinutes = getElapsedTime(order.receivedAt);
    const isOverdue = elapsedMinutes > 15;
    const statusColors = STATUS_COLORS[order.status as 'received' | 'preparing' | 'ready']
      ?? STATUS_COLORS.received;

    return (
      <Card
        key={order.id}
        className="cursor-pointer transition-all hover:shadow-lg border-2"
        onClick={() => onOrderClick(order)}
        style={{
          backgroundColor: 'var(--foodchain-warm-white)',
          borderColor: order.isNew ? 'var(--foodchain-golden-amber)' : order.isUrgent || isOverdue ? 'var(--foodchain-burnt-orange)' : 'transparent'
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm mb-1" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                #{order.id.split('-')[2] ?? order.id}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className="border-0 text-xs"
                  style={{
                    backgroundColor: order.orderType === 'dine-in' ? 'var(--foodchain-sage-green)' : order.orderType === 'delivery' ? 'var(--foodchain-golden-amber)' : 'var(--foodchain-espresso)',
                    color: 'var(--foodchain-white)'
                  }}
                >
                  {order.orderType === 'dine-in' ? 'Dine-In' : order.orderType === 'delivery' ? 'Delivery' : 'Takeaway'}
                </Badge>
                {order.tableNumber && (
                  <Badge className="border-0 text-xs" style={{ backgroundColor: 'var(--foodchain-espresso)', color: 'var(--foodchain-warm-white)' }}>
                    Table {order.tableNumber}
                  </Badge>
                )}
                <Badge className="border-0 text-xs" style={{ backgroundColor: statusColors.bg, color: statusColors.text }}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center gap-1 text-sm ${isOverdue || order.isUrgent ? 'animate-pulse' : ''}`}>
                {(isOverdue || order.isUrgent) && <Flame className="w-4 h-4" style={{ color: 'var(--foodchain-burnt-orange)' }} />}
                <Clock className="w-4 h-4" style={{ color: isOverdue || order.isUrgent ? 'var(--foodchain-burnt-orange)' : 'var(--foodchain-espresso)' }} />
                <span style={{ color: isOverdue || order.isUrgent ? 'var(--foodchain-burnt-orange)' : 'var(--foodchain-espresso)', fontWeight: 600 }}>
                  {elapsedMinutes}m
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            {order.items.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--foodchain-golden-amber)' }} />
                <span style={{ color: 'var(--foodchain-espresso)' }}>
                  {item.quantity}× {item.name}
                </span>
              </div>
            ))}
            {order.items.length > 2 && (
              <p className="text-xs pl-5" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                +{order.items.length - 2} more items
              </p>
            )}
          </div>

          {order.status === 'received' && (
            <Button
              onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'preparing'); }}
              className="w-full transition-all hover:opacity-90 gap-2"
              size="sm"
              disabled={updatingOrders.has(order.id)}
              style={{ backgroundColor: 'var(--foodchain-golden-amber)', color: 'var(--foodchain-charcoal)' }}
            >
              {updatingOrders.has(order.id) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Start Preparing
            </Button>
          )}

          {order.status === 'preparing' && (
            <Button
              onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'ready'); }}
              className="w-full transition-all hover:opacity-90 gap-2"
              size="sm"
              disabled={updatingOrders.has(order.id)}
              style={{ backgroundColor: 'var(--foodchain-sage-green)', color: 'var(--foodchain-white)' }}
            >
              {updatingOrders.has(order.id) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Mark Ready
            </Button>
          )}

          {order.status === 'ready' && order.orderType === 'dine-in' && (
            <Button
              onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'served'); }}
              className="w-full transition-all hover:opacity-90 gap-2"
              size="sm"
              disabled={updatingOrders.has(order.id)}
              style={{ backgroundColor: 'var(--foodchain-espresso)', color: 'var(--foodchain-warm-white)' }}
            >
              {updatingOrders.has(order.id) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Served
            </Button>
          )}

          {order.status === 'ready' && (order.orderType === 'takeaway' || order.orderType === 'delivery') && (
            <Button
              onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'picked-up'); }}
              className="w-full transition-all hover:opacity-90 gap-2"
              size="sm"
              disabled={updatingOrders.has(order.id)}
              style={{ backgroundColor: 'var(--foodchain-golden-amber)', color: 'var(--foodchain-charcoal)' }}
            >
              {updatingOrders.has(order.id) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Picked Up
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="p-6 sm:p-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72 mb-6" />
          <Skeleton className="h-10 w-56 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="p-6 sm:p-8 text-center">
          <p className="mb-4" style={{ color: 'var(--foodchain-burnt-orange)' }}>{error}</p>
          <Button onClick={fetchQueue} variant="outline" className="border-[var(--foodchain-espresso)]/20" style={{ color: 'var(--foodchain-espresso)' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl mb-8" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
            Kitchen Queue
          </h1>
          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardContent className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'var(--foodchain-golden-amber)', opacity: 0.1 }}>
                <Clock className="w-10 h-10" style={{ color: 'var(--foodchain-golden-amber)' }} />
              </div>
              <h3 className="text-xl mb-2" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                No Orders in Queue
              </h3>
              <p style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                New orders will appear here
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl mb-1" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
              Kitchen Queue
            </h1>
            <p style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
              {orders.length} active {orders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value as StatusFilter)}
              className="rounded-md px-3 py-2 text-sm border outline-none cursor-pointer"
              style={{
                borderColor: 'color-mix(in srgb, var(--foodchain-espresso) 20%, transparent)',
                backgroundColor: 'var(--foodchain-white)',
                color: 'var(--foodchain-espresso)',
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
          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardContent className="text-center py-12">
              <p style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                No {statusFilter === 'all' ? '' : STATUS_OPTIONS.find(o => o.value === statusFilter)?.label.toLowerCase() + ' '}orders right now
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filtered.map(renderOrderCard)}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchQueue(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="gap-1 border-[var(--foodchain-espresso)]/20"
                  style={{ color: 'var(--foodchain-espresso)' }}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Prev
                </Button>
                <span className="text-sm px-2" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                  {currentPage + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchQueue(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="gap-1 border-[var(--foodchain-espresso)]/20"
                  style={{ color: 'var(--foodchain-espresso)' }}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
