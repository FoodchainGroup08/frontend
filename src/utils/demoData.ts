import type {
  KitchenOrder,
  Order,
  PopularItem,
  HourlySales,
  ManagerDashboard as DashboardData,
  Analytics as AnalyticsData,
  BranchAnalytics,
  SystemUser,
  MenuItem,
} from '@/services/api';

// ─── Network error helper ────────────────────────────────────────────────────

export const isNetworkError = (err: any): boolean =>
  err?.code === 'ERR_NETWORK' ||
  err?.message?.includes('Network Error') ||
  err?.message?.includes('net::ERR') ||
  localStorage.getItem('foodchain_demo_mode') === 'true';

// ─── Demo: Kitchen Orders ─────────────────────────────────────────────────────

const t = (minAgo: number) =>
  new Date(Date.now() - minAgo * 60_000).toISOString();

export const DEMO_KITCHEN_ORDERS: KitchenOrder[] = [
  {
    id: 'demo-kitchen-001',
    status: 'received',
    items: [
      { id: '1', name: 'Jollof Rice with Chicken', quantity: 2 },
      { id: '7', name: 'Fried Plantain', quantity: 1 },
    ],
    orderType: 'dine-in',
    tableNumber: '5',
    receivedAt: t(3),
    isNew: true,
    customerName: 'Adebayo Okafor',
  },
  {
    id: 'demo-kitchen-002',
    status: 'preparing',
    items: [
      { id: '4', name: 'Suya Platter', quantity: 1 },
      { id: '8', name: 'Chapman', quantity: 2 },
      { id: '9', name: 'Fresh Coconut Water', quantity: 1 },
    ],
    orderType: 'delivery',
    receivedAt: t(11),
    customerName: 'Ngozi Adeyemi',
  },
  {
    id: 'demo-kitchen-003',
    status: 'preparing',
    items: [
      { id: '2', name: 'Fried Rice Combo', quantity: 1 },
      { id: '7', name: 'Fried Plantain', quantity: 2 },
    ],
    orderType: 'takeaway',
    receivedAt: t(8),
    isUrgent: true,
    customerName: 'Tunde Fashola',
  },
  {
    id: 'demo-kitchen-004',
    status: 'ready',
    items: [
      { id: '3', name: 'Egusi Soup & Pounded Yam', quantity: 1 },
      { id: '9', name: 'Fresh Coconut Water', quantity: 1 },
    ],
    orderType: 'dine-in',
    tableNumber: '12',
    receivedAt: t(22),
    customerName: 'Emeka Nwosu',
  },
];

// ─── Demo: Manager Live Orders ────────────────────────────────────────────────

export const DEMO_LIVE_MANAGER_ORDERS: Order[] = [
  {
    id: 'demo-mgr-001',
    status: 'RECEIVED',
    items: [
      { id: '1', name: 'Jollof Rice with Chicken', price: 3500, quantity: 2 },
      { id: '8', name: 'Chapman', price: 1500, quantity: 1 },
    ],
    subtotal: 8500, deliveryFee: 500, total: 9000,
    branchId: 'branch-1', branchName: 'FoodChain Victoria Island',
    orderType: 'dine-in', tableNumber: '3',
    customerName: 'Babatunde Alabi', phoneNumber: '08012345678',
    placedAt: t(4), estimatedTime: '20 mins',
  },
  {
    id: 'demo-mgr-002',
    status: 'PREPARING',
    items: [
      { id: '6', name: 'Grilled Chicken', price: 3800, quantity: 1 },
      { id: '5', name: 'Pepper Soup', price: 2500, quantity: 1 },
    ],
    subtotal: 6300, deliveryFee: 500, total: 6800,
    branchId: 'branch-1', branchName: 'FoodChain Victoria Island',
    orderType: 'delivery', deliveryAddress: '12 Admiralty Way, Lekki Phase 1',
    customerName: 'Funke Adeola', phoneNumber: '08087654321',
    placedAt: t(13), estimatedTime: '35 mins',
  },
  {
    id: 'demo-mgr-003',
    status: 'READY',
    items: [
      { id: '4', name: 'Suya Platter', price: 4000, quantity: 1 },
      { id: '7', name: 'Fried Plantain', price: 1200, quantity: 1 },
    ],
    subtotal: 5200, deliveryFee: 0, total: 5200,
    branchId: 'branch-1', branchName: 'FoodChain Victoria Island',
    orderType: 'takeaway',
    customerName: 'Chidi Eze', phoneNumber: '08055512345',
    placedAt: t(19),
  },
  {
    id: 'demo-mgr-004',
    status: 'PICKED_UP',
    items: [
      { id: '2', name: 'Fried Rice Combo', price: 3200, quantity: 2 },
    ],
    subtotal: 6400, deliveryFee: 500, total: 6900,
    branchId: 'branch-1', branchName: 'FoodChain Victoria Island',
    orderType: 'delivery', deliveryAddress: '8 Oniru Estate, Victoria Island',
    customerName: 'Amaka Obi', phoneNumber: '08031234567',
    placedAt: t(35),
  },
];

