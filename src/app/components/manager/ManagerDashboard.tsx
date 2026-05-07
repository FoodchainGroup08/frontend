import { ShoppingCart, DollarSign, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersChange?: number;
  revenueChange?: number;
}

interface ManagerDashboardProps {
  stats?: DashboardStats;
}

const mockStats: DashboardStats = {
  totalOrders: 142,
  totalRevenue: 387500,
  averageOrderValue: 2729,
  ordersChange: 12,
  revenueChange: 8
};

export function ManagerDashboard({ stats = mockStats }: ManagerDashboardProps) {
  const statCards = [
    {
      title: "Today's Orders",
      value: stats.totalOrders,
      change: stats.ordersChange,
      icon: ShoppingCart,
      color: '#F0A500',
      format: (val: number) => val.toString()
    },
    {
      title: "Today's Revenue",
      value: stats.totalRevenue,
      change: stats.revenueChange,
      icon: DollarSign,
      color: '#4CAF7D',
      format: (val: number) => `₦${val.toLocaleString()}`
    },
    {
      title: "Average Order Value",
      value: stats.averageOrderValue,
      icon: TrendingUp,
      color: '#3B2314',
      format: (val: number) => `₦${val.toLocaleString()}`
    }
  ];

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
            Dashboard
          </h1>
          <p style={{ color: '#3B2314', opacity: 0.7 }}>
            Overview of today's performance • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.title} className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                    {stat.title}
                  </CardTitle>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: stat.color, opacity: 0.1 }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl mb-1" style={{ color: '#3B2314', fontWeight: 600 }}>
                    {stat.format(stat.value)}
                  </div>
                  {stat.change !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="w-4 h-4" style={{ color: '#4CAF7D' }} />
                      <span style={{ color: '#4CAF7D', fontWeight: 600 }}>
                        +{stat.change}%
                      </span>
                      <span style={{ color: '#3B2314', opacity: 0.6 }}>
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
          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle style={{ color: '#3B2314' }}>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: '#FAF7F2' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F0A500' }}>
                    <Clock className="w-5 h-5" style={{ color: '#1E1E1E' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>Average Prep Time</p>
                    <p className="text-lg" style={{ color: '#3B2314', fontWeight: 600 }}>12 mins</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: '#FAF7F2' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4CAF7D' }}>
                    <ShoppingCart className="w-5 h-5" style={{ color: 'white' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>Peak Hour Orders</p>
                    <p className="text-lg" style={{ color: '#3B2314', fontWeight: 600 }}>28 orders (1-2 PM)</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: '#FAF7F2' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3B2314' }}>
                    <TrendingUp className="w-5 h-5" style={{ color: '#FAF7F2' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>Completion Rate</p>
                    <p className="text-lg" style={{ color: '#3B2314', fontWeight: 600 }}>98.6%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle style={{ color: '#3B2314' }}>Order Type Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: '#3B2314' }}>Delivery</span>
                  <span className="text-sm" style={{ color: '#3B2314', fontWeight: 600 }}>65 orders (46%)</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#3B2314', opacity: 0.1 }}>
                  <div className="h-2 rounded-full" style={{ backgroundColor: '#F0A500', width: '46%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: '#3B2314' }}>Dine-In</span>
                  <span className="text-sm" style={{ color: '#3B2314', fontWeight: 600 }}>52 orders (37%)</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#3B2314', opacity: 0.1 }}>
                  <div className="h-2 rounded-full" style={{ backgroundColor: '#4CAF7D', width: '37%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: '#3B2314' }}>Takeaway</span>
                  <span className="text-sm" style={{ color: '#3B2314', fontWeight: 600 }}>25 orders (17%)</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#3B2314', opacity: 0.1 }}>
                  <div className="h-2 rounded-full" style={{ backgroundColor: '#3B2314', width: '17%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
