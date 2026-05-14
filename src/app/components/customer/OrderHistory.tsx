import { useEffect, useState } from "react";
import { Calendar, MapPin, Package, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getOrderHistory, getOrderById, type Order } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { formatOrderReference } from "@/utils/orderDisplay";
import { getOrderStatusDisplay } from "./orderStatusDisplay";

interface HistoricalOrder {
  id: string;
  status: string;
  items: Array<{ id: string; name: string; quantity: number }>;
  total: number;
  branchName: string;
  orderDate: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  phoneNumber?: string;
  paymentMethod?: string;
  customerName?: string;
}

interface OrderHistoryProps {
  onViewDetails: (order: HistoricalOrder) => void;
  onBrowseMenu?: () => void;
}

function mapApiOrder(order: Order): HistoricalOrder {
  return {
    id: order.id,
    status: order.status,
    items: order.items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })),
    total: order.total,
    branchName: order.branchName,
    orderDate: order.orderDate ?? order.placedAt,
    deliveryDate: order.deliveryDate,
    deliveryAddress: order.deliveryAddress,
    phoneNumber: order.phoneNumber,
    paymentMethod: order.paymentMethod,
    customerName: order.customerName,
  };
}

export function OrderHistory({ onViewDetails, onBrowseMenu }: OrderHistoryProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<HistoricalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    setIsLoading(true);
    setError("");
    try {
      // /orders/history returns a summary page (no items, no branchName).
      // Fetch full detail for each so the history cards can display items and branch.
      const summaries = await getOrderHistory(user?.id);
      const full = await Promise.all(summaries.map(s => getOrderById(s.id)));
      setOrders(full.map(mapApiOrder));
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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--warm-white)' }}>
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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="mb-4" style={{ color: 'var(--burnt-orange)' }}>{error}</p>
          <Button onClick={fetchHistory} variant="outline" className="border-[var(--espresso)]/20" style={{ color: 'var(--espresso)' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl mb-8" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
            Order History
          </h1>

          <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardContent className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'var(--espresso)', opacity: 0.1 }}>
                <Package className="w-10 h-10" style={{ color: 'var(--espresso)' }} />
              </div>
              <h3 className="text-xl mb-2" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                No Order History
              </h3>
              <p style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                Your past orders will appear here
              </p>
              {onBrowseMenu && (
                <Button
                  onClick={onBrowseMenu}
                  className="mt-4 transition-all hover:opacity-90 hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--golden-amber)',
                    color: 'var(--charcoal)'
                  }}
                >
                  Browse Menu
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
            Order History
          </h1>
          {onBrowseMenu && (
            <Button
              onClick={onBrowseMenu}
              className="transition-all hover:opacity-90 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--golden-amber)',
                color: 'var(--charcoal)'
              }}
            >
              Browse Menu
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {orders.map((order) => {
            const statusDisplay = getOrderStatusDisplay(order.status);

            return (
              <Card
                key={order.id}
                className="border-[var(--espresso)]/10 cursor-pointer transition-all hover:shadow-lg"
                onClick={() => onViewDetails(order)}
                style={{ backgroundColor: 'var(--white)' }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CardTitle className="text-lg" style={{ color: 'var(--espresso)' }}>
                          Order {formatOrderReference(order.id)}
                        </CardTitle>
                        <Badge
                          className="border-0"
                          style={statusDisplay.style}
                        >
                          {statusDisplay.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap text-sm">
                        <div className="flex items-center gap-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                          <Calendar className="w-4 h-4" />
                          <span>{order.orderDate}</span>
                        </div>
                        <div className="flex items-center gap-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                          <MapPin className="w-4 h-4" />
                          <span>{order.branchName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl" style={{ color: 'var(--golden-amber)', fontWeight: 600 }}>
                        ₦{order.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--golden-amber)' }} />
                        <span style={{ color: 'var(--espresso)', opacity: 0.8 }}>
                          {item.name} × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.deliveryDate && (
                    <CardDescription className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                      Delivered on {order.deliveryDate}
                    </CardDescription>
                  )}

                  <div className="flex items-center justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[var(--espresso)]/20"
                      style={{ color: 'var(--espresso)' }}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
