import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
export const TOKEN_KEY = 'foodchain_token';

export const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'Customer' | 'Kitchen Staff' | 'Branch Manager' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  location?: string;
  distance?: string;
  hours: string;
  rating: number;
  isOpen: boolean;
  isActive: boolean;
  manager?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  isActive?: boolean;
  imageUrl?: string;
  image?: string;
}

export type OrderStatus = 'RECEIVED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'SERVED';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  branchId: string;
  branchName: string;
  orderType: 'delivery' | 'dine-in' | 'takeaway';
  tableNumber?: string;
  deliveryAddress?: string;
  customerName: string;
  phoneNumber?: string;
  specialInstructions?: string;
  estimatedTime?: string;
  placedAt: string;
  orderDate?: string;
  deliveryDate?: string;
  paymentMethod?: string;
}

export interface PlaceOrderPayload {
  branchId: string;
  orderType: 'delivery' | 'dine-in' | 'takeaway';
  tableNumber?: string;
  deliveryAddress?: string;
  items: Array<{ menuItemId: string; quantity: number }>;
  customerName?: string;
  phoneNumber?: string;
  paymentMethod?: string;
  specialInstructions?: string;
}

export interface KitchenOrder {
  id: string;
  status: 'received' | 'preparing' | 'ready';
  items: Array<{ id: string; name: string; quantity: number; specialInstructions?: string }>;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  receivedAt: string;
  isNew?: boolean;
  isUrgent?: boolean;
  customerName?: string;
}

export interface ManagerDashboard {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersChange?: number;
  revenueChange?: number;
}

export interface HourlySales {
  hour: string;
  revenue: number;
  orders: number;
}

export interface PopularItem {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  trend: number;
}

export interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  ordersChange?: number;
  revenueChange?: number;
}

export interface BranchAnalytics {
  name: string;
  orders: number;
  revenue: number;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  branch?: string;
  branchId?: string;
}

