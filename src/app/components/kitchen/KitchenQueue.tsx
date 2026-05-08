import { useState, useEffect } from "react";
import { Clock, ChevronRight, Flame } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getKitchenQueue, updateOrderStatus, type KitchenOrder, type WsOrderUpdate } from "@/services/api";
import { useKitchenQueue } from "@/hooks/useKitchenQueue";
import { useAuth } from "@/context/AuthContext";
import { isNetworkError, DEMO_KITCHEN_ORDERS } from "@/utils/demoData";

interface KitchenQueueProps {
  onOrderClick: (order: KitchenOrder) => void;
  onStatusChange: (orderId: string, newStatus: 'preparing' | 'ready') => void;
}

export function KitchenQueue({ onOrderClick, onStatusChange }: KitchenQueueProps) {
  const { user } = useAuth();
  const branchId = user?.branchId ?? '';

  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getKitchenQueue();
      setOrders(data);
    } catch (err: any) {
      if (isNetworkError(err)) {
        setOrders(DEMO_KITCHEN_ORDERS);
      } else {
        setError("Failed to load kitchen queue");
        toast.error("Failed to load kitchen queue");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  useKitchenQueue(branchId, (data) => {
    const msg = data as WsOrderUpdate;
    if (msg.orderId && msg.newStatus) {
      setOrders(prev => prev.map(o =>
        o.id === msg.orderId
          ? { ...o, status: msg.newStatus.toLowerCase() as KitchenOrder['status'], isNew: false }
          : o
      ));
    } else {
      // New order arrived — refresh the queue
      fetchQueue();
    }
  });

  const handleStatusChange = async (orderId: string, newStatus: 'preparing' | 'ready') => {
    const apiStatus = newStatus === 'preparing' ? 'PREPARING' : 'READY';
    try {
      await updateOrderStatus(orderId, apiStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      onStatusChange(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err: any) {
      if (isNetworkError(err)) {
        // Demo mode — update locally
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        onStatusChange(orderId, newStatus);
        toast.success(`Order status updated to ${newStatus}`);
      } else {
        toast.error("Failed to update order status");
      }
    }
  };

  const getElapsedTime = (receivedAt: string) => {
    return Math.floor((currentTime - new Date(receivedAt).getTime()) / 60000);
  };

  const receivedOrders = orders.filter(o => o.status === 'received');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const renderOrderCard = (order: KitchenOrder) => {
    const elapsedMinutes = getElapsedTime(order.receivedAt);
    const isOverdue = elapsedMinutes > 15;

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
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(order.id, 'preparing');
              }}
              className="w-full transition-all hover:opacity-90"
              size="sm"
              style={{ backgroundColor: 'var(--foodchain-golden-amber)', color: 'var(--foodchain-charcoal)' }}
            >
              Start Preparing
            </Button>
          )}

          {order.status === 'preparing' && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(order.id, 'ready');
              }}
              className="w-full transition-all hover:opacity-90"
              size="sm"
              style={{ backgroundColor: 'var(--foodchain-sage-green)', color: 'var(--foodchain-white)' }}
            >
              Mark Ready
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen overflow-hidden" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--foodchain-espresso)', opacity: 0.1 }}>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {[1, 2, 3].map(col => (
            <div key={col} className="space-y-4">
              <Skeleton className="h-6 w-24" />
              {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="text-center">
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
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'var(--foodchain-golden-amber)', opacity: 0.1 }}>
            <Clock className="w-10 h-10" style={{ color: 'var(--foodchain-golden-amber)' }} />
          </div>
          <h3 className="text-xl mb-2" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
            No Orders in Queue
          </h3>
          <p style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
            New orders will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
      <div className="p-6 border-b" style={{ borderColor: 'var(--foodchain-espresso)', opacity: 0.1 }}>
        <h1 className="text-2xl mb-2" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
          Kitchen Queue
        </h1>
        <p style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
          {orders.length} active {orders.length === 1 ? 'order' : 'orders'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 h-[calc(100vh-120px)] overflow-auto">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
              Received
            </h2>
            <Badge className="border-0" style={{ backgroundColor: 'var(--foodchain-espresso)', color: 'var(--foodchain-warm-white)' }}>
              {receivedOrders.length}
            </Badge>
          </div>
          <div className="space-y-4">
            {receivedOrders.map(renderOrderCard)}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
              Preparing
            </h2>
            <Badge className="border-0" style={{ backgroundColor: 'var(--foodchain-golden-amber)', color: 'var(--foodchain-charcoal)' }}>
              {preparingOrders.length}
            </Badge>
          </div>
          <div className="space-y-4">
            {preparingOrders.map(renderOrderCard)}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
              Ready
            </h2>
            <Badge className="border-0" style={{ backgroundColor: 'var(--foodchain-sage-green)', color: 'var(--foodchain-white)' }}>
              {readyOrders.length}
            </Badge>
          </div>
          <div className="space-y-4">
            {readyOrders.map(renderOrderCard)}
          </div>
        </div>
      </div>
    </div>
  );
}