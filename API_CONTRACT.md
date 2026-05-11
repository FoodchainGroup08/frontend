# FoodChain — Backend Integration Roadmap 

**Source of truth:** Frontend `src/services/api.ts` and UI components  
**Legend:** 🔴 MVP Critical · 🟡 MVP High Priority · 🟢 Post-MVP

---

## Current Integration Status

Four services have been partially built (branch, menu/items, menu/categories, orders). The branch and menu-items paths differ from what the frontend originally expected — the adapter layer has been updated to handle this. Auth is entirely missing, which blocks all role-gated screens. `GET /menu/branch/:branchId` is not yet built, which blocks the entire customer ordering flow. Kitchen, Manager, and Admin services are not built. The order response shape has several missing fields and the status enum has two gaps.

---

## Section 0 — Frontend API Base

### Frontend `.env`
```
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_BASE_URL=ws://localhost:8080
VITE_GOOGLE_MAPS_API_KEY=optional
```

### Seed Demo Accounts
```sql
INSERT INTO users (email, password, name, role) VALUES
  ('user@demo.com',  'demo', 'Demo Customer',      'Customer'),
  ('kitchen@demo.com',   'demo', 'Demo Kitchen Staff', 'Kitchen Staff'),
  ('manager@demo.com',   'demo', 'Demo Manager',       'Branch Manager'),
  ('admin@demo.com',     'demo', 'Demo Admin',         'Admin');
```
Hash passwords properly. These are for testing only.

---

## Section 1 — Authentication & User Management

**Status: ❌ Not built**

| Method | Endpoint | Used In | Roles | Priority | Notes |
|--------|----------|---------|-------|----------|-------|
| POST | `/api/auth/register` | Register screen | All | 🔴 MVP | Sends `{ name, email, password }`. Returns `{ token, user }`. Role defaults to Customer — frontend does NOT send role. |
| POST | `/api/auth/login` | Login screen | All | 🔴 MVP | Sends `{ email, password }`. Returns `{ token, user: { id, name, email, role, branchId? } }`. |
| POST | `/api/auth/forgot-password` | Forgot Password screen | All | 🟡 MVP | Sends `{ email }`. Backend sends reset link via email. **Email-only reset** — link goes to external page, no in-app form needed. |
| POST | `/api/auth/logout` | All screens | All | 🟡 MVP | Frontend clears local state but does NOT call this yet. Must be wired to invalidate JWT server-side. |
| GET | `/api/auth/me` | App init | All | 🟡 MVP | Must be called on app load to rehydrate session from stored JWT. Without this, page refresh logs user out. |
| POST | `/api/auth/google` | Login screen | All | 🟢 Post-MVP | `handleGoogleLogin()` is stub (`console.log` only). Implement OAuth or remove button. |
| PUT | `/api/auth/profile` | Not in frontend | All | 🟢 Post-MVP | No profile edit screen exists. User can edit name, email, password. |

**Critical:** JWT payload and `/api/auth/me` response must return role as one of: `"Customer"` · `"Kitchen Staff"` · `"Branch Manager"` · `"Admin"` — casing is exact, must match these strings.

---

## Section 2 — Branch Management

| Method | Endpoint | Status | Used In | Roles | Priority | Notes |
|--------|----------|--------|---------|-------|----------|-------|
| GET | `/api/branches` | ⚠️ Built — see notes | Branch Selector (Customer), Branch Management (Admin) | C, A | 🔴 MVP | Backend built as `/branch` (singular). Frontend adapter updated. Backend should rename to `/branches` for consistency. |
| GET | `/api/branches/nearby` | ⚠️ Built — see notes | Branch Selector | C | 🟡 MVP | Backend at `/branch/nearby`. Returns `distanceKm` — adapter converts to `distance` string. |
| POST | `/api/branches` | ⚠️ Built — see notes | Branch Management (Admin) | A | 🟡 MVP | Backend at `/branch`. `handleSave()` when adding new branch. |
| PUT | `/api/branches/:id` | ⚠️ Built — see notes | Branch Management (Admin) | A | 🟡 MVP | Backend at `/branch/:id`. `handleSave()` when editing existing branch. |
| PATCH | `/api/branches/:id/status` | ⚠️ Built — see notes | Branch Management (Admin) | A | 🟡 MVP | Backend exposes `/branch/:id/activate` and `/branch/:id/deactivate` separately. Frontend adapter handles this. Backend should add unified `PATCH /branches/:id/status { isActive: boolean }` for forward compatibility. |
| GET | `/api/branches/:id` | ⚠️ Built — see notes | Not directly used | C, M, A | 🟢 Post-MVP | Backend at `/branch/:id`. |