export interface WsOrderUpdate {
  orderId: string;
  branchId: string;
  customerId: string;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  updatedBy: string;
  timestamp: string;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const postRegister = (name: string, email: string, password: string) =>
  apiClient.post<{ token: string; user: User }>('/auth/register', { name, email, password }).then(r => r.data);

export const postLogin = (email: string, password: string) =>
  apiClient.post<{ token: string; user: User }>('/auth/login', { email, password }).then(r => r.data);

export const postLogout = () =>
  apiClient.post('/auth/logout').then(r => r.data);

export const getMe = () =>
  apiClient.get<User>('/auth/me').then(r => r.data);

export const postForgotPassword = (email: string) =>
  apiClient.post('/auth/forgot-password', { email }).then(r => r.data);

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_BRANCHES: Branch[] = [
  {
    id: 'branch-1',
    name: 'FoodChain Victoria Island',
    address: '15 Akin Adesola Street, Victoria Island, Lagos',
    hours: '8:00 AM - 10:00 PM',
    rating: 4.8,
    isOpen: true,
    isActive: true,
    distance: '2.3 km'
  },
  {
    id: 'branch-2',
    name: 'FoodChain Lekki',
    address: '32 Admiralty Way, Lekki Phase 1, Lagos',
    hours: '9:00 AM - 11:00 PM',
    rating: 4.6,
    isOpen: true,
    isActive: true,
    distance: '5.1 km'
  },
  {
    id: 'branch-3',
    name: 'FoodChain Ikeja',
    address: '21 Allen Avenue, Ikeja, Lagos',
    hours: '7:00 AM - 9:00 PM',
    rating: 4.7,
    isOpen: false,
    isActive: true,
    distance: '8.5 km'
  },
  {
    id: 'branch-4',
    name: 'FoodChain Ikoyi',
    address: '45 Awolowo Road, Ikoyi, Lagos',
    hours: '8:00 AM - 10:00 PM',
    rating: 4.9,
    isOpen: true,
    isActive: true,
    distance: '3.2 km'
  },
  {
    id: 'branch-5',
    name: 'FoodChain Surulere',
    address: '18 Adeniran Ogunsanya Street, Surulere, Lagos',
    hours: '7:00 AM - 10:00 PM',
    rating: 4.5,
    isOpen: true,
    isActive: true,
    distance: '10.2 km'
  },
  {
    id: 'branch-6',
    name: 'FoodChain Yaba',
    address: '52 Herbert Macaulay Way, Yaba, Lagos',
    hours: '8:00 AM - 9:00 PM',
    rating: 4.4,
    isOpen: true,
    isActive: true,
    distance: '12.0 km'
  },
  {
    id: 'branch-7',
    name: 'FoodChain Ajah',
    address: '7 Lekki-Epe Expressway, Ajah, Lagos',
    hours: '9:00 AM - 11:00 PM',
    rating: 4.6,
    isOpen: true,
    isActive: true,
    distance: '15.8 km'
  },
  {
    id: 'branch-8',
    name: 'FoodChain Maryland',
    address: '34 Ikorodu Road, Maryland, Lagos',
    hours: '7:00 AM - 9:00 PM',
    rating: 4.3,
    isOpen: true,
    isActive: true,
    distance: '11.5 km'
  },
  {
    id: 'branch-9',
    name: 'FoodChain Festac',
    address: '22 Second Avenue, Festac Town, Lagos',
    hours: '8:00 AM - 10:00 PM',
    rating: 4.5,
    isOpen: false,
    isActive: true,
    distance: '18.3 km'
  }
];

const DEMO_MENU: MenuItem[] = [
  { id: '1', name: 'Jollof Rice with Chicken', description: 'Spicy Nigerian jollof rice served with grilled chicken', price: 3500, category: 'Mains', available: true, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400' },
  { id: '2', name: 'Fried Rice Combo', description: 'Delicious fried rice with beef and plantain', price: 3200, category: 'Mains', available: true, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400' },
  { id: '3', name: 'Egusi Soup & Pounded Yam', description: 'Traditional melon soup with smooth pounded yam', price: 2800, category: 'Soups', available: true, image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400' },
  { id: '4', name: 'Suya Platter', description: 'Spicy grilled beef suya with onions and tomatoes', price: 4000, category: 'Grills', available: true, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400' },
  { id: '5', name: 'Pepper Soup', description: 'Spicy Nigerian pepper soup with assorted meat', price: 2500, category: 'Soups', available: true, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400' },
  { id: '6', name: 'Grilled Chicken', description: 'Perfectly seasoned grilled chicken', price: 3800, category: 'Grills', available: true, image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400' },
  { id: '7', name: 'Fried Plantain', description: 'Sweet fried plantain slices', price: 1200, category: 'Sides', available: true, image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400' },
  { id: '8', name: 'Chapman', description: 'Refreshing Nigerian cocktail drink', price: 1500, category: 'Drinks', available: true, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400' },
  { id: '9', name: 'Fresh Coconut Water', description: 'Chilled coconut water', price: 1000, category: 'Drinks', available: true, image: 'https://images.unsplash.com/photo-1564538724971-5aed61b928ba?w=400' }
];

// Helper to check if we're in demo mode
const isDemoMode = () => localStorage.getItem('foodchain_demo_mode') === 'true';

// Wrapper to handle network errors with demo fallback
const withDemoFallback = async <T,>(apiCall: () => Promise<T>, demoData: T): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    if (isDemoMode() || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return demoData;
    }
    throw error;
  }
};

// ─── BRANCHES ─────────────────────────────────────────────────────────────────

export const getBranches = () =>
  withDemoFallback(
    () => apiClient.get<Branch[]>('/branches').then(r => r.data),
    DEMO_BRANCHES
  );

export const getBranchesNearby = (lat: number, lng: number) =>
  withDemoFallback(
    () => apiClient.get<Branch[]>('/branches/nearby', { params: { lat, lng } }).then(r => r.data),
    DEMO_BRANCHES
  );

export const getBranchById = (id: string) =>
  apiClient.get<Branch>(`/branches/${id}`).then(r => r.data);

export const createBranch = (data: Partial<Branch>) =>
  apiClient.post<Branch>('/branches', data).then(r => r.data);

export const updateBranch = (id: string, data: Partial<Branch>) =>
  apiClient.put<Branch>(`/branches/${id}`, data).then(r => r.data);

export const patchBranchStatus = (id: string, isActive: boolean) =>
  apiClient.patch<Branch>(`/branches/${id}/status`, { isActive }).then(r => r.data);

// ─── MENU ─────────────────────────────────────────────────────────────────────

export const getMenuByBranch = (branchId: string) =>
  withDemoFallback(
    () => apiClient.get<MenuItem[]>(`/menu/branch/${branchId}`).then(r => r.data),
    DEMO_MENU
  );

export const getAllMenuItems = () =>
  apiClient.get<MenuItem[]>('/menu').then(r => r.data);

export const getCategories = () =>
  apiClient.get<string[]>('/menu/categories').then(r => r.data);

export const createMenuItem = (data: Partial<MenuItem>) =>
  apiClient.post<MenuItem>('/menu', data).then(r => r.data);

export const updateMenuItem = (id: string, data: Partial<MenuItem>) =>
  apiClient.put<MenuItem>(`/menu/${id}`, data).then(r => r.data);

export const deleteMenuItem = (id: string) =>
  apiClient.delete(`/menu/${id}`).then(r => r.data);

export const toggleMenuItemAvailability = (id: string) =>
  apiClient.patch<MenuItem>(`/menu/${id}/availability`).then(r => r.data);

// ─── ORDERS (Customer) ────────────────────────────────────────────────────────

export const placeOrder = (payload: PlaceOrderPayload) =>
  apiClient.post<Order>('/orders', payload).then(r => r.data);

export const getActiveOrder = () =>
  apiClient.get<Order | null>('/orders/active').then(r => r.data);

export const getOrderHistory = () =>
  apiClient.get<Order[]>('/orders/history').then(r => r.data);

export const getOrderById = (id: string) =>
  apiClient.get<Order>(`/orders/${id}`).then(r => r.data);

export const cancelOrder = (id: string) =>
  apiClient.post(`/orders/${id}/cancel`).then(r => r.data);

// ─── KITCHEN ──────────────────────────────────────────────────────────────────

export const getKitchenQueue = () =>
  apiClient.get<KitchenOrder[]>('/kitchen/queue').then(r => r.data);

export const updateOrderStatus = (orderId: string, newStatus: 'PREPARING' | 'READY') =>
  apiClient.patch(`/kitchen/orders/${orderId}/status`, { status: newStatus }).then(r => r.data);

// ─── MANAGER ──────────────────────────────────────────────────────────────────

export const getManagerDashboard = () =>
  apiClient.get<ManagerDashboard>('/manager/dashboard').then(r => r.data);

export const getManagerLiveOrders = () =>
  apiClient.get<Order[]>('/manager/orders/live').then(r => r.data);

export const getDailySales = (date: string) =>
  apiClient.get<HourlySales[]>('/manager/sales/daily', { params: { date } }).then(r => r.data);

export const getPopularItems = () =>
  apiClient.get<PopularItem[]>('/manager/items/popular').then(r => r.data);

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export const getAnalytics = (startDate?: string, endDate?: string) =>
  apiClient.get<Analytics>('/admin/analytics', { params: { startDate, endDate } }).then(r => r.data);

export const getBranchAnalytics = (startDate?: string, endDate?: string) =>
  apiClient.get<BranchAnalytics[]>('/admin/analytics/branches', { params: { startDate, endDate } }).then(r => r.data);

export const getAllUsers = (role?: string) =>
  apiClient.get<SystemUser[]>('/admin/users', { params: role ? { role } : undefined }).then(r => r.data);

export const patchUserStatus = (userId: string, status: 'active' | 'inactive') =>
  apiClient.patch(`/admin/users/${userId}/status`, { status }).then(r => r.data);

// ─── IMAGE UPLOAD ─────────────────────────────────────────────────────────────

export const uploadImage = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient
    .post<{ url: string }>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(r => r.data);
};
