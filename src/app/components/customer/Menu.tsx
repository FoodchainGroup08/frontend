import { useEffect, useState } from "react";
import { Plus, Minus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getMenuByBranch, getCategories, type MenuItem } from "@/services/api";

interface CartItem extends MenuItem {
  quantity: number;
}

interface MenuProps {
  onAddToCart: (item: MenuItem, quantity: number) => void;
  cart: CartItem[];
  branchId: string;
}

const ITEMS_PER_PAGE = 9;

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

export function Menu({ onAddToCart, cart, branchId }: MenuProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(['All']);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getCategories()
      .then(cats => setCategories(['All', ...cats]))
      .catch(() => { /* keep ["All"] */ });
  }, []);

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

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl mb-4" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
            Menu
          </h1>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--foodchain-espresso)', opacity: 0.4 }} />
            <Input
              type="text"
              placeholder="Search for dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[var(--foodchain-espresso)]/20"
              style={{ backgroundColor: 'var(--foodchain-white)' }}
            />
          </div>

          {/* Category pills — custom scrollable row, no native scrollbar */}
          <div
            className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' } as React.CSSProperties}
          >
            {categories.map(category => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="flex-shrink-0 whitespace-nowrap rounded-full text-sm font-medium transition-all px-4 py-2"
                  style={{
                    backgroundColor: active ? 'var(--foodchain-golden-amber)' : 'var(--foodchain-white)',
                    color: active ? 'var(--foodchain-charcoal)' : 'var(--foodchain-espresso)',
                    border: active ? '1.5px solid transparent' : '1.5px solid rgba(59,35,20,0.15)',
                    fontWeight: active ? 600 : 400,
                    boxShadow: active ? '0 2px 8px rgba(240,165,0,0.25)' : 'none',
                  }}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-72 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="mb-4" style={{ color: 'var(--foodchain-burnt-orange)' }}>{error}</p>
            <Button
              onClick={fetchMenu}
              variant="outline"
              className="border-[var(--foodchain-espresso)]/20"
              style={{ color: 'var(--foodchain-espresso)' }}
            >
              Retry
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'rgba(59,35,20,0.08)' }}>
              <Search className="w-8 h-8" style={{ color: 'var(--foodchain-espresso)' }} />
            </div>
            <h3 className="text-xl mb-2" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
              No items found
            </h3>
            <p style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            {/* Results info */}
            <p className="text-sm mb-4" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} of {filteredItems.length} items
            </p>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {paginatedItems.map((item) => {
                const cartQty = getCartQuantity(item.id);
                const selectedQty = quantities[item.id] || 0;

                return (
                  <Card
                    key={item.id}
                    className="border-[var(--foodchain-espresso)]/10 flex flex-col overflow-hidden"
                    style={{
                      backgroundColor: 'var(--foodchain-white)',
                      opacity: item.available ? 1 : 0.6
                    }}
                  >
                    <div className="aspect-video w-full overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={item.imageUrl || item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-lg" style={{ color: 'var(--foodchain-espresso)' }}>
                          {item.name}
                        </CardTitle>
                        {!item.available && (
                          <Badge className="border-0 flex-shrink-0" style={{ backgroundColor: 'var(--foodchain-burnt-orange)', color: 'var(--foodchain-white)' }}>
                            Unavailable
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl" style={{ color: 'var(--foodchain-golden-amber)', fontWeight: 600 }}>
                          ₦{item.price.toLocaleString()}
                        </span>
                        {cartQty > 0 && (
                          <Badge className="border-0" style={{ backgroundColor: 'var(--foodchain-sage-green)', color: 'var(--foodchain-white)' }}>
                            {cartQty} in cart
                          </Badge>
                        )}
                      </div>

                      {item.available && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border rounded-md" style={{ borderColor: 'rgba(59,35,20,0.2)' }}>
                            <button
                              onClick={() => handleQuantityChange(item.id, -1)}
                              className="p-2 hover:bg-[var(--foodchain-espresso)]/5 transition-colors"
                              disabled={selectedQty === 0}
                            >
                              <Minus className="w-4 h-4" style={{ color: 'var(--foodchain-espresso)' }} />
                            </button>
                            <span className="px-4 text-center min-w-[3rem]" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                              {selectedQty}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="p-2 hover:bg-[var(--foodchain-espresso)]/5 transition-colors"
                            >
                              <Plus className="w-4 h-4" style={{ color: 'var(--foodchain-espresso)' }} />
                            </button>
                          </div>
                          <Button
                            onClick={() => handleAddToCart(item)}
                            disabled={selectedQty === 0}
                            className="flex-1 transition-all hover:opacity-90"
                            style={{
                              backgroundColor: selectedQty > 0 ? 'var(--foodchain-golden-amber)' : 'var(--foodchain-espresso)',
                              color: selectedQty > 0 ? 'var(--foodchain-charcoal)' : 'var(--foodchain-warm-white)',
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-all"
                  style={{
                    backgroundColor: currentPage === 1 ? 'transparent' : 'var(--foodchain-white)',
                    border: '1.5px solid rgba(59,35,20,0.15)',
                    color: 'var(--foodchain-espresso)',
                    opacity: currentPage === 1 ? 0.35 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                  page === '…' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-9 h-9 flex items-center justify-center text-sm"
                      style={{ color: 'var(--foodchain-espresso)', opacity: 0.4 }}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className="w-9 h-9 rounded-full text-sm font-medium transition-all"
                      style={{
                        backgroundColor: currentPage === page ? 'var(--foodchain-golden-amber)' : 'var(--foodchain-white)',
                        color: currentPage === page ? 'var(--foodchain-charcoal)' : 'var(--foodchain-espresso)',
                        border: currentPage === page ? '1.5px solid transparent' : '1.5px solid rgba(59,35,20,0.15)',
                        fontWeight: currentPage === page ? 600 : 400,
                        boxShadow: currentPage === page ? '0 2px 8px rgba(240,165,0,0.25)' : 'none',
                      }}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-all"
                  style={{
                    backgroundColor: currentPage === totalPages ? 'transparent' : 'var(--foodchain-white)',
                    border: '1.5px solid rgba(59,35,20,0.15)',
                    color: 'var(--foodchain-espresso)',
                    opacity: currentPage === totalPages ? 0.35 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
