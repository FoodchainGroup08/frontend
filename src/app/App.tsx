import { useState } from "react";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { ForgotPassword } from "./components/auth/ForgotPassword";
import { CustomerNavbar } from "./components/customer/CustomerNavbar";
import { BranchSelector } from "./components/customer/BranchSelector";
import { Menu } from "./components/customer/Menu";
import { Cart } from "./components/customer/Cart";
import { Checkout, OrderDetails } from "./components/customer/Checkout";
import { OrderConfirmation } from "./components/customer/OrderConfirmation";
import { OrderTracker } from "./components/customer/OrderTracker";
import { OrderHistory } from "./components/customer/OrderHistory";
import { OrderDetailModal } from "./components/customer/OrderDetailModal";
import { KitchenSidebar } from "./components/kitchen/KitchenSidebar";
import { KitchenQueue } from "./components/kitchen/KitchenQueue";
import { KitchenOrderDetail } from "./components/kitchen/KitchenOrderDetail";
import { ManagerSidebar } from "./components/manager/ManagerSidebar";
import { ManagerDashboard } from "./components/manager/ManagerDashboard";
import { LiveOrders } from "./components/manager/LiveOrders";
import { DailySales } from "./components/manager/DailySales";
import { PopularItems } from "./components/manager/PopularItems";
import { AdminSidebar } from "./components/admin/AdminSidebar";
import { Analytics } from "./components/admin/Analytics";
import { BranchManagement } from "./components/admin/BranchManagement";
import { MenuCatalogue } from "./components/admin/MenuCatalogue";
import { UserManagement } from "./components/admin/UserManagement";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

type AuthScreen = "login" | "register" | "forgot-password";
type CustomerScreen = "branch-selector" | "menu" | "cart" | "checkout" | "order-confirmation" | "order-tracker" | "order-history";
type KitchenScreen = "queue";
type ManagerScreen = "dashboard" | "live-orders" | "daily-sales" | "popular-items";
type AdminScreen = "analytics" | "branches" | "menu-catalogue" | "users";
type UserRole = "Customer" | "Kitchen Staff" | "Branch Manager" | "Admin";

interface User {
  name: string;
  email: string;
  role: UserRole;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  distance: string;
  hours: string;
  rating: number;
  isOpen: boolean;
}

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  quantity: number;
}

interface Order {
  id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered';
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  phoneNumber: string;
  customerName: string;
  paymentMethod: string;
  specialInstructions: string;
  branchName: string;
  estimatedTime: string;
  placedAt: string;
  deliveryDate?: string;
}

