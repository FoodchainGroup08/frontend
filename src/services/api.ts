import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const TOKEN_KEY = 'foodchain_token';
export const REFRESH_TOKEN_KEY = 'foodchain_refresh_token';

export const apiClient = axios.create({ baseURL: BASE_URL });


apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        originalRequest._retry = true;
        try {
          // Use raw axios (not apiClient) to avoid interceptor loop
          const r = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = r.data.accessToken as string;
          const newRefreshToken = r.data.refreshToken as string | undefined;
          localStorage.setItem(TOKEN_KEY, newAccessToken);
          if (newRefreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newAccessToken}`,
          };
          return apiClient(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
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
  branchId?: string | null;
  addressLine?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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
  itemCount?: number;
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
  averagePrepTime?: number;
  peakHour?: string;
  peakHourOrders?: number;
  completionRate?: number;
  dineInCount?: number;
  takeawayCount?: number;
  deliveryCount?: number;
}

export interface ManagerHistoryDay {
  branchId: string;
  date: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  inProgressOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  dineInCount: number;
  takeawayCount: number;
  deliveryCount: number;
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

export interface AuthMessageResponse {
  message: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

// ─── Response Mappers (backend → frontend shape) ───────────────────────────────
// Backend uses different field names and paths. These mappers normalise responses
// so all exported types stay unchanged and no UI component needs to be touched.

function mapBranch(b: any): Branch {
  return {
    id: b.id,
    name: b.name,
    address: b.address,
    location: b.address,
    distance: b.distanceKm != null ? `${Number(b.distanceKm).toFixed(1)} km` : b.distance,
    // Branch service returns hoursDisplay when no hours rows are configured.
    // Fall back through hours → hoursDisplay → placeholder.
    hours: (b.hours && b.hours !== 'Hours not set') ? b.hours : (b.hoursDisplay && b.hoursDisplay !== 'Hours not set') ? b.hoursDisplay : '—',
    rating: b.rating ?? 0,
    isOpen: b.isOpen ?? false,
    isActive: b.isActive ?? b.active ?? false,
    manager: b.manager ?? b.managerId,
  };
}

function mapMenuItem(m: any): MenuItem {
  return {
    id: m.id,
    name: m.name,
    description: m.description ?? '',
    // Backend uses `basePrice`, frontend type uses `price`
    price: m.price ?? m.basePrice ?? 0,
    // Backend returns `categoryName` string, frontend type uses `category`
    category: m.category ?? m.categoryName ?? '',
    // Backend uses `active`, frontend type uses `available`
    available: m.available ?? m.active ?? false,
    isActive: m.isActive ?? m.active ?? false,
    imageUrl: m.imageUrl ?? m.image,
    image: m.image ?? m.imageUrl,
  };
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

// Backend role enum → frontend display string
function mapUserRole(raw: string): UserRole {
  switch (raw) {
    case 'CUSTOMER':          return 'Customer';
    case 'KITCHEN_STAFF':     return 'Kitchen Staff';
    case 'BRANCH_MANAGER':    return 'Branch Manager';
    case 'HEAD_OFFICE_ADMIN': return 'Admin';
    case 'ADMIN':             return 'Admin';
    default:                  return raw as UserRole;
  }
}

function mapUser(u: any): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: mapUserRole(u.role),
    branchId: u.branchId ?? null,
    addressLine: u.addressLine ?? null,
    latitude: u.latitude ?? null,
    longitude: u.longitude ?? null,
  };
}

// Backend returns the created user only. Customers are not tied to a branch,
// so branchId is sent as null for the CUSTOMER role.
export const postRegister = (name: string, email: string, password: string) =>
  apiClient.post<any>('/auth/register', {
    name,
    email,
    password,
    role: 'CUSTOMER',
    branchId: null,
  }).then(r => mapUser(r.data));

export const postLogin = (email: string, password: string) =>
  apiClient.post<any>('/auth/login', { email, password }).then(r => ({
    // Backend returns `accessToken`; `token` is a documented alias — handle both.
    token: (r.data.accessToken ?? r.data.token) as string,
    refreshToken: r.data.refreshToken as string | undefined,
    user: mapUser(r.data.user),
  }));

// Backend requires refreshToken in the body to fully invalidate the session.
export const postLogout = (refreshToken?: string) =>
  apiClient.post('/auth/logout', refreshToken ? { refreshToken } : {}).then(r => r.data);

export const getMe = () =>
  apiClient.get<any>('/users/me').then(r => mapUser(r.data));

export const updateProfile = (data: { name?: string; addressLine?: string; latitude?: number; longitude?: number }) =>
  apiClient.patch<any>('/users/me', data).then(r => mapUser(r.data));

export const postForgotPassword = (email: string) =>
  apiClient.post<AuthMessageResponse>('/auth/forgot-password', { email }).then(r => r.data);

export const postResetPassword = (token: string, newPassword: string) =>
  apiClient.post<AuthMessageResponse>('/auth/reset-password', { token, newPassword }).then(r => r.data);

// GET with token as query param — matches the backend endpoint exactly.
export const getVerifyEmail = (token: string) =>
  apiClient.get<AuthMessageResponse>('/auth/verify-email', { params: { token } }).then(r => r.data);

// Resends the verification email. Response is always a generic success message
// regardless of whether the email exists (backend prevents user enumeration).
export const postResendVerification = (email: string) =>
  apiClient.post<AuthMessageResponse>('/auth/resend-verification', { email }).then(r => r.data);

export const postRefreshToken = (refreshToken: string): Promise<AuthResponse> =>
  apiClient.post<any>('/auth/refresh', { refreshToken }).then(r => ({
    accessToken: r.data.accessToken as string,
    refreshToken: r.data.refreshToken as string,
    tokenType: r.data.tokenType as string,
    expiresIn: r.data.expiresIn as number,
    user: mapUser(r.data.user),
  }));

// Exchanges a Google Identity Services credential (ID token) for app tokens.
export const postGoogleAuth = (credential: string): Promise<AuthResponse> =>
  apiClient.post<any>('/auth/google', { credential }).then(r => ({
    accessToken: r.data.accessToken as string,
    refreshToken: r.data.refreshToken as string,
    tokenType: r.data.tokenType as string,
    expiresIn: r.data.expiresIn as number,
    user: mapUser(r.data.user),
  }));


// ─── Order response mappers ───────────────────────────────────────────────────

function normaliseOrderType(raw: string): 'dine-in' | 'takeaway' | 'delivery' {
  switch (raw?.toUpperCase?.()) {
    case 'DINE_IN': return 'dine-in';
    case 'TAKEAWAY': return 'takeaway';
    case 'DELIVERY': return 'delivery';
    default: return (raw as any) ?? 'dine-in';
  }
}

// Maps backend-only statuses to the nearest frontend-visible value so the
// order tracker never receives an unknown enum string.
function normaliseOrderStatus(raw: string): OrderStatus {
  switch (raw) {
    case 'RECEIVED':
    case 'PREPARING':
    case 'READY':
    case 'PICKED_UP':
    case 'SERVED':
      return raw as OrderStatus;
    case 'PAYMENT_PENDING': return 'RECEIVED';
    case 'CONFIRMED':       return 'RECEIVED';
    case 'COMPLETED':       return 'PICKED_UP';
    default:                return 'RECEIVED';
  }
}

function mapOrderItem(i: any): OrderItem {
  return {
    id: i.id ?? i.menuItemId ?? '',
    name: i.name ?? i.menuItemName ?? '',
    price: i.price ?? i.unitPrice ?? 0,
    quantity: i.quantity ?? 1,
  };
}

function mapOrder(o: any): Order {
  return {
    id: o.id,
    status: normaliseOrderStatus(o.status),
    items: (o.items ?? []).map(mapOrderItem),
    itemCount: o.itemCount,
    subtotal: o.subtotal ?? o.totalAmount ?? 0,
    deliveryFee: o.deliveryFee ?? 0,
    total: o.total ?? o.totalAmount ?? 0,
    branchId: o.branchId ?? '',
    branchName: o.branchName ?? '',
    orderType: normaliseOrderType(o.orderType),
    tableNumber: o.tableNumber,
    deliveryAddress: o.deliveryAddress,
    customerName: o.customerName ?? '',
    phoneNumber: o.phoneNumber,
    specialInstructions: o.specialInstructions,
    estimatedTime: o.estimatedTime,
    placedAt: o.placedAt ?? o.createdAt ?? new Date().toISOString(),
    paymentMethod: o.paymentMethod,
  };
}

// ─── BRANCHES ─────────────────────────────────────────────────────────────────
// Backend path is /branch (singular). Responses are mapped via mapBranch().
// List endpoints return a Spring Page object — content array is extracted.

export const getBranches = () =>
  apiClient.get<any>('/branches').then((r) => {
    const items: any[] = r.data?.content ?? (Array.isArray(r.data) ? r.data : []);
    return items.map(mapBranch);
  });

export const getBranchesNearby = (lat: number, lng: number) =>
  apiClient
    .get<any[]>('/branches/nearby', { params: { lat, lng } })
    .then((r) => (r.data ?? []).map(mapBranch));

export const getBranchById = (id: string) =>
  apiClient.get<any>(`/branches/${id}`).then((r) => mapBranch(r.data));

export const createBranch = (data: Partial<Branch>) =>
  apiClient.post<any>('/branches', data).then((r) => mapBranch(r.data));

export const updateBranch = (id: string, data: Partial<Branch>) =>
  apiClient.put<any>(`/branches/${id}`, data).then((r) => mapBranch(r.data));

// Backend uses separate /activate and /deactivate endpoints.
// The frontend contract used PATCH /branches/:id/status with { isActive: boolean }.
// This adapter preserves the same function signature while calling the correct backend endpoints.
export const patchBranchStatus = (id: string, isActive: boolean) =>
  apiClient
    .patch<any>(`/branches/${id}/${isActive ? 'activate' : 'deactivate'}`)
    .then((r) => mapBranch(r.data));

export const getBranchesPublic = (): Promise<Branch[]> =>
  apiClient.get<any>('/branches').then((r) => {
    const items: any[] = r.data?.content ?? (Array.isArray(r.data) ? r.data : []);
    return items.map(mapBranch);
  });

// ─── MENU ─────────────────────────────────────────────────────────────────────
// All paths include /v1/ — the menu service uses that as an internal prefix.
// Gateway base is /api so full URL becomes /api/menu/...
// Branch menu endpoint returns FrontendMenuItemResponse (price/category/available)
// which already matches MenuItem type — no remapping needed.
// Admin write endpoints use MenuItemResponse (basePrice/categoryName/active) —
// mapped via mapMenuItem(). Write ops require HEAD_OFFICE_ADMIN role.

export const getMenuByBranch = (branchId: string) =>
  apiClient
    .get<any[]>(`/menu/branch/${branchId}`)
    .then((r) => (r.data ?? []).map(mapMenuItem));

// Admin: paginated full item list with optional categoryId / active filters.
export const getAllMenuItems = (params?: { categoryId?: string; active?: boolean; page?: number; size?: number }) =>
  apiClient.get<any>('/menu/items', { params }).then((r) => {
    const items: any[] = r.data?.content ?? (Array.isArray(r.data) ? r.data : []);
    return items.map(mapMenuItem);
  });

export const getMenuItemById = (id: string) =>
  apiClient.get<any>(`/menu/items/${id}`).then((r) => mapMenuItem(r.data));

// Returns CategoryResponse[] with id, name, displayOrder, active.
// namesOnly=true returns plain string[] — used for display-only dropdowns.
export const getCategories = (): Promise<string[]> =>
  apiClient.get<any>('/menu/categories', { params: { namesOnly: true } }).then((r) => {
    const data: any[] = Array.isArray(r.data) ? r.data : [];
    return data.map((c) => (typeof c === 'string' ? c : String(c.name ?? c)));
  });

// Returns full CategoryResponse objects so admin can access category UUIDs.
export const getCategoriesFull = () =>
  apiClient.get<any>('/menu/categories').then((r): Array<{ id: string; name: string; displayOrder: number; active: boolean }> =>
    Array.isArray(r.data) ? r.data : []
  );

// Admin write — create/update send basePrice (not price) and categoryId (UUID, not name).
export const createMenuItem = (data: { name: string; description?: string; categoryId: string; price: number; imageUrl?: string }) =>
  apiClient.post<any>('/menu/items', {
    name: data.name,
    description: data.description,
    categoryId: data.categoryId,
    basePrice: data.price,
    imageUrl: data.imageUrl,
  }).then((r) => mapMenuItem(r.data));

export const updateMenuItem = (id: string, data: { name?: string; description?: string; categoryId?: string; price?: number; imageUrl?: string }) =>
  apiClient.put<any>(`/menu/items/${id}`, {
    name: data.name,
    description: data.description,
    categoryId: data.categoryId,
    basePrice: data.price,
    imageUrl: data.imageUrl,
  }).then((r) => mapMenuItem(r.data));

export const deleteMenuItem = (id: string) =>
  apiClient.delete(`/menu/items/${id}`).then((r) => r.data);

export const activateMenuItem = (id: string) =>
  apiClient.patch<any>(`/menu/items/${id}/activate`).then((r) => mapMenuItem(r.data));

export const deactivateMenuItem = (id: string) =>
  apiClient.patch<any>(`/menu/items/${id}/deactivate`).then((r) => mapMenuItem(r.data));

export const toggleMenuItemAvailability = (id: string) =>
  apiClient.patch<any>(`/menu/items/${id}/toggle`).then((r) => mapMenuItem(r.data));

export const createCategory = (name: string, displayOrder?: number) =>
  apiClient.post<any>('/menu/categories', { name, displayOrder }).then((r) => r.data);

export const updateCategory = (id: string, data: { name?: string; displayOrder?: number }) =>
  apiClient.put<any>(`/menu/categories/${id}`, data).then((r) => r.data);

export const getMenuSuggestions = (params?: { preferences?: string[]; limit?: number }) =>
  apiClient.post<any>('/menu/suggestions', params ?? {}).then((r) => (r.data ?? []).map(mapMenuItem));

export const uploadMenuItemImage = async (id: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const r = await apiClient.post<any>(`/menu/items/${id}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return mapMenuItem(r.data);
};

