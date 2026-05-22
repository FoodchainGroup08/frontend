import axios from 'axios';

// VITE_API_BASE_URL should include the full path (e.g. https://api.foodchain.live/api/v1).
// Falls back to /api/v1 in dev so the Vite proxy handles the request and avoids CORS.
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
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem('foodchain_user');
          window.dispatchEvent(new Event('foodchain:unauthorized'));
          return Promise.reject(error);
        }
      }
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('foodchain_user');
      window.dispatchEvent(new Event('foodchain:unauthorized'));
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

export interface BranchHour {
  id?: string;
  dayOfWeek: number; // 0=Monday … 6=Sunday
  dayName?: string;
  openTime: string;  // "08:00"
  closeTime: string; // "22:00"
  closed: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
  description?: string;
  managerId?: string;
  latitude?: number;
  longitude?: number;
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

export type OrderStatus =
  | 'PAYMENT_PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'PICKED_UP'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PAYMENT_PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  status: string;
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
  customerId?: string;
  customerName: string;
  phoneNumber?: string;
  specialInstructions?: string;
  estimatedTime?: string;
  placedAt: string;
  orderDate?: string;
  deliveryDate?: string;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  paymentReference?: string;
}

export interface PlaceOrderPayload {
  branchId: string;
  branchName?: string;
  orderType: 'delivery' | 'dine-in' | 'takeaway';
  tableNumber?: string;
  deliveryAddress?: string;
  customerName?: string;
  customerEmail?: string;
  phoneNumber?: string;
  paymentMethod?: string;
  specialInstructions?: string;
  notes?: string;
  items: Array<{
    menuItemId: string;
    menuItemName?: string;
    quantity: number;
    unitPrice?: number;
    specialInstructions?: string;
  }>;
}

export interface KitchenOrder {
  id: string;
  status: 'received' | 'preparing' | 'ready' | 'picked-up' | 'served';
  items: Array<{ id: string; name: string; quantity: number; specialInstructions?: string }>;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  receivedAt: string;
  notes?: string;
  isNew?: boolean;
  isUrgent?: boolean;
  customerName?: string;
}

const normalizeKitchenStatus = (status?: string): KitchenOrder['status'] => {
  const value = status?.toLowerCase().replace('_', '-');
  if (value === 'preparing' || value === 'ready' || value === 'picked-up' || value === 'served') return value;
  return 'received';
};

const normalizeKitchenOrderType = (orderType?: string): KitchenOrder['orderType'] => {
  const value = orderType?.toLowerCase().replace('_', '-');
  if (value === 'dine-in' || value === 'delivery') return value;
  return 'takeaway';
};

const mapKitchenOrder = (order: any): KitchenOrder => ({
  id: order.id ?? order.orderId,
  status: normalizeKitchenStatus(order.displayStatus ?? order.status),
  items: Array.isArray(order.items)
    ? order.items.map((item: any, i: number) => ({
        id: item.id ?? item.menuItemId ?? `${item.name ?? 'item'}-${i}`,
        name: item.name ?? item.menuItemName ?? 'Menu item',
        quantity: item.quantity ?? 1,
        specialInstructions: item.specialInstructions ?? undefined,
      }))
    : [],
  orderType: normalizeKitchenOrderType(order.displayOrderType ?? order.orderType),
  tableNumber: order.tableNumber ?? undefined,
  receivedAt: order.receivedAt ?? order.createdAt ?? new Date().toISOString(),
  notes: order.notes ?? undefined,
  isNew: order.isNew,
  isUrgent: order.isUrgent,
  customerName: order.customerName ?? undefined,
});

const looksLikeKitchenOrder = (value: any) =>
  value && typeof value === 'object' && !Array.isArray(value) &&
  (value.orderId || value.id) &&
  (Array.isArray(value.items) || value.status || value.displayStatus);

const extractKitchenOrders = (data: any): any[] => {
  if (Array.isArray(data)) {
    return data.some(looksLikeKitchenOrder) ? data : [];
  }

  if (!data || typeof data !== 'object') return [];

  const directCandidates = [
    data.content,
    data.orders,
    data.queue,
    data.data,
    data.data?.content,
    data.data?.orders,
    data.data?.queue,
    data.result,
    data.result?.content,
    data.result?.orders,
    data.result?.queue,
  ];

  for (const candidate of directCandidates) {
    const orders = extractKitchenOrders(candidate);
    if (orders.length > 0) return orders;
  }

  for (const value of Object.values(data)) {
    const orders = extractKitchenOrders(value);
    if (orders.length > 0) return orders;
  }

  return [];
};

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