// ─── Demo: Manager Dashboard ──────────────────────────────────────────────────

export const DEMO_MANAGER_DASHBOARD: DashboardData = {
  totalOrders: 142,
  totalRevenue: 521450,
  averageOrderValue: 3672,
  ordersChange: 12,
  revenueChange: 8,
};

// ─── Demo: Hourly Sales ───────────────────────────────────────────────────────

export const DEMO_HOURLY_SALES: HourlySales[] = [
  { hour: '7 AM', revenue: 12000, orders: 4 },
  { hour: '8 AM', revenue: 18000, orders: 6 },
  { hour: '9 AM', revenue: 22000, orders: 7 },
  { hour: '10 AM', revenue: 25000, orders: 8 },
  { hour: '11 AM', revenue: 35000, orders: 12 },
  { hour: '12 PM', revenue: 68000, orders: 22 },
  { hour: '1 PM', revenue: 85000, orders: 28 },
  { hour: '2 PM', revenue: 72000, orders: 24 },
  { hour: '3 PM', revenue: 48000, orders: 16 },
  { hour: '4 PM', revenue: 32000, orders: 10 },
  { hour: '5 PM', revenue: 55000, orders: 18 },
  { hour: '6 PM', revenue: 78000, orders: 25 },
  { hour: '7 PM', revenue: 65000, orders: 21 },
  { hour: '8 PM', revenue: 42000, orders: 14 },
  { hour: '9 PM', revenue: 28000, orders: 9 },
];

// ─── Demo: Popular Items ──────────────────────────────────────────────────────

export const DEMO_POPULAR_ITEMS: PopularItem[] = [
  { id: '8', name: 'Chapman', category: 'Drinks', quantitySold: 95, revenue: 142500, trend: 22 },
  { id: '1', name: 'Jollof Rice with Chicken', category: 'Mains', quantitySold: 87, revenue: 304500, trend: 15 },
  { id: '7', name: 'Fried Plantain', category: 'Sides', quantitySold: 72, revenue: 86400, trend: 6 },
  { id: '4', name: 'Suya Platter', category: 'Grills', quantitySold: 64, revenue: 256000, trend: 8 },
  { id: '6', name: 'Grilled Chicken', category: 'Grills', quantitySold: 52, revenue: 197600, trend: 3 },
  { id: '2', name: 'Fried Rice Combo', category: 'Mains', quantitySold: 48, revenue: 153600, trend: -2 },
  { id: '3', name: 'Egusi Soup & Pounded Yam', category: 'Soups', quantitySold: 41, revenue: 114800, trend: 12 },
  { id: '5', name: 'Pepper Soup', category: 'Soups', quantitySold: 33, revenue: 82500, trend: -5 },
];

// ─── Demo: Admin Analytics ─────────────────────────────────────────────────────

export const DEMO_ANALYTICS: AnalyticsData = {
  totalOrders: 426,
  totalRevenue: 1_564_350,
  ordersChange: 14,
  revenueChange: 11,
};

export const DEMO_BRANCH_ANALYTICS: BranchAnalytics[] = [
  { name: 'Victoria Island', orders: 165, revenue: 605_250 },
  { name: 'Lekki', orders: 148, revenue: 543_440 },
  { name: 'Ikeja', orders: 113, revenue: 415_660 },
];

// ─── Demo: System Users ───────────────────────────────────────────────────────

export const DEMO_SYSTEM_USERS: SystemUser[] = [
  { id: '1', name: 'Demo Customer', email: 'user@demo.com', role: 'Customer', status: 'active' },
  { id: '2', name: 'Demo Kitchen Staff', email: 'kitchen@demo.com', role: 'Kitchen Staff', status: 'active', branch: 'Victoria Island', branchId: 'branch-1' },
  { id: '3', name: 'Demo Manager', email: 'manager@demo.com', role: 'Branch Manager', status: 'active', branch: 'Victoria Island', branchId: 'branch-1' },
  { id: '4', name: 'Demo Admin', email: 'admin@demo.com', role: 'Admin', status: 'active' },
  { id: '5', name: 'Amaka Obi', email: 'amaka.obi@foodchain.ng', role: 'Customer', status: 'active' },
  { id: '6', name: 'Chidi Eze', email: 'chidi.eze@foodchain.ng', role: 'Kitchen Staff', status: 'active', branch: 'Lekki', branchId: 'branch-2' },
  { id: '7', name: 'Yemi Adewale', email: 'yemi.adewale@foodchain.ng', role: 'Branch Manager', status: 'inactive', branch: 'Ikeja', branchId: 'branch-3' },
  { id: '8', name: 'Ngozi Adeyemi', email: 'ngozi@foodchain.ng', role: 'Customer', status: 'active' },
];

