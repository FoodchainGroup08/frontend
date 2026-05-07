import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';
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

export const postRegister = (name: string, email: string, password: string, role: string) =>
  apiClient.post<{ token: string; user: User }>('/auth/register', { name, email, password, role }).then(r => r.data);

export const postLogin = (email: string, password: string) =>
  apiClient.post<{ token: string; user: User }>('/auth/login', { email, password }).then(r => r.data);

export const postLogout = () =>
  apiClient.post('/auth/logout').then(r => r.data);

export const getMe = () =>
  apiClient.get<User>('/auth/me').then(r => r.data);

export const postForgotPassword = (email: string) =>
  apiClient.post('/auth/forgot-password', { email }).then(r => r.data);

// ─── BRANCHES ─────────────────────────────────────────────────────────────────

export const getBranches = () =>
  apiClient.get<Branch[]>('/branches').then(r => r.data);

export const getBranchesNearby = (lat: number, lng: number) =>
  apiClient.get<Branch[]>('/branches/nearby', { params: { lat, lng } }).then(r => r.data);

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
  apiClient.get<MenuItem[]>(`/menu/branch/${branchId}`).then(r => r.data);

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
