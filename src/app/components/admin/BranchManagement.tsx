import { useState } from "react";
import { Plus, Edit, XCircle, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
  isActive: boolean;
}

interface BranchManagementProps {
  branches?: Branch[];
}

const mockBranches: Branch[] = [
  {
    id: "1",
    name: "Victoria Island",
    location: "15 Ahmadu Bello Way, Victoria Island, Lagos",
    manager: "Adebayo Ogunlesi",
    isActive: true
  },
  {
    id: "2",
    name: "Lekki Phase 1",
    location: "23 Admiralty Way, Lekki Phase 1, Lagos",
    manager: "Chioma Nwosu",
    isActive: true
  },
  {
    id: "3",
    name: "Ikeja GRA",
    location: "12 Oba Akran Avenue, Ikeja GRA, Lagos",
    manager: "Oluwaseun Adeyemi",
    isActive: false
  },
  {
    id: "4",
    name: "Surulere",
    location: "45 Adeniran Ogunsanya Street, Surulere, Lagos",
    manager: "Funmilayo Ibrahim",
    isActive: true
  }
];

export function BranchManagement({ branches: initialBranches = mockBranches }: BranchManagementProps) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    manager: "",
    isActive: true
  });

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

  const handleSave = () => {
    if (editingBranch) {
      setBranches(branches.map(b =>
        b.id === editingBranch.id ? { ...b, ...formData } : b
      ));
    } else {
      const newBranch: Branch = {
        id: (branches.length + 1).toString(),
        ...formData
      };
      setBranches([...branches, newBranch]);
    }
    setIsModalOpen(false);
  };

  const handleDeactivate = (branchId: string) => {
    setBranches(branches.map(b =>
      b.id === branchId ? { ...b, isActive: !b.isActive } : b
    ));
  };

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
              Branch Management
            </h1>
            <p style={{ color: '#3B2314', opacity: 0.7 }}>
              Manage all FoodChain restaurant branches
            </p>
          </div>

          <Button
            onClick={handleAdd}
            className="gap-2 transition-all hover:opacity-90"
            style={{ backgroundColor: '#F0A500', color: '#1E1E1E' }}
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </Button>
        </div>

        <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
          <CardHeader>
            <CardTitle style={{ color: '#3B2314' }}>All Branches ({branches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ color: '#3B2314', fontWeight: 600 }}>Branch Name</TableHead>
                    <TableHead style={{ color: '#3B2314', fontWeight: 600 }}>Location</TableHead>
                    <TableHead style={{ color: '#3B2314', fontWeight: 600 }}>Manager</TableHead>
                    <TableHead style={{ color: '#3B2314', fontWeight: 600 }}>Status</TableHead>
                    <TableHead className="text-right" style={{ color: '#3B2314', fontWeight: 600 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell style={{ color: '#3B2314', fontWeight: 600 }}>
                        {branch.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#F0A500' }} />
                          <span className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                            {branch.location}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell style={{ color: '#3B2314' }}>
                        {branch.manager}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="border-0"
                          style={{
                            backgroundColor: branch.isActive ? '#4CAF7D' : '#E8622A',
                            color: 'white'
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
                            className="gap-1 border-[#3B2314]/20"
                            style={{ color: '#3B2314' }}
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
                              borderColor: branch.isActive ? '#E8622A' : '#4CAF7D',
                              color: branch.isActive ? '#E8622A' : '#4CAF7D'
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
          <DialogContent style={{ backgroundColor: '#FAF7F2' }}>
            <DialogHeader>
              <DialogTitle style={{ color: '#3B2314' }}>
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" style={{ color: '#3B2314' }}>Branch Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Victoria Island"
                  className="border-[#3B2314]/20"
                  style={{ backgroundColor: 'white' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" style={{ color: '#3B2314' }}>Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="15 Ahmadu Bello Way, Victoria Island, Lagos"
                  className="border-[#3B2314]/20"
                  style={{ backgroundColor: 'white' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager" style={{ color: '#3B2314' }}>Manager Name</Label>
                <Input
                  id="manager"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder="John Doe"
                  className="border-[#3B2314]/20"
                  style={{ backgroundColor: 'white' }}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-md" style={{ backgroundColor: 'white' }}>
                <div>
                  <Label htmlFor="active" style={{ color: '#3B2314' }}>Active Status</Label>
                  <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
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
                className="border-[#3B2314]/20"
                style={{ color: '#3B2314' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="transition-all hover:opacity-90"
                style={{ backgroundColor: '#F0A500', color: '#1E1E1E' }}
              >
                {editingBranch ? 'Save Changes' : 'Add Branch'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
