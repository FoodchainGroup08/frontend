import { useEffect, useState } from "react";
import { Calendar, MapPin, Package, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getOrderHistory, type Order } from "@/services/api";

interface HistoricalOrder {
  id: string;
  status: 'delivered' | 'cancelled';
  items: Array<{ id: string; name: string; quantity: number }>;
  total: number;
  branchName: string;
  orderDate: string;
  deliveryDate?: string;
}

interface OrderHistoryProps {
  onViewDetails: (order: HistoricalOrder) => void;
}

function mapApiOrder(order: Order): HistoricalOrder {
  const deliveredStatuses = ['SERVED', 'PICKED_UP'];
  return {
    id: order.id,
    status: deliveredStatuses.includes(order.status) ? 'delivered' : 'cancelled',
    items: order.items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })),
    total: order.total,
    branchName: order.branchName,
    orderDate: order.orderDate ?? order.placedAt,
    deliveryDate: order.deliveryDate,
  };
}

export function OrderHistory({ onViewDetails }: OrderHistoryProps) {
  const [orders, setOrders] = useState<HistoricalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getOrderHistory();
      setOrders(data.map(mapApiOrder));
    } catch {
      setError("Failed to load order history");
      toast.error("Failed to load order history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="mb-4" style={{ color: '#E8622A' }}>{error}</p>
          <Button onClick={fetchHistory} variant="outline" className="border-[#3B2314]/20" style={{ color: '#3B2314' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

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
