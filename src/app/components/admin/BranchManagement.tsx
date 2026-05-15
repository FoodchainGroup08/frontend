import { useState, useEffect } from "react";
import { Plus, Edit, XCircle, MapPin, Search, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import {
  getBranches,
  createBranch,
  updateBranch,
  patchBranchStatus,
  getBranchHours,
  setBranchHours,
  type Branch as ApiBranch,
  type BranchHour,
} from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  description: string;
  managerId: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
  hours: string;
}

type HourEntry = { dayOfWeek: number; openTime: string; closeTime: string; closed: boolean };

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_HOURS: HourEntry[] = [
  { dayOfWeek: 0, openTime: '08:00', closeTime: '22:00', closed: false },
  { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00', closed: false },
  { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00', closed: false },
  { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00', closed: false },
  { dayOfWeek: 4, openTime: '08:00', closeTime: '22:00', closed: false },
  { dayOfWeek: 5, openTime: '10:00', closeTime: '20:00', closed: false },
  { dayOfWeek: 6, openTime: '00:00', closeTime: '00:00', closed: true  },
];

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapApiBranch(b: ApiBranch): Branch {
  return {
    id: b.id,
    name: b.name,
    address: b.address ?? '',
    phone: b.phone ?? '',
    description: b.description ?? '',
    managerId: b.managerId ?? '',
    latitude: b.latitude != null ? String(b.latitude) : '',
    longitude: b.longitude != null ? String(b.longitude) : '',
    isActive: b.isActive,
    hours: b.hours,
  };
}

function hoursFromApi(apiHours: BranchHour[]): HourEntry[] {
  if (!apiHours.length) return DEFAULT_HOURS.map(h => ({ ...h }));
  return DEFAULT_HOURS.map(def => {
    const found = apiHours.find(h => h.dayOfWeek === def.dayOfWeek);
    return found
      ? { dayOfWeek: found.dayOfWeek, openTime: found.openTime, closeTime: found.closeTime, closed: found.closed }
      : { ...def };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'hours'>('info');

  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', description: '', managerId: '',
    latitude: '', longitude: '', isActive: true,
  });
  const [hours, setHours] = useState<HourEntry[]>(DEFAULT_HOURS.map(h => ({ ...h })));

  // ─── Data fetching ───────────────────────────────────────────────────────────

  const fetchBranches = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getBranches();
      setBranches(data.map(mapApiBranch));
    } catch {
      setError("Failed to load branches");
      toast.error("Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  // ─── Modal open helpers ──────────────────────────────────────────────────────

  const handleAdd = () => {
    setEditingBranch(null);
    setFormData({ name: '', address: '', phone: '', description: '', managerId: '', latitude: '', longitude: '', isActive: true });
    setHours(DEFAULT_HOURS.map(h => ({ ...h })));
    setActiveTab('info');
    setIsModalOpen(true);
  };

  const handleEdit = async (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name, address: branch.address, phone: branch.phone,
      description: branch.description, managerId: branch.managerId,
      latitude: branch.latitude, longitude: branch.longitude, isActive: branch.isActive,
    });
    setActiveTab('info');
    setIsModalOpen(true);
    // Load existing hours in background
    try {
      const apiHours = await getBranchHours(branch.id);
      setHours(hoursFromApi(apiHours));
    } catch {
      setHours(DEFAULT_HOURS.map(h => ({ ...h })));
    }
  };

  // ─── Auto-geocode from address ───────────────────────────────────────────────

  const handleGeocode = async () => {
    if (!formData.address.trim()) { toast.error('Enter an address first'); return; }
    setIsGeolocating(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.address)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (data[0]) {
        setFormData(f => ({ ...f, latitude: String(parseFloat(data[0].lat).toFixed(6)), longitude: String(parseFloat(data[0].lon).toFixed(6)) }));
        toast.success('Coordinates found');
      } else {
        toast.error('Address not found — try a more specific address');
      }
    } catch {
      toast.error('Geocoding failed — enter coordinates manually');
    } finally {
      setIsGeolocating(false);
    }
  };

  // ─── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error('Branch name is required'); return; }
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone || undefined,
        description: formData.description || undefined,
        managerId: formData.managerId || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        isActive: formData.isActive,
      };

      let branchId: string;
      if (editingBranch) {
        const updated = await updateBranch(editingBranch.id, payload);
        branchId = editingBranch.id;
        setBranches(prev => prev.map(b => b.id === branchId ? mapApiBranch(updated) : b));
      } else {
        const created = await createBranch(payload);
        branchId = created.id;
        setBranches(prev => [...prev, mapApiBranch(created)]);
      }

      // Save hours after branch is created/updated
      try {
        await setBranchHours(branchId, hours.map(({ dayOfWeek, openTime, closeTime, closed }) => ({ dayOfWeek, openTime, closeTime, closed })));
      } catch {
        toast.error('Branch saved but failed to save hours — try editing the branch to retry');
      }

      toast.success(editingBranch ? 'Branch updated' : 'Branch created');
      setIsModalOpen(false);
    } catch {
      toast.error(editingBranch ? 'Failed to update branch' : 'Failed to create branch');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Activate / deactivate ───────────────────────────────────────────────────

  const handleToggleStatus = async (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;
    const newStatus = !branch.isActive;
    try {
      await patchBranchStatus(branchId, newStatus);
      setBranches(prev => prev.map(b => b.id === branchId ? { ...b, isActive: newStatus } : b));
      toast.success(`Branch ${newStatus ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update branch status');
    }
  };

  // ─── Map iframe URL ──────────────────────────────────────────────────────────

  const mapSrc = (() => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      const d = 0.008;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
    }
    return null;
  })();

  // ─── Loading / error states ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div><Skeleton className="h-10 w-56 mb-2" /><Skeleton className="h-5 w-64" /></div>
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="p-6 sm:p-8 text-center">
          <p className="mb-4" style={{ color: 'var(--burnt-orange)' }}>{error}</p>
          <Button onClick={fetchBranches} variant="outline" className="border-[var(--espresso)]/20" style={{ color: 'var(--espresso)' }}>Retry</Button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(branches.length / ITEMS_PER_PAGE);
  const paginated = branches.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl mb-2" style={{ color: 'var(--espresso)', fontWeight: 600 }}>Branch Management</h1>
            <p style={{ color: 'var(--espresso)', opacity: 0.7 }}>Manage all FoodChain restaurant branches</p>
          </div>
          <Button onClick={handleAdd} className="gap-2 transition-all hover:opacity-90" style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}>
            <Plus className="w-4 h-4" />Add Branch
          </Button>
        </div>

        <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--espresso)' }}>All Branches ({branches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ color: 'var(--espresso)', fontWeight: 600 }}>Branch Name</TableHead>
                    <TableHead style={{ color: 'var(--espresso)', fontWeight: 600 }}>Location</TableHead>
                    <TableHead style={{ color: 'var(--espresso)', fontWeight: 600 }}>Hours</TableHead>
                    <TableHead style={{ color: 'var(--espresso)', fontWeight: 600 }}>Status</TableHead>
                    <TableHead style={{ color: 'var(--espresso)', fontWeight: 600, textAlign: 'right' }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(branch => (
                    <TableRow key={branch.id}>
                      <TableCell style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                        <div>{branch.name}</div>
                        {branch.phone && <div className="text-xs mt-0.5" style={{ color: 'var(--espresso)', opacity: 0.55 }}>{branch.phone}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--golden-amber)' }} />
                          <span className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.7 }}>{branch.address || '—'}</span>
                        </div>
                        {branch.latitude && branch.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs underline mt-0.5 inline-block"
                            style={{ color: 'var(--golden-amber)' }}
                          >
                            View on map
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--golden-amber)' }} />
                          {branch.hours}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="border-0" style={{ backgroundColor: branch.isActive ? 'var(--sage-green)' : 'var(--burnt-orange)', color: 'var(--white)' }}>
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-2">
                          <Button onClick={() => handleEdit(branch)} variant="outline" size="sm" className="gap-1 border-[var(--espresso)]/20" style={{ color: 'var(--espresso)' }}>
                            <Edit className="w-4 h-4" />Edit
                          </Button>
                          <Button
                            onClick={() => handleToggleStatus(branch.id)}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            style={{ borderColor: branch.isActive ? 'var(--burnt-orange)' : 'var(--sage-green)', color: branch.isActive ? 'var(--burnt-orange)' : 'var(--sage-green)' }}
                          >
                            {branch.isActive ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {branch.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--espresso)]/10">
                <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, branches.length)} of {branches.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="border-[var(--espresso)]/20" style={{ color: 'var(--espresso)' }}>Previous</Button>
                  <span className="text-sm" style={{ color: 'var(--espresso)' }}>{currentPage} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="border-[var(--espresso)]/20" style={{ color: 'var(--espresso)' }}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Create / Edit Modal ─────────────────────────────────────────────── */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--espresso)' }}>
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </DialogTitle>
            </DialogHeader>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg mb-2" style={{ backgroundColor: 'rgba(59,35,20,0.08)' }}>
              {(['info', 'hours'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all"
                  style={{
                    backgroundColor: activeTab === tab ? 'var(--white)' : 'transparent',
                    color: 'var(--espresso)',
                    boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {tab === 'info' ? 'Branch Info' : 'Operating Hours'}
                </button>
              ))}
            </div>

            {/* ── Tab: Branch Info ── */}
            {activeTab === 'info' && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--espresso)' }}>Branch Name *</Label>
                    <Input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="Victoria Island" className="border-[var(--espresso)]/20" style={{ backgroundColor: 'var(--white)' }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--espresso)' }}>Phone</Label>
                    <Input value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} placeholder="+2348012345678" className="border-[var(--espresso)]/20" style={{ backgroundColor: 'var(--white)' }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--espresso)' }}>Address</Label>
                  <div className="flex gap-2">
                    <Input value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} placeholder="10 Adeola Odeku Street, Lagos" className="border-[var(--espresso)]/20" style={{ backgroundColor: 'var(--white)' }} />
                    <Button type="button" onClick={handleGeocode} disabled={isGeolocating} variant="outline" size="sm" className="gap-1.5 flex-shrink-0 border-[var(--espresso)]/20" style={{ color: 'var(--espresso)' }}>
                      <Search className="w-3.5 h-3.5" />
                      {isGeolocating ? 'Finding…' : 'Find'}
                    </Button>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--espresso)', opacity: 0.5 }}>Click Find to auto-detect coordinates from address</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--espresso)' }}>Latitude</Label>
                    <Input value={formData.latitude} onChange={e => setFormData(f => ({ ...f, latitude: e.target.value }))} placeholder="6.4281" type="number" step="any" className="border-[var(--espresso)]/20" style={{ backgroundColor: 'var(--white)' }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--espresso)' }}>Longitude</Label>
                    <Input value={formData.longitude} onChange={e => setFormData(f => ({ ...f, longitude: e.target.value }))} placeholder="3.4219" type="number" step="any" className="border-[var(--espresso)]/20" style={{ backgroundColor: 'var(--white)' }} />
                  </div>
                </div>

                {/* Map preview */}
                {mapSrc && (
                  <div className="rounded-lg overflow-hidden border border-[var(--espresso)]/10">
                    <iframe src={mapSrc} width="100%" height="200" style={{ border: 'none', display: 'block' }} title="Branch location" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--espresso)' }}>Description</Label>
                  <Input value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} placeholder="Flagship branch" className="border-[var(--espresso)]/20" style={{ backgroundColor: 'var(--white)' }} />
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--espresso)' }}>Manager ID</Label>
                  <Input value={formData.managerId} onChange={e => setFormData(f => ({ ...f, managerId: e.target.value }))} placeholder="UUID of the manager user" className="border-[var(--espresso)]/20 font-mono text-sm" style={{ backgroundColor: 'var(--white)' }} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-md" style={{ backgroundColor: 'var(--white)' }}>
                  <div>
                    <Label style={{ color: 'var(--espresso)' }}>Active Status</Label>
                    <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>Branch is {formData.isActive ? 'active' : 'inactive'}</p>
                  </div>
                  <Switch checked={formData.isActive} onCheckedChange={v => setFormData(f => ({ ...f, isActive: v }))} />
                </div>
              </div>
            )}

            {/* ── Tab: Operating Hours ── */}
            {activeTab === 'hours' && (
              <div className="space-y-2 py-2">
                <p className="text-sm mb-3" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                  Set opening and closing times for each day. Toggle Closed for days the branch doesn't operate.
                </p>
                {hours.map((h, i) => (
                  <div
                    key={h.dayOfWeek}
                    className="grid items-center gap-3 p-3 rounded-md"
                    style={{
                      backgroundColor: 'var(--white)',
                      gridTemplateColumns: '90px 1fr 1fr auto',
                      opacity: h.closed ? 0.5 : 1,
                    }}
                  >
                    <span className="text-sm font-medium" style={{ color: 'var(--espresso)' }}>{DAY_NAMES[i]}</span>
                    <Input
                      type="time"
                      value={h.openTime}
                      disabled={h.closed}
                      onChange={e => setHours(prev => prev.map((x, idx) => idx === i ? { ...x, openTime: e.target.value } : x))}
                      className="border-[var(--espresso)]/20 text-sm"
                      style={{ backgroundColor: h.closed ? 'transparent' : 'var(--warm-white)' }}
                    />
                    <Input
                      type="time"
                      value={h.closeTime}
                      disabled={h.closed}
                      onChange={e => setHours(prev => prev.map((x, idx) => idx === i ? { ...x, closeTime: e.target.value } : x))}
                      className="border-[var(--espresso)]/20 text-sm"
                      style={{ backgroundColor: h.closed ? 'transparent' : 'var(--warm-white)' }}
                    />
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={h.closed}
                        onCheckedChange={v => setHours(prev => prev.map((x, idx) => idx === i ? { ...x, closed: v } : x))}
                      />
                      <span className="text-xs" style={{ color: 'var(--espresso)', opacity: 0.6 }}>Closed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button onClick={() => setIsModalOpen(false)} variant="outline" className="border-[var(--espresso)]/20" style={{ color: 'var(--espresso)' }} disabled={isSaving}>Cancel</Button>
              {activeTab === 'info' && (
                <Button onClick={() => setActiveTab('hours')} variant="outline" className="border-[var(--espresso)]/20 gap-1" style={{ color: 'var(--espresso)' }}>
                  <Clock className="w-4 h-4" />Set Hours
                </Button>
              )}
              <Button onClick={handleSave} disabled={isSaving} className="transition-all hover:opacity-90" style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}>
                {isSaving ? 'Saving…' : editingBranch ? 'Save Changes' : 'Create Branch'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
