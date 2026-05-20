import { getManagerHistory, type ManagerHistoryDay } from "@/services/api";
import { Calendar as CalendarIcon, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Skeleton } from "../ui/skeleton";

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
          <Button variant="outline" className="border-[var(--brown)]/20 gap-2" style={{ color: 'var(--brown)' }}>
            <CalendarIcon className="w-4 h-4" />
            {from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar mode="single" selected={from} onSelect={(d) => d && onFromChange(d)} initialFocus />
        </PopoverContent>
      </Popover>
      <span style={{ color: 'var(--brown)', opacity: 0.6 }}>to</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="border-[var(--brown)]/20 gap-2" style={{ color: 'var(--brown)' }}>
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
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
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
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="p-6 sm:p-8">
          <div className="flex justify-end mb-8">{dateRangePicker}</div>
          <div className="text-center">
            <p className="mb-4" style={{ color: 'var(--burnt-orange)' }}>{error}</p>
            <Button onClick={() => fetchHistory(from, to)} variant="outline" className="border-[var(--brown)]/20" style={{ color: 'var(--brown)' }}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl mb-2" style={{ color: 'var(--brown)', fontWeight: 600 }}>
              History
            </h1>
            <p style={{ color: 'var(--brown)', opacity: 0.7 }}>
              {history.length} days • {from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {dateRangePicker}
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-8">
          <Card className="border-[var(--brown)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm" style={{ color: 'var(--brown)', opacity: 0.7 }}>Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4" style={{ color: 'var(--sage-green)' }} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                ₦{totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--brown)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm" style={{ color: 'var(--brown)', opacity: 0.7 }}>Total Orders</CardTitle>
              <ShoppingCart className="w-4 h-4" style={{ color: 'var(--golden-amber)' }} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                {totalOrders.toLocaleString()}
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--brown)', opacity: 0.6 }}>
                {totalCancelled} cancelled
              </p>
            </CardContent>
          </Card>

          <Card className="border-[var(--brown)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm" style={{ color: 'var(--brown)', opacity: 0.7 }}>Completion Rate</CardTitle>
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--brown)' }} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                {completionRate}{typeof completionRate === 'string' ? '' : '%'}
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--brown)', opacity: 0.6 }}>
                {totalCompleted} completed
              </p>
            </CardContent>
          </Card>
        </div>

        {history.length === 0 ? (
          <Card className="border-[var(--brown)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardContent className="text-center py-16">
              <p style={{ color: 'var(--brown)', opacity: 0.6 }}>No data for this date range</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-[var(--brown)]/10 mb-6" style={{ backgroundColor: 'var(--white)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--brown)' }}>Daily Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--brown)" opacity={0.1} />
                      <XAxis dataKey="date" stroke="var(--brown)" style={{ fontSize: '11px' }} />
                      <YAxis
                        stroke="var(--brown)"
                        style={{ fontSize: '11px' }}
                        tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--brown)', borderRadius: '8px', color: 'var(--brown)' }}
                        formatter={(v: number) => [`₦${v.toLocaleString()}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="var(--golden-amber)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--brown)]/10" style={{ backgroundColor: 'var(--white)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--brown)' }}>Daily Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--brown)" opacity={0.1} />
                      <XAxis dataKey="date" stroke="var(--brown)" style={{ fontSize: '11px' }} />
                      <YAxis stroke="var(--brown)" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--brown)', borderRadius: '8px', color: 'var(--brown)' }}
                        formatter={(v: number) => [v, 'Orders']}
                      />
                      <Line dataKey="orders" stroke="var(--sage-green)" strokeWidth={2} dot={{ fill: 'var(--sage-green)', r: 3 }} />
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
