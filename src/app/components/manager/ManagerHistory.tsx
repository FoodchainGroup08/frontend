import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, TrendingUp, ShoppingCart, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { toast } from "sonner";
import { getManagerHistory, type ManagerHistoryDay } from "@/services/api";

function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: Date;
  to: Date;
  onFromChange: (d: Date) => void;
  onToChange: (d: Date) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="border-[var(--foodchain-espresso)]/20 gap-2" style={{ color: 'var(--foodchain-espresso)' }}>
            <CalendarIcon className="w-4 h-4" />
            {from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar mode="single" selected={from} onSelect={(d) => d && onFromChange(d)} initialFocus />
        </PopoverContent>
      </Popover>
      <span style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>to</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="border-[var(--foodchain-espresso)]/20 gap-2" style={{ color: 'var(--foodchain-espresso)' }}>
            <CalendarIcon className="w-4 h-4" />
            {to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar mode="single" selected={to} onSelect={(d) => d && onToChange(d)} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const defaultTo = new Date();
const defaultFrom = new Date(defaultTo);
defaultFrom.setDate(defaultFrom.getDate() - 29);

export function ManagerHistory() {
  const [from, setFrom] = useState<Date>(defaultFrom);
  const [to, setTo] = useState<Date>(defaultTo);
  const [history, setHistory] = useState<ManagerHistoryDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async (fromDate: Date, toDate: Date) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getManagerHistory(
        fromDate.toISOString().split('T')[0],
        toDate.toISOString().split('T')[0],
      );
      setHistory(data);
    } catch {
      setError("Failed to load history");
      toast.error("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(from, to);
  }, []);

  const handleFromChange = useCallback((d: Date) => {
    setFrom(d);
    fetchHistory(d, to);
  }, [to]);

  const handleToChange = useCallback((d: Date) => {
    setTo(d);
    fetchHistory(from, d);
  }, [from]);

  const totalRevenue = history.reduce((s, d) => s + d.totalRevenue, 0);
  const totalOrders = history.reduce((s, d) => s + d.totalOrders, 0);
  const totalCompleted = history.reduce((s, d) => s + d.completedOrders, 0);
  const totalCancelled = history.reduce((s, d) => s + d.cancelledOrders, 0);
  const completionRate = totalOrders > 0 ? ((totalCompleted / totalOrders) * 100).toFixed(1) : '—';

  const chartData = history.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: d.totalRevenue,
    orders: d.totalOrders,
  }));

  const dateRangePicker = (
    <DateRangePicker
      from={from}
      to={to}
      onFromChange={handleFromChange}
      onToChange={handleToChange}
    />
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
            {dateRangePicker}
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-8">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
          </div>
          <Skeleton className="h-[360px] w-full rounded-lg mb-6" />
          <Skeleton className="h-[360px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="p-6 sm:p-8">
          <div className="flex justify-end mb-8">{dateRangePicker}</div>
          <div className="text-center">
            <p className="mb-4" style={{ color: 'var(--foodchain-burnt-orange)' }}>{error}</p>
            <Button onClick={() => fetchHistory(from, to)} variant="outline" className="border-[var(--foodchain-espresso)]/20" style={{ color: 'var(--foodchain-espresso)' }}>
              Retry
            </Button>
          </div>
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
              History
            </h1>
            <p style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
              {history.length} days • {from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {dateRangePicker}
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-8">
          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4" style={{ color: 'var(--foodchain-sage-green)' }} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                ₦{totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>Total Orders</CardTitle>
              <ShoppingCart className="w-4 h-4" style={{ color: 'var(--foodchain-golden-amber)' }} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                {totalOrders.toLocaleString()}
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                {totalCancelled} cancelled
              </p>
            </CardContent>
          </Card>

          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>Completion Rate</CardTitle>
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--foodchain-espresso)' }} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                {completionRate}{typeof completionRate === 'string' ? '' : '%'}
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                {totalCompleted} completed
              </p>
            </CardContent>
          </Card>
        </div>

        {history.length === 0 ? (
          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardContent className="text-center py-16">
              <p style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>No data for this date range</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-[var(--foodchain-espresso)]/10 mb-6" style={{ backgroundColor: 'var(--foodchain-white)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--foodchain-espresso)' }}>Daily Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--foodchain-espresso)" opacity={0.1} />
                      <XAxis dataKey="date" stroke="var(--foodchain-espresso)" style={{ fontSize: '11px' }} />
                      <YAxis
                        stroke="var(--foodchain-espresso)"
                        style={{ fontSize: '11px' }}
                        tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--foodchain-warm-white)', border: '1px solid var(--foodchain-espresso)', borderRadius: '8px', color: 'var(--foodchain-espresso)' }}
                        formatter={(v: number) => [`₦${v.toLocaleString()}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="var(--foodchain-golden-amber)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--foodchain-espresso)' }}>Daily Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--foodchain-espresso)" opacity={0.1} />
                      <XAxis dataKey="date" stroke="var(--foodchain-espresso)" style={{ fontSize: '11px' }} />
                      <YAxis stroke="var(--foodchain-espresso)" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--foodchain-warm-white)', border: '1px solid var(--foodchain-espresso)', borderRadius: '8px', color: 'var(--foodchain-espresso)' }}
                        formatter={(v: number) => [v, 'Orders']}
                      />
                      <Line dataKey="orders" stroke="var(--foodchain-sage-green)" strokeWidth={2} dot={{ fill: 'var(--foodchain-sage-green)', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