export const deleteMenuItemImage = (id: string) =>
  apiClient.delete<any>(`/menu/items/${id}/image`).then((r) => mapMenuItem(r.data));

// ─── ORDERS (Customer) ────────────────────────────────────────────────────────

// TODO (backend): Backend CreateOrderRequest requires customerId (must be extracted
// from JWT server-side, not sent by client), menuItemName, and unitPrice per item
// (must be looked up from menu-service server-side). Frontend only sends menuItemId
// and quantity. The order service must resolve the rest internally.
// TODO (backend): orderType values — frontend sends 'delivery'|'dine-in'|'takeaway',
// backend enum is DINE_IN|TAKEAWAY|DELIVERY. Backend must accept both casings or
// document the exact expected format.
export const placeOrder = (payload: PlaceOrderPayload) =>
  apiClient.post<any>('/orders', payload).then(r => mapOrder(r.data));

// Backend returns Page<OrderListResponse> (backend bug B7) — extract first item.
export const getActiveOrder = (): Promise<Order | null> =>
  apiClient.get<any>('/orders/active').then(r => {
    const data = r.data;
    if (data?.content && Array.isArray(data.content)) {
      return data.content.length > 0 ? mapOrder(data.content[0]) : null;
    }
    return data ? mapOrder(data) : null;
  });

