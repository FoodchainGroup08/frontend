import { useState } from "react";
import { Calendar as CalendarIcon, DollarSign, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface HourlySalesData {
  hour: string;
  revenue: number;
  orders: number;
}

interface DailySalesProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

const mockHourlyData: HourlySalesData[] = [
  { hour: "9 AM", revenue: 12500, orders: 5 },
  { hour: "10 AM", revenue: 18000, orders: 7 },
  { hour: "11 AM", revenue: 24500, orders: 9 },
  { hour: "12 PM", revenue: 45000, orders: 18 },
  { hour: "1 PM", revenue: 62000, orders: 25 },
  { hour: "2 PM", revenue: 51000, orders: 21 },
  { hour: "3 PM", revenue: 28000, orders: 11 },
  { hour: "4 PM", revenue: 22000, orders: 9 },
  { hour: "5 PM", revenue: 31000, orders: 13 },
  { hour: "6 PM", revenue: 48000, orders: 19 },
  { hour: "7 PM", revenue: 35000, orders: 14 },
  { hour: "8 PM", revenue: 16000, orders: 6 }
];

export function DailySales({ selectedDate: initialDate, onDateChange }: DailySalesProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateChange?.(date);
    }
  };

  const totalRevenue = mockHourlyData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = mockHourlyData.reduce((sum, item) => sum + item.orders, 0);

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
              Daily Sales
            </h1>
            <p style={{ color: '#3B2314', opacity: 0.7 }}>
              Hourly breakdown of sales performance
            </p>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="border-[#3B2314]/20 gap-2"
                style={{ color: '#3B2314' }}
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
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-8">
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
              <div className="text-3xl" style={{ color: '#3B2314', fontWeight: 600 }}>
                ₦{totalRevenue.toLocaleString()}
              </div>
              <p className="text-sm mt-1" style={{ color: '#3B2314', opacity: 0.6 }}>
                For {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </p>
            </CardContent>
          </Card>

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
              <div className="text-3xl" style={{ color: '#3B2314', fontWeight: 600 }}>
                {totalOrders}
              </div>
              <p className="text-sm mt-1" style={{ color: '#3B2314', opacity: 0.6 }}>
                Average: ₦{Math.round(totalRevenue / totalOrders).toLocaleString()} per order
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
          <CardHeader>
            <CardTitle style={{ color: '#3B2314' }}>Hourly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockHourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3B2314" opacity={0.1} />
                  <XAxis
                    dataKey="hour"
                    stroke="#3B2314"
                    style={{ fontSize: '12px', fill: '#3B2314' }}
                  />
                  <YAxis
                    stroke="#3B2314"
                    style={{ fontSize: '12px', fill: '#3B2314' }}
                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF7F2',
                      border: '1px solid #3B2314',
                      borderRadius: '8px',
                      color: '#3B2314'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return [`₦${value.toLocaleString()}`, 'Revenue'];
                      if (name === 'orders') return [value, 'Orders'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="revenue" fill="#F0A500" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-2">
          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle style={{ color: '#3B2314' }}>Peak Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ color: '#3B2314' }}>Highest Revenue</span>
                <span style={{ color: '#F0A500', fontWeight: 600 }}>1 PM - ₦62,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: '#3B2314' }}>Most Orders</span>
                <span style={{ color: '#F0A500', fontWeight: 600 }}>1 PM - 25 orders</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: '#3B2314' }}>Lowest Activity</span>
                <span style={{ color: '#3B2314', fontWeight: 600, opacity: 0.6 }}>9 AM - ₦12,500</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle style={{ color: '#3B2314' }}>Order Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ color: '#3B2314' }}>Morning (9 AM - 12 PM)</span>
                <span style={{ color: '#3B2314', fontWeight: 600 }}>41 orders (29%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: '#3B2314' }}>Afternoon (12 PM - 5 PM)</span>
                <span style={{ color: '#3B2314', fontWeight: 600 }}>83 orders (58%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: '#3B2314' }}>Evening (5 PM - 9 PM)</span>
                <span style={{ color: '#3B2314', fontWeight: 600 }}>19 orders (13%)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
