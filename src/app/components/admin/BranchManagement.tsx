import { useState, useEffect } from "react";
import { Plus, Edit, XCircle, MapPin } from "lucide-react";
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
  type Branch as ApiBranch,
} from "@/services/api";

interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
  isActive: boolean;
}

function mapApiBranch(b: ApiBranch): Branch {
  return {
    id: b.id,
    name: b.name,
    location: b.address ?? b.location ?? '',
    manager: b.manager ?? '',
    isActive: b.isActive,
  };
}

export function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    manager: "",
    isActive: true
  });

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

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAdd = () => {
    setEditingBranch(null);
    setFormData({ name: "", location: "", manager: "", isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location,
      manager: branch.manager,
      isActive: branch.isActive
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const apiData = { name: formData.name, address: formData.location, manager: formData.manager, isActive: formData.isActive };
      if (editingBranch) {
        const updated = await updateBranch(editingBranch.id, apiData);
        setBranches(branches.map(b => b.id === editingBranch.id ? mapApiBranch(updated) : b));
        toast.success("Branch updated");
      } else {
        const created = await createBranch(apiData);
        setBranches([...branches, mapApiBranch(created)]);
        toast.success("Branch added");
      }
      setIsModalOpen(false);
    } catch {
      toast.error(editingBranch ? "Failed to update branch" : "Failed to add branch");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;
    const newStatus = !branch.isActive;
    try {
      await patchBranchStatus(branchId, newStatus);
      setBranches(branches.map(b => b.id === branchId ? { ...b, isActive: newStatus } : b));
      toast.success(`Branch ${newStatus ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error("Failed to update branch status");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <Skeleton className="h-10 w-56 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="p-6 sm:p-8 text-center">
          <p className="mb-4" style={{ color: 'var(--foodchain-burnt-orange)' }}>{error}</p>
          <Button onClick={fetchBranches} variant="outline" className="border-[var(--foodchain-espresso)]/20" style={{ color: 'var(--foodchain-espresso)' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl mb-2" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
              Branch Management
            </h1>
            <p style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
              Manage all FoodChain restaurant branches
            </p>
          </div>

          <Button
            onClick={handleAdd}
            className="gap-2 transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--foodchain-golden-amber)', color: 'var(--foodchain-charcoal)' }}
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </Button>
        </div>

        <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--foodchain-espresso)' }}>All Branches ({branches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>Branch Name</TableHead>
                    <TableHead style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>Location</TableHead>
                    <TableHead style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>Manager</TableHead>
                    <TableHead style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>Status</TableHead>
                    <TableHead className="text-right" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                        {branch.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--foodchain-golden-amber)' }} />
                          <span className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                            {branch.location}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell style={{ color: 'var(--foodchain-espresso)' }}>
                        {branch.manager}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="border-0"
                          style={{
                            backgroundColor: branch.isActive ? 'var(--foodchain-sage-green)' : 'var(--foodchain-burnt-orange)',
                            color: 'var(--foodchain-white)'
                          }}
                        >
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleEdit(branch)}
                            variant="outline"
                            size="sm"
                            className="gap-1 border-[var(--foodchain-espresso)]/20"
                            style={{ color: 'var(--foodchain-espresso)' }}
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeactivate(branch.id)}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            style={{
                              borderColor: branch.isActive ? 'var(--foodchain-burnt-orange)' : 'var(--foodchain-sage-green)',
                              color: branch.isActive ? 'var(--foodchain-burnt-orange)' : 'var(--foodchain-sage-green)'
                            }}
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
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--foodchain-espresso)' }}>
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" style={{ color: 'var(--foodchain-espresso)' }}>Branch Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Victoria Island"
                  className="border-[var(--foodchain-espresso)]/20"
                  style={{ backgroundColor: 'var(--foodchain-white)' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" style={{ color: 'var(--foodchain-espresso)' }}>Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="15 Ahmadu Bello Way, Victoria Island, Lagos"
                  className="border-[var(--foodchain-espresso)]/20"
                  style={{ backgroundColor: 'var(--foodchain-white)' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager" style={{ color: 'var(--foodchain-espresso)' }}>Manager Name</Label>
                <Input
                  id="manager"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder="John Doe"
                  className="border-[var(--foodchain-espresso)]/20"
                  style={{ backgroundColor: 'var(--foodchain-white)' }}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-md" style={{ backgroundColor: 'var(--foodchain-white)' }}>
                <div>
                  <Label htmlFor="active" style={{ color: 'var(--foodchain-espresso)' }}>Active Status</Label>
                  <p className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                    Branch is {formData.isActive ? 'active' : 'inactive'}
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                className="border-[var(--foodchain-espresso)]/20"
                style={{ color: 'var(--foodchain-espresso)' }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--foodchain-golden-amber)', color: 'var(--foodchain-charcoal)' }}
              >
                {isSaving ? 'Saving...' : editingBranch ? 'Save Changes' : 'Add Branch'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