export default function App() {
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [customerScreen, setCustomerScreen] = useState<CustomerScreen>("branch-selector");
  const [kitchenScreen, setKitchenScreen] = useState<KitchenScreen>("queue");
  const [managerScreen, setManagerScreen] = useState<ManagerScreen>("dashboard");
  const [adminScreen, setAdminScreen] = useState<AdminScreen>("analytics");
  const [user, setUser] = useState<User | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [kitchenOrders, setKitchenOrders] = useState<any[]>([]);
  const [selectedKitchenOrder, setSelectedKitchenOrder] = useState<any>(null);
  const [isKitchenOrderDetailOpen, setIsKitchenOrderDetailOpen] = useState(false);

  const handleLogin = (email: string, password: string) => {
    const mockUser: User = {
      name: "Demo User",
      email: email,
      role: "Customer"
    };
    setUser(mockUser);
    toast.success("Login successful!", {
      description: `Welcome back, ${mockUser.name}!`
    });
  };

  const handleRegister = (name: string, email: string, password: string, role: string) => {
    const newUser: User = {
      name,
      email,
      role: role as UserRole
    };
    setUser(newUser);
    toast.success("Account created successfully!", {
      description: `Welcome to FoodChain, ${name}!`
    });
  };

  const handleLogout = () => {
    setUser(null);
    setAuthScreen("login");
    setSelectedBranch(null);
    setCart([]);
    setCurrentOrder(null);
    setCustomerScreen("branch-selector");
    toast.info("Logged out successfully");
  };

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setCustomerScreen("menu");
    toast.success(`Selected ${branch.name}`, {
      description: "Browse our menu and start ordering"
    });
  };

  const handleAddToCart = (item: Omit<CartItem, 'quantity'>, quantity: number) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);

    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + quantity }
          : cartItem
      ));
      toast.success(`Updated ${item.name}`, {
        description: `Cart quantity: ${existingItem.quantity + quantity}`
      });
    } else {
      setCart([...cart, { ...item, quantity }]);
      toast.success(`Added ${item.name}`, {
        description: `${quantity} item${quantity > 1 ? 's' : ''} added to cart`
      });
    }
  };

  const handleUpdateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCart(cart.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveFromCart = (itemId: string) => {
    const item = cart.find(i => i.id === itemId);
    setCart(cart.filter(item => item.id !== itemId));
    if (item) {
      toast.info(`Removed ${item.name} from cart`);
    }
  };

  const handlePlaceOrder = (orderDetails: OrderDetails) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 500;
    const total = subtotal + deliveryFee;

    const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const estimatedDelivery = new Date(now.getTime() + 45 * 60000); // 45 minutes from now

    const newOrder: Order = {
      id: orderId,
      status: 'confirmed',
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      subtotal,
      deliveryFee,
      total,
      ...orderDetails,
      branchName: selectedBranch?.name || 'Unknown Branch',
      estimatedTime: `${estimatedDelivery.getHours()}:${estimatedDelivery.getMinutes().toString().padStart(2, '0')}`,
      placedAt: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
    };

    setCurrentOrder(newOrder);
    setCart([]);
    setCustomerScreen("order-confirmation");
    toast.success("Order placed successfully!", {
      description: `Order #${orderId}`
    });
  };

  const handleViewOrderDetails = (order: any) => {
    const orderDetail: Order = {
      ...order,
      subtotal: order.total - (order.deliveryFee || 500),
      deliveryFee: order.deliveryFee || 500,
      deliveryAddress: order.deliveryAddress || "Sample address",
      phoneNumber: order.phoneNumber || "080 1234 5678",
      customerName: order.customerName || user?.name || "Customer",
      paymentMethod: order.paymentMethod || "card",
      specialInstructions: order.specialInstructions || "",
      estimatedTime: order.estimatedTime || "45 mins",
      placedAt: order.orderDate || order.placedAt
    };
    setSelectedOrderDetail(orderDetail);
    setIsOrderDetailOpen(true);
  };

  const handleKitchenOrderClick = (order: any) => {
    setSelectedKitchenOrder(order);
    setIsKitchenOrderDetailOpen(true);
  };

  const handleKitchenStatusChange = (orderId: string, newStatus: 'preparing' | 'ready') => {
    setKitchenOrders(kitchenOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    toast.success(`Order status updated to ${newStatus}`);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!user) {
    if (authScreen === "login") {
      return (
        <>
          <Login
            onNavigateToRegister={() => setAuthScreen("register")}
            onNavigateToForgotPassword={() => setAuthScreen("forgot-password")}
            onLogin={handleLogin}
          />
          <Toaster />
        </>
      );
    }

    if (authScreen === "forgot-password") {
      return (
        <>
          <ForgotPassword
            onNavigateToLogin={() => setAuthScreen("login")}
            onResetSuccess={() => {
              setAuthScreen("login");
              toast.success("Password reset email sent!");
            }}
          />
          <Toaster />
        </>
      );
    }

    return (
      <>
        <Register
          onNavigateToLogin={() => setAuthScreen("login")}
          onRegister={handleRegister}
        />
        <Toaster />
      </>
    );
  }

  if (user.role === "Customer") {
    return (
      <>
        {selectedBranch && (
          <CustomerNavbar
            currentScreen={customerScreen}
            onNavigate={setCustomerScreen}
            cartItemCount={cartItemCount}
            userName={user.name}
            selectedBranch={selectedBranch.name}
            onLogout={handleLogout}
          />
        )}

        {customerScreen === "branch-selector" && (
          <BranchSelector
            onSelectBranch={handleSelectBranch}
            onLogout={handleLogout}
            userName={user.name}
          />
        )}

        {customerScreen === "menu" && (
          <Menu onAddToCart={handleAddToCart} cart={cart} />
        )}

        {customerScreen === "cart" && (
          <Cart
            cart={cart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onProceedToCheckout={() => setCustomerScreen("checkout")}
            onContinueShopping={() => setCustomerScreen("menu")}
          />
        )}

        {customerScreen === "checkout" && selectedBranch && (
          <Checkout
            cart={cart}
            branchName={selectedBranch.name}
            onPlaceOrder={handlePlaceOrder}
            onGoBack={() => setCustomerScreen("cart")}
          />
        )}

        {customerScreen === "order-confirmation" && currentOrder && (
          <OrderConfirmation
            order={currentOrder}
            onTrackOrder={() => setCustomerScreen("order-tracker")}
            onBackToMenu={() => setCustomerScreen("menu")}
          />
        )}

        {customerScreen === "order-tracker" && (
          <OrderTracker
            activeOrder={currentOrder}
            onGoBack={() => setCustomerScreen("menu")}
          />
        )}

        {customerScreen === "order-history" && (
          <OrderHistory
            orders={orderHistory}
            onViewDetails={handleViewOrderDetails}
          />
        )}

        <OrderDetailModal
          order={selectedOrderDetail}
          isOpen={isOrderDetailOpen}
          onClose={() => setIsOrderDetailOpen(false)}
        />

        <Toaster />
      </>
    );
  }

  if (user.role === "Kitchen Staff") {
    return (
      <div className="flex h-screen" style={{ backgroundColor: '#1E1E1E' }}>
        <KitchenSidebar
          currentScreen={kitchenScreen}
          onNavigate={setKitchenScreen}
          userName={user.name}
          branchName={selectedBranch?.name || "Victoria Island"}
          onLogout={handleLogout}
        />
        <div className="flex-1 overflow-hidden">
          <KitchenQueue
            orders={kitchenOrders}
            onOrderClick={handleKitchenOrderClick}
            onStatusChange={handleKitchenStatusChange}
          />
        </div>
        <KitchenOrderDetail
          order={selectedKitchenOrder}
          isOpen={isKitchenOrderDetailOpen}
          onClose={() => setIsKitchenOrderDetailOpen(false)}
          onStatusChange={handleKitchenStatusChange}
        />
        <Toaster />
      </div>
    );
  }

  if (user.role === "Branch Manager") {
    return (
      <div className="flex h-screen">
        <ManagerSidebar
          currentScreen={managerScreen}
          onNavigate={setManagerScreen}
          userName={user.name}
          branchName={selectedBranch?.name || "Victoria Island"}
          onLogout={handleLogout}
        />
        <div className="flex-1 overflow-hidden">
          {managerScreen === "dashboard" && <ManagerDashboard />}
          {managerScreen === "live-orders" && <LiveOrders />}
          {managerScreen === "daily-sales" && <DailySales />}
          {managerScreen === "popular-items" && <PopularItems />}
        </div>
        <Toaster />
      </div>
    );
  }

  if (user.role === "Admin") {
    return (
      <div className="flex h-screen">
        <AdminSidebar
          currentScreen={adminScreen}
          onNavigate={setAdminScreen}
          userName={user.name}
          onLogout={handleLogout}
        />
        <div className="flex-1 overflow-hidden">
          {adminScreen === "analytics" && <Analytics />}
          {adminScreen === "branches" && <BranchManagement />}
          {adminScreen === "menu-catalogue" && <MenuCatalogue />}
          {adminScreen === "users" && <UserManagement />}
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="#3B2314"/>
                <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="#F0A500"/>
                <circle cx="20" cy="20" r="4" fill="#FAF7F2"/>
              </svg>
              <div>
                <h1 className="text-2xl" style={{ color: '#3B2314', fontWeight: 600 }}>FoodChain</h1>
                <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                  {user?.role} Dashboard
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md transition-colors hover:opacity-90"
              style={{
                backgroundColor: '#3B2314',
                color: '#FAF7F2'
              }}
            >
              Logout
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#3B2314]/10 p-8">
            <h2 className="text-xl mb-4" style={{ color: '#3B2314', fontWeight: 600 }}>
              Welcome, {user?.name}!
            </h2>
            <p style={{ color: '#3B2314', opacity: 0.7 }}>
              You are logged in as <span style={{ color: '#F0A500', fontWeight: 600 }}>{user?.role}</span>.
            </p>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}