import { useState, useEffect } from "react";
import { ShoppingCart, DollarSign, TrendingUp, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import {
  getAnalytics,
  getBranchAnalytics,
  type Analytics as AnalyticsData,
  type BranchAnalytics,
} from "@/services/api";

function getDateParams(range: string): { startDate?: string; endDate?: string } {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  if (range === 'This Week') {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { startDate: start.toISOString().split('T')[0], endDate };
  }
  if (range === 'This Month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: start.toISOString().split('T')[0], endDate };
  }
  return { startDate: endDate, endDate };
}

export function Analytics() {
  const [selectedRange, setSelectedRange] = useState("Today");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [branchData, setBranchData] = useState<BranchAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async (range: string) => {
    setIsLoading(true);
    setError("");
    try {
      const { startDate, endDate } = getDateParams(range);
      const [analyticsData, branchesData] = await Promise.all([
        getAnalytics(startDate, endDate),
        getBranchAnalytics(startDate, endDate),
      ]);
      setAnalytics(analyticsData);
      setBranchData(branchesData);
    } catch {
      setError("Failed to load analytics");
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedRange);
  }, [selectedRange]);

  const totalOrders = analytics?.totalOrders ?? 0;
  const totalRevenue = analytics?.totalRevenue ?? 0;
  const busiestBranch = branchData.length > 0 ? [...branchData].sort((a, b) => b.orders - a.orders)[0] : null;

  const rangeButton = (label: string) => (
    <Button
      key={label}
      variant={selectedRange === label ? "default" : "outline"}
      size="sm"
      onClick={() => setSelectedRange(label)}
      className="transition-all"
      style={selectedRange === label ? {
        backgroundColor: '#F0A500',
        color: '#1E1E1E'
      } : {
        borderColor: '#3B2314',
        color: '#3B2314',
        opacity: 0.6
      }}
    >
      {label}
    </Button>
  );

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-72" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-8">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
          </div>
          <Skeleton className="h-[460px] w-full rounded-lg mb-8" />
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
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
          <Button onClick={() => fetchData(selectedRange)} variant="outline" className="border-[#3B2314]/20" style={{ color: '#3B2314' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
              Cross-Branch Analytics
            </h1>
            <p style={{ color: '#3B2314', opacity: 0.7 }}>
              Performance overview across all branches
            </p>
          </div>

          <div className="flex items-center gap-2">
            {rangeButton("Today")}
            {rangeButton("This Week")}
            {rangeButton("This Month")}
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-8">
          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                Total Orders
              </CardTitle>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F0A500', opacity: 0.1 }}>
                <ShoppingCart className="w-4 h-4" style={{ color: '#F0A500' }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl mb-1" style={{ color: '#3B2314', fontWeight: 600 }}>
                {totalOrders}
              </div>
              {analytics?.ordersChange !== undefined && (
                <div className="flex items-center gap-1 text-sm mt-1">
                  <TrendingUp className="w-4 h-4" style={{ color: '#4CAF7D' }} />
                  <span style={{ color: '#4CAF7D', fontWeight: 600 }}>+{analytics.ordersChange}%</span>
                  <span style={{ color: '#3B2314', opacity: 0.6 }}>vs last period</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                Total Revenue
              </CardTitle>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4CAF7D', opacity: 0.1 }}>
                <DollarSign className="w-4 h-4" style={{ color: '#4CAF7D' }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl mb-1" style={{ color: '#3B2314', fontWeight: 600 }}>
                ₦{(totalRevenue / 1000000).toFixed(2)}M
              </div>
              {analytics?.revenueChange !== undefined && (
                <div className="flex items-center gap-1 text-sm mt-1">
                  <TrendingUp className="w-4 h-4" style={{ color: '#4CAF7D' }} />
                  <span style={{ color: '#4CAF7D', fontWeight: 600 }}>+{analytics.revenueChange}%</span>
                  <span style={{ color: '#3B2314', opacity: 0.6 }}>vs last period</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                Busiest Branch
              </CardTitle>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3B2314', opacity: 0.1 }}>
                <Building2 className="w-4 h-4" style={{ color: '#3B2314' }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl mb-1" style={{ color: '#3B2314', fontWeight: 600 }}>
                {busiestBranch?.name ?? '—'}
              </div>
              {busiestBranch && (
                <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                  {busiestBranch.orders} orders
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#3B2314]/10 mb-8" style={{ backgroundColor: 'white' }}>
          <CardHeader>
            <CardTitle style={{ color: '#3B2314' }}>Branch Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3B2314" opacity={0.1} />
                  <XAxis
                    dataKey="name"
                    stroke="#3B2314"
                    style={{ fontSize: '12px', fill: '#3B2314' }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#3B2314"
                    style={{ fontSize: '12px', fill: '#3B2314' }}
                    label={{ value: 'Orders', angle: -90, position: 'insideLeft', style: { fill: '#3B2314' } }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#3B2314"
                    style={{ fontSize: '12px', fill: '#3B2314' }}
                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                    label={{ value: 'Revenue', angle: 90, position: 'insideRight', style: { fill: '#3B2314' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF7F2',
                      border: '1px solid #3B2314',
                      borderRadius: '8px',
                      color: '#3B2314'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'Orders') return [value, 'Orders'];
                      if (name === 'Revenue') return [`₦${value.toLocaleString()}`, 'Revenue'];
                      return [value, name];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar yAxisId="left" dataKey="orders" fill="#F0A500" name="Orders" radius={[8, 8, 0, 0]} />
                  <Bar yAxisId="right" dataKey="revenue" fill="#4CAF7D" name="Revenue" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {branchData.map((branch) => (
            <Card key={branch.name} className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
              <CardHeader>
                <CardTitle className="text-base" style={{ color: '#3B2314' }}>{branch.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm mb-1" style={{ color: '#3B2314', opacity: 0.6 }}>Orders</p>
                  <p className="text-2xl" style={{ color: '#F0A500', fontWeight: 600 }}>{branch.orders}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: '#3B2314', opacity: 0.6 }}>Revenue</p>
                  <p className="text-xl" style={{ color: '#4CAF7D', fontWeight: 600 }}>₦{branch.revenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: '#3B2314', opacity: 0.6 }}>Avg Order Value</p>
                  <p style={{ color: '#3B2314', fontWeight: 600 }}>
                    ₦{branch.orders > 0 ? Math.round(branch.revenue / branch.orders).toLocaleString() : 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