**Branch response MUST include these fields — currently missing from backend:**
- `hours` (string) — e.g. `"8:00 AM - 10:00 PM"`
- `rating` (number) — e.g. `4.8`
- `isOpen` (boolean)
- `isActive` (boolean) — backend uses `active`; adapter handles but backend should standardise

**Branch object (frontend type — do not change field names):**
```typescript
{
  id: string;
  name: string;
  address: string;
  location?: string;
  distance?: string;  // Only for nearby queries — formatted "X.X km"
  hours: string;
  rating: number;
  isOpen: boolean;
  isActive: boolean;
  manager?: string;   // Backend uses managerId — adapter maps it
}
```

---

## Section 3 — Menu Management

| Method | Endpoint | Status | Used In | Roles | Priority | Notes |
|--------|----------|--------|---------|-------|----------|-------|
| GET | `/api/menu/branch/:branchId` | ❌ Not built | Menu screen (Customer) | C | 🔴 MVP | **CRITICAL.** Menu.tsx relies on demo fallback. Core customer flow is blocked without this. |
| GET | `/api/menu` | ⚠️ Built — see notes | Menu Catalogue (Admin) | A | 🟡 MVP | Backend at `/menu/items`. May return a Spring Page object — adapter extracts `content[]`. |
| GET | `/api/menu/categories` | ⚠️ Built — see notes | Menu Catalogue (Admin) | A | 🟡 MVP | Backend returns `CategoryResponse[]` objects (`{ id, name, displayOrder, active }`). Frontend expects `string[]`. Adapter extracts `name` field. |
| POST | `/api/menu` | ⚠️ Built — see notes | Menu Catalogue (Admin) | A | 🟡 MVP | Backend at `/menu/items`. `handleSave()` when adding new item. |
| PUT | `/api/menu/:id` | ⚠️ Built — see notes | Menu Catalogue (Admin) | A | 🟡 MVP | Backend at `/menu/items/:id`. `handleSave()` when editing item. |
| DELETE | `/api/menu/:id` | ⚠️ Built — see notes | Menu Catalogue (Admin) | A | 🟡 MVP | Backend at `/menu/items/:id`. `handleDelete()`. |
| PATCH | `/api/menu/:id/availability` | ⚠️ Built — see notes | Menu Catalogue (Admin) | A | 🟡 MVP | Backend at `/menu/items/:id/toggle`. `handleToggleActive()`. |
| POST | `/api/upload/image` | ❌ Not built | Menu Catalogue (Admin) | A | 🟢 Post-MVP | No image upload field in modal yet. Expects `multipart/form-data`. Returns `{ url: string }`. |
| GET | `/api/menu/:id` | ❌ Not built | Not directly used | A | 🟢 Post-MVP | Needed if clicking menu item opens detail view. |

**MenuItem response field mismatches — backend must fix or adapter will absorb:**
- Use `price` (not `basePrice`) — adapter handles current mismatch
- Use `available` (not `active`) — adapter handles current mismatch
- Use `category` as a plain string (not `categoryId` or `categoryName`) — adapter handles current mismatch

**MenuItem object (frontend type — do not change field names):**
```typescript
{
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
```

---

## Section 4 — Cart & Orders (Customer)

Cart state lives in React state — correct per design. Order placement flows through Checkout.tsx.

| Method | Endpoint | Status | Used In | Roles | Priority | Notes |
|--------|----------|--------|---------|-------|----------|-------|
| POST | `/api/orders` | ⚠️ Built — see notes | Checkout | C | 🔴 MVP | Request body mismatch — see below. |
| GET | `/api/orders/active` | ⚠️ Built — see notes | Order Tracker | C | 🔴 MVP | Backend returns Page not `Order\|null` — see below. |
| GET | `/api/orders/history` | ❌ Not built | Order History | C | 🔴 MVP | OrderHistory.tsx uses mock data. |
| POST | `/api/orders/:id/cancel` | ❌ Not built | Order Tracker | C | 🟡 MVP | No cancel button exists yet. Add to Order Tracker (RECEIVED status only). |
| GET | `/api/orders/:id` | ❌ Not built | Order Detail modal | C | 🟢 Post-MVP | OrderDetailModal receives order as prop. Could fetch fresh data by ID when modal opens. |

