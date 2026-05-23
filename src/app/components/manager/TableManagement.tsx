import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  getTablesByBranch,
  addTable,
  deleteTable,
  updateTableStatus,
  type BranchTableDetail,
} from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const STATUS_STYLES: Record<BranchTableDetail['status'], { bg: string; text: string; label: string }> = {
  AVAILABLE: { bg: 'var(--sage-green)',  text: '#fff',             label: 'Available' },
  OCCUPIED:  { bg: 'var(--espresso)',    text: 'var(--warm-white)', label: 'Occupied' },
  RESERVED:  { bg: 'var(--golden-amber)', text: 'var(--charcoal)', label: 'Reserved' },
};

export function TableManagement() {
  const { user } = useAuth();
  const branchId = user?.branchId ?? '';

  const [tables, setTables]       = useState<BranchTableDetail[]>([]);
  const [loading, setLoading]     = useState(true);
  const [addNumber, setAddNumber] = useState('');
  const [addCapacity, setAddCapacity] = useState('4');
  const [isAdding, setIsAdding]   = useState(false);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);

  const load = () => {
    if (!branchId) return;
    setLoading(true);
    getTablesByBranch(branchId)
      .then(data => setTables(data.sort((a, b) => Number(a.tableNumber) - Number(b.tableNumber))))
      .catch(() => toast.error('Failed to load tables'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [branchId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(addNumber, 10);
    const cap = parseInt(addCapacity, 10);
    if (!num || num < 1) return toast.error('Enter a valid table number');
    if (!cap || cap < 1) return toast.error('Enter a valid capacity');
    setIsAdding(true);
    try {
      const created = await addTable(branchId, { tableNumber: num, capacity: cap });
      setTables(prev => [...prev, created].sort((a, b) => Number(a.tableNumber) - Number(b.tableNumber)));
      setAddNumber('');
      setAddCapacity('4');
      toast.success(`Table ${num} added`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to add table');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (table: BranchTableDetail) => {
    if (!confirm(`Remove Table ${table.tableNumber}? This cannot be undone.`)) return;
    setDeletingId(table.id);
    try {
      await deleteTable(branchId, table.id);
      setTables(prev => prev.filter(t => t.id !== table.id));
      toast.success(`Table ${table.tableNumber} removed`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to remove table');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (table: BranchTableDetail, status: BranchTableDetail['status']) => {
    if (table.status === status) return;
    setUpdatingId(table.id);
    try {
      const updated = await updateTableStatus(branchId, table.id, status);
      setTables(prev => prev.map(t => t.id === updated.id ? updated : t));
      toast.success(`Table ${table.tableNumber} set to ${status.toLowerCase()}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = {
    AVAILABLE: tables.filter(t => t.status === 'AVAILABLE').length,
    OCCUPIED:  tables.filter(t => t.status === 'OCCUPIED').length,
    RESERVED:  tables.filter(t => t.status === 'RESERVED').length,
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--espresso)' }}>Table Management</h1>
        <button
          onClick={load}
          className="p-2 rounded-lg transition-opacity hover:opacity-70"
          style={{ color: 'var(--espresso)' }}
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {(Object.entries(counts) as [BranchTableDetail['status'], number][]).map(([status, count]) => {
          const s = STATUS_STYLES[status];
          return (
            <div key={status} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
              {count} {s.label}
            </div>
          );
        })}
        <div className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: 'color-mix(in srgb, var(--espresso) 10%, transparent)', color: 'var(--espresso)' }}>
          {tables.length} Total
        </div>
      </div>

      {/* Add table form */}
      <Card className="border-[var(--espresso)]/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--espresso)' }}>
            <Plus className="w-4 h-4" />
            Add New Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--espresso)', opacity: 0.7 }}>Table Number</label>
              <input
                type="number"
                min={1}
                value={addNumber}
                onChange={e => setAddNumber(e.target.value)}
                placeholder="e.g. 7"
                className="w-24 px-3 py-2 rounded-lg border-2 text-sm outline-none"
                style={{ borderColor: 'color-mix(in srgb, var(--espresso) 20%, transparent)', color: 'var(--espresso)', backgroundColor: 'transparent' }}
                required
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--espresso)', opacity: 0.7 }}>Capacity (seats)</label>
              <input
                type="number"
                min={1}
                max={20}
                value={addCapacity}
                onChange={e => setAddCapacity(e.target.value)}
                className="w-24 px-3 py-2 rounded-lg border-2 text-sm outline-none"
                style={{ borderColor: 'color-mix(in srgb, var(--espresso) 20%, transparent)', color: 'var(--espresso)', backgroundColor: 'transparent' }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' }}
            >
              <Plus className="w-4 h-4" />
              {isAdding ? 'Adding…' : 'Add Table'}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Tables grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: 'color-mix(in srgb, var(--espresso) 8%, transparent)' }} />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.5 }}>No tables yet — add your first table above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tables.map(table => {
            const s = STATUS_STYLES[table.status];
            const isProcessing = deletingId === table.id || updatingId === table.id;
            return (
              <div
                key={table.id}
                className="rounded-xl border-2 p-4 space-y-3 transition-opacity"
                style={{
                  borderColor: 'color-mix(in srgb, var(--espresso) 12%, transparent)',
                  backgroundColor: 'var(--white)',
                  opacity: isProcessing ? 0.6 : 1,
                }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold" style={{ color: 'var(--espresso)' }}>Table {table.tableNumber}</p>
                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                      <Users className="w-3 h-3" />
                      {table.capacity} seats
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>
                      {s.label}
                    </span>
                    <button
                      onClick={() => handleDelete(table)}
                      disabled={isProcessing}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                      style={{ color: 'var(--espresso)', opacity: 0.4 }}
                      title="Remove table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status override */}
                <div className="flex gap-1.5">
                  {(['AVAILABLE', 'OCCUPIED', 'RESERVED'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(table, st)}
                      disabled={isProcessing || table.status === st}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40"
                      style={{
                        backgroundColor: table.status === st ? STATUS_STYLES[st].bg : 'transparent',
                        borderColor: STATUS_STYLES[st].bg,
                        color: table.status === st ? STATUS_STYLES[st].text : 'var(--espresso)',
                      }}
                    >
                      {STATUS_STYLES[st].label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
