import { useEffect, useState } from "react";
import { Clock, CheckCircle2, Package, Truck, Home, ChevronRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";

interface Order {
  id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  total: number;
  branchName: string;
  estimatedTime: string;
  placedAt: string;
}

interface OrderTrackerProps {
  activeOrder?: Order;
  onGoBack?: () => void;
}

const statusSteps = [
  { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'ready', label: 'Ready', icon: Clock },
  { key: 'out-for-delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home }
];

export function OrderTracker({ activeOrder, onGoBack }: OrderTrackerProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (activeOrder) {
      const currentIndex = statusSteps.findIndex(step => step.key === activeOrder.status);
      const progressValue = ((currentIndex + 1) / statusSteps.length) * 100;
      setProgress(progressValue);
    }
  }, [activeOrder]);

  if (!activeOrder) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-8">
            {onGoBack && (
              <Button
                onClick={onGoBack}
                variant="ghost"
                size="sm"
                className="gap-2"
                style={{ color: '#3B2314' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <h1 className="text-2xl sm:text-3xl" style={{ color: '#3B2314', fontWeight: 600 }}>
              Track Order
            </h1>
          </div>

          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardContent className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#3B2314', opacity: 0.1 }}>
                <Package className="w-10 h-10" style={{ color: '#3B2314' }} />
              </div>
              <h3 className="text-xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
                No Active Orders
              </h3>
              <p style={{ color: '#3B2314', opacity: 0.6 }}>
                You don't have any orders in progress
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(step => step.key === activeOrder.status);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          {onGoBack && (
            <Button
              onClick={onGoBack}
              variant="ghost"
              size="sm"
              className="gap-2"
              style={{ color: '#3B2314' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <h1 className="text-2xl sm:text-3xl" style={{ color: '#3B2314', fontWeight: 600 }}>
            Track Order
          </h1>
        </div>

        <Card className="border-[#3B2314]/10 mb-6" style={{ backgroundColor: 'white' }}>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle style={{ color: '#3B2314' }}>Order #{activeOrder.id}</CardTitle>
                <p className="text-sm mt-1" style={{ color: '#3B2314', opacity: 0.6 }}>
                  Placed at {activeOrder.placedAt}
                </p>
              </div>
              <Badge
                className="border-0"
                style={{
                  backgroundColor:
                    activeOrder.status === 'delivered' ? '#4CAF7D' :
                    activeOrder.status === 'out-for-delivery' ? '#F0A500' :
                    '#3B2314',
                  color: 'white'
                }}
              >
                {activeOrder.status === 'out-for-delivery' ? 'Out for Delivery' :
                 activeOrder.status.charAt(0).toUpperCase() + activeOrder.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm mb-2">
                <span style={{ color: '#3B2314', opacity: 0.6 }}>Progress</span>
                <span style={{ color: '#F0A500', fontWeight: 600 }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="relative">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.key} className="relative">
                    {index > 0 && (
                      <div
                        className="absolute left-5 -top-6 w-0.5 h-6"
                        style={{
                          backgroundColor: isCompleted ? '#4CAF7D' : '#3B2314',
                          opacity: isCompleted ? 1 : 0.2
                        }}
                      />
                    )}
                    <div className="flex items-center gap-4 py-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          backgroundColor: isCompleted ? '#4CAF7D' : isCurrent ? '#F0A500' : '#3B2314',
                          opacity: isCompleted || isCurrent ? 1 : 0.2
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ color: 'white' }} />
                      </div>
                      <div className="flex-1">
                        <p
                          className="text-base"
                          style={{
                            color: '#3B2314',
                            fontWeight: isCurrent ? 600 : 400,
                            opacity: isCompleted || isCurrent ? 1 : 0.5
                          }}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm mt-1" style={{ color: '#F0A500' }}>
                            In progress...
                          </p>
                        )}
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#4CAF7D' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-md" style={{ backgroundColor: '#F0A500', opacity: 0.15 }}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4" style={{ color: '#3B2314' }} />
                <span className="text-sm" style={{ color: '#3B2314', fontWeight: 600 }}>
                  Estimated Delivery
                </span>
              </div>
              <p className="text-lg" style={{ color: '#3B2314', fontWeight: 600 }}>
                {activeOrder.estimatedTime}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
          <CardHeader>
            <CardTitle style={{ color: '#3B2314' }}>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm mb-2" style={{ color: '#3B2314', opacity: 0.6 }}>
                Branch
              </p>
              <p style={{ color: '#3B2314', fontWeight: 600 }}>
                {activeOrder.branchName}
              </p>
            </div>

            <div>
              <p className="text-sm mb-2" style={{ color: '#3B2314', opacity: 0.6 }}>
                Items ({activeOrder.items.length})
              </p>
              <div className="space-y-1">
                {activeOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" style={{ color: '#F0A500' }} />
                    <span style={{ color: '#3B2314' }}>
                      {item.name} × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#3B2314]/10">
              <div className="flex justify-between">
                <span style={{ color: '#3B2314', fontWeight: 600 }}>Total</span>
                <span style={{ color: '#F0A500', fontWeight: 600 }}>
                  ₦{activeOrder.total.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