// ─── AI Food Suggestions ──────────────────────────────────────────────────────

export interface FoodSuggestionRequest {
  branchId: string;
  branchName?: string;
  budget?: number;
  budgetUnlimited?: boolean;
  appetite?: 'light' | 'moderate' | 'heavy';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
  fulfillmentType?: 'pickup' | 'delivery' | 'dine-in';
  peopleCount?: number;
  limit?: number;
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  spiceLevel?: 'spice_mild' | 'spice_medium' | 'spice_hot' | null;
  moods?: string[];
}

// Legacy single-item types (kept for backward compat)
export interface FoodSuggestionItem {
  menuItemId: string;
  menuItemName: string;
  price: number;
  reason: string;
  branchId: string;
  branchName: string;
  estimatedTotalCost: number;
  optionalAddOns: string[];
}

export interface FoodSuggestionResponse {
  message: string;
  readyForSuggestions: boolean;
  questions: string[];
  suggestions: FoodSuggestionItem[];
  estimatedTotalCost: number;
}

// Enhanced combo types
export interface ComboItem {
  menuItemId: string;
  name: string;
  price: number;
}

export interface ComboSuggestion {
  comboName: string;
  items: ComboItem[];
  totalPrice: number;
  healthScore: number;
  wellnessTags: string[];
  reason: string;
  confidence: number;
}

export type RecommendationSource = 'GEMINI' | 'RULE_BASED' | 'NONE';

