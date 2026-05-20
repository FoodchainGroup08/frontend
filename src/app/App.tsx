import { useAuth } from "@/context/AuthContext";
import { type Branch as ApiBranch, type Order as ApiOrder, type KitchenOrder, type UserRole } from "@/services/api";
import { Menu as MenuIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { AdminSidebar } from "./components/admin/AdminSidebar";
import { Analytics } from "./components/admin/Analytics";
import { BranchManagement } from "./components/admin/BranchManagement";
import { MenuCatalogue } from "./components/admin/MenuCatalogue";
import { Reports } from "./components/admin/Reports";
import { UserManagement } from "./components/admin/UserManagement";
import { ForgotPassword } from "./components/auth/ForgotPassword";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { ResetPassword } from "./components/auth/ResetPassword";
import { SetupLocation } from "./components/auth/SetupLocation";
import { VerifyEmail } from "./components/auth/VerifyEmail";
import { ActiveOrdersList } from "./components/customer/ActiveOrdersList";
import { AIFoodAssistantModal } from "./components/customer/AIFoodAssistantModal";
import { AISuggestions } from "./components/customer/AISuggestions";
import { BranchSelector } from "./components/customer/BranchSelector";
import { Cart } from "./components/customer/Cart";
import { Checkout, type OrderDetails } from "./components/customer/Checkout";
import { CustomerNavbar } from "./components/customer/CustomerNavbar";
import { CustomerProfile } from "./components/customer/CustomerProfile";
import { Menu } from "./components/customer/Menu";
import { OrderConfirmation } from "./components/customer/OrderConfirmation";
import { OrderDetailModal } from "./components/customer/OrderDetailModal";
import { OrderHistory } from "./components/customer/OrderHistory";
import { OrderTracker } from "./components/customer/OrderTracker";
import { KitchenCompletedOrders } from "./components/kitchen/KitchenCompletedOrders";
import { KitchenOrderDetail } from "./components/kitchen/KitchenOrderDetail";
import { KitchenQueue } from "./components/kitchen/KitchenQueue";
import { KitchenSidebar } from "./components/kitchen/KitchenSidebar";
import { LandingPage } from "./components/landing/LandingPage";
import { DailySales } from "./components/manager/DailySales";
import { LiveOrders } from "./components/manager/LiveOrders";
import { ManagerDashboard } from "./components/manager/ManagerDashboard";
import { ManagerHistory } from "./components/manager/ManagerHistory";
import { ManagerSidebar } from "./components/manager/ManagerSidebar";
import { PopularItems } from "./components/manager/PopularItems";
import { Toaster } from "./components/ui/sonner";

// ─── Local types ──────────────────────────────────────────────────────────────

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  quantity: number;
}

type ConfirmationOrder = {
  id: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  subtotal: number;
  deliveryFee: number;
  reservationFee?: number;
  total: number;
  deliveryAddress: string;
  phoneNumber: string;
  customerName: string;
  paymentMethod: string;
  branchName: string;
  estimatedTime: string;
  orderType?: 'delivery' | 'dine-in' | 'pickup';
};

type OrderDetailData = {
  id: string;
  status: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  branchName: string;
  orderDate: string;
  deliveryDate?: string;
  customerName: string;
  phoneNumber: string;
  deliveryAddress: string;
  paymentMethod: string;
  specialInstructions?: string;
};

type HistoricalOrder = {
  id: string;
  status: string;
  items: Array<{ id: string; name: string; quantity: number }>;
  total: number;
  branchName: string;
  orderDate: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  phoneNumber?: string;
  paymentMethod?: string;
  customerName?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleHome(role: UserRole | undefined): string {
  switch (role) {
    case 'Customer': return '/branches';
    case 'Kitchen Staff': return '/kitchen';
    case 'Branch Manager': return '/manager';
    case 'Admin': return '/admin';
    default: return '/login';
  }
}

// ─── Route guards ─────────────────────────────────────────────────────────────

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireRole({ role }: { role: UserRole }) {
  const { user } = useAuth();
  if (user?.role !== role) return <Navigate to={getRoleHome(user?.role)} replace />;
  return <Outlet />;
}

// ─── Auth page wrappers ───────────────────────────────────────────────────────

function LoginPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  if (isAuthenticated) return <Navigate to={getRoleHome(user?.role)} replace />;
  return (
    <Login
      onNavigateToRegister={() => navigate('/register')}
      onNavigateToForgotPassword={() => navigate('/forgot-password')}
      onVerificationRequired={(email) => navigate(`/verify-email?email=${encodeURIComponent(email)}`)}
    />
  );
}

function RegisterPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  if (isAuthenticated) return <Navigate to={getRoleHome(user?.role)} replace />;
  return (
    <Register
      onNavigateToLogin={() => navigate('/login')}
      onVerificationRequired={(email) => navigate(`/verify-email?email=${encodeURIComponent(email)}`)}
    />
  );
}

function VerifyEmailPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get('token') ?? undefined;
  const email = params.get('email') ?? undefined;
  // Only redirect away if there's no token — if a token is present the user must complete
  // verification even if they're already signed in (e.g. opened the link on a logged-in device).
  if (isAuthenticated && !token) return <Navigate to={getRoleHome(user?.role)} replace />;
  return <VerifyEmail token={token} email={email} onNavigateToLogin={() => navigate('/login')} />;
}


function SetupLocationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <SetupLocation
      userName={user?.name}
      onComplete={() => navigate(getRoleHome(user?.role), { replace: true })}
    />
  );
}

function ForgotPasswordPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  if (isAuthenticated) return <Navigate to={getRoleHome(user?.role)} replace />;
  return (
    <ForgotPassword
      onNavigateToLogin={() => navigate('/login')}
      onResetSuccess={() => {
        navigate('/login');
        toast.success("Password reset email sent!");
      }}
    />
  );
}

function ResetPasswordPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  if (isAuthenticated) return <Navigate to={getRoleHome(user?.role)} replace />;
  const token = new URLSearchParams(location.search).get('token') ?? '';
  return <ResetPassword token={token} onNavigateToLogin={() => navigate('/login')} />;
}

// ─── Customer Layout ──────────────────────────────────────────────────────────

