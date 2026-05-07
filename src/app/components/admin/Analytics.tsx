import { useState } from "react";
import { ShoppingCart, DollarSign, TrendingUp, Building2, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface BranchData {
  name: string;
  orders: number;
  revenue: number;
}

interface AnalyticsProps {
  dateRange?: string;
}

const mockBranchData: BranchData[] = [
  { name: "Victoria Island", orders: 342, revenue: 925000 },
  { name: "Lekki Phase 1", orders: 298, revenue: 812000 },
  { name: "Ikeja GRA", orders: 256, revenue: 687000 },
  { name: "Surulere", orders: 189, revenue: 512000 }
];

export function Analytics({ dateRange = "Today" }: AnalyticsProps) {
  const [selectedRange, setSelectedRange] = useState(dateRange);

  const totalOrders = mockBranchData.reduce((sum, branch) => sum + branch.orders, 0);
  const totalRevenue = mockBranchData.reduce((sum, branch) => sum + branch.revenue, 0);
  const busiestBranch = [...mockBranchData].sort((a, b) => b.orders - a.orders)[0];

  const kpiCards = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      color: '#F0A500',
      format: (val: number) => val.toString(),
      change: "+15%"
    },
    {
      title: "Total Revenue",
      value: totalRevenue,
      icon: DollarSign,
      color: '#4CAF7D',
      format: (val: number) => `₦${(val / 1000000).toFixed(2)}M`,
      change: "+12%"
    },
    {
      title: "Busiest Branch",
      value: busiestBranch.name,
      subtitle: `${busiestBranch.orders} orders`,
      icon: Building2,
      color: '#3B2314',
      format: (val: string) => val
    }
  ];

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
            <Button
              variant={selectedRange === "Today" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRange("Today")}
              className="transition-all"
              style={selectedRange === "Today" ? {
                backgroundColor: '#F0A500',
                color: '#1E1E1E'
              } : {
                borderColor: '#3B2314',
                color: '#3B2314',
                opacity: 0.6
              }}
            >
              Today
            </Button>
            <Button
              variant={selectedRange === "This Week" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRange("This Week")}
              className="transition-all"
              style={selectedRange === "This Week" ? {
                backgroundColor: '#F0A500',
                color: '#1E1E1E'
              } : {
                borderColor: '#3B2314',
                color: '#3B2314',
                opacity: 0.6
              }}
            >
              This Week
            </Button>
            <Button
              variant={selectedRange === "This Month" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRange("This Month")}
              className="transition-all"
              style={selectedRange === "This Month" ? {
                backgroundColor: '#F0A500',
                color: '#1E1E1E'
              } : {
                borderColor: '#3B2314',
                color: '#3B2314',
                opacity: 0.6
              }}
            >
              This Month
            </Button>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-8">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;

            return (
              <Card key={kpi.title} className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                    {kpi.title}
                  </CardTitle>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: kpi.color, opacity: 0.1 }}>
                    <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl mb-1" style={{ color: '#3B2314', fontWeight: 600 }}>
                    {kpi.format(kpi.value)}
                  </div>
                  {kpi.subtitle && (
                    <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                      {kpi.subtitle}
                    </p>
                  )}
                  {kpi.change && (
                    <div className="flex items-center gap-1 text-sm mt-1">
                      <TrendingUp className="w-4 h-4" style={{ color: '#4CAF7D' }} />
                      <span style={{ color: '#4CAF7D', fontWeight: 600 }}>
                        {kpi.change}
                      </span>
                      <span style={{ color: '#3B2314', opacity: 0.6 }}>
                        vs last period
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-[#3B2314]/10 mb-8" style={{ backgroundColor: 'white' }}>
          <CardHeader>
            <CardTitle style={{ color: '#3B2314' }}>Branch Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockBranchData}>
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
          {mockBranchData.map((branch) => (
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
                  <p style={{ color: '#3B2314', fontWeight: 600 }}>₦{Math.round(branch.revenue / branch.orders).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
