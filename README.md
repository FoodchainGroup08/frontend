# FoodChain Frontend

React + TypeScript SPA for the FoodChain multi-branch restaurant platform. Covers customer ordering (branch selection → menu → cart → checkout → live order tracking), kitchen queue management, branch manager dashboards, and head-office admin tools.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 6 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` — no config file) |
| UI primitives | shadcn/ui (Radix UI wrappers) |
| Charts | Recharts |
| HTTP client | Axios |
| Routing | React Router v7 |
| Toast notifications | Sonner |
| Animations | Motion (Framer Motion) |
| Drag and drop | React DnD |
| Location / maps | Google Maps JS API (address autocomplete, distance matrix) with Lagos demo fallback |

---

## Prerequisites

- **Node.js** 18 LTS or later
- **npm** (bundled with Node) or **pnpm**
- Backend: API Gateway at `http://localhost:8080` routing to the individual microservices.  
  The app enters **demo mode** automatically when the gateway is unreachable — no backend required to explore the UI.

---

## Installation

```bash
# 1. Install dependencies
npm install        # or: pnpm install

# 2. (Optional) Configure environment — see section below
cp .env.example .env.local   # then edit .env.local

# 3. Start the dev server
npm run dev        # http://localhost:5173

# 4. Production build
npm run build      # output → dist/
```

---

## Environment Variables

Create a `.env.local` file in the project root (never commit it):

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | API gateway base URL. All backend calls go through this. |
| `VITE_GOOGLE_MAPS_API_KEY` | _(empty)_ | Google Maps JS API key. Enables address autocomplete in registration, reverse geocoding, and real driving-distance sorting on the branch selector. Without it the app falls back to Lagos demo locations and Haversine straight-line distances. |

---

## Demo Mode

When the gateway is not reachable, login with any of the pre-built demo accounts:

| Role | Email | Password |
|---|---|---|
| Customer | user@demo.com | `Demo@1234` |
| Kitchen Staff | kitchen@demo.com | `Demo@1234` |
| Branch Manager | manager@demo.com | `Demo@1234` |
| Admin | admin@demo.com | `Demo@1234` |

Branches, menu items, orders, analytics, and users are all served from in-memory mock lists. The "Demo Credentials" accordion on the login page fills the form automatically.

---

## Auth Flow

| Step | Endpoint | Notes |
|---|---|---|
| Login | `POST /auth/login` | Returns `accessToken`; stored in localStorage. |
| Register | `POST /auth/register` | Creates account — **no auto-login**. Redirects to `/verify-email`. |
| Email verification | `POST /auth/verify-email` | Called when the user taps the link in their inbox (`/verify-email?token=…`). |
| Forgot password | `POST /auth/forgot-password` | Sends a one-time reset link; always responds 200 to prevent enumeration. |
| Reset password | `POST /auth/reset-password` | Called from the reset link (`/reset-password?token=…`). |
| Session restore | `GET /auth/me` | Called on every page load. Network failures fall back to localStorage cache; an expired token triggers a force-logout. |
| Logout | `POST /auth/logout` | Invalidates token on backend, clears localStorage, navigates to `/login`. |

### Token handling

The 401 interceptor decodes the stored JWT client-side. It only force-logs the user out when the token is **expired or invalid** — a 401 from a temporarily unavailable microservice does not end the session.

---

## Password Policy

Applies to registration (`/register`) and password reset (`/reset-password`):

| Rule | Requirement |
|---|---|
| Length | Minimum **8** characters |
| Uppercase | At least one **A–Z** |
| Lowercase | At least one **a–z** |
| Digit | At least one **0–9** |
| Special character | At least one from `@ # $ ! % * ? & - _ + =` |

**Valid example:** `Secure@123!`

---

## Role-Based Routes

| Role | Landing page | Screens |
|---|---|---|
| Customer | `/branches` | Branch selector → Menu → Cart → Checkout → Order confirmation → Order tracker → Order history |
| Kitchen Staff | `/kitchen` | Order queue with detail drawer |
| Branch Manager | `/manager` | Dashboard, Live orders, Daily sales, Popular items |
| Admin | `/admin` | Analytics, Branch management, Menu catalogue, User management |

**Public routes:** `/login` · `/register` · `/forgot-password` · `/reset-password` · `/verify-email`

Route guards (`RequireAuth`, `RequireRole`) live in `src/app/App.tsx`. Navigation between screens uses React state (`useState` string values), not React Router path changes — see Architecture notes below.

---

## Folder Structure

