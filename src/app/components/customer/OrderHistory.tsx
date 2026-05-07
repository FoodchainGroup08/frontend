import { Calendar, MapPin, Package, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface HistoricalOrder {
  id: string;
  status: 'delivered' | 'cancelled';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  total: number;
  branchName: string;
  orderDate: string;
  deliveryDate?: string;
}

interface OrderHistoryProps {
  orders: HistoricalOrder[];
  onViewDetails: (order: HistoricalOrder) => void;
}

const mockOrders: HistoricalOrder[] = [
  {
    id: "ORD-2024-1245",
    status: "delivered",
    items: [
      { id: "1", name: "Jollof Rice & Chicken", quantity: 2 },
      { id: "7", name: "Chapman", quantity: 2 }
    ],
    total: 5800,
    branchName: "Victoria Island",
    orderDate: "2026-05-06 14:30",
    deliveryDate: "2026-05-06 15:15"
  },
  {
    id: "ORD-2024-1198",
    status: "delivered",
    items: [
      { id: "4", name: "Egusi Soup & Pounded Yam", quantity: 1 },
      { id: "5", name: "Suya Platter", quantity: 1 }
    ],
    total: 5500,
    branchName: "Lekki Phase 1",
    orderDate: "2026-05-04 19:00",
    deliveryDate: "2026-05-04 20:05"
  },
  {
    id: "ORD-2024-1102",
    status: "delivered",
    items: [
      { id: "2", name: "Fried Rice Special", quantity: 1 },
      { id: "9", name: "Puff Puff", quantity: 1 }
    ],
    total: 4100,
    branchName: "Victoria Island",
    orderDate: "2026-05-01 12:15",
    deliveryDate: "2026-05-01 13:00"
  },
  {
    id: "ORD-2024-1089",
    status: "cancelled",
    items: [
      { id: "3", name: "Pepper Soup", quantity: 1 }
    ],
    total: 2500,
    branchName: "Surulere",
    orderDate: "2026-04-29 18:30"
  }
];

export function OrderHistory({ orders = mockOrders, onViewDetails }: OrderHistoryProps) {
  if (orders.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl mb-8" style={{ color: '#3B2314', fontWeight: 600 }}>
            Order History
          </h1>

          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardContent className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#3B2314', opacity: 0.1 }}>
                <Package className="w-10 h-10" style={{ color: '#3B2314' }} />
              </div>
              <h3 className="text-xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
                No Order History
              </h3>
              <p style={{ color: '#3B2314', opacity: 0.6 }}>
                Your past orders will appear here
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl mb-6" style={{ color: '#3B2314', fontWeight: 600 }}>
          Order History
        </h1>

        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="border-[#3B2314]/10 cursor-pointer transition-all hover:shadow-lg"
              onClick={() => onViewDetails(order)}
              style={{ backgroundColor: 'white' }}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <CardTitle className="text-lg" style={{ color: '#3B2314' }}>
                        Order #{order.id}
                      </CardTitle>
                      <Badge
                        className="border-0"
                        style={{
                          backgroundColor: order.status === 'delivered' ? '#4CAF7D' : '#E8622A',
                          color: 'white'
                        }}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-sm">
                      <div className="flex items-center gap-1" style={{ color: '#3B2314', opacity: 0.6 }}>
                        <Calendar className="w-4 h-4" />
                        <span>{order.orderDate}</span>
                      </div>
                      <div className="flex items-center gap-1" style={{ color: '#3B2314', opacity: 0.6 }}>
                        <MapPin className="w-4 h-4" />
                        <span>{order.branchName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl" style={{ color: '#F0A500', fontWeight: 600 }}>
                      ₦{order.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#F0A500' }} />
                      <span style={{ color: '#3B2314', opacity: 0.8 }}>
                        {item.name} × {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {order.deliveryDate && (
                  <CardDescription className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                    Delivered on {order.deliveryDate}
                  </CardDescription>
                )}

                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#3B2314]/20"
                    style={{ color: '#3B2314' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(order);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