// ─── Demo: Menu Items ────────────────────────────────────────────────────────

export const DEMO_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Jollof Rice with Chicken', description: 'Spicy Nigerian jollof rice served with grilled chicken', price: 3500, category: 'Mains', available: true },
  { id: '2', name: 'Fried Rice Combo', description: 'Delicious fried rice with beef and plantain', price: 3200, category: 'Mains', available: true },
  { id: '3', name: 'Egusi Soup & Pounded Yam', description: 'Traditional melon soup with smooth pounded yam', price: 2800, category: 'Soups', available: true },
  { id: '4', name: 'Suya Platter', description: 'Spicy grilled beef suya with onions and tomatoes', price: 4000, category: 'Grills', available: true },
  { id: '5', name: 'Pepper Soup', description: 'Spicy Nigerian pepper soup with assorted meat', price: 2500, category: 'Soups', available: true },
  { id: '6', name: 'Grilled Chicken', description: 'Perfectly seasoned grilled chicken', price: 3800, category: 'Grills', available: true },
  { id: '7', name: 'Fried Plantain', description: 'Sweet fried plantain slices', price: 1200, category: 'Sides', available: true },
  { id: '8', name: 'Chapman', description: 'Refreshing Nigerian cocktail drink', price: 1500, category: 'Drinks', available: true },
  { id: '9', name: 'Fresh Coconut Water', description: 'Chilled coconut water', price: 1000, category: 'Drinks', available: true },
];

// ─── Demo: Customer Orders ────────────────────────────────────────────────────

const dayAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();

export const DEMO_ORDER_HISTORY: Order[] = [
  {
    id: 'demo_hist_001',
    status: 'SERVED',
    items: [
      { id: '1', name: 'Jollof Rice with Chicken', price: 3500, quantity: 1 },
      { id: '8', name: 'Chapman', price: 1500, quantity: 2 },
    ],
    subtotal: 6500, deliveryFee: 500, total: 7000,
    branchId: 'branch-1', branchName: 'FoodChain Victoria Island',
    orderType: 'delivery',
    deliveryAddress: localStorage.getItem('foodchain_delivery_location') || '12 Admiralty Way, Lekki Phase 1, Lagos',
    customerName: 'Demo Customer', phoneNumber: '08012345678',
    paymentMethod: 'card',
    placedAt: dayAgo(2),
    orderDate: new Date(Date.now() - 2 * 24 * 60 * 60_000).toLocaleDateString('en-NG'),
    deliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60_000).toLocaleDateString('en-NG'),
  },
  {
    id: 'demo_hist_002',
    status: 'SERVED',
    items: [
      { id: '4', name: 'Suya Platter', price: 4000, quantity: 1 },
      { id: '7', name: 'Fried Plantain', price: 1200, quantity: 1 },
      { id: '9', name: 'Fresh Coconut Water', price: 1000, quantity: 1 },
    ],
    subtotal: 6200, deliveryFee: 0, total: 6200,
    branchId: 'branch-2', branchName: 'FoodChain Lekki',
    orderType: 'dine-in', tableNumber: '7',
    customerName: 'Demo Customer', phoneNumber: '08012345678',
    paymentMethod: 'cash',
    placedAt: dayAgo(5),
    orderDate: new Date(Date.now() - 5 * 24 * 60 * 60_000).toLocaleDateString('en-NG'),
  },
];

// ─── Demo: Active Order (persisted) ──────────────────────────────────────────

const ACTIVE_ORDER_KEY = 'foodchain_demo_active_order';

export function saveDemoActiveOrder(order: Order): void {
  localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(order));
}

export function getDemoActiveOrder(): Order | null {
  const stored = localStorage.getItem(ACTIVE_ORDER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as Order;
  } catch {
    return null;
  }
}

export function clearDemoActiveOrder(): void {
  localStorage.removeItem(ACTIVE_ORDER_KEY);
}