function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const cartKey = `foodchain_cart_${user?.id}`;
  const branchKey = `foodchain_branch_${user?.id}`;

  const [selectedBranch, setSelectedBranch] = useState<ApiBranch | null>(() => {
    try { return JSON.parse(localStorage.getItem(branchKey) ?? 'null'); } catch { return null; }
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(cartKey) ?? '[]'); } catch { return []; }
  });
  const [currentOrder, setCurrentOrder] = useState<ConfirmationOrder | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  // Track which branches have already shown the AI modal this session
  const aiModalShownFor = useRef(new Set<string>());
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderDetailData | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

  useEffect(() => {
    if (user?.id) localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (selectedBranch) localStorage.setItem(branchKey, JSON.stringify(selectedBranch));
    else localStorage.removeItem(branchKey);
  }, [selectedBranch, branchKey, user?.id]);

  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const pathToScreen: Record<string, string> = {
    '/branches': 'branch-selector',
    '/menu': 'menu',
    '/cart': 'cart',
    '/checkout': 'checkout',
    '/order-confirmation': 'order-confirmation',
    '/active-orders': 'active-orders',
    '/order-tracker': 'order-tracker',
    '/order-history': 'order-history',
    '/profile': 'profile',
    '/ai-suggestions': 'ai-suggestions',
  };

  const screenToPath: Record<string, string> = {
    'branch-selector': '/branches',
    'menu': '/menu',
    'cart': '/cart',
    'checkout': '/checkout',
    'order-confirmation': '/order-confirmation',
    'active-orders': '/active-orders',
    'order-tracker': '/order-tracker',
    'order-history': '/order-history',
    'profile': '/profile',
    'ai-suggestions': '/ai-suggestions',
  };

  const currentScreen = pathToScreen[location.pathname] ?? 'branch-selector';

  const handleSelectBranch = (branch: ApiBranch) => {
    setSelectedBranch(branch);
    navigate('/menu');
    toast.success(`Selected ${branch.name}`, { description: "Browse our menu and start ordering" });
    // Open the AI assistant once per branch per session, unless the user dismissed it permanently
    const permanentlyDismissed = localStorage.getItem('foodchain_ai_assistant_dismissed') === 'true';
    if (!permanentlyDismissed && !aiModalShownFor.current.has(branch.id)) {
      aiModalShownFor.current.add(branch.id);
      setIsAIModalOpen(true);
    }
  };

  const handleChangeBranch = (branch: ApiBranch) => {
    if (branch.id === selectedBranch?.id) return;
    setSelectedBranch(branch);
    toast.success(`Switched to ${branch.name}`);
    if (currentScreen !== 'menu') navigate('/menu');
  };

  const handleAddToCart = (item: Omit<CartItem, 'quantity'>, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + quantity } : c);
      }
      return [...prev, { ...item, quantity }];
    });
    toast.success(`Added ${item.name}`, { description: `${quantity} item${quantity > 1 ? 's' : ''} added to cart` });
  };

  const handleUpdateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      const item = cart.find(i => i.id === itemId);
      setCart(cart.filter(i => i.id !== itemId));
      if (item) toast.info(`Removed ${item.name} from cart`);
    } else {
      setCart(cart.map(i => i.id === itemId ? { ...i, quantity } : i));
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    const item = cart.find(i => i.id === itemId);
    setCart(cart.filter(i => i.id !== itemId));
    if (item) toast.info(`Removed ${item.name} from cart`);
  };

  const handlePlaceOrder = (formData: OrderDetails, apiOrder: ApiOrder) => {
    setCurrentOrder({
      id: apiOrder.id,
      // Use cart items for names/prices — the API response may not return them correctly.
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      subtotal: formData.subtotal,
      deliveryFee: formData.deliveryFee,
      reservationFee: formData.reservationFee,
      total: formData.total,
      deliveryAddress: formData.deliveryAddress,
      phoneNumber: formData.phoneNumber,
      customerName: formData.customerName,
      paymentMethod: formData.paymentMethod,
      branchName: selectedBranch?.name ?? '',
      estimatedTime: apiOrder.estimatedTime ?? '45 mins',
      orderType: formData.orderType,
    });
    setTrackingOrderId(apiOrder.id);
    setCart([]);
    if (user?.id) localStorage.removeItem(`foodchain_cart_${user.id}`);
    navigate('/order-confirmation');
  };

  const handleViewOrderDetails = (order: HistoricalOrder) => {
    setSelectedOrderDetail({
      ...order,
      items: order.items.map(i => ({ ...i, price: 0 })),
      subtotal: order.total > 500 ? order.total - 500 : order.total,
      deliveryFee: 500,
      customerName: order.customerName ?? user?.name ?? '—',
      phoneNumber: order.phoneNumber ?? '—',
      deliveryAddress: order.deliveryAddress ?? '—',
      paymentMethod: order.paymentMethod ?? '—',
    });
    setIsOrderDetailOpen(true);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'branch-selector':
        return (
          <BranchSelector
            onSelectBranch={handleSelectBranch}
            onLogout={logout}
            userName={user?.name ?? ''}
          />
        );
      case 'menu':
        if (!selectedBranch) return <Navigate to="/branches" replace />;
        return (
          <Menu
            branchId={selectedBranch.id}
            onAddToCart={handleAddToCart}
            onGoToCart={() => navigate('/cart')}
            cart={cart}
          />
        );
      case 'cart':
        return (
          <Cart
            cart={cart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onProceedToCheckout={() => navigate('/checkout')}
            onContinueShopping={() => navigate('/menu')}
          />
        );
      case 'checkout':
        if (!selectedBranch) return <Navigate to="/branches" replace />;
        return (
          <Checkout
            cart={cart}
            branchId={selectedBranch.id}
            branchName={selectedBranch.name}
            branchAddress={selectedBranch.address}
            onPlaceOrder={handlePlaceOrder}
            onGoBack={() => navigate('/cart')}
            onChangeBranch={() => navigate('/branches')}
          />
        );
      case 'order-confirmation':
        if (!currentOrder) return <Navigate to="/branches" replace />;
        return (
          <OrderConfirmation
            order={currentOrder}
            onTrackOrder={() => navigate('/order-tracker')}
            onBackToMenu={() => navigate('/menu')}
          />
        );
      case 'active-orders':
        return (
          <ActiveOrdersList
            onSelectOrder={(id) => { setTrackingOrderId(id); navigate('/order-tracker'); }}
            onGoBack={() => navigate('/menu')}
          />
        );
      case 'order-tracker':
        if (!trackingOrderId) return <Navigate to="/active-orders" replace />;
        return (
          <OrderTracker
            orderId={trackingOrderId}
            onGoBack={() => navigate('/active-orders')}
          />
        );
      case 'order-history':
        return <OrderHistory onViewDetails={handleViewOrderDetails} onBrowseMenu={() => navigate('/menu')} />;
      case 'profile':
        return <CustomerProfile onGoBack={() => navigate(-1)} />;
      case 'ai-suggestions':
        if (!selectedBranch) return <Navigate to="/branches" replace />;
        return (
          <AISuggestions
            branchId={selectedBranch.id}
            branchName={selectedBranch.name}
            onAddToCart={handleAddToCart}
            onGoToCart={() => navigate('/cart')}
          />
        );
      default:
        return <Navigate to="/branches" replace />;
    }
  };

  return (
    <>
      {selectedBranch && currentScreen !== 'branch-selector' && (
        <CustomerNavbar
          currentScreen={currentScreen}
          onNavigate={s => navigate(screenToPath[s] ?? '/branches')}
          cartItemCount={cartItemCount}
          userName={user?.name}
          userId={user?.id}
          selectedBranch={selectedBranch.name}
          selectedBranchId={selectedBranch.id}
          onChangeBranch={handleChangeBranch}
          onLogout={logout}
        />
      )}
      <div className="pb-16 sm:pb-0">{renderScreen()}</div>
      <OrderDetailModal
        order={selectedOrderDetail}
        isOpen={isOrderDetailOpen}
        onClose={() => setIsOrderDetailOpen(false)}
      />
      {selectedBranch && (
        <AIFoodAssistantModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          branchId={selectedBranch.id}
          branchName={selectedBranch.name}
          onAddToCart={handleAddToCart}
          onGoToCart={() => { setIsAIModalOpen(false); navigate('/cart'); }}
        />
      )}
    </>
  );
}

