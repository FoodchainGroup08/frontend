import { getPopularItems, type PopularItem } from "@/services/api";
import { Award, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
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

export function PopularItems() {
  const [items, setItems] = useState<PopularItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchItems = async (date?: Date | null) => {
    setIsLoading(true);
    setError("");
    const dateStr = date ? date.toISOString().split('T')[0] : undefined;
    try {
      const data = await getPopularItems(dateStr);
      setItems(data);
    } catch {
      setError("Failed to load popular items");
      toast.error("Failed to load popular items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = useCallback((date: Date | null) => {
    setSelectedDate(date);
    fetchItems(date);
  }, []);

  useEffect(() => {
    fetchItems(null);
  }, []);

  const sortedByQuantity = [...items].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 8);

  const chartData = sortedByQuantity.map(item => ({
    name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
    quantity: item.quantitySold
  }));

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
          <Skeleton className="h-[460px] w-full rounded-lg mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="p-6 sm:p-8">
          <div className="flex justify-end mb-8">
            <DatePicker date={selectedDate} onChange={handleDateChange} />
          </div>
          <div className="text-center">
            <p className="mb-4" style={{ color: 'var(--burnt-orange)' }}>{error}</p>
            <Button onClick={() => fetchItems(selectedDate)} variant="outline" className="border-[var(--brown)]/20" style={{ color: 'var(--brown)' }}>
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
              Popular Items
            </h1>
            <p style={{ color: 'var(--brown)', opacity: 0.7 }}>
              Top-selling items {selectedDate
                ? `for ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                : 'today'}
            </p>
          </div>
          <DatePicker date={selectedDate} onChange={handleDateChange} />
        </div>

        <Card className="border-[var(--brown)]/10 mb-8" style={{ backgroundColor: 'var(--white)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--brown)' }}>Top Items by Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--brown)" opacity={0.1} />
                  <XAxis
                    type="number"
                    stroke="var(--brown)"
                    style={{ fontSize: '12px', fill: 'var(--brown)' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--brown)"
                    style={{ fontSize: '12px', fill: 'var(--brown)' }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--warm-white)',
                      border: '1px solid var(--brown)',
                      borderRadius: '8px',
                      color: 'var(--brown)'
                    }}
                    formatter={(value: number) => [value, 'Quantity Sold']}
                  />
                  <Bar dataKey="quantity" fill="var(--golden-amber)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {sortedByQuantity.map((item, index) => (
            <Card key={item.id} className="border-[var(--brown)]/10" style={{ backgroundColor: 'var(--white)' }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: index === 0 ? 'var(--golden-amber)' : index === 1 ? 'var(--sage-green)' : index === 2 ? 'var(--brown)' : 'var(--brown)',
                      opacity: index > 2 ? 0.5 : 1
                    }}
                  >
                    <span className="text-xl" style={{ color: 'var(--warm-white)', fontWeight: 600 }}>
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg truncate" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                        {item.name}
                      </h3>
                      {index === 0 && (
                        <Award className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--golden-amber)' }} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="border-0 text-xs" style={{ backgroundColor: 'var(--brown)', color: 'var(--warm-white)', opacity: 0.7 }}>
                        {item.category}
                      </Badge>
                      {item.trend !== 0 && (
                        <div className={`flex items-center gap-1 text-xs ${item.trend > 0 ? '' : 'opacity-60'}`}>
                          <TrendingUp className="w-3 h-3" style={{ color: item.trend > 0 ? 'var(--sage-green)' : 'var(--burnt-orange)' }} />
                          <span style={{ color: item.trend > 0 ? 'var(--sage-green)' : 'var(--burnt-orange)', fontWeight: 600 }}>
                            {item.trend > 0 ? '+' : ''}{item.trend}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl mb-1" style={{ color: 'var(--golden-amber)', fontWeight: 600 }}>
                      {item.quantitySold}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--brown)', opacity: 0.6 }}>
                      sold
                    </p>
                  </div>

                  <div className="text-right hidden sm:block">
                    <p className="text-lg mb-1" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                      ₦{item.revenue.toLocaleString()}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--brown)', opacity: 0.6 }}>
                      revenue
                    </p>
                  </div>
                </div>

                <div className="mt-4 sm:hidden">
                  <div className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: 'var(--warm-white)' }}>
                    <span className="text-sm" style={{ color: 'var(--brown)', opacity: 0.7 }}>
                      Revenue
                    </span>
                    <span style={{ color: 'var(--brown)', fontWeight: 600 }}>
                      ₦{item.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-3">
          <Card className="border-[var(--brown)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: 'var(--brown)', opacity: 0.7 }}>
                Best Seller
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-1" style={{ color: 'var(--golden-amber)', fontWeight: 600 }}>
                {sortedByQuantity[0]?.name ?? '—'}
              </p>
              <p className="text-sm" style={{ color: 'var(--brown)', opacity: 0.6 }}>
                {sortedByQuantity[0]?.quantitySold ?? 0} units sold
              </p>
            </CardContent>
          </Card>

          <Card className="border-[var(--brown)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: 'var(--brown)', opacity: 0.7 }}>
                Highest Revenue Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-1" style={{ color: 'var(--sage-green)', fontWeight: 600 }}>
                {[...items].sort((a, b) => b.revenue - a.revenue)[0]?.name ?? '—'}
              </p>
              <p className="text-sm" style={{ color: 'var(--brown)', opacity: 0.6 }}>
                ₦{([...items].sort((a, b) => b.revenue - a.revenue)[0]?.revenue ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[var(--brown)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: 'var(--brown)', opacity: 0.7 }}>
                Fastest Growing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-1" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                {[...items].sort((a, b) => b.trend - a.trend)[0]?.name ?? '—'}
              </p>
              <p className="text-sm flex items-center gap-1" style={{ color: 'var(--sage-green)' }}>
                <TrendingUp className="w-4 h-4" />
                +{[...items].sort((a, b) => b.trend - a.trend)[0]?.trend ?? 0}% growth
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}