**POST `/api/orders` — request body mismatches:**
- Frontend does **NOT** send `customerId` — backend must extract from JWT
- Frontend sends items as `[{ menuItemId, quantity }]` only — backend must resolve `menuItemName` and `unitPrice` from menu-service internally
- `orderType` casing: frontend sends `'delivery'` | `'dine-in'` | `'takeaway'` (lowercase with hyphen); backend enum is `DINE_IN | TAKEAWAY | DELIVERY`. Backend must accept both casings or document the exact expected format.

**GET `/api/orders/active` — response mismatch:**
- Backend returns `Page<OrderListResponse>`, frontend expects `Order | null`
- Missing fields in `OrderListResponse`: `branchName`, `subtotal`, `deliveryFee`, `total`, `placedAt`, `customerName`, `phoneNumber`
- Backend has `totalAmount` and `createdAt` — must alias or add the frontend field names

**Order status enum — CRITICAL mismatch:**
| Frontend expects | Backend has |
|---|---|
| `RECEIVED` | `RECEIVED` ✅ |
| `PREPARING` | `PREPARING` ✅ |
| `READY` | `READY` ✅ |
| `PICKED_UP` | ❌ Missing — add this |
| `SERVED` | ❌ Missing — add this |
| — | `CONFIRMED` (extra — frontend has no UI for this state) |
| — | `COMPLETED` (maps to `PICKED_UP` or `SERVED` depending on `orderType`) |

**PlaceOrder request (frontend sends):**
```typescript
{
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
```

**Order response (frontend requires):**
```typescript
{
  id: string;
  status: 'RECEIVED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'SERVED';
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
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
  paymentMethod?: string;
}
```

---

## Section 5 — Kitchen Operations (Kitchen Staff)

**Status: ❌ Not built**

| Method | Endpoint | Used In | Roles | Priority | Notes |
|--------|----------|---------|-------|----------|-------|
| GET | `/api/kitchen/queue` | Kitchen Queue | K | 🔴 MVP | KitchenQueue.tsx uses mock data. Replace with live fetch, then sync via WebSocket. |
| PATCH | `/api/kitchen/orders/:id/status` | Kitchen Queue | K | 🔴 MVP | `onStatusChange()` updates local state only. Body: `{ newStatus: "PREPARING" \| "READY" \| "SERVED" }`. SERVED for dine-in orders. |
| GET | `/api/kitchen/orders/:id` | Kitchen Order Detail popup | K | 🟢 Post-MVP | KitchenOrderDetail receives order as prop. Could fetch full detail by ID. |
| GET | `/api/kitchen/stats` | Not in frontend | K | 🟢 Post-MVP | No kitchen stats screen exists. |

**KitchenOrder object:**
```typescript
{
  id: string;
  status: 'received' | 'preparing' | 'ready';
  items: Array<{ id: string; name: string; quantity: number; specialInstructions?: string }>;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  receivedAt: string;
  customerName?: string;
}
```

---

## Section 6 — Branch Manager Dashboard

**Status: ❌ Not built**

| Method | Endpoint | Used In | Roles | Priority | Notes |
|--------|----------|---------|-------|----------|-------|
| GET | `/api/manager/dashboard` | Manager Dashboard | M | 🔴 MVP | ManagerDashboard.tsx uses mock data. Wire on mount. |
| GET | `/api/manager/orders/live` | Live Orders | M | 🔴 MVP | LiveOrders.tsx uses mock data. Wire on mount + sync via WebSocket. |
| GET | `/api/manager/sales/daily` | Daily Sales | M | 🔴 MVP | DailySales.tsx uses mock data. Pass `?date=YYYY-MM-DD` from date picker. |
| GET | `/api/manager/items/popular` | Popular Items | M | 🔴 MVP | PopularItems.tsx uses mock data. Wire on mount. |
| GET | `/api/manager/sales/weekly` | Not in frontend | M | 🟢 Post-MVP | No weekly view screen. DailySales shows daily only. |
| GET | `/api/manager/sales/monthly` | Not in frontend | M | 🟢 Post-MVP | No monthly view screen. |
| GET | `/api/manager/reports` | Not in frontend | M | 🟢 Post-MVP | No reports download screen. |

