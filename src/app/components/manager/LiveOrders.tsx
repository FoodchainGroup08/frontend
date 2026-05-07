import { Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";

interface LiveOrder {
  id: string;
  status: 'received' | 'preparing' | 'ready' | 'out-for-delivery';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  receivedAt: string;
  customerName?: string;
}

interface LiveOrdersProps {
  orders?: LiveOrder[];
}

const mockOrders: LiveOrder[] = [
  {
    id: "ORD-2026-5001",
    status: "received",
    items: [
      { id: "1", name: "Jollof Rice & Chicken", quantity: 2 },
      { id: "7", name: "Chapman", quantity: 2 }
    ],
    orderType: "delivery",
    receivedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    customerName: "John Doe"
  },
  {
    id: "ORD-2026-5002",
    status: "preparing",
    items: [
      { id: "4", name: "Egusi Soup & Pounded Yam", quantity: 1 },
      { id: "5", name: "Suya Platter", quantity: 1 }
    ],
    orderType: "delivery",
    receivedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    customerName: "Jane Smith"
  },
  {
    id: "ORD-2026-5003",
    status: "preparing",
    items: [
      { id: "2", name: "Fried Rice Special", quantity: 2 }
    ],
    orderType: "takeaway",
    receivedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    customerName: "Mike Johnson"
  },
  {
    id: "ORD-2026-5004",
    status: "ready",
    items: [
      { id: "1", name: "Jollof Rice & Chicken", quantity: 1 },
      { id: "10", name: "Plantain", quantity: 1 }
    ],
    orderType: "dine-in",
    tableNumber: "5",
    receivedAt: new Date(Date.now() - 22 * 60000).toISOString(),
    customerName: "Sarah Wilson"
  },
  {
    id: "ORD-2026-5005",
    status: "out-for-delivery",
    items: [
      { id: "3", name: "Pepper Soup", quantity: 1 },
      { id: "8", name: "Zobo", quantity: 1 }
    ],
    orderType: "delivery",
    receivedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    customerName: "David Brown"
  }
];

export function LiveOrders({ orders = mockOrders }: LiveOrdersProps) {
  const getElapsedTime = (receivedAt: string) => {
    const elapsed = Math.floor((Date.now() - new Date(receivedAt).getTime()) / 60000);
    return elapsed;
  };

  const ordersByStatus = {
    received: orders.filter(o => o.status === 'received'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready'),
    'out-for-delivery': orders.filter(o => o.status === 'out-for-delivery')
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
                #{order.id.split('-')[2]}
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
