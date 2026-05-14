import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, UploadCloud } from "lucide-react";
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
  uploadMenuItemImage,
  getCategoriesFull,
  type MenuItem,
} from "@/services/api";
import { isNetworkError } from "@/utils/demoData";

const DEMO_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Jollof Rice with Chicken', description: 'Spicy Nigerian jollof rice served with grilled chicken', price: 3500, category: 'Mains', available: true, isActive: true },
  { id: '2', name: 'Fried Rice Combo', description: 'Delicious fried rice with beef and plantain', price: 3200, category: 'Mains', available: true, isActive: true },
];

function ImageUploadZone({ onFileChange }: { onFileChange: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onFileChange(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className="flex flex-col items-center justify-center gap-2 p-6 rounded-md border-2 border-dashed cursor-pointer transition-colors"
      style={{
        borderColor: isDragging ? 'var(--golden-amber)' : 'rgba(59,35,20,0.2)',
        backgroundColor: isDragging ? 'rgba(240,165,0,0.06)' : 'var(--white)',
      }}
    >
      <UploadCloud className="w-8 h-8" style={{ color: isDragging ? 'var(--golden-amber)' : 'var(--espresso)', opacity: isDragging ? 1 : 0.4 }} />
      <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
        Click or drag & drop to upload image
      </p>
      <p className="text-xs" style={{ color: 'var(--espresso)', opacity: 0.4 }}>PNG, JPG, WEBP</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileChange(file);
        }}
      />
    </div>
  );
}