**Response shapes:**
```typescript
// ManagerDashboard
{ totalOrders: number; totalRevenue: number; averageOrderValue: number; ordersChange?: number; revenueChange?: number; }

// HourlySales (array)
{ hour: string; revenue: number; orders: number; }

// PopularItem (array)
{ id: string; name: string; category: string; quantitySold: number; revenue: number; trend?: number; }
```

---

## Section 7 — Admin Analytics & User Management

**Status: ❌ Not built**

| Method | Endpoint | Used In | Roles | Priority | Notes |
|--------|----------|---------|-------|----------|-------|
| GET | `/api/admin/analytics` | Analytics screen | A | 🔴 MVP | Analytics.tsx uses mock data. Supports `?startDate&endDate`. |
| GET | `/api/admin/analytics/branches` | Analytics screen | A | 🔴 MVP | Bar chart data (orders + revenue per branch). |
| GET | `/api/admin/users` | User Management | A | 🔴 MVP | UserManagement.tsx uses mock data. Supports `?role=` filter. |
| PATCH | `/api/admin/users/:id/status` | User Management | A | 🔴 MVP | `handleToggleStatus()` — body: `{ status: "active" \| "inactive" }`. |
| GET | `/api/admin/analytics/revenue` | Analytics screen | A | 🟢 Post-MVP | Consider consolidating with `/analytics/branches` to reduce API calls. |
| GET | `/api/admin/analytics/orders` | Analytics screen | A | 🟢 Post-MVP | Same — consolidate with `/analytics/branches`. |
| GET | `/api/admin/users/:id` | Not directly used | A | 🟢 Post-MVP | Needed if clicking user row opens detail view. |
| GET | `/api/admin/users/role/:role` | User Management | A | 🟢 Post-MVP | Currently filtered client-side. Could fetch server-side for large datasets. |
| POST | `/api/admin/users` | Not in frontend | A | 🟢 Post-MVP | No Add User button. Admin can only deactivate. Staff creation not in MVP. |
| PUT | `/api/admin/users/:id` | Not in frontend | A | 🟢 Post-MVP | No user edit form. |
| DELETE | `/api/admin/users/:id` | Not in frontend | A | 🟢 Post-MVP | No delete user action. Recommend deactivation only for data integrity. |

**Response shapes:**
```typescript
// BranchAnalytics (array)
{ name: string; orders: number; revenue: number; }

// SystemUser (array)
{ id: string; name: string; email: string; role: UserRole; status: 'active' | 'inactive'; branchId?: string; branch?: string; }
```

---

## Section 8 — Real-Time WebSocket Connections

These are NOT REST calls. Persistent connections that push data to the frontend without polling. **Critical for demo** — without them, Kitchen Queue, Order Tracker, and Manager Live Orders won't update until the user refreshes.

| Type | Endpoint | Status | Used In | Roles | Priority | Notes |
|------|----------|--------|---------|-------|----------|-------|
| WS | `/ws/kitchen/:branchId` | ⚠️ Architecture mismatch | Kitchen Queue | K | 🔴 MVP | Hook `useKitchenQueue.ts` exists and ready. New orders must appear instantly in RECEIVED column. |
| WS | `/ws/orders/:orderId` | ⚠️ Architecture mismatch | Order Tracker | C | 🔴 MVP | Hook `useOrderTracker.ts` exists and ready. Status stepper must advance in real time — this is the live demo moment. |
| WS | `/ws/manager/:branchId` | ⚠️ Architecture mismatch | Live Orders | M | 🟡 MVP | Hook `useManagerOrders.ts` exists and ready. Manager sees queue update without refresh. |

**WebSocket Architecture Gap**

Frontend hooks (`useKitchenQueue.ts`, `useOrderTracker.ts`, `useManagerOrders.ts`) connect via raw WebSocket to:
- `ws://[host]/ws/kitchen/:branchId`
- `ws://[host]/ws/orders/:orderId`
- `ws://[host]/ws/manager/:branchId`

Backend notifications-service uses STOMP over SockJS at `/ws-notifications` with topic-based routing to `/topic/customer/{customerId}`.

These are incompatible. The backend team must either:

**(a) Expose raw WebSocket endpoints at the three paths above — RECOMMENDED, least frontend change**  
(b) Frontend team rewrites all three hooks to use a STOMP client — significant work, requires coordination

Option (a) is the faster path for MVP.