// ─── Kitchen Layout ───────────────────────────────────────────────────────────

type KitchenScreen = 'queue' | 'completed';

const kitchenScreenLabels: Record<KitchenScreen, string> = {
  queue: 'Kitchen Queue',
  completed: 'Completed Orders',
};

function KitchenLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [kitchenScreen, setKitchenScreen] = useState<KitchenScreen>('queue');
  const [selectedKitchenOrder, setSelectedKitchenOrder] = useState<KitchenOrder | null>(null);
  const [isKitchenOrderDetailOpen, setIsKitchenOrderDetailOpen] = useState(false);

  const handleKitchenStatusChange = (orderId: string, newStatus: 'preparing' | 'ready') => {
    setSelectedKitchenOrder(prev =>
      prev?.id === orderId ? { ...prev, status: newStatus } : prev
    );
    toast.success(`Order status updated to ${newStatus}`);
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#1E1E1E' }}>
      <KitchenSidebar
        currentScreen={kitchenScreen}
        onNavigate={(screen) => setKitchenScreen(screen as KitchenScreen)}
        userName={user?.name ?? ''}
        branchName=""
        onLogout={logout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ backgroundColor: 'var(--charcoal)', borderColor: 'var(--brown)' }}>
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" style={{ color: 'var(--warm-white)' }}>
            <MenuIcon className="w-6 h-6" />
          </button>
          <span className="font-semibold" style={{ color: 'var(--warm-white)' }}>{kitchenScreenLabels[kitchenScreen]}</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {kitchenScreen === 'queue' ? (
            <KitchenQueue
              onOrderClick={(order) => {
                setSelectedKitchenOrder(order);
                setIsKitchenOrderDetailOpen(true);
              }}
              onStatusChange={handleKitchenStatusChange}
            />
          ) : (
            <KitchenCompletedOrders />
          )}
        </div>
      </div>
      <KitchenOrderDetail
        order={selectedKitchenOrder}
        isOpen={isKitchenOrderDetailOpen}
        onClose={() => setIsKitchenOrderDetailOpen(false)}
        onStatusChange={handleKitchenStatusChange}
      />
    </div>
  );
}

// ─── Manager Layout ───────────────────────────────────────────────────────────

const managerScreenPaths: Record<string, string> = {
  'dashboard': '/manager',
  'live-orders': '/manager/live-orders',
  'daily-sales': '/manager/daily-sales',
  'popular-items': '/manager/popular-items',
  'history': '/manager/history',
};

function ManagerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pathToScreen: Record<string, string> = {
    '/manager': 'dashboard',
    '/manager/live-orders': 'live-orders',
    '/manager/daily-sales': 'daily-sales',
    '/manager/popular-items': 'popular-items',
    '/manager/history': 'history',
  };
  const currentScreen = pathToScreen[location.pathname] ?? 'dashboard';

  const screenLabels: Record<string, string> = {
    'dashboard': 'Dashboard',
    'live-orders': 'Live Orders',
    'daily-sales': 'Daily Sales',
    'popular-items': 'Popular Items',
    'history': 'History',
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--warm-white)' }}>
      <ManagerSidebar
        currentScreen={currentScreen}
        onNavigate={s => navigate(managerScreenPaths[s] ?? '/manager')}
        userName={user?.name ?? ''}
        branchName=""
        onLogout={logout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ backgroundColor: 'var(--brown)', borderColor: 'rgba(250,247,242,0.1)' }}>
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" style={{ color: 'var(--warm-white)' }}>
            <MenuIcon className="w-6 h-6" />
          </button>
          <span className="font-semibold" style={{ color: 'var(--warm-white)' }}>{screenLabels[currentScreen] ?? 'Manager'}</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Routes>
            <Route index element={<ManagerDashboard />} />
            <Route path="live-orders" element={<LiveOrders />} />
            <Route path="daily-sales" element={<DailySales />} />
            <Route path="popular-items" element={<PopularItems />} />
            <Route path="history" element={<ManagerHistory />} />
            <Route path="*" element={<Navigate to="/manager" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Layout ─────────────────────────────────────────────────────────────

const adminScreenPaths: Record<string, string> = {
  'analytics': '/admin',
  'branches': '/admin/branches',
  'menu-catalogue': '/admin/menu-catalogue',
  'users': '/admin/users',
  'reports': '/admin/reports',
};

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pathToScreen: Record<string, string> = {
    '/admin': 'analytics',
    '/admin/branches': 'branches',
    '/admin/menu-catalogue': 'menu-catalogue',
    '/admin/users': 'users',
    '/admin/reports': 'reports',
  };
  const currentScreen = pathToScreen[location.pathname] ?? 'analytics';

  const screenLabels: Record<string, string> = {
    'analytics': 'Analytics',
    'branches': 'Branches',
    'menu-catalogue': 'Menu Catalogue',
    'users': 'Users',
    'reports': 'Reports',
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--warm-white)' }}>
      <AdminSidebar
        currentScreen={currentScreen}
        onNavigate={s => navigate(adminScreenPaths[s] ?? '/admin')}
        userName={user?.name ?? ''}
        onLogout={logout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ backgroundColor: 'var(--brown)', borderColor: 'rgba(250,247,242,0.1)' }}>
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" style={{ color: 'var(--warm-white)' }}>
            <MenuIcon className="w-6 h-6" />
          </button>
          <span className="font-semibold" style={{ color: 'var(--warm-white)' }}>{screenLabels[currentScreen] ?? 'Admin'}</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Routes>
            <Route index element={<Analytics />} />
            <Route path="branches" element={<BranchManagement />} />
            <Route path="menu-catalogue" element={<MenuCatalogue />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="text-center">
        <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 animate-pulse">
          <rect width="40" height="40" rx="8" fill="#3B2314"/>
          <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="#F0A500"/>
          <circle cx="20" cy="20" r="4" fill="#FAF7F2"/>
        </svg>
        <p style={{ color: '#3B2314', opacity: 0.7 }}>Loading...</p>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function AppRoutes() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <Routes>
        {/* Landing page */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={getRoleHome(user?.role)} replace />
            ) : (
              <LandingPage />
            )
          }
        />

        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Protected role-based routes */}
        <Route element={<RequireAuth />}>
          <Route path="/setup-location" element={<SetupLocationPage />} />

          <Route element={<RequireRole role="Kitchen Staff" />}>
            <Route path="/kitchen" element={<KitchenLayout />} />
          </Route>

          <Route element={<RequireRole role="Branch Manager" />}>
            <Route path="/manager/*" element={<ManagerLayout />} />
          </Route>

          <Route element={<RequireRole role="Admin" />}>
            <Route path="/admin/*" element={<AdminLayout />} />
          </Route>

          {/* Customer catch-all — must be last so specific role paths above take priority */}
          <Route element={<RequireRole role="Customer" />}>
            <Route path="/*" element={<CustomerLayout />} />
          </Route>
        </Route>

        {/* Fallback — redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default function App() {
  return <AppRoutes />;
}
