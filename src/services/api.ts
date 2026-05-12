import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { computeRoadDistancesKm } from './locationService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
export const TOKEN_KEY = 'foodchain_token';
export const REFRESH_TOKEN_KEY = 'foodchain_refresh_token';

export const apiClient = axios.create({ baseURL: BASE_URL });

/** Same prefix as REST API (e.g. .../api/v1). Prod gateway routes /api/v1/** ; /api/oauth2/** is often not exposed. */
export const getGoogleOAuthStartUrl = () => `${BASE_URL.replace(/\/$/, '')}/oauth2/authorization/google`;

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (storedToken) {
        let tokenExpiredOrInvalid = true;
        try {
          const { exp } = jwtDecode<{ exp: number }>(storedToken);
          tokenExpiredOrInvalid = Date.now() >= exp * 1000;
        } catch {
          // Non-JWT or corrupted string (e.g. stored "undefined") → treat as invalid
        }
        if (tokenExpiredOrInvalid) {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
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
  apiClient.get<any>('/auth/me').then(r => mapUser(r.data));

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


// ─── Demo Data ────────────────────────────────────────────────────────────────

// These are the two real branches seeded in the DB.
// Shown as fallback when the branch service is unavailable (gateway routing bug returns 500).
const DEMO_BRANCHES: Branch[] = [
  {
    id: '4d800a8a-970b-4b80-a1e6-315106f170a4',
    name: 'Uptown Express',
    address: '15 Akin Adesola Street, Victoria Island, Lagos',
    hours: '8:00 AM - 10:00 PM',
    rating: 4.8,
    isOpen: true,
    isActive: true,
    distance: '2.3 km'
  },
  {
    id: '63ae8d0f-4c7c-48ea-9ec2-805d0e7f9d8d',
    name: 'Downtown Kitchen',
    address: '32 Admiralty Way, Lekki Phase 1, Lagos',
    hours: '9:00 AM - 11:00 PM',
    rating: 4.6,
    isOpen: true,
    isActive: true,
    distance: '5.1 km'
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

// Returns true for any error that means the backend/service is unreachable or
// temporarily unavailable — used to decide whether to return demo data.
// Includes all 5xx so the branch service gateway routing bug (500) also falls back.
const isServiceUnavailable = (error: any): boolean => {
  const status: number | undefined = error.response?.status;
  return (
    error.code === 'ERR_NETWORK' ||
    !!error.message?.includes('Network Error') ||
    (status != null && status >= 500)
  );
};

// Wrapper to handle network/gateway errors with demo fallback
const withDemoFallback = async <T,>(apiCall: () => Promise<T>, demoData: T): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    if (isDemoMode() || isServiceUnavailable(error)) {
      return demoData;
    }
    throw error;
  }
};

// Like withDemoFallback but accepts an async producer for demo data (e.g. when computing distances)
const withAsyncDemoFallback = async <T,>(apiCall: () => Promise<T>, getDemoData: () => Promise<T>): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    if (isDemoMode() || isServiceUnavailable(error)) {
      return await getDemoData();
    }
    throw error;
  }
};

// ─── Demo branch distance helpers ────────────────────────────────────────────
// Approximate Lagos coordinates for each demo branch (used for Haversine sorting
// when the backend is unavailable and Google Maps Distance Matrix has no API key).

