import { useState, useEffect } from "react";
import { Clock, ChevronRight } from "lucide-react";
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
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  receivedAt: string;
  customerName?: string;
}

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
    orderType: o.orderType,
    tableNumber: o.tableNumber,
    receivedAt: o.placedAt,
    customerName: o.customerName,
  };
}

export function LiveOrders() {
  const { user } = useAuth();
  const branchId = user?.branchId ?? '';

  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
      setOrders(prev => prev.map(o =>
        o.id === msg.orderId ? { ...o, status: mapOrderStatus(msg.newStatus) } : o
      ));
    } else {
      fetchOrders();
    }
  });

  const getElapsedTime = (receivedAt: string) => {
    return Math.floor((Date.now() - new Date(receivedAt).getTime()) / 60000);
  };

  const ordersByStatus = {
    received: orders.filter(o => o.status === 'received'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready'),
    'out-for-delivery': orders.filter(o => o.status === 'out-for-delivery'),
  };

  const renderOrderCard = (order: LiveOrder) => {
    const elapsedMinutes = getElapsedTime(order.receivedAt);

    return (
      <Card
        key={order.id}
        className="border-[#3B2314]/10"
        style={{ backgroundColor: 'white' }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm mb-1" style={{ color: '#3B2314', fontWeight: 600 }}>
                #{order.id.split('-')[2] ?? order.id}
              </p>
              {order.customerName && (
                <p className="text-xs mb-2" style={{ color: '#3B2314', opacity: 0.6 }}>
                  {order.customerName}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className="border-0 text-xs"
                  style={{
                    backgroundColor: order.orderType === 'dine-in' ? '#4CAF7D' : order.orderType === 'delivery' ? '#F0A500' : '#3B2314',
                    color: 'white'
                  }}
                >
                  {order.orderType === 'dine-in' ? 'Dine-In' : order.orderType === 'delivery' ? 'Delivery' : 'Takeaway'}
                </Badge>
                {order.tableNumber && (
                  <Badge className="border-0 text-xs" style={{ backgroundColor: '#3B2314', color: '#FAF7F2' }}>
                    Table {order.tableNumber}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm">
                <Clock className="w-4 h-4" style={{ color: '#3B2314', opacity: 0.6 }} />
                <span style={{ color: '#3B2314', fontWeight: 600 }}>
                  {elapsedMinutes}m
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: '#F0A500' }} />
                <span style={{ color: '#3B2314' }}>
                  {item.quantity}× {item.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="p-6 sm:p-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(col => (
              <div key={col} className="space-y-4">
                <Skeleton className="h-6 w-24" />
                {[1, 2].map(i => <Skeleton key={i} className="h-36 w-full rounded-lg" />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="p-6 sm:p-8 text-center">
          <p className="mb-4" style={{ color: '#E8622A' }}>{error}</p>
          <Button onClick={fetchOrders} variant="outline" className="border-[#3B2314]/20" style={{ color: '#3B2314' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl mb-8" style={{ color: '#3B2314', fontWeight: 600 }}>
            Live Orders
          </h1>
          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardContent className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#3B2314', opacity: 0.1 }}>
                <Clock className="w-10 h-10" style={{ color: '#3B2314' }} />
              </div>
              <h3 className="text-xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
                No Active Orders
              </h3>
              <p style={{ color: '#3B2314', opacity: 0.6 }}>
                Active orders will appear here
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
            Live Orders
          </h1>
          <p style={{ color: '#3B2314', opacity: 0.7 }}>
            Real-time view of all active orders • {orders.length} {orders.length === 1 ? 'order' : 'orders'} in progress
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg" style={{ color: '#3B2314', fontWeight: 600 }}>
                Received
              </h2>
              <Badge className="border-0" style={{ backgroundColor: '#3B2314', color: '#FAF7F2' }}>
                {ordersByStatus.received.length}
              </Badge>
            </div>
            <div className="space-y-4">
              {ordersByStatus.received.map(renderOrderCard)}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg" style={{ color: '#3B2314', fontWeight: 600 }}>
                Preparing
              </h2>
              <Badge className="border-0" style={{ backgroundColor: '#F0A500', color: '#1E1E1E' }}>
                {ordersByStatus.preparing.length}
              </Badge>
            </div>
            <div className="space-y-4">
              {ordersByStatus.preparing.map(renderOrderCard)}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg" style={{ color: '#3B2314', fontWeight: 600 }}>
                Ready
              </h2>
              <Badge className="border-0" style={{ backgroundColor: '#4CAF7D', color: 'white' }}>
                {ordersByStatus.ready.length}
              </Badge>
            </div>
            <div className="space-y-4">
              {ordersByStatus.ready.map(renderOrderCard)}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg" style={{ color: '#3B2314', fontWeight: 600 }}>
                Out for Delivery
              </h2>
              <Badge className="border-0" style={{ backgroundColor: '#F0A500', color: '#1E1E1E' }}>
                {ordersByStatus['out-for-delivery'].length}
              </Badge>
            </div>
            <div className="space-y-4">
              {ordersByStatus['out-for-delivery'].map(renderOrderCard)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
