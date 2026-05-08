import { useEffect, useState } from "react";
import { ShoppingCart, DollarSign, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getManagerDashboard, type ManagerDashboard as DashboardData } from "@/services/api";
import { isNetworkError, DEMO_MANAGER_DASHBOARD } from "@/utils/demoData";

export function ManagerDashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getManagerDashboard();
      setStats(data);
    } catch (err: any) {
      if (isNetworkError(err)) {
        setStats(DEMO_MANAGER_DASHBOARD);
      } else {
        setError("Failed to load dashboard stats");
        toast.error("Failed to load dashboard stats");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="p-6 sm:p-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72 mb-8" />
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
          </div>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="p-6 sm:p-8 text-center">
          <p className="mb-4" style={{ color: 'var(--foodchain-burnt-orange)' }}>{error || "No data available"}</p>
          <Button onClick={fetchStats} variant="outline" className="border-[var(--foodchain-espresso)]/20" style={{ color: 'var(--foodchain-espresso)' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Orders",
      value: stats.totalOrders,
      change: stats.ordersChange,
      icon: ShoppingCart,
      color: 'var(--foodchain-golden-amber)',
      format: (val: number) => val.toString()
    },
    {
      title: "Today's Revenue",
      value: stats.totalRevenue,
      change: stats.revenueChange,
      icon: DollarSign,
      color: 'var(--foodchain-sage-green)',
      format: (val: number) => `₦${val.toLocaleString()}`
    },
    {
      title: "Average Order Value",
      value: stats.averageOrderValue,
      icon: TrendingUp,
      color: 'var(--foodchain-espresso)',
      format: (val: number) => `₦${val.toLocaleString()}`
    }
  ];

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl mb-2" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
            Overview of today's performance • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.title} className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                    {stat.title}
                  </CardTitle>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: stat.color, opacity: 0.1 }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl mb-1" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                    {stat.format(stat.value)}
                  </div>
                  {stat.change !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="w-4 h-4" style={{ color: 'var(--foodchain-sage-green)' }} />
                      <span style={{ color: 'var(--foodchain-sage-green)', fontWeight: 600 }}>
                        +{stat.change}%
                      </span>
                      <span style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                        vs yesterday
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--foodchain-espresso)' }}>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--foodchain-golden-amber)' }}>
                    <Clock className="w-5 h-5" style={{ color: 'var(--foodchain-charcoal)' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>Average Prep Time</p>
                    <p className="text-lg" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>12 mins</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--foodchain-sage-green)' }}>
                    <ShoppingCart className="w-5 h-5" style={{ color: 'var(--foodchain-white)' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>Peak Hour Orders</p>
                    <p className="text-lg" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>28 orders (1-2 PM)</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--foodchain-espresso)' }}>
                    <TrendingUp className="w-5 h-5" style={{ color: 'var(--foodchain-warm-white)' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>Completion Rate</p>
                    <p className="text-lg" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>98.6%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--foodchain-espresso)' }}>Order Type Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: 'var(--foodchain-espresso)' }}>Delivery</span>
                  <span className="text-sm" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>65 orders (46%)</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--foodchain-espresso)', opacity: 0.1 }}>
                  <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--foodchain-golden-amber)', width: '46%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: 'var(--foodchain-espresso)' }}>Dine-In</span>
                  <span className="text-sm" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>52 orders (37%)</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--foodchain-espresso)', opacity: 0.1 }}>
                  <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--foodchain-sage-green)', width: '37%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: 'var(--foodchain-espresso)' }}>Takeaway</span>
                  <span className="text-sm" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>25 orders (17%)</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--foodchain-espresso)', opacity: 0.1 }}>
                  <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--foodchain-espresso)', width: '17%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}