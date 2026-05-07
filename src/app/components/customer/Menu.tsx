import { useEffect, useState } from "react";
import { Plus, Minus, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getMenuByBranch, type MenuItem } from "@/services/api";

interface CartItem extends MenuItem {
  quantity: number;
}

interface MenuProps {
  onAddToCart: (item: MenuItem, quantity: number) => void;
  cart: CartItem[];
  branchId: string;
}

export function Menu({ onAddToCart, cart, branchId }: MenuProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Mains", "Soups", "Grills", "Sides", "Drinks"];

  const fetchMenu = async () => {
    setIsLoading(true);
    setError("");
    try {
      const items = await getMenuByBranch(branchId);
      setMenuItems(items);
    } catch {
      setError("Failed to load menu");
      toast.error("Failed to load menu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) fetchMenu();
  }, [branchId]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleQuantityChange = (itemId: string, delta: number) => {
    const currentQty = quantities[itemId] || 0;
    const newQty = Math.max(0, currentQty + delta);
    setQuantities({ ...quantities, [itemId]: newQty });
  };

  const handleAddToCart = (item: MenuItem) => {
    const quantity = quantities[item.id] || 1;
    onAddToCart(item, quantity);
    setQuantities({ ...quantities, [item.id]: 0 });
  };

  const getCartQuantity = (itemId: string) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl mb-4" style={{ color: '#3B2314', fontWeight: 600 }}>
            Menu
          </h1>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#3B2314', opacity: 0.4 }} />
            <Input
              type="text"
              placeholder="Search for dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#3B2314]/20"
              style={{ backgroundColor: 'white' }}
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-white border border-[#3B2314]/10">
              {categories.map(category => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="data-[state=active]:bg-[#F0A500] data-[state=active]:text-[#1E1E1E]"
                  style={{ color: '#3B2314' }}
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-72 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="mb-4" style={{ color: '#E8622A' }}>{error}</p>
            <Button
              onClick={fetchMenu}
              variant="outline"
              className="border-[#3B2314]/20"
              style={{ color: '#3B2314' }}
            >
              Retry
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#3B2314', opacity: 0.1 }}>
              <Search className="w-8 h-8" style={{ color: '#3B2314' }} />
            </div>
            <h3 className="text-xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
              No items found
            </h3>
            <p style={{ color: '#3B2314', opacity: 0.6 }}>
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const cartQty = getCartQuantity(item.id);
              const selectedQty = quantities[item.id] || 0;

              return (
                <Card
                  key={item.id}
                  className="border-[#3B2314]/10 flex flex-col overflow-hidden"
                  style={{
                    backgroundColor: 'white',
                    opacity: item.available ? 1 : 0.6
                  }}
                >
                  <div className="aspect-video w-full overflow-hidden bg-gray-100">
                    <img
                      src={item.imageUrl || item.image || ''}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg" style={{ color: '#3B2314' }}>
                        {item.name}
                      </CardTitle>
                      {!item.available && (
                        <Badge className="border-0 flex-shrink-0" style={{ backgroundColor: '#E8622A', color: 'white' }}>
                          Unavailable
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl" style={{ color: '#F0A500', fontWeight: 600 }}>
                        ₦{item.price.toLocaleString()}
                      </span>
                      {cartQty > 0 && (
                        <Badge className="border-0" style={{ backgroundColor: '#4CAF7D', color: 'white' }}>
                          {cartQty} in cart
                        </Badge>
                      )}
                    </div>

                    {item.available && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-md" style={{ borderColor: '#3B2314', opacity: 0.2 }}>
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="p-2 hover:bg-[#3B2314]/5 transition-colors"
                            disabled={selectedQty === 0}
                          >
                            <Minus className="w-4 h-4" style={{ color: '#3B2314' }} />
                          </button>
                          <span className="px-4 text-center min-w-[3rem]" style={{ color: '#3B2314', fontWeight: 600 }}>
                            {selectedQty}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="p-2 hover:bg-[#3B2314]/5 transition-colors"
                          >
                            <Plus className="w-4 h-4" style={{ color: '#3B2314' }} />
                          </button>
                        </div>
                        <Button
                          onClick={() => handleAddToCart(item)}
                          disabled={selectedQty === 0}
                          className="flex-1 transition-all hover:opacity-90"
                          style={{
                            backgroundColor: selectedQty > 0 ? '#F0A500' : '#3B2314',
                            color: selectedQty > 0 ? '#1E1E1E' : '#FAF7F2',
                            opacity: selectedQty === 0 ? 0.5 : 1
                          }}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
