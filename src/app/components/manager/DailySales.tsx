import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, DollarSign, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { getDailySales, type HourlySales } from "@/services/api";
import { isNetworkError, DEMO_HOURLY_SALES } from "@/utils/demoData";

export function DailySales() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [hourlyData, setHourlyData] = useState<HourlySales[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async (date: Date) => {
    setIsLoading(true);
    setError("");
    try {
      const dateStr = date.toISOString().split('T')[0];
      const data = await getDailySales(dateStr);
      setHourlyData(data);
    } catch (err: any) {
      if (isNetworkError(err)) {
        setHourlyData(DEMO_HOURLY_SALES);
      } else {
        setError("Failed to load daily sales");
        toast.error("Failed to load daily sales");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) setSelectedDate(date);
  };

  const totalRevenue = hourlyData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = hourlyData.reduce((sum, item) => sum + item.orders, 0);

  const peakRevenue = hourlyData.length > 0 ? [...hourlyData].sort((a, b) => b.revenue - a.revenue)[0] : null;
  const peakOrders = hourlyData.length > 0 ? [...hourlyData].sort((a, b) => b.orders - a.orders)[0] : null;
  const lowestActivity = hourlyData.length > 0 ? [...hourlyData].sort((a, b) => a.revenue - b.revenue)[0] : null;

  const third = Math.ceil(hourlyData.length / 3);
  const morningOrders = hourlyData.slice(0, third).reduce((sum, h) => sum + h.orders, 0);
  const afternoonOrders = hourlyData.slice(third, third * 2).reduce((sum, h) => sum + h.orders, 0);
  const eveningOrders = hourlyData.slice(third * 2).reduce((sum, h) => sum + h.orders, 0);
  const distPercent = (n: number) => totalOrders > 0 ? Math.round((n / totalOrders) * 100) : 0;
  const morningLabel = hourlyData.length > 0 ? `${hourlyData[0]?.hour} - ${hourlyData[third - 1]?.hour ?? ''}` : '—';
  const afternoonLabel = hourlyData.length > 0 ? `${hourlyData[third]?.hour ?? ''} - ${hourlyData[third * 2 - 1]?.hour ?? ''}` : '—';
  const eveningLabel = hourlyData.length > 0 ? `${hourlyData[third * 2]?.hour ?? ''} - ${hourlyData[hourlyData.length - 1]?.hour ?? ''}` : '—';

  const datePickerButton = (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="border-[var(--foodchain-espresso)]/20 gap-2"
          style={{ color: 'var(--foodchain-espresso)' }}
        >
          <CalendarIcon className="w-4 h-4" />
          {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            {datePickerButton}
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-8">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
          <Skeleton className="h-[460px] w-full rounded-lg mb-6" />
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="p-6 sm:p-8 text-center">
          <p className="mb-4" style={{ color: 'var(--foodchain-burnt-orange)' }}>{error}</p>
          <Button onClick={() => fetchData(selectedDate)} variant="outline" className="border-[var(--foodchain-espresso)]/20" style={{ color: 'var(--foodchain-espresso)' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl mb-2" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
              Daily Sales
            </h1>
            <p style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
              Hourly breakdown of sales performance
            </p>
          </div>

          {datePickerButton}
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-8">
          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                Total Revenue
              </CardTitle>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--foodchain-sage-green)', opacity: 0.1 }}>
                <DollarSign className="w-4 h-4" style={{ color: 'var(--foodchain-sage-green)' }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                ₦{totalRevenue.toLocaleString()}
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                For {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                Total Orders
              </CardTitle>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--foodchain-golden-amber)', opacity: 0.1 }}>
                <ShoppingCart className="w-4 h-4" style={{ color: 'var(--foodchain-golden-amber)' }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                {totalOrders}
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                Average: ₦{totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : 0} per order
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--foodchain-espresso)' }}>Hourly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--foodchain-espresso)" opacity={0.1} />
                  <XAxis
                    dataKey="hour"
                    stroke="var(--foodchain-espresso)"
                    style={{ fontSize: '12px', fill: 'var(--foodchain-espresso)' }}
                  />
                  <YAxis
                    stroke="var(--foodchain-espresso)"
                    style={{ fontSize: '12px', fill: 'var(--foodchain-espresso)' }}
                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--foodchain-warm-white)',
                      border: '1px solid var(--foodchain-espresso)',
                      borderRadius: '8px',
                      color: 'var(--foodchain-espresso)'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return [`₦${value.toLocaleString()}`, 'Revenue'];
                      if (name === 'orders') return [value, 'Orders'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="revenue" fill="var(--foodchain-golden-amber)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-2">
          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--foodchain-espresso)' }}>Peak Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--foodchain-espresso)' }}>Highest Revenue</span>
                <span style={{ color: 'var(--foodchain-golden-amber)', fontWeight: 600 }}>
                  {peakRevenue ? `${peakRevenue.hour} - ₦${peakRevenue.revenue.toLocaleString()}` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--foodchain-espresso)' }}>Most Orders</span>
                <span style={{ color: 'var(--foodchain-golden-amber)', fontWeight: 600 }}>
                  {peakOrders ? `${peakOrders.hour} - ${peakOrders.orders} orders` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--foodchain-espresso)' }}>Lowest Activity</span>
                <span style={{ color: 'var(--foodchain-espresso)', fontWeight: 600, opacity: 0.6 }}>
                  {lowestActivity ? `${lowestActivity.hour} - ₦${lowestActivity.revenue.toLocaleString()}` : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--foodchain-espresso)' }}>Order Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--foodchain-espresso)' }}>Morning ({morningLabel})</span>
                <span style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>{morningOrders} orders ({distPercent(morningOrders)}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--foodchain-espresso)' }}>Afternoon ({afternoonLabel})</span>
                <span style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>{afternoonOrders} orders ({distPercent(afternoonOrders)}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--foodchain-espresso)' }}>Evening ({eveningLabel})</span>
                <span style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>{eveningOrders} orders ({distPercent(eveningOrders)}%)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}