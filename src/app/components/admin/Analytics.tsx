import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart, DollarSign, TrendingUp, TrendingDown,
  Building2, CheckCircle2, XCircle, Star, Zap, Clock,
  Award, BarChart2, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { toast } from "sonner";
import {
  getAdminOverview,
  getBranchComparison,
  getAdminTrends,
  getAdminOperational,
  getAdminPopularItems,
  type AdminOverview,
  type BranchComparison,
  type AdminTrends,
  type AdminOperational,
  type AdminPopularItem,
} from "@/services/api";

// ── Date helpers ──────────────────────────────────────────────────────────────

type Range = 'Today' | 'This Week' | 'This Month';
type Interval = 'DAY' | 'WEEK' | 'MONTH';

function getDateParams(range: Range): { startDate: string; endDate: string } {
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

function rangeToInterval(range: Range): Interval {
  if (range === 'This Month') return 'DAY';
  if (range === 'This Week') return 'DAY';
  return 'DAY';
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtRevenue(v: number): string {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(1)}k`;
  return `₦${v.toLocaleString()}`;
}

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'var(--sage-green)',
  CANCELLED: 'var(--burnt-orange)',
  PREPARING: 'var(--golden-amber)',
  RECEIVED: '#6B7280',
  CONFIRMED: '#3B82F6',
  READY: '#8B5CF6',
  PICKED_UP: '#14B8A6',
  SERVED: '#F59E0B',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function RangeButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <Button
      variant={selected ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className="transition-all"
      style={selected
        ? { backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }
        : { borderColor: 'var(--espresso)', color: 'var(--espresso)', opacity: 0.6 }}
    >
      {label}
    </Button>
  );
}

function KpiCard({
  title, value, subtitle, icon: Icon, iconColor, trend, trendLabel,
}: {
  title: string; value: string; subtitle?: string;
  icon: React.ElementType; iconColor: string;
  trend?: number; trendLabel?: string;
}) {
  const positive = trend === undefined || trend >= 0;
  return (
    <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.7 }}>{title}</CardTitle>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: iconColor, opacity: 0.15 }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold mb-1" style={{ color: 'var(--espresso)' }}>{value}</div>
        {subtitle && <p className="text-xs mb-1" style={{ color: 'var(--espresso)', opacity: 0.5 }}>{subtitle}</p>}
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-xs mt-1">
            {positive
              ? <TrendingUp className="w-3 h-3" style={{ color: 'var(--sage-green)' }} />
              : <TrendingDown className="w-3 h-3" style={{ color: 'var(--burnt-orange)' }} />}
            <span style={{ color: positive ? 'var(--sage-green)' : 'var(--burnt-orange)', fontWeight: 600 }}>
              {fmtPct(trend)}
            </span>
            <span style={{ color: 'var(--espresso)', opacity: 0.6 }}>{trendLabel ?? 'vs prior period'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div><Skeleton className="h-10 w-64 mb-2" /><Skeleton className="h-5 w-72" /></div>
          <div className="flex gap-2">
            {[1,2,3].map(i => <Skeleton key={i} className="h-9 w-24 rounded-md" />)}
          </div>
        </div>
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-3 mb-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <Skeleton className="h-[320px] w-full rounded-lg mb-6" />
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Analytics() {
  const [range, setRange] = useState<Range>('This Month');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [comparison, setComparison] = useState<BranchComparison[]>([]);
  const [trends, setTrends] = useState<AdminTrends | null>(null);
  const [operational, setOperational] = useState<AdminOperational | null>(null);
  const [popularItems, setPopularItems] = useState<AdminPopularItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async (r: Range) => {
    setIsLoading(true);
    setError('');
    try {
      const { startDate, endDate } = getDateParams(r);
      const interval = rangeToInterval(r);
      const [ov, comp, tr, op, pop] = await Promise.all([
        getAdminOverview(startDate, endDate),
        getBranchComparison(startDate, endDate),
        getAdminTrends(startDate, endDate, interval),
        getAdminOperational(startDate, endDate),
        getAdminPopularItems(startDate, endDate, 8),
      ]);
      setOverview(ov);
      setComparison(comp);
      setTrends(tr);
      setOperational(op);
      setPopularItems(pop);
    } catch {
      setError('Failed to load analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(range); }, [range, fetchAll]);

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="h-screen overflow-auto flex items-center justify-center" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--burnt-orange)' }}>{error}</p>
          <Button onClick={() => fetchAll(range)} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const sortedByRevenue = [...comparison].sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="p-6 sm:p-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-1" style={{ color: 'var(--espresso)' }}>
              Executive Dashboard
            </h1>
            <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
              Org-wide performance · {overview?.totalBranches ?? 0} branches
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['Today', 'This Week', 'This Month'] as Range[]).map(r => (
              <RangeButton key={r} label={r} selected={range === r} onClick={() => setRange(r)} />
            ))}
            <Button size="sm" variant="outline" onClick={() => fetchAll(range)}
              className="border-[var(--espresso)]/20 p-2"
              style={{ color: 'var(--espresso)' }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 6 KPI cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          <KpiCard
            title="Total Orders"
            value={(overview?.totalOrders ?? 0).toLocaleString()}
            icon={ShoppingCart}
            iconColor="var(--golden-amber)"
            trend={overview?.ordersGrowthPercent}
          />
          <KpiCard
            title="Total Revenue"
            value={fmtRevenue(overview?.totalRevenue ?? 0)}
            icon={DollarSign}
            iconColor="var(--sage-green)"
            trend={overview?.revenueGrowthPercent}
          />
          <KpiCard
            title="Avg Order Value"
            value={fmtRevenue(overview?.avgOrderValue ?? 0)}
            icon={BarChart2}
            iconColor="var(--espresso)"
          />
          <KpiCard
            title="Completion Rate"
            value={`${(overview?.completionRate ?? 0).toFixed(1)}%`}
            icon={CheckCircle2}
            iconColor="var(--sage-green)"
            subtitle={`Cancellation: ${(overview?.cancellationRate ?? 0).toFixed(1)}%`}
          />
          <KpiCard
            title="Revenue Growth"
            value={fmtPct(overview?.revenueGrowthPercent ?? 0)}
            icon={overview?.revenueGrowthPercent != null && overview.revenueGrowthPercent >= 0 ? TrendingUp : TrendingDown}
            iconColor={overview?.revenueGrowthPercent != null && overview.revenueGrowthPercent >= 0
              ? 'var(--sage-green)' : 'var(--burnt-orange)'}
            subtitle="vs prior period"
          />
          <KpiCard
            title="Orders Growth"
            value={fmtPct(overview?.ordersGrowthPercent ?? 0)}
            icon={overview?.ordersGrowthPercent != null && overview.ordersGrowthPercent >= 0 ? TrendingUp : TrendingDown}
            iconColor={overview?.ordersGrowthPercent != null && overview.ordersGrowthPercent >= 0
              ? 'var(--sage-green)' : 'var(--burnt-orange)'}
            subtitle="vs prior period"
          />
        </div>

        {/* Branch highlights */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {[
            { label: 'Top Revenue Branch', value: overview?.topPerformingBranch, icon: Award, color: 'var(--golden-amber)' },
            { label: 'Fastest Branch', value: overview?.fastestBranch, icon: Zap, color: 'var(--sage-green)' },
            { label: 'Slowest Branch', value: overview?.slowestBranch, icon: Clock, color: 'var(--burnt-orange)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: color, opacity: 0.15 }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs mb-0.5" style={{ color: 'var(--espresso)', opacity: 0.6 }}>{label}</p>
                  <p className="font-semibold truncate" style={{ color: 'var(--espresso)' }}>
                    {value ?? '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue trend chart */}
        {trends && trends.dataPoints.length > 0 && (
          <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--espresso)' }}>Revenue & Orders Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends.dataPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--espresso)" opacity={0.08} />
                    <XAxis dataKey="period" stroke="var(--espresso)" style={{ fontSize: '11px' }}
                      tickFormatter={v => v.length > 7 ? v.slice(5) : v} />
                    <YAxis yAxisId="rev" stroke="var(--espresso)" style={{ fontSize: '11px' }}
                      tickFormatter={v => fmtRevenue(v)} width={72} />
                    <YAxis yAxisId="ord" orientation="right" stroke="var(--espresso)" style={{ fontSize: '11px' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--espresso)', borderRadius: '8px' }}
                      formatter={(value: number, name: string) => [
                        name === 'Revenue' ? fmtRevenue(value) : value,
                        name,
                      ]}
                    />
                    <Legend wrapperStyle={{ paddingTop: '12px' }} iconType="circle" />
                    <Line yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue"
                      stroke="var(--golden-amber)" strokeWidth={2} dot={false} />
                    <Line yAxisId="ord" type="monotone" dataKey="orders" name="Orders"
                      stroke="var(--sage-green)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders by status + Popular items */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">

          {/* Orders by status */}
          {operational && operational.ordersByStatus.length > 0 && (
            <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--espresso)' }}>Orders by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={operational.ordersByStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ status, percentage }) => `${status} ${percentage.toFixed(0)}%`}
                        labelLine={false}
                      >
                        {operational.ordersByStatus.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94A3B8'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--espresso)', borderRadius: '8px' }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {operational.ordersByStatus.map(s => (
                    <div key={s.status} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[s.status] ?? '#94A3B8' }} />
                      <span className="text-xs" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
                        {s.status} ({s.count})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Popular items */}
          {popularItems.length > 0 && (
            <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: 'var(--espresso)' }}>
                  <Star className="w-4 h-4" style={{ color: 'var(--golden-amber)' }} />
                  Top Menu Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {popularItems.slice(0, 6).map((item, i) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-semibold flex-shrink-0 text-right"
                      style={{ color: i < 3 ? 'var(--golden-amber)' : 'var(--espresso)', opacity: i < 3 ? 1 : 0.4 }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--espresso)' }}>{item.name}</p>
                      <p className="text-xs" style={{ color: 'var(--espresso)', opacity: 0.5 }}>
                        {item.quantitySold} sold · {fmtRevenue(item.revenue)}
                      </p>
                    </div>
                    <div className="w-20 h-1.5 rounded-full overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: 'var(--espresso)', opacity: 0.1 }}>
                      <div className="h-full rounded-full"
                        style={{
                          width: `${(item.quantitySold / (popularItems[0]?.quantitySold || 1)) * 100}%`,
                          backgroundColor: 'var(--golden-amber)',
                          opacity: 1,
                        }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Branch comparison table */}
        {sortedByRevenue.length > 0 && (
          <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--espresso)' }}>
                <Building2 className="w-4 h-4" />
                Branch Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--espresso)', opacity: 0.1 }}>
                      {['Branch', 'Orders', 'Revenue', 'Avg Order', 'Completion', 'Cancellation', 'Avg Prep'].map(h => (
                        <th key={h} className="text-left py-3 px-2 font-medium"
                          style={{ color: 'var(--espresso)', opacity: 0.6 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByRevenue.map((b, i) => (
                      <tr key={b.branchId} className="border-b last:border-0"
                        style={{ borderColor: 'var(--espresso)' }}>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {i === 0 && <Badge className="text-xs px-1.5 py-0 h-5"
                              style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)', border: 'none' }}>
                              #1
                            </Badge>}
                            <span className="font-medium" style={{ color: 'var(--espresso)' }}>
                              {b.name ?? b.branchId}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2" style={{ color: 'var(--espresso)' }}>{b.totalOrders.toLocaleString()}</td>
                        <td className="py-3 px-2 font-medium" style={{ color: 'var(--sage-green)' }}>{fmtRevenue(b.totalRevenue)}</td>
                        <td className="py-3 px-2" style={{ color: 'var(--espresso)' }}>{fmtRevenue(b.avgOrderValue)}</td>
                        <td className="py-3 px-2">
                          <span className="font-medium" style={{ color: b.completionRate >= 80 ? 'var(--sage-green)' : 'var(--burnt-orange)' }}>
                            {b.completionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-medium" style={{ color: b.cancellationRate <= 10 ? 'var(--espresso)' : 'var(--burnt-orange)', opacity: b.cancellationRate <= 10 ? 0.7 : 1 }}>
                            {b.cancellationRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-2" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
                          {b.avgPreparationTimeMinutes != null ? `${b.avgPreparationTimeMinutes.toFixed(0)}m` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hourly heatmap */}
        {operational && operational.ordersByHour.length > 0 && (
          <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between" style={{ color: 'var(--espresso)' }}>
                <span>Orders by Hour</span>
                {operational.peakHour && (
                  <Badge className="text-xs"
                    style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)', border: 'none' }}>
                    Peak: {operational.peakHour}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operational.ordersByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--espresso)" opacity={0.08} />
                    <XAxis dataKey="hour" stroke="var(--espresso)" style={{ fontSize: '11px' }} />
                    <YAxis stroke="var(--espresso)" style={{ fontSize: '11px' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--espresso)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="orders" name="Orders" fill="var(--golden-amber)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!overview && !isLoading && (
          <div className="text-center py-16">
            <BarChart2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--espresso)', opacity: 0.3 }} />
            <p style={{ color: 'var(--espresso)', opacity: 0.5 }}>No analytics data for this period</p>
          </div>
        )}

      </div>
    </div>
  );
}
