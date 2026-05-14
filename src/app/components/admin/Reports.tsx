import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, RefreshCw, ChevronLeft, ChevronRight, Eye, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../ui/dialog";
import { toast } from "sonner";
import {
  generateReport, getReports, getReportById, getBranches,
  type GenerateReportRequest, type Report, type ReportListItem,
  type ReportType, type Branch,
} from "@/services/api";
import { downloadReportPdf, downloadReportXlsx } from "@/utils/reportExport";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRevenue(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(1)}k`;
  return `₦${v.toLocaleString()}`;
}

function fmtDate(s: string): string {
  try { return new Date(s).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return s; }
}

function fmtDateTime(s: string): string {
  try { return new Date(s).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return s; }
}

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  BRANCH_PERFORMANCE: 'Branch Performance',
  SALES_SUMMARY: 'Sales Summary',
  ORDER_SUMMARY: 'Order Summary',
};

const REPORT_TYPE_COLORS: Record<string, string> = {
  BRANCH_PERFORMANCE: 'var(--golden-amber)',
  SALES_SUMMARY: 'var(--sage-green)',
  ORDER_SUMMARY: 'var(--espresso)',
};

// ── Generate form ─────────────────────────────────────────────────────────────

function GenerateReportModal({
  open, onClose, branches, onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
  onGenerated: (report: Report) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const thirtyAgo = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

  const [reportType, setReportType] = useState<ReportType>('SALES_SUMMARY');
  const [branchId, setBranchId] = useState('');
  const [startDate, setStartDate] = useState(thirtyAgo);
  const [endDate, setEndDate] = useState(today);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!startDate || !endDate) { toast.error('Please select a date range'); return; }
    setIsLoading(true);
    try {
      const req: GenerateReportRequest = {
        reportType,
        branchId: branchId || null,
        startDate,
        endDate,
      };
      const result = await generateReport(req);
      toast.success('Report generated successfully');
      onGenerated(result);
      onClose();
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const labelStyle = { color: 'var(--espresso)', opacity: 0.7, fontSize: '13px', fontWeight: 500 };
  const inputStyle = {
    border: '1px solid var(--espresso)',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    color: 'var(--espresso)',
    backgroundColor: 'var(--warm-white)',
    width: '100%',
    outline: 'none',
    opacity: 0.8,
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md" style={{ backgroundColor: 'var(--warm-white)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--espresso)' }}>Generate Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">

          <div>
            <label className="block mb-1.5" style={labelStyle}>Report Type</label>
            <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)} style={inputStyle}>
              {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map(t => (
                <option key={t} value={t}>{REPORT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>Branch (leave blank for all branches)</label>
            <select value={branchId} onChange={e => setBranchId(e.target.value)} style={inputStyle}>
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5" style={labelStyle}>Start Date</label>
              <input type="date" value={startDate} max={endDate}
                onChange={e => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>End Date</label>
              <input type="date" value={endDate} min={startDate} max={today}
                onChange={e => setEndDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}
              style={{ borderColor: 'var(--espresso)', color: 'var(--espresso)', opacity: 0.7 }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}
              style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}>
              {isLoading ? 'Generating…' : 'Generate'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Report detail modal ───────────────────────────────────────────────────────

function ReportDetailModal({
  reportId, branches, onClose,
}: {
  reportId: number;
  branches: Branch[];
  onClose: () => void;
}) {
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getReportById(reportId)
      .then(setReport)
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setIsLoading(false));
  }, [reportId]);

  const row = (label: string, value: string) => (
    <div key={label} className="flex justify-between items-center py-2 border-b last:border-0"
      style={{ borderColor: 'var(--espresso)' }}>
      <span className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--espresso)' }}>{value}</span>
    </div>
  );

  const branchName = report?.branchId
    ? (branches.find(b => b.id === report.branchId)?.name ?? report.branchId)
    : 'All Branches';

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md" style={{ backgroundColor: 'var(--warm-white)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--espresso)' }}>Report Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2 mt-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : report ? (
          <>
            <div className="flex justify-end gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => downloadReportPdf(report, branchName)}
                className="h-8 border-[var(--espresso)]/20 gap-1"
                style={{ color: 'var(--espresso)' }}>
                <Download className="w-3.5 h-3.5" />
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadReportXlsx(report, branchName)}
                className="h-8 border-[var(--espresso)]/20 gap-1"
                style={{ color: 'var(--espresso)' }}>
                <Download className="w-3.5 h-3.5" />
                XLSX
              </Button>
            </div>
            <div className="mt-2 divide-y" style={{ borderColor: 'var(--espresso)' }}>
              {row('Type', REPORT_TYPE_LABELS[report.reportType as ReportType] ?? report.reportType)}
              {row('Period', `${fmtDate(report.startDate)} → ${fmtDate(report.endDate)}`)}
              {row('Generated', fmtDateTime(report.generatedAt))}
              {row('Branch', branchName)}
              {row('Total Orders', (report.totalOrders ?? 0).toLocaleString())}
              {row('Completed', (report.completedOrders ?? 0).toLocaleString())}
              {row('Cancelled', (report.cancelledOrders ?? 0).toLocaleString())}
              {row('Total Revenue', fmtRevenue(report.totalRevenue))}
              {row('Avg Order Value', fmtRevenue(report.avgOrderValue))}
              {row('Completion Rate', `${report.completionRate.toFixed(1)}%`)}
              {row('Cancellation Rate', `${report.cancellationRate.toFixed(1)}%`)}
              {report.dineInCount != null && row('Dine-In', report.dineInCount.toLocaleString())}
              {report.takeawayCount != null && row('Takeaway', report.takeawayCount.toLocaleString())}
              {report.deliveryCount != null && row('Delivery', report.deliveryCount.toLocaleString())}
            </div>
          </>
        ) : (
          <p className="text-center py-8" style={{ color: 'var(--espresso)', opacity: 0.5 }}>Report not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Reports() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showGenerate, setShowGenerate] = useState(false);
  const [viewReportId, setViewReportId] = useState<number | null>(null);

  const fetchReports = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const result = await getReports(p);
      setReports(result.content);
      setTotalPages(result.totalPages);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(page); }, [page, fetchReports]);

  useEffect(() => {
    getBranches().then(setBranches).catch(() => {});
  }, []);

  const handleGenerated = () => {
    setPage(0);
    fetchReports(0);
  };

  const branchNameFor = (branchId: string | null | undefined) => branchId
    ? (branches.find(b => b.id === branchId)?.name ?? branchId)
    : 'All Branches';

  const downloadReport = async (reportId: number, format: 'pdf' | 'xlsx') => {
    try {
      const report = await getReportById(reportId);
      const branchName = branchNameFor(report.branchId);
      if (format === 'pdf') downloadReportPdf(report, branchName);
      else downloadReportXlsx(report, branchName);
    } catch {
      toast.error(`Failed to download ${format.toUpperCase()} report`);
    }
  };

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="p-6 sm:p-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-1" style={{ color: 'var(--espresso)' }}>Reports</h1>
            <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
              Generate and download business performance reports
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => fetchReports(page)}
              className="border-[var(--espresso)]/20 p-2" style={{ color: 'var(--espresso)' }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => setShowGenerate(true)}
              className="gap-2" style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}>
              <Plus className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Reports list */}
        <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--espresso)' }}>
              <FileText className="w-4 h-4" />
              Generated Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--espresso)', opacity: 0.3 }} />
                <p className="mb-4" style={{ color: 'var(--espresso)', opacity: 0.5 }}>No reports generated yet</p>
                <Button size="sm" onClick={() => setShowGenerate(true)}
                  style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}>
                  Generate your first report
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--espresso)', opacity: 0.1 }}>
                      {['Type', 'Branch', 'Period', 'Revenue', 'Orders', 'Generated', ''].map(h => (
                        <th key={h} className="text-left py-3 px-4 font-medium"
                          style={{ color: 'var(--espresso)', opacity: 0.6 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-[var(--espresso)]/3 transition-colors"
                        style={{ borderColor: 'var(--espresso)' }}>
                        <td className="py-3 px-4">
                          <Badge className="text-xs border-0 font-medium" style={{
                            backgroundColor: REPORT_TYPE_COLORS[r.reportType] ?? 'var(--espresso)',
                            color: 'white',
                            opacity: 1,
                          }}>
                            {REPORT_TYPE_LABELS[r.reportType as ReportType] ?? r.reportType}
                          </Badge>
                        </td>
                        <td className="py-3 px-4" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
                          {branchNameFor(r.branchId)}
                        </td>
                        <td className="py-3 px-4 text-xs" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
                          {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
                        </td>
                        <td className="py-3 px-4 font-medium" style={{ color: 'var(--sage-green)' }}>
                          {fmtRevenue(r.totalRevenue)}
                        </td>
                        <td className="py-3 px-4" style={{ color: 'var(--espresso)' }}>
                          {r.totalOrders?.toLocaleString() ?? '—'}
                        </td>
                        <td className="py-3 px-4 text-xs" style={{ color: 'var(--espresso)', opacity: 0.5 }}>
                          {fmtDateTime(r.generatedAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setViewReportId(r.id)}
                            className="h-7 px-2 border-[var(--espresso)]/20 gap-1"
                            style={{ color: 'var(--espresso)' }}>
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => downloadReport(r.id, 'pdf')}
                            className="h-7 px-2 border-[var(--espresso)]/20 gap-1"
                            style={{ color: 'var(--espresso)' }}>
                            PDF
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => downloadReport(r.id, 'xlsx')}
                            className="h-7 px-2 border-[var(--espresso)]/20 gap-1"
                            style={{ color: 'var(--espresso)' }}>
                            XLSX
                          </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'var(--espresso)', opacity: 0.1 }}>
                <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.5 }}>
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="border-[var(--espresso)]/20 p-1.5" style={{ color: 'var(--espresso)' }}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                    className="border-[var(--espresso)]/20 p-1.5" style={{ color: 'var(--espresso)' }}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Modals */}
      {showGenerate && (
        <GenerateReportModal
          open={showGenerate}
          onClose={() => setShowGenerate(false)}
          branches={branches}
          onGenerated={handleGenerated}
        />
      )}
      {viewReportId != null && (
        <ReportDetailModal reportId={viewReportId} branches={branches} onClose={() => setViewReportId(null)} />
      )}
    </div>
  );
}