export const getOrderHistory = (): Promise<Order[]> =>
  apiClient.get<any>('/orders/history').then(r => {
    const data = r.data;
    if (data?.content && Array.isArray(data.content)) return data.content.map(mapOrder);
    return Array.isArray(data) ? data.map(mapOrder) : [];
  });

export const getOrderById = (id: string) =>
  apiClient.get<any>(`/orders/${id}`).then(r => mapOrder(r.data));

export const cancelOrder = (id: string) =>
  apiClient.post(`/orders/${id}/cancel`).then(r => r.data);

// TODO (backend): Kitchen service not yet built.
// Required: GET /kitchen/queue, PATCH /kitchen/orders/:id/status
// ─── KITCHEN ──────────────────────────────────────────────────────────────────

export const getKitchenQueue = () =>
  apiClient.get<any>('/kitchen/queue').then(r => {
    const data = r.data;
    if (data?.content && Array.isArray(data.content)) return data.content as KitchenOrder[];
    return (Array.isArray(data) ? data : []) as KitchenOrder[];
  });

export const updateOrderStatus = (orderId: string, newStatus: 'PREPARING' | 'READY') =>
  apiClient.patch(`/kitchen/orders/${orderId}/status`, { status: newStatus }).then(r => r.data);

// ─── MANAGER ──────────────────────────────────────────────────────────────────