```
src/
├── app/
│   ├── App.tsx                        # Route definitions, auth guards, role layouts
│   └── components/
│       ├── auth/
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   ├── ForgotPassword.tsx
│       │   ├── ResetPassword.tsx      # Handles /reset-password?token=…
│       │   ├── VerifyEmail.tsx        # Handles /verify-email?email=… and ?token=…
│       │   └── LocationPicker.tsx     # Google Maps address autocomplete (used in Register)
│       ├── customer/
│       │   ├── BranchSelector.tsx     # Geolocation + distance-sorted branch list
│       │   ├── Menu.tsx
│       │   ├── Cart.tsx
│       │   ├── Checkout.tsx
│       │   ├── OrderConfirmation.tsx
│       │   ├── OrderTracker.tsx
│       │   ├── OrderHistory.tsx
│       │   ├── OrderDetailModal.tsx
│       │   └── CustomerNavbar.tsx
│       ├── kitchen/
│       │   ├── KitchenQueue.tsx
│       │   ├── KitchenOrderDetail.tsx
│       │   └── KitchenSidebar.tsx
│       ├── manager/
│       │   ├── ManagerDashboard.tsx
│       │   ├── LiveOrders.tsx
│       │   ├── DailySales.tsx
│       │   ├── PopularItems.tsx
│       │   └── ManagerSidebar.tsx
│       ├── admin/
│       │   ├── Analytics.tsx
│       │   ├── BranchManagement.tsx
│       │   ├── MenuCatalogue.tsx
│       │   ├── UserManagement.tsx
│       │   └── AdminSidebar.tsx
│       ├── figma/
│       │   └── ImageWithFallback.tsx  # Handles Figma-exported asset URLs
│       └── ui/                        # shadcn/ui primitives — do not edit
├── context/
│   └── AuthContext.tsx                # Auth state, login/register/logout, demo fallback
├── hooks/
│   ├── useKitchenQueue.ts
│   ├── useOrderTracker.ts
│   └── useManagerOrders.ts
├── services/
│   ├── api.ts                         # Axios client, all API calls, demo data, response mappers
│   └── locationService.ts             # Google Maps loader, place search, geocoding, distance matrix
├── styles/
│   ├── theme.css                      # CSS custom properties (brand colour tokens)
│   ├── tailwind.css
│   ├── index.css
│   └── fonts.css
├── utils/
│   └── demoData.ts
└── main.tsx
```

---

## Architecture Notes

### State & navigation

All global state (authenticated user, cart, current order, order history) lives in `src/app/App.tsx` and is passed down as props. Screen transitions within a role use `useState` string values — **React Router is used only for top-level role routes** (e.g. `/branches`, `/kitchen`), not for inner-screen navigation.

### API layer (`src/services/api.ts`)

- All backend calls go through the shared `apiClient` (Axios instance).
- `withDemoFallback(apiCall, demoData)` — wraps a call and returns `demoData` on network errors, 502/503/504 gateway errors, or when `foodchain_demo_mode` is set.
- Response mappers (`mapBranch`, `mapMenuItem`) normalise backend field names to the frontend types so no UI component ever needs raw backend shapes.

### Branch distance sorting

On the branch selector screen:

1. All branches are loaded immediately (fast path).
2. Browser geolocation is requested in the background.
3. On permission grant, `GET /branch/nearby?lat=…&lng=…` is called — the backend returns branches pre-sorted by proximity.
4. If the backend is unreachable, `computeRoadDistancesKm` in `locationService.ts` is tried (Google Maps Distance Matrix API).
5. Final fallback: Haversine straight-line distance using approximate Lagos coordinates stored in `api.ts`.

---

## Brand Colour Tokens

Defined in `src/styles/theme.css`, used as Tailwind classes (`bg-foodchain-espresso`) or CSS variables (`var(--foodchain-espresso)`):

| Token | Value | Use |
|---|---|---|
| `--foodchain-espresso` | `#3B2314` | Primary text, headers, buttons |
| `--foodchain-golden-amber` | `#F0A500` | Accents, highlights, primary CTAs |
| `--foodchain-charcoal` | `#1E1E1E` | Kitchen dark background |
| `--foodchain-warm-white` | `#FAF7F2` | Customer-facing page background |
| `--foodchain-sage-green` | `#4CAF7D` | Success / available states |
| `--foodchain-burnt-orange` | `#E8622A` | Warnings / busy states |

---

## Related Services

All services are accessed through the **API Gateway** at `http://localhost:8080`. Refer to each service's README for standalone Docker setup.

| Capability | Service | Gateway path prefix |
|---|---|---|
| Auth, users | user-service (port 8081) | `/api/v1/auth`, `/api/v1/users` |
| Branches | branch-service | `/api/v1/branch` |
| Menu | menu-service | `/api/v1/menu` |
| Orders | order-service | `/api/v1/orders` |
| Real-time updates | notifications-service | WebSockets: `/ws/kitchen/…`, `/ws/orders/…`, `/ws/manager/…` |

Design reference: [Figma — FoodChain](https://www.figma.com/design/UfhFKcgwAO70zP2Ty91Ix0/FoodChain)
