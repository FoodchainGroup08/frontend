import { useState, useEffect } from "react";
import { Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { getPopularItems, type PopularItem } from "@/services/api";

export function PopularItems() {
  const [items, setItems] = useState<PopularItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchItems = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getPopularItems();
      setItems(data);
    } catch {
      setError("Failed to load popular items");
      toast.error("Failed to load popular items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const sortedByQuantity = [...items].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 8);

  const chartData = sortedByQuantity.map(item => ({
    name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
    quantity: item.quantitySold
  }));

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="p-6 sm:p-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72 mb-8" />
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
      <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="p-6 sm:p-8 text-center">
          <p className="mb-4" style={{ color: '#E8622A' }}>{error}</p>
          <Button onClick={fetchItems} variant="outline" className="border-[#3B2314]/20" style={{ color: '#3B2314' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
            Popular Items
          </h1>
          <p style={{ color: '#3B2314', opacity: 0.7 }}>
            Top-selling menu items ranked by quantity sold today
          </p>
        </div>

        <Card className="border-[#3B2314]/10 mb-8" style={{ backgroundColor: 'white' }}>
          <CardHeader>
            <CardTitle style={{ color: '#3B2314' }}>Top Items by Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3B2314" opacity={0.1} />
                  <XAxis
                    type="number"
                    stroke="#3B2314"
                    style={{ fontSize: '12px', fill: '#3B2314' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#3B2314"
                    style={{ fontSize: '12px', fill: '#3B2314' }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF7F2',
                      border: '1px solid #3B2314',
                      borderRadius: '8px',
                      color: '#3B2314'
                    }}
                    formatter={(value: number) => [value, 'Quantity Sold']}
                  />
                  <Bar dataKey="quantity" fill="#F0A500" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {sortedByQuantity.map((item, index) => (
            <Card key={item.id} className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: index === 0 ? '#F0A500' : index === 1 ? '#4CAF7D' : index === 2 ? '#3B2314' : '#3B2314',
                      opacity: index > 2 ? 0.5 : 1
                    }}
                  >
                    <span className="text-xl" style={{ color: '#FAF7F2', fontWeight: 600 }}>
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg truncate" style={{ color: '#3B2314', fontWeight: 600 }}>
                        {item.name}
                      </h3>
                      {index === 0 && (
                        <Award className="w-5 h-5 flex-shrink-0" style={{ color: '#F0A500' }} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="border-0 text-xs" style={{ backgroundColor: '#3B2314', color: '#FAF7F2', opacity: 0.7 }}>
                        {item.category}
                      </Badge>
                      {item.trend !== 0 && (
                        <div className={`flex items-center gap-1 text-xs ${item.trend > 0 ? '' : 'opacity-60'}`}>
                          <TrendingUp className="w-3 h-3" style={{ color: item.trend > 0 ? '#4CAF7D' : '#E8622A' }} />
                          <span style={{ color: item.trend > 0 ? '#4CAF7D' : '#E8622A', fontWeight: 600 }}>
                            {item.trend > 0 ? '+' : ''}{item.trend}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl mb-1" style={{ color: '#F0A500', fontWeight: 600 }}>
                      {item.quantitySold}
                    </p>
                    <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                      sold
                    </p>
                  </div>

                  <div className="text-right hidden sm:block">
                    <p className="text-lg mb-1" style={{ color: '#3B2314', fontWeight: 600 }}>
                      ₦{item.revenue.toLocaleString()}
                    </p>
                    <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                      revenue
                    </p>
                  </div>
                </div>

                <div className="mt-4 sm:hidden">
                  <div className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: '#FAF7F2' }}>
                    <span className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                      Revenue
                    </span>
                    <span style={{ color: '#3B2314', fontWeight: 600 }}>
                      ₦{item.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-3">
          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                Best Seller
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-1" style={{ color: '#F0A500', fontWeight: 600 }}>
                {sortedByQuantity[0]?.name ?? '—'}
              </p>
              <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                {sortedByQuantity[0]?.quantitySold ?? 0} units sold
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                Highest Revenue Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-1" style={{ color: '#4CAF7D', fontWeight: 600 }}>
                {[...items].sort((a, b) => b.revenue - a.revenue)[0]?.name ?? '—'}
              </p>
              <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                ₦{([...items].sort((a, b) => b.revenue - a.revenue)[0]?.revenue ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                Fastest Growing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-1" style={{ color: '#3B2314', fontWeight: 600 }}>
                {[...items].sort((a, b) => b.trend - a.trend)[0]?.name ?? '—'}
              </p>
              <p className="text-sm flex items-center gap-1" style={{ color: '#4CAF7D' }}>
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