export const getManagerDashboard = (date?: string) =>
  apiClient.get<any>('/manager/dashboard', { params: date ? { date } : undefined })
    .then(r => {
      const d = r.data;
      return {
        ...d,
        totalRevenue: Math.round((d.totalRevenue ?? 0) / 100),
        averageOrderValue: Math.round((d.averageOrderValue ?? 0) / 100),
      } as ManagerDashboard;
    });

export const getManagerLiveOrders = () =>
  apiClient.get<any>('/manager/orders/live').then(r => {
    const data = r.data;
    const rows: any[] = data?.content ?? (Array.isArray(data) ? data : []);
    return rows.map(mapOrder);
  });

export const getDailySales = (date?: string) =>
  apiClient.get<any>('/manager/sales/daily', { params: date ? { date } : undefined }).then(r => {
    const data = r.data;
    const rows: HourlySales[] = Array.isArray(data) ? data : data?.content ?? [];
    return rows.map(h => ({ ...h, revenue: Math.round((h.revenue ?? 0) / 100) }));
  });

export const getPopularItems = (date?: string) =>
  apiClient.get<any>('/manager/items/popular', { params: date ? { date } : undefined }).then(r => {
    const data = r.data;
    const rows: PopularItem[] = Array.isArray(data) ? data : data?.content ?? [];
    return rows.map(item => ({ ...item, revenue: Math.round((item.revenue ?? 0) / 100) }));
  });

export const getManagerHistory = (from?: string, to?: string) =>
  apiClient.get<any>('/manager/summary/history', {
    params: { ...(from && { from }), ...(to && { to }) },
  }).then(r => {
    const data = r.data;
    const rows: ManagerHistoryDay[] = Array.isArray(data) ? data : data?.content ?? [];
    return rows.map(d => ({
      ...d,
      totalRevenue: Math.round((d.totalRevenue ?? 0) / 100),
      avgOrderValue: Math.round((d.avgOrderValue ?? 0) / 100),
    }));
  });

// TODO (backend): Admin analytics and user management service not yet built.
// Required: GET /admin/analytics, GET /admin/analytics/branches,
// GET /admin/users, PATCH /admin/users/:id/status
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
