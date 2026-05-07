import { useState } from "react";
import { Plus, Minus, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface MenuProps {
  onAddToCart: (item: MenuItem, quantity: number) => void;
  cart: CartItem[];
}

const mockMenuItems: MenuItem[] = [
  {
    id: "1",
    name: "Jollof Rice & Chicken",
    description: "Classic Nigerian jollof rice served with grilled chicken",
    price: 2500,
    category: "Mains",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop",
    available: true
  },
  {
    id: "2",
    name: "Fried Rice Special",
    description: "Fried rice with mixed vegetables, prawns, and chicken",
    price: 3000,
    category: "Mains",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop",
    available: true
  },
  {
    id: "3",
    name: "Pepper Soup",
    description: "Spicy goat meat pepper soup with herbs",
    price: 2000,
    category: "Soups",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    available: true
  },
  {
    id: "4",
    name: "Egusi Soup & Pounded Yam",
    description: "Traditional egusi soup with assorted meat",
    price: 3500,
    category: "Soups",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop",
    available: true
  },
  {
    id: "5",
    name: "Suya Platter",
    description: "Grilled spiced beef skewers with onions",
    price: 1500,
    category: "Grills",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&h=300&fit=crop",
    available: true
  },
  {
    id: "6",
    name: "Grilled Fish",
    description: "Whole tilapia grilled to perfection",
    price: 4000,
    category: "Grills",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop",
    available: false
  },
  {
    id: "7",
    name: "Chapman",
    description: "Refreshing Nigerian cocktail drink",
    price: 800,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=300&fit=crop",
    available: true
  },
  {
    id: "8",
    name: "Zobo",
    description: "Chilled hibiscus drink",
    price: 500,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
    available: true
  },
  {
    id: "9",
    name: "Puff Puff",
    description: "Sweet fried dough balls (6 pieces)",
    price: 600,
    category: "Sides",
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&h=300&fit=crop",
    available: true
  },
  {
    id: "10",
    name: "Plantain",
    description: "Fried ripe plantain slices",
    price: 700,
    category: "Sides",
    image: "https://images.unsplash.com/photo-1593096870549-36d3fbc6f1c8?w=400&h=300&fit=crop",
    available: true
  }
];

export function Menu({ onAddToCart, cart }: MenuProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const categories = ["All", "Mains", "Soups", "Grills", "Sides", "Drinks"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredItems = mockMenuItems.filter(item => {
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

        {filteredItems.length === 0 ? (
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
                      src={item.image}
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