export function MenuCatalogue() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    categoryId: "",
    isActive: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchItems = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [data, cats] = await Promise.all([
        getAllMenuItems(),
        getCategoriesFull().catch(() => [] as Array<{ id: string; name: string; displayOrder: number; active: boolean }>),
      ]);
      setItems(data);
      setCategories(cats.filter(c => c.active));
    } catch (err: any) {
      if (isNetworkError(err)) {
        setItems(DEMO_MENU_ITEMS);
      } else {
        setError("Failed to load menu items");
        toast.error("Failed to load menu items");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: "", description: "", price: 0, categoryId: categories[0]?.id ?? "", isActive: true });
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    const matchedCat = categories.find(c => c.name === item.category);
    setFormData({
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      categoryId: matchedCat?.id ?? categories[0]?.id ?? "",
      isActive: item.isActive ?? item.available
    });
    setImageFile(null);
    setImagePreview(item.imageUrl ?? item.image ?? null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error("Item name is required"); return; }
    if (!formData.categoryId) { toast.error("Please select a category"); return; }
    setIsSaving(true);
    try {
      if (editingItem) {
        let updated = await updateMenuItem(editingItem.id, {
          name: formData.name, description: formData.description,
          categoryId: formData.categoryId, price: formData.price,
        });
        if (imageFile) {
          updated = await uploadMenuItemImage(editingItem.id, imageFile);
        }
        setItems(items.map(i => i.id === editingItem.id ? updated : i));
        toast.success("Menu item updated");
      } else {
        let created = await createMenuItem({
          name: formData.name, description: formData.description,
          categoryId: formData.categoryId, price: formData.price,
        });
        if (imageFile) {
          created = await uploadMenuItemImage(created.id, imageFile);
        }
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
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
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
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="p-6 sm:p-8 text-center">
          <p className="mb-4" style={{ color: 'var(--burnt-orange)' }}>{error}</p>
          <Button onClick={fetchItems} variant="outline" className="border-[var(--espresso)]/20" style={{ color: 'var(--espresso)' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl mb-2" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
              Menu Catalogue
            </h1>
            <p style={{ color: 'var(--espresso)', opacity: 0.7 }}>
              Manage all menu items across all branches
            </p>
          </div>

          <Button
            onClick={handleAdd}
            className="gap-2 transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </Button>
        </div>

        <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--espresso)' }}>All Menu Items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead style={{ color: 'var(--espresso)', fontWeight: 600 }}>Name</TableHead>
                    <TableHead style={{ color: 'var(--espresso)', fontWeight: 600 }}>Category</TableHead>
                    <TableHead style={{ color: 'var(--espresso)', fontWeight: 600 }}>Price</TableHead>
                    <TableHead style={{ color: 'var(--espresso)', fontWeight: 600 }}>Status</TableHead>
                    <TableHead className="w-px text-right" style={{ color: 'var(--espresso)', fontWeight: 600 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="w-10 pr-0">
                        {(item.imageUrl || item.image) ? (
                          <img
                            src={item.imageUrl ?? item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: 'rgba(59,35,20,0.06)' }}>
                            <span className="text-xs" style={{ color: 'var(--espresso)', opacity: 0.3 }}>—</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                            {item.name}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                            {item.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="border-0" style={{ backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' }}>
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: 'var(--golden-amber)', fontWeight: 600 }}>
                        ₦{item.price.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.isActive ?? item.available}
                          onCheckedChange={() => handleToggleActive(item.id)}
                        />
                      </TableCell>
                      <TableCell className="w-px whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleEdit(item)}
                            variant="outline"
                            size="sm"
                            className="gap-1 border-[var(--espresso)]/20"
                            style={{ color: 'var(--espresso)' }}
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(item.id)}
                            variant="outline"
                            size="sm"
                            className="gap-1 border-[var(--burnt-orange)]"
                            style={{ color: 'var(--burnt-orange)' }}
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
            {Math.ceil(items.length / ITEMS_PER_PAGE) > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--espresso)]/10">
                <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, items.length)} of {items.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border-[var(--espresso)]/20"
                    style={{ color: 'var(--espresso)' }}
                  >
                    Previous
                  </Button>
                  <span className="text-sm" style={{ color: 'var(--espresso)' }}>
                    {currentPage} / {Math.ceil(items.length / ITEMS_PER_PAGE)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(items.length / ITEMS_PER_PAGE), p + 1))}
                    disabled={currentPage === Math.ceil(items.length / ITEMS_PER_PAGE)}
                    className="border-[var(--espresso)]/20"
                    style={{ color: 'var(--espresso)' }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent style={{ backgroundColor: 'var(--warm-white)' }} className="max-w-2xl">
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--espresso)' }}>
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="itemName" style={{ color: 'var(--espresso)' }}>Item Name</Label>
                <Input
                  id="itemName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jollof Rice & Chicken"
                  className="border-[var(--espresso)]/20"
                  style={{ backgroundColor: 'var(--white)' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" style={{ color: 'var(--espresso)' }}>Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Classic Nigerian jollof rice served with grilled chicken"
                  rows={3}
                  className="border-[var(--espresso)]/20 resize-none"
                  style={{ backgroundColor: 'var(--white)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" style={{ color: 'var(--espresso)' }}>Price (₦)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    placeholder="2500"
                    className="border-[var(--espresso)]/20"
                    style={{ backgroundColor: 'var(--white)' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" style={{ color: 'var(--espresso)' }}>Category</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger
                      id="category"
                      className="border-[var(--espresso)]/20"
                      style={{ backgroundColor: 'var(--white)' }}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label style={{ color: 'var(--espresso)' }}>Meal Image</Label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-md"
                  />
                )}
                <ImageUploadZone
                  onFileChange={(file) => {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }}
                />
                {imagePreview && (
                  <button
                    type="button"
                    className="text-xs"
                    style={{ color: 'var(--burnt-orange)' }}
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                  >
                    Remove image
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-md" style={{ backgroundColor: 'var(--white)' }}>
                <div>
                  <Label htmlFor="itemActive" style={{ color: 'var(--espresso)' }}>Active Status</Label>
                  <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
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
                className="border-[var(--espresso)]/20"
                style={{ color: 'var(--espresso)' }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}
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