**WebSocket message payload (all three connections):**
```typescript
{
  orderId: string;
  branchId: string;
  customerId: string;
  oldStatus: 'RECEIVED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'SERVED';
  newStatus: 'RECEIVED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'SERVED';
  updatedBy: string;
  timestamp: string;  // ISO
}
```

Note: The order status enum mismatch from Section 4 applies here too — `PICKED_UP` and `SERVED` must exist before WebSocket payloads can carry them.

**Flow:** Customer places order → backend broadcasts `RECEIVED` to `/ws/kitchen/{branchId}` → Kitchen clicks Start Preparing → backend broadcasts `PREPARING` to both `/ws/kitchen/{branchId}` AND `/ws/orders/{orderId}` → Customer tracker updates live.

---

## Section 9 — Additional Endpoints

| Method | Endpoint | Used In | Roles | Priority | Notes |
|--------|----------|---------|-------|----------|-------|
| GET | `/api/health` | Not in frontend | DevOps | 🔴 MVP | Health check only. Frontend doesn't call this. Backend/DevOps concern. |
| POST | `/api/notifications/send` | Not a frontend call | Backend internal | 🔴 MVP | Backend-to-backend or server push. Frontend does NOT call this. |
| GET | `/api/stats/summary` | Not in frontend | A | 🟢 Post-MVP | Could power platform-wide summary panel. Not built yet. |

---

## Backend Action Items (Priority Order)

### 🔴 Blocking MVP — must be done before any integration testing

1. **Build Auth Service** — `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/forgot-password`. Nothing else can be tested without this. Role values in JWT must exactly match: `"Customer"` · `"Kitchen Staff"` · `"Branch Manager"` · `"Admin"`.

2. **Build `GET /menu/branch/:branchId`** — This is the core customer flow. Without it, customers cannot see a menu. The endpoint should return active menu items for a given branch, with shape matching the MenuItem object in Section 3.

3. **Fix Order Status Enum** — Add `PICKED_UP` and `SERVED` statuses. Map `COMPLETED` to the appropriate terminal status based on `orderType`. Remove or keep `CONFIRMED` as an internal state but ensure the frontend is never shown it (filter it out or alias it to `RECEIVED` in responses).

4. **Fix Order Service — PlaceOrder** — Extract `customerId` from JWT on the backend (do not require it in the request body). Look up `menuItemName` and `unitPrice` from the menu-service internally when creating order items.

5. **Fix Order Response Shape** — All order responses must include: `branchName` (string), `subtotal` (number), `deliveryFee` (number), `total` (number), `placedAt` (ISO string — alias of `createdAt`). The existing `totalAmount` can be kept internally but responses must use the frontend field names.

6. **Build WebSocket Raw Endpoints** — Implement raw WebSocket at `/ws/kitchen/:branchId`, `/ws/orders/:orderId`, and `/ws/manager/:branchId`. The existing Kafka + STOMP infrastructure can power these — just add a raw WebSocket gateway layer. Message payload must match the Section 8 shape.

### 🟡 High Priority — needed for role-specific screens

7. **Build Kitchen Service** — `GET /kitchen/queue` and `PATCH /kitchen/orders/:id/status`

8. **Build Manager Service** — `GET /manager/dashboard`, `GET /manager/orders/live`, `GET /manager/sales/daily`, `GET /manager/items/popular`

9. **Build Admin Service** — `GET /admin/analytics`, `GET /admin/analytics/branches`, `GET /admin/users`, `PATCH /admin/users/:id/status`

### 🟢 Cleanup — backend path consistency (low risk, low effort)

10. **Rename `/branch` → `/branches`** — Frontend adapter already handles this, but keeping the mismatch creates confusion. A one-line path change in Spring.

11. **Add `hours`, `rating`, `isOpen` to Branch entity and responses** — Required for the branch selector UI to display meaningful information. Adapter returns placeholder defaults (`'—'`, `0`, `false`) until this is done.

12. **Standardise MenuItem response** — Use `price` (not `basePrice`), `available` (not `active`), `category` string (not `categoryId`/`categoryName`). Frontend adapter handles the current mismatch but backend should own the right shape.

13. **Standardise Category endpoint** — Return `string[]` not `CategoryResponse[]`, or document that `CategoryResponse[]` is permanent so the adapter can be made explicit.

14. **Add unified `PATCH /branches/:id/status`** — Accept `{ isActive: boolean }` in addition to the existing activate/deactivate endpoints. Frontend adapter handles both for now.

---