const DEMO_BRANCH_COORDS: Record<string, { lat: number; lng: number }> = {
  '4d800a8a-970b-4b80-a1e6-315106f170a4': { lat: 6.4281, lng: 3.4219 },  // Uptown Express — Victoria Island
  '63ae8d0f-4c7c-48ea-9ec2-805d0e7f9d8d': { lat: 6.4321, lng: 3.5197 },  // Downtown Kitchen — Lekki Phase 1
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function demoBranchesNearby(userLat: number, userLng: number): Promise<Branch[]> {
  // Try Google Maps Distance Matrix first for real road distances
  try {
    const destinations = DEMO_BRANCHES.map(b => ({
      id: b.id,
      address: b.address,
      ...DEMO_BRANCH_COORDS[b.id],
    }));
    const distMap = await computeRoadDistancesKm(userLat, userLng, destinations);
    if (distMap.size > 0) {
      return [...DEMO_BRANCHES]
        .map(b => {
          const d = distMap.get(b.id);
          return { ...b, distance: d ? `${d.km.toFixed(1)} km` : b.distance };
        })
        .sort((a, b) => {
          const da = distMap.get(a.id)?.km ?? 999;
          const db = distMap.get(b.id)?.km ?? 999;
          return da - db;
        });
    }
  } catch {
    // fall through to Haversine
  }

  // Fallback: straight-line Haversine sort
  return [...DEMO_BRANCHES]
    .map(b => {
      const coords = DEMO_BRANCH_COORDS[b.id];
      const km = coords ? haversineKm(userLat, userLng, coords.lat, coords.lng) : 999;
      return { ...b, distance: `${km.toFixed(1)} km` };
    })
    .sort((a, b) => {
      const coordsA = DEMO_BRANCH_COORDS[a.id];
      const coordsB = DEMO_BRANCH_COORDS[b.id];
      const da = coordsA ? haversineKm(userLat, userLng, coordsA.lat, coordsA.lng) : 999;
      const db = coordsB ? haversineKm(userLat, userLng, coordsB.lat, coordsB.lng) : 999;
      return da - db;
    });
}

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
  withDemoFallback(
    () =>
      apiClient.get<any>('/v1/branches').then((r) => {
        const items: any[] = r.data?.content ?? (Array.isArray(r.data) ? r.data : []);
        return items.map(mapBranch);
      }),
    DEMO_BRANCHES
  );

export const getBranchesNearby = (lat: number, lng: number) =>
  withAsyncDemoFallback(
    () =>
      apiClient
        .get<any[]>('/branches/nearby', { params: { lat, lng } })
        .then((r) => (r.data ?? []).map(mapBranch)),
    () => demoBranchesNearby(lat, lng)
  );

export const getBranchById = (id: string) =>
  apiClient.get<any>(`/v1/branches/${id}`).then((r) => mapBranch(r.data));

export const createBranch = (data: Partial<Branch>) =>
  apiClient.post<any>('/v1/branches', data).then((r) => mapBranch(r.data));

export const updateBranch = (id: string, data: Partial<Branch>) =>
  apiClient.put<any>(`/v1/branches/${id}`, data).then((r) => mapBranch(r.data));

// Backend uses separate /activate and /deactivate endpoints.
// The frontend contract used PATCH /branches/:id/status with { isActive: boolean }.
// This adapter preserves the same function signature while calling the correct backend endpoints.
export const patchBranchStatus = (id: string, isActive: boolean) =>
  apiClient
    .patch<any>(`/branches/${id}/${isActive ? 'activate' : 'deactivate'}`)
    .then((r) => mapBranch(r.data));

// Pre-auth branch fetch used on the registration form. Falls back to DEMO_BRANCHES
// on ANY error (401 because branches require auth through gateway, 500 due to
// gateway routing bug). In demo mode these are placeholder branches only.
export const getBranchesPublic = (): Promise<Branch[]> =>
  apiClient.get<any>('/v1/branches')
    .then((r) => {
      const items: any[] = r.data?.content ?? (Array.isArray(r.data) ? r.data : []);
      return items.map(mapBranch);
    })
    .catch(() => DEMO_BRANCHES);

// ─── MENU ─────────────────────────────────────────────────────────────────────
// All paths include /v1/ — the menu service uses that as an internal prefix.
// Gateway base is /api so full URL becomes /api/v1/menu/...
// Branch menu endpoint returns FrontendMenuItemResponse (price/category/available)
// which already matches MenuItem type — no remapping needed.
// Admin write endpoints use MenuItemResponse (basePrice/categoryName/active) —
// mapped via mapMenuItem(). Write ops require HEAD_OFFICE_ADMIN role.

// Customer: all active items for a branch (public catalogue, shared across branches).
// Falls back to demo menu on 5xx so customers can still browse when service is down.
export const getMenuByBranch = (branchId: string) =>
  withDemoFallback(
    () =>
      apiClient
        .get<any[]>(`/v1/menu/branch/${branchId}`)
        .then((r) => (r.data ?? []).map(mapMenuItem)),
    DEMO_MENU
  );

// Admin: paginated full item list with optional categoryId / active filters.
export const getAllMenuItems = (params?: { categoryId?: string; active?: boolean; page?: number; size?: number }) =>
  apiClient.get<any>('/v1/menu/items', { params }).then((r) => {
    const items: any[] = r.data?.content ?? (Array.isArray(r.data) ? r.data : []);
    return items.map(mapMenuItem);
  });

export const getMenuItemById = (id: string) =>
  apiClient.get<any>(`/v1/menu/items/${id}`).then((r) => mapMenuItem(r.data));

// Returns CategoryResponse[] with id, name, displayOrder, active.
// namesOnly=true returns plain string[] — used for display-only dropdowns.
export const getCategories = (): Promise<string[]> =>
  apiClient.get<any>('/v1/menu/categories', { params: { namesOnly: true } }).then((r) => {
    const data: any[] = Array.isArray(r.data) ? r.data : [];
    return data.map((c) => (typeof c === 'string' ? c : String(c.name ?? c)));
  });

// Returns full CategoryResponse objects so admin can access category UUIDs.
export const getCategoriesFull = () =>
  apiClient.get<any>('/v1/menu/categories').then((r): Array<{ id: string; name: string; displayOrder: number; active: boolean }> =>
    Array.isArray(r.data) ? r.data : []
  );

// Admin write — create/update send basePrice (not price) and categoryId (UUID, not name).
export const createMenuItem = (data: { name: string; description?: string; categoryId: string; price: number; imageUrl?: string }) =>
  apiClient.post<any>('/v1/menu/items', {
    name: data.name,
    description: data.description,
    categoryId: data.categoryId,
    basePrice: data.price,
    imageUrl: data.imageUrl,
  }).then((r) => mapMenuItem(r.data));

export const updateMenuItem = (id: string, data: { name?: string; description?: string; categoryId?: string; price?: number; imageUrl?: string }) =>
  apiClient.put<any>(`/v1/menu/items/${id}`, {
    name: data.name,
    description: data.description,
    categoryId: data.categoryId,
    basePrice: data.price,
    imageUrl: data.imageUrl,
  }).then((r) => mapMenuItem(r.data));

export const deleteMenuItem = (id: string) =>
  apiClient.delete(`/v1/menu/items/${id}`).then((r) => r.data);

export const activateMenuItem = (id: string) =>
  apiClient.patch<any>(`/v1/menu/items/${id}/activate`).then((r) => mapMenuItem(r.data));

export const deactivateMenuItem = (id: string) =>
  apiClient.patch<any>(`/v1/menu/items/${id}/deactivate`).then((r) => mapMenuItem(r.data));

export const toggleMenuItemAvailability = (id: string) =>
  apiClient.patch<any>(`/v1/menu/items/${id}/toggle`).then((r) => mapMenuItem(r.data));

export const createCategory = (name: string, displayOrder?: number) =>
  apiClient.post<any>('/v1/menu/categories', { name, displayOrder }).then((r) => r.data);

export const updateCategory = (id: string, data: { name?: string; displayOrder?: number }) =>
  apiClient.put<any>(`/v1/menu/categories/${id}`, data).then((r) => r.data);

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
  apiClient.get<KitchenOrder[]>('/kitchen/queue').then(r => r.data);

export const updateOrderStatus = (orderId: string, newStatus: 'PREPARING' | 'READY') =>
  apiClient.patch(`/kitchen/orders/${orderId}/status`, { status: newStatus }).then(r => r.data);

// TODO (backend): Manager service not yet built.
// Required: GET /manager/dashboard, GET /manager/orders/live,
// GET /manager/sales/daily, GET /manager/items/popular
// ─── MANAGER ──────────────────────────────────────────────────────────────────

export const getManagerDashboard = () =>
  apiClient.get<ManagerDashboard>('/manager/dashboard').then(r => r.data);

export const getManagerLiveOrders = () =>
  apiClient.get<Order[]>('/manager/orders/live').then(r => r.data);

export const getDailySales = (date: string) =>
  apiClient.get<HourlySales[]>('/manager/sales/daily', { params: { date } }).then(r => r.data);

export const getPopularItems = () =>
  apiClient.get<PopularItem[]>('/manager/items/popular').then(r => r.data);

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
