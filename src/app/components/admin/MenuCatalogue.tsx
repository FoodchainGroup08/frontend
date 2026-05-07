import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  type MenuItem,
} from "@/services/api";

const categories = ["Mains", "Soups", "Grills", "Sides", "Drinks"];

export function MenuCatalogue() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category: "Mains",
    isActive: true
  });

  const fetchItems = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getAllMenuItems();
      setItems(data);
    } catch {
      setError("Failed to load menu items");
      toast.error("Failed to load menu items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: "", description: "", price: 0, category: "Mains", isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isActive: item.isActive ?? item.available
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const apiData = { name: formData.name, description: formData.description, price: formData.price, category: formData.category, available: formData.isActive };
      if (editingItem) {
        const updated = await updateMenuItem(editingItem.id, apiData);
        setItems(items.map(i => i.id === editingItem.id ? updated : i));
        toast.success("Menu item updated");
      } else {
        const created = await createMenuItem(apiData);
        setItems([...items, created]);
        toast.success("Menu item added");
      }
      setIsModalOpen(false);
    } catch {
      toast.error(editingItem ? "Failed to update item" : "Failed to add item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await deleteMenuItem(itemId);
      setItems(items.filter(i => i.id !== itemId));
      toast.success("Menu item deleted");
    } catch {
      toast.error("Failed to delete menu item");
    }
  };

  const handleToggleActive = async (itemId: string) => {
    try {
      const updated = await toggleMenuItemAvailability(itemId);
      setItems(items.map(i => i.id === itemId ? updated : i));
    } catch {
      toast.error("Failed to update item availability");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="p-6 sm:p-8 text-center">
          <p className="mb-4" style={{ color: '#E8622A' }}>{error}</p>
          <Button onClick={fetchItems} variant="outline" className="border-[#3B2314]/20" style={{ color: '#3B2314' }}>
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
              Menu Catalogue
            </h1>
            <p style={{ color: '#3B2314', opacity: 0.7 }}>
              Manage all menu items across all branches
            </p>
          </div>

          <Button
            onClick={handleAdd}
            className="gap-2 transition-all hover:opacity-90"
            style={{ backgroundColor: '#F0A500', color: '#1E1E1E' }}
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </Button>
        </div>

        <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
          <CardHeader>
            <CardTitle style={{ color: '#3B2314' }}>All Menu Items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ color: '#3B2314', fontWeight: 600 }}>Name</TableHead>
                    <TableHead style={{ color: '#3B2314', fontWeight: 600 }}>Category</TableHead>
                    <TableHead style={{ color: '#3B2314', fontWeight: 600 }}>Price</TableHead>
                    <TableHead style={{ color: '#3B2314', fontWeight: 600 }}>Status</TableHead>
                    <TableHead className="text-right" style={{ color: '#3B2314', fontWeight: 600 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p style={{ color: '#3B2314', fontWeight: 600 }}>
                            {item.name}
                          </p>
                          <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                            {item.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="border-0" style={{ backgroundColor: '#3B2314', color: '#FAF7F2' }}>
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: '#F0A500', fontWeight: 600 }}>
                        ₦{item.price.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.isActive ?? item.available}
                          onCheckedChange={() => handleToggleActive(item.id)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleEdit(item)}
                            variant="outline"
                            size="sm"
                            className="gap-1 border-[#3B2314]/20"
                            style={{ color: '#3B2314' }}
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(item.id)}
                            variant="outline"
                            size="sm"
                            className="gap-1 border-[#E8622A]"
                            style={{ color: '#E8622A' }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
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
          <DialogContent style={{ backgroundColor: '#FAF7F2' }} className="max-w-2xl">
            <DialogHeader>
              <DialogTitle style={{ color: '#3B2314' }}>
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="itemName" style={{ color: '#3B2314' }}>Item Name</Label>
                <Input
                  id="itemName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jollof Rice & Chicken"
                  className="border-[#3B2314]/20"
                  style={{ backgroundColor: 'white' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" style={{ color: '#3B2314' }}>Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Classic Nigerian jollof rice served with grilled chicken"
                  rows={3}
                  className="border-[#3B2314]/20 resize-none"
                  style={{ backgroundColor: 'white' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" style={{ color: '#3B2314' }}>Price (₦)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    placeholder="2500"
                    className="border-[#3B2314]/20"
                    style={{ backgroundColor: 'white' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" style={{ color: '#3B2314' }}>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger
                      id="category"
                      className="border-[#3B2314]/20"
                      style={{ backgroundColor: 'white' }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-md" style={{ backgroundColor: 'white' }}>
                <div>
                  <Label htmlFor="itemActive" style={{ color: '#3B2314' }}>Active Status</Label>
                  <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                    Item is {formData.isActive ? 'available' : 'unavailable'}
                  </p>
                </div>
                <Switch
                  id="itemActive"
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
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="transition-all hover:opacity-90"
                style={{ backgroundColor: '#F0A500', color: '#1E1E1E' }}
              >
                {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