export interface AiRecommendationResponse {
  recommendationSource: RecommendationSource;
  fallbackUsed: boolean;
  message: string;
  readyForSuggestions: boolean;
  questions: string[];
  suggestions: ComboSuggestion[];
  estimatedTotalCost: number;
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
    phone: b.phone,
    description: b.description,
    managerId: b.managerId,
    latitude: b.latitude,
    longitude: b.longitude,
    location: b.address,
    distance: b.distanceKm != null ? `${Number(b.distanceKm).toFixed(1)} km` : b.distance,
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

// ─── Food Preferences ─────────────────────────────────────────────────────────

export interface UserFoodPreferences {
  dietary: string[];
  cuisines: string[];
  spice: string | null;
}

export const getFoodPreferences = (): Promise<UserFoodPreferences> =>
  apiClient.get<UserFoodPreferences>('/users/me/preferences').then(r => r.data);

export const updateFoodPreferences = (prefs: UserFoodPreferences): Promise<UserFoodPreferences> =>
  apiClient.put<UserFoodPreferences>('/users/me/preferences', prefs).then(r => r.data);

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

function normaliseOrderStatus(raw: string): string {
  switch (raw) {
    case 'PAYMENT_PENDING':
    case 'RECEIVED':
    case 'CONFIRMED':
    case 'PREPARING':
    case 'READY':
    case 'PICKED_UP':
    case 'SERVED':
    case 'COMPLETED':
    case 'CANCELLED':
      return raw;
    default:
      return raw ?? 'RECEIVED';
  }
}

function mapOrderItem(i: any): OrderItem {
  return {
    id: i.id ?? i.menuItemId ?? '',
    name: i.name ?? i.menuItemName ?? i.itemName ?? i.productName ?? i.menuItem?.name ?? '',
    price: i.price ?? i.unitPrice ?? i.basePrice ?? 0,
    quantity: i.quantity ?? 1,
  };
}

function mapOrder(o: any): Order {
  return {
    id: o.id ?? o.orderId ?? '',
    status: normaliseOrderStatus(o.status),
    items: (o.items ?? []).map(mapOrderItem),
    itemCount: o.itemCount,
    subtotal: o.subtotal ?? o.totalAmount ?? 0,
    deliveryFee: o.deliveryFee ?? 0,
    total: o.total ?? o.totalAmount ?? 0,
    branchId: o.branchId ?? o.branch?.id ?? '',
    branchName: o.branchName ?? o.branch?.name ?? o.branchDetails?.name ?? '',
    orderType: normaliseOrderType(o.orderType),
    tableNumber: o.tableNumber,
    deliveryAddress: o.deliveryAddress,
    customerId: o.customerId ?? o.userId ?? o.customer?.id,
    customerName: o.customerName ?? '',
    phoneNumber: o.phoneNumber,
    specialInstructions: o.specialInstructions,
    estimatedTime: o.estimatedTime,
    placedAt: o.placedAt ?? o.createdAt ?? new Date().toISOString(),
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus as PaymentStatus | undefined,
    paymentReference: o.paymentReference,
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

export const getBranchHours = (id: string): Promise<BranchHour[]> =>
  apiClient.get<any>(`/branches/${id}/hours`).then(r => r.data ?? []);

export const setBranchHours = (id: string, hours: Omit<BranchHour, 'id' | 'dayName'>[]): Promise<BranchHour[]> =>
  apiClient.put<any>(`/branches/${id}/hours`, hours).then(r => r.data ?? []);

export const getBranchesPublic = (): Promise<Branch[]> =>
  apiClient.get<any>('/branches').then((r) => {
    const items: any[] = r.data?.content ?? (Array.isArray(r.data) ? r.data : []);
    return items.map(mapBranch);
  });

export interface BranchTable {
  id: string;
  tableNumber: string | number;
  capacity: number;
  isAvailable: boolean;
}

// Expects GET /branches/{branchId}/tables returning an array or Spring Page of table objects.
export const getTablesByBranch = (branchId: string): Promise<BranchTable[]> =>
  apiClient.get<any>(`/branches/${branchId}/tables`).then(r => {
    const items: any[] = r.data?.content ?? r.data?.tables ?? (Array.isArray(r.data) ? r.data : []);
    return items.map(t => ({
      id: t.id ?? String(t.tableNumber ?? t.number),
      tableNumber: t.tableNumber ?? t.number ?? '?',
      capacity: t.capacity ?? t.seats ?? 4,
      isAvailable: t.isAvailable ?? t.available ?? true,
    }));
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

export const getFoodSuggestions = (request: FoodSuggestionRequest): Promise<AiRecommendationResponse> =>
  apiClient.post<AiRecommendationResponse>('/menu/suggestions', request).then((r) => r.data);

export const uploadMenuItemImage = async (id: string, file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  const r = await apiClient.post<any>(`/menu/items/${id}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return mapMenuItem(r.data);
};

export const deleteMenuItemImage = (id: string) =>
  apiClient.delete<any>(`/menu/items/${id}/image`).then((r) => mapMenuItem(r.data));

// ─── ORDERS (Customer) ────────────────────────────────────────────────────────

// customerId is resolved from the JWT by the gateway — never send it in the body.
// A fresh idempotency key is generated per call; retries should use the same key
// (callers that need retry-safe placement should generate the key themselves and
// pass it via a wrapper — this default is fine for the normal one-shot checkout flow).
export const placeOrder = (payload: PlaceOrderPayload) =>
  apiClient.post<any>('/orders', payload, {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  }).then(r => mapOrder(r.data));


export const getActiveOrders = (customerId?: string): Promise<Order[]> =>
  apiClient.get<any>('/orders/active', {
    params: { ...(customerId && { customerId }), size: 20 },
  }).then(r => {
    const data = r.data;
    let orders: Order[];
    if (data?.content && Array.isArray(data.content)) orders = data.content.map(mapOrder);
    else if (Array.isArray(data)) orders = data.map(mapOrder);
    else orders = data ? [mapOrder(data)] : [];
    return orders;
  });

// Same summary page shape as /orders/active.
export const getOrderHistory = (customerId?: string): Promise<Order[]> =>
  apiClient.get<any>('/orders/history', {
    params: { ...(customerId && { customerId }), size: 20 },
  }).then(r => {
    const data = r.data;
    if (data?.content && Array.isArray(data.content)) return data.content.map(mapOrder);
    return Array.isArray(data) ? data.map(mapOrder) : [];
  });

export const getOrderById = (id: string) =>
  apiClient.get<any>(`/orders/${id}`).then(r => mapOrder(r.data));

export const cancelOrder = (id: string, cancelledBy?: string, reason?: string) =>
  apiClient.post(`/orders/${id}/cancel`, { cancelledBy, reason }).then(r => r.data);

// ─── KITCHEN ──────────────────────────────────────────────────────────────────

export interface KitchenStatusGroup {
  total: number;
  page: number;
  size: number;
  orders: KitchenOrder[];
}

export interface KitchenQueuePage {
  branchId: string;
  page: number;
  size: number;
  received: KitchenStatusGroup;
  preparing: KitchenStatusGroup;
  ready: KitchenStatusGroup;
}

// Handles both the new paginated shape ({ orders: [...], total: N })
// and the old shape where a status group is a plain array.
const parseStatusGroup = (g: any, fallbackSize: number): KitchenStatusGroup => {
  if (Array.isArray(g)) {
    const orders = g.map(mapKitchenOrder);
    return { total: orders.length, page: 0, size: fallbackSize, orders };
  }
  if (!g || typeof g !== 'object') return { total: 0, page: 0, size: fallbackSize, orders: [] };
  const orders = Array.isArray(g.orders) ? g.orders.map(mapKitchenOrder) : [];
  return { total: g.total ?? orders.length, page: g.page ?? 0, size: g.size ?? fallbackSize, orders };
};

export const getKitchenQueue = (page = 0, size = 20): Promise<KitchenQueuePage> =>
  apiClient.get<any>('/kitchen/queue', { params: { page, size } }).then(r => {
    const d = r.data;

    if (d && typeof d === 'object') {
      // Accept both lowercase and uppercase keys (RECEIVED / received).
      // Also fires when groups are plain arrays (old format) — parseStatusGroup handles both.
      const receivedRaw  = d.received  ?? d.RECEIVED;
      const preparingRaw = d.preparing ?? d.PREPARING;
      const readyRaw     = d.ready     ?? d.READY;

      if (receivedRaw !== undefined || preparingRaw !== undefined || readyRaw !== undefined) {
        return {
          branchId: d.branchId ?? '',
          page: d.page ?? page,
          size: d.size ?? size,
          received:  parseStatusGroup(receivedRaw,  size),
          preparing: parseStatusGroup(preparingRaw, size),
          ready:     parseStatusGroup(readyRaw,     size),
        };
      }
    }

    // True legacy fallback: flat array or unrecognised envelope.
    // extractKitchenOrders stops at the first array it finds, so split by status
    // here rather than relying on the extractor to merge multiple groups.
    const allOrders = extractKitchenOrders(d).map(mapKitchenOrder);
    const byStatus = (s: KitchenOrder['status']) => allOrders.filter(o => o.status === s);
    const makeGroup = (orders: KitchenOrder[]): KitchenStatusGroup => ({ total: orders.length, page: 0, size, orders });
    return {
      branchId: '',
      page,
      size,
      received:  makeGroup(byStatus('received')),
      preparing: makeGroup(byStatus('preparing')),
      ready:     makeGroup(byStatus('ready')),
    };
  });

export const acceptKitchenOrder = (orderId: string) =>
  apiClient.post(`/kitchen/orders/${orderId}/accept`).then(r => r.data);

export const readyKitchenOrder = (orderId: string) =>
  apiClient.post(`/kitchen/orders/${orderId}/ready`).then(r => r.data);

export const pickupKitchenOrder = (orderId: string) =>
  apiClient.post(`/kitchen/orders/${orderId}/pickup`).then(r => r.data);

export const serveKitchenOrder = (orderId: string) =>
  apiClient.post(`/kitchen/orders/${orderId}/serve`).then(r => r.data);

export interface CompletedOrdersPage {
  page: number;
  size: number;
  total: number;
  orders: KitchenOrder[];
}

export const getCompletedKitchenOrders = (page = 0, size = 20): Promise<CompletedOrdersPage> =>
  apiClient.get<any>('/kitchen/orders/completed', { params: { page, size } }).then(r => {
    const d = r.data;
    const raw: any[] = Array.isArray(d)
      ? d
      : Array.isArray(d?.content)
        ? d.content
        : Array.isArray(d?.orders)
          ? d.orders
          : [];
    const orders = raw.map(mapKitchenOrder);
    return {
      page: d?.page ?? page,
      size: d?.size ?? size,
      total: d?.total ?? d?.totalElements ?? orders.length,
      orders,
    };
  });

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
    return rows.map(o => ({
      ...mapOrder(o),
      total: Math.round((o.total ?? 0) / 100),
      subtotal: Math.round((o.subtotal ?? o.totalAmount ?? 0) / 100),
      deliveryFee: Math.round((o.deliveryFee ?? 0) / 100),
    }));
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

// ─── ADMIN ────────────────────────────────────────────────────────────────────

// ── Admin analytics types ─────────────────────────────────────────────────────

export interface AdminOverview {
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  completionRate: number;
  cancellationRate: number;
  revenueGrowthPercent: number;
  ordersGrowthPercent: number;
  topPerformingBranch: string | null;
  fastestBranch: string | null;
  slowestBranch: string | null;
  totalBranches: number;
}

export interface AdminPopularItem {
  id: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

export interface BranchComparison {
  branchId: string;
  name?: string;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  completionRate: number;
  cancellationRate: number;
  avgPreparationTimeMinutes: number | null;
  topItems: AdminPopularItem[];
}

export interface TrendDataPoint {
  period: string;
  revenue: number;
  orders: number;
  avgPreparationTimeMinutes: number | null;
  completionRate: number | null;
}

export interface AdminTrends {
  startDate: string;
  endDate: string;
  interval: string;
  branchId: string | null;
  dataPoints: TrendDataPoint[];
}

export interface OrdersByStatusEntry {
  status: string;
  count: number;
  percentage: number;
}

export interface AdminOperational {
  ordersByStatus: OrdersByStatusEntry[];
  ordersByHour: Array<{ hour: string; revenue: number; orders: number }>;
  peakHour: string | null;
  totalOrders: number;
}

// ── Report types ──────────────────────────────────────────────────────────────

export type ReportType = 'BRANCH_PERFORMANCE' | 'SALES_SUMMARY' | 'ORDER_SUMMARY';

export interface GenerateReportRequest {
  reportType: ReportType;
  branchId?: string | null;
  startDate: string;
  endDate: string;
  requestedBy?: string;
}

export interface Report {
  id: number;
  reportType: string;
  branchId: string | null;
  startDate: string;
  endDate: string;
  generatedAt: string;
  generatedBy: string | null;
  totalOrders: number | null;
  completedOrders: number | null;
  cancelledOrders: number | null;
  inProgressOrders: number | null;
  totalRevenue: number | null;
  avgOrderValue: number | null;
  dineInCount: number | null;
  takeawayCount: number | null;
  deliveryCount: number | null;
  completionRate: number;
  cancellationRate: number;
}

export interface ReportListItem {
  id: number;
  reportType: string;
  branchId: string | null;
  startDate: string;
  endDate: string;
  generatedAt: string;
  generatedBy: string | null;
  totalRevenue: number | null;
  totalOrders: number | null;
}

// ── Notification types ────────────────────────────────────────────────────────

export interface AdminNotification {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: string;
  channel: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  status: string;
  isRead: boolean;
  retryCount: number;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

// ── Admin API functions ───────────────────────────────────────────────────────

export const getAnalytics = (startDate?: string, endDate?: string) =>
  apiClient.get<Analytics>('/admin/analytics', { params: { startDate, endDate } }).then(r => r.data);

export const getBranchAnalytics = (startDate?: string, endDate?: string) =>
  apiClient.get<BranchAnalytics[]>('/admin/analytics/branches', { params: { startDate, endDate } }).then(r => r.data);

export const getAdminOverview = (startDate?: string, endDate?: string, branchId?: string): Promise<AdminOverview> =>
  apiClient.get<any>('/admin/analytics/overview', { params: { startDate, endDate, branchId } }).then(r => ({
    ...r.data,
    totalRevenue: Number(r.data.totalRevenue ?? 0),
    avgOrderValue: Number(r.data.avgOrderValue ?? 0),
  }));

export const getBranchComparison = (startDate?: string, endDate?: string): Promise<BranchComparison[]> =>
  apiClient.get<any[]>('/admin/analytics/compare', { params: { startDate, endDate } }).then(r =>
    (r.data ?? []).map((b: any) => ({
      ...b,
      totalRevenue: Number(b.totalRevenue ?? 0),
      avgOrderValue: Number(b.avgOrderValue ?? 0),
    }))
  );

export const getAdminTrends = (startDate?: string, endDate?: string, interval?: string, branchId?: string): Promise<AdminTrends> =>
  apiClient.get<any>('/admin/analytics/trends', { params: { startDate, endDate, interval, branchId } }).then(r => ({
    ...r.data,
    dataPoints: (r.data.dataPoints ?? []).map((p: any) => ({
      ...p,
      revenue: Number(p.revenue ?? 0),
    })),
  }));

export const getAdminOperational = (startDate?: string, endDate?: string, branchId?: string): Promise<AdminOperational> =>
  apiClient.get<AdminOperational>('/admin/analytics/operational', { params: { startDate, endDate, branchId } }).then(r => r.data);

export const getAdminPopularItems = (startDate?: string, endDate?: string, limit = 10, branchId?: string): Promise<AdminPopularItem[]> =>
  apiClient.get<AdminPopularItem[]>('/admin/analytics/popular-items', { params: { startDate, endDate, limit, branchId } }).then(r => r.data ?? []);

export const getAllUsers = (role?: string) =>
  apiClient.get<SystemUser[]>('/admin/users', { params: role ? { role } : undefined }).then(r => r.data);

export const patchUserStatus = (userId: string, status: 'active' | 'inactive') =>
  apiClient.patch(`/admin/users/${userId}/status`, { status }).then(r => r.data);

// ── Reports ───────────────────────────────────────────────────────────────────

export const generateReport = (req: GenerateReportRequest): Promise<Report> =>
  apiClient.post<any>('/reports/generate', req).then(r => ({
    ...r.data,
    totalRevenue: Number(r.data.totalRevenue ?? 0),
    avgOrderValue: Number(r.data.avgOrderValue ?? 0),
  }));

export const getReports = (page = 0, size = 20): Promise<{ content: ReportListItem[]; totalElements: number; totalPages: number }> =>
  apiClient.get<any>('/reports', { params: { page, size } }).then(r => ({
    content: (r.data?.content ?? []).map((item: any) => ({
      ...item,
      totalRevenue: Number(item.totalRevenue ?? 0),
    })),
    totalElements: r.data?.totalElements ?? 0,
    totalPages: r.data?.totalPages ?? 0,
  }));

export const getReportById = (id: number): Promise<Report> =>
  apiClient.get<any>(`/reports/${id}`).then(r => ({
    ...r.data,
    totalRevenue: Number(r.data.totalRevenue ?? 0),
    avgOrderValue: Number(r.data.avgOrderValue ?? 0),
  }));

export const getReportsByBranch = (branchId: string): Promise<Report[]> =>
  apiClient.get<any[]>(`/reports/branch/${branchId}`).then(r =>
    (r.data ?? []).map((item: any) => ({
      ...item,
      totalRevenue: Number(item.totalRevenue ?? 0),
      avgOrderValue: Number(item.avgOrderValue ?? 0),
    }))
  );

// ── Notifications ─────────────────────────────────────────────────────────────

export const getNotifications = (page = 0, size = 20): Promise<{ content: AdminNotification[]; totalElements: number; totalPages: number }> =>
  apiClient.get<any>('/notifications', { params: { page, size } }).then(r => {
    const page_data = r.data?.data ?? r.data;
    return {
      content: page_data?.content ?? [],
      totalElements: page_data?.totalElements ?? 0,
      totalPages: page_data?.totalPages ?? 0,
    };
  });

export const getUnreadNotificationCount = (): Promise<number> =>
  apiClient.get<any>('/notifications/unread-count').then(r => r.data?.data ?? r.data ?? 0);

export const markNotificationRead = (id: number): Promise<AdminNotification> =>
  apiClient.patch<any>(`/notifications/${id}/read`).then(r => r.data?.data ?? r.data);

export const markAllNotificationsRead = (): Promise<number> =>
  apiClient.patch<any>('/notifications/read-all').then(r => r.data?.data ?? r.data ?? 0);

export const deleteNotification = (id: number): Promise<void> =>
  apiClient.delete(`/notifications/${id}`).then(() => undefined);

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
