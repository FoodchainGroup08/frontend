import { useState, useEffect } from "react";
import { Clock, ChevronRight, Flame } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface KitchenOrder {
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
  isNew?: boolean;
  isUrgent?: boolean;
}

interface KitchenQueueProps {
  orders: KitchenOrder[];
  onOrderClick: (order: KitchenOrder) => void;
  onStatusChange: (orderId: string, newStatus: 'preparing' | 'ready') => void;
}

const mockOrders: KitchenOrder[] = [
  {
    id: "ORD-2026-5001",
    status: "received",
    items: [
      { id: "1", name: "Jollof Rice & Chicken", quantity: 2 },
      { id: "7", name: "Chapman", quantity: 2 }
    ],
    orderType: "delivery",
    receivedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    isNew: true
  },
  {
    id: "ORD-2026-5002",
    status: "received",
    items: [
      { id: "3", name: "Pepper Soup", quantity: 1 },
      { id: "9", name: "Puff Puff", quantity: 1 }
    ],
    orderType: "dine-in",
    tableNumber: "12",
    receivedAt: new Date(Date.now() - 18 * 60000).toISOString(),
    isUrgent: true
  },
  {
    id: "ORD-2026-5003",
    status: "preparing",
    items: [
      { id: "4", name: "Egusi Soup & Pounded Yam", quantity: 1, specialInstructions: "Extra spicy" },
      { id: "5", name: "Suya Platter", quantity: 1 }
    ],
    orderType: "delivery",
    receivedAt: new Date(Date.now() - 12 * 60000).toISOString()
  },
  {
    id: "ORD-2026-5004",
    status: "preparing",
    items: [
      { id: "2", name: "Fried Rice Special", quantity: 2 }
    ],
    orderType: "takeaway",
    receivedAt: new Date(Date.now() - 8 * 60000).toISOString()
  },
  {
    id: "ORD-2026-5005",
    status: "ready",
    items: [
      { id: "1", name: "Jollof Rice & Chicken", quantity: 1 },
      { id: "10", name: "Plantain", quantity: 1 }
    ],
    orderType: "dine-in",
    tableNumber: "5",
    receivedAt: new Date(Date.now() - 22 * 60000).toISOString()
  }
];

export function KitchenQueue({ orders = mockOrders, onOrderClick, onStatusChange }: KitchenQueueProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedTime = (receivedAt: string) => {
    const elapsed = Math.floor((currentTime - new Date(receivedAt).getTime()) / 60000);
    return elapsed;
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
          backgroundColor: '#FAF7F2',
          borderColor: order.isNew ? '#F0A500' : order.isUrgent || isOverdue ? '#E8622A' : 'transparent'
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm mb-1" style={{ color: '#3B2314', fontWeight: 600 }}>
                #{order.id.split('-')[2]}
              </p>
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
              <div className={`flex items-center gap-1 text-sm ${isOverdue || order.isUrgent ? 'animate-pulse' : ''}`}>
                {(isOverdue || order.isUrgent) && <Flame className="w-4 h-4" style={{ color: '#E8622A' }} />}
                <Clock className="w-4 h-4" style={{ color: isOverdue || order.isUrgent ? '#E8622A' : '#3B2314' }} />
                <span style={{ color: isOverdue || order.isUrgent ? '#E8622A' : '#3B2314', fontWeight: 600 }}>
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
                <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: '#F0A500' }} />
                <span style={{ color: '#3B2314' }}>
                  {item.quantity}× {item.name}
                </span>
              </div>
            ))}
            {order.items.length > 2 && (
              <p className="text-xs pl-5" style={{ color: '#3B2314', opacity: 0.6 }}>
                +{order.items.length - 2} more items
              </p>
            )}
          </div>

          {order.status === 'received' && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(order.id, 'preparing');
              }}
              className="w-full transition-all hover:opacity-90"
              size="sm"
              style={{ backgroundColor: '#F0A500', color: '#1E1E1E' }}
            >
              Start Preparing
            </Button>
          )}

          {order.status === 'preparing' && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(order.id, 'ready');
              }}
              className="w-full transition-all hover:opacity-90"
              size="sm"
              style={{ backgroundColor: '#4CAF7D', color: 'white' }}
            >
              Mark Ready
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (orders.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#F0A500', opacity: 0.1 }}>
            <Clock className="w-10 h-10" style={{ color: '#F0A500' }} />
          </div>
          <h3 className="text-xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
            No Orders in Queue
          </h3>
          <p style={{ color: '#3B2314', opacity: 0.6 }}>
            New orders will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="p-6 border-b" style={{ borderColor: '#3B2314', opacity: 0.1 }}>
        <h1 className="text-2xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
          Kitchen Queue
        </h1>
        <p style={{ color: '#3B2314', opacity: 0.6 }}>
          {orders.length} active {orders.length === 1 ? 'order' : 'orders'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 h-[calc(100vh-120px)] overflow-auto">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg" style={{ color: '#3B2314', fontWeight: 600 }}>
              Received
            </h2>
            <Badge className="border-0" style={{ backgroundColor: '#3B2314', color: '#FAF7F2' }}>
              {receivedOrders.length}
            </Badge>
          </div>
          <div className="space-y-4">
            {receivedOrders.map(renderOrderCard)}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg" style={{ color: '#3B2314', fontWeight: 600 }}>
              Preparing
            </h2>
            <Badge className="border-0" style={{ backgroundColor: '#F0A500', color: '#1E1E1E' }}>
              {preparingOrders.length}
            </Badge>
          </div>
          <div className="space-y-4">
            {preparingOrders.map(renderOrderCard)}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg" style={{ color: '#3B2314', fontWeight: 600 }}>
              Ready
            </h2>
            <Badge className="border-0" style={{ backgroundColor: '#4CAF7D', color: 'white' }}>
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
