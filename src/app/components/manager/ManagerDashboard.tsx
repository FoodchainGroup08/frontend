import { getManagerDashboard, type ManagerDashboard as DashboardData } from "@/services/api";
import { Calendar as CalendarIcon, Clock, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Skeleton } from "../ui/skeleton";

function DatePicker({ date, onChange }: { date: Date | null; onChange: (d: Date | null) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-[var(--brown)]/20 gap-2" style={{ color: 'var(--brown)' }}>
          <CalendarIcon className="w-4 h-4" />
          {date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar mode="single" selected={date ?? undefined} onSelect={(d) => onChange(d ?? null)} initialFocus />
        {date && (
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => onChange(null)}>
              Back to Today
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function ManagerDashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchStats = async (date?: Date | null) => {
    setIsLoading(true);
    setError("");
    const dateStr = date ? date.toISOString().split('T')[0] : undefined;
    try {
      const data = await getManagerDashboard(dateStr);
      setStats(data);
    } catch {
      setError("Failed to load dashboard stats");
      toast.error("Failed to load dashboard stats");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = useCallback((date: Date | null) => {
    setSelectedDate(date);
    fetchStats(date);
  }, []);

  useEffect(() => {
    fetchStats(null);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-5 w-72" />
            </div>
            <DatePicker date={selectedDate} onChange={handleDateChange} />
          </div>
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
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="p-6 sm:p-8">
          <div className="flex justify-end mb-8">
            <DatePicker date={selectedDate} onChange={handleDateChange} />
          </div>
          <div className="text-center">
            <p className="mb-4" style={{ color: 'var(--burnt-orange)' }}>{error || "No data available"}</p>
            <Button onClick={() => fetchStats(selectedDate)} variant="outline" className="border-[var(--brown)]/20" style={{ color: 'var(--brown)' }}>
              Retry
            </Button>
          </div>
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
      color: 'var(--golden-amber)',
      format: (val: number) => val.toString()
    },
    {
      title: "Today's Revenue",
      value: stats.totalRevenue,
      change: stats.revenueChange,
      icon: DollarSign,
      color: 'var(--sage-green)',
      format: (val: number) => `₦${val.toLocaleString()}`
    },
    {
      title: "Average Order Value",
      value: stats.averageOrderValue,
      icon: TrendingUp,
      color: 'var(--brown)',
      format: (val: number) => `₦${val.toLocaleString()}`
    }
  ];

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl mb-2" style={{ color: 'var(--brown)', fontWeight: 600 }}>
              Dashboard
            </h1>
            <p style={{ color: 'var(--brown)', opacity: 0.7 }}>
              {selectedDate
                ? `Performance for ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                : `Today's performance • ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
            </p>
          </div>
          <DatePicker date={selectedDate} onChange={handleDateChange} />
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.title} className="border-[var(--brown)]/10" style={{ backgroundColor: 'var(--white)' }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm" style={{ color: 'var(--brown)', opacity: 0.7 }}>
                    {stat.title}
                  </CardTitle>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: stat.color, opacity: 0.1 }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl mb-1" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                    {stat.format(stat.value)}
                  </div>
                  {stat.change !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="w-4 h-4" style={{ color: 'var(--sage-green)' }} />
                      <span style={{ color: 'var(--sage-green)', fontWeight: 600 }}>
                        +{stat.change}%
                      </span>
                      <span style={{ color: 'var(--brown)', opacity: 0.6 }}>
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
          <Card className="border-[var(--brown)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--brown)' }}>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: 'var(--warm-white)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--golden-amber)' }}>
                    <Clock className="w-5 h-5" style={{ color: 'var(--charcoal)' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--brown)', opacity: 0.7 }}>Average Prep Time</p>
                    <p className="text-lg" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                      {stats.averagePrepTime != null ? `${stats.averagePrepTime} mins` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: 'var(--warm-white)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--sage-green)' }}>
                    <ShoppingCart className="w-5 h-5" style={{ color: 'var(--white)' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--brown)', opacity: 0.7 }}>Peak Hour Orders</p>
                    <p className="text-lg" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                      {stats.peakHourOrders != null && stats.peakHour
                        ? `${stats.peakHourOrders} orders (${stats.peakHour})`
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: 'var(--warm-white)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brown)' }}>
                    <TrendingUp className="w-5 h-5" style={{ color: 'var(--warm-white)' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--brown)', opacity: 0.7 }}>Completion Rate</p>
                    <p className="text-lg" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                      {stats.completionRate != null ? `${stats.completionRate}%` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--brown)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--brown)' }}>Order Type Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const delivery = stats.deliveryCount ?? 0;
                const dineIn = stats.dineInCount ?? 0;
                const takeaway = stats.takeawayCount ?? 0;
                const total = delivery + dineIn + takeaway;
                const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
                const hasData = total > 0;

                return (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm" style={{ color: 'var(--brown)' }}>Delivery</span>
                        <span className="text-sm" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                          {hasData ? `${delivery} orders (${pct(delivery)}%)` : '—'}
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full" style={{ backgroundColor: 'rgba(59,35,20,0.12)' }}>
                        <div className="h-3 rounded-full" style={{ backgroundColor: 'var(--golden-amber)', width: `${pct(delivery)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm" style={{ color: 'var(--brown)' }}>Dine-In</span>
                        <span className="text-sm" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                          {hasData ? `${dineIn} orders (${pct(dineIn)}%)` : '—'}
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full" style={{ backgroundColor: 'rgba(59,35,20,0.12)' }}>
                        <div className="h-3 rounded-full" style={{ backgroundColor: 'var(--sage-green)', width: `${pct(dineIn)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm" style={{ color: 'var(--brown)' }}>Takeaway</span>
                        <span className="text-sm" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                          {hasData ? `${takeaway} orders (${pct(takeaway)}%)` : '—'}
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full" style={{ backgroundColor: 'rgba(59,35,20,0.12)' }}>
                        <div className="h-3 rounded-full" style={{ backgroundColor: 'var(--brown)', width: `${pct(takeaway)}%` }} />
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}