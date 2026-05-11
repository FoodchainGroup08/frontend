# FoodChain frontend

Vite + React client for the FoodChain platform (ordering, branch browsing, kitchen/manager views). UI is built with **MUI**, **Radix** primitives, and **Emotion**.

## Prerequisites

- **Node.js** (LTS recommended)
- Running backend: preferably the **API Gateway** at **`http://localhost:8080`** so JWT and routing match production-like behaviour.

## Install and run

```bash
npm install
npm run dev
```

Default dev server: **Vite** (typically **`http://localhost:5173`** — check terminal output).

Production bundle:

```bash
npm run build
```

## Configuration

Point the app at your gateway URL and WebSocket hosts via environment variables used in the codebase (for example API base URL and `ws://` / `wss://` endpoints). When the full stack runs under **Docker Compose** (`foodchain-deployment`), set URLs to the published gateway and notification socket routes.

## Related services

| Capability | Typical upstream |
|------------|------------------|
| Auth, profile | Gateway → **user-service** (`/api/v1/auth`, `/api/v1/users`) |
| Branches, menu | Gateway → **branch-service**, **menu-service** |
| Orders | Gateway → **order-service** |
| Live updates | **notifications-service** raw WebSockets (`/ws/kitchen/...`, `/ws/orders/...`, `/ws/manager/...`) proxied from gateway — see **notifications-service** README |

Design reference (original bundle): [Figma — FoodChain](https://www.figma.com/design/UfhFKcgwAO70zP2Ty91Ix0/FoodChain).
