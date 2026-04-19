# TickiSpot

**Event discovery, ticketing, and organizer operations in one platform.**

TickiSpot connects attendees and organizers: browse and purchase tickets, validate entry with QR codes, run live experiences, and operate payouts and analytics—with role-aware access for users, organizers, staff, and administrators.

---

## Overview

TickiSpot is a full-stack web application consisting of a **React (Vite)** client and a **Node.js (Express)** API backed by **MongoDB**. Real-time features use **Socket.IO**. Authentication is **JWT-based**; payments and webhooks integrate with **Paystack** where configured.

---

## Capabilities

| Area | What you can do |
|------|------------------|
| **Ticketing** | Digital tickets, secure checkout, QR generation and on-site scanning |
| **Events** | Create and manage events, media, categories, and live streaming flows |
| **Attendees** | Ticket wallet, transactions, favorites, messaging, notifications |
| **Organizers** | Analytics, earnings, withdrawals, staff tooling |
| **Platform** | Admin oversight, user management, billing and plan limits |
| **Community** | Posts, comments, and social surfaces alongside core ticketing |

---

## Architecture

```
┌─────────────┐     HTTPS / WSS      ┌─────────────┐     ┌──────────────┐
│   Browser   │ ◄──────────────────► │  Express    │ ◄──► │   MongoDB    │
│  (React)    │      REST + Socket   │  + Socket   │      │  (Mongoose)  │
└─────────────┘                      └─────────────┘     └──────────────┘
```

- **Client**: SPA with React Router, shared auth context, and API client (`axios`).
- **Server**: REST API under `/api/*`, static uploads, CORS allowlist, global error handling.
- **Realtime**: Socket server shares JWT verification with HTTP auth patterns.

---

## Repository structure

```
.
├── client/                 # Vite + React frontend
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── services/api/
│       └── utils/
├── server/                 # Express API
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── socket/
│   └── uploads/
└── README.md
```

---

## Prerequisites

- **Node.js** (LTS recommended)
- **npm** (or compatible package manager)
- **MongoDB** instance (local or hosted)
- Optional: **Paystack**, **Cloudinary**, **Firebase**, **Resend** (or other email) for full production parity

---

## Quick start

### 1. Clone and install

```bash
git clone <your-repository-url>
cd <repository-directory>

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

Create `server/.env` with at least the variables in [Server environment](#server-environment). Create `client/.env` for API and optional socket URLs as in [Client environment](#client-environment).

### 3. Run

**Terminal A — API**

```bash
cd server
npm run dev
```

**Terminal B — UI**

```bash
cd client
npm run dev
```

By default the API listens on **port 8080** unless `PORT` is set. Point the client `VITE_API_URL` at that origin.

---

## Configuration

### Server environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Signing key for access tokens |
| `PORT` | No | HTTP port (default **8080**) |
| `FRONTEND_URL` | Recommended | Origin of the web app (CORS, links, callbacks) |
| `BACKEND_URL` | Recommended | Public API base URL (e.g. Paystack callback construction) |
| `ALLOWED_ORIGINS` | No | Comma-separated extra CORS origins |
| `PAYSTACK_SECRET_KEY` or `PAYSTACK_SECRET` | For payments | Paystack secret |
| `PAYSTACK_CALLBACK` | No | Override for payment verification callback URL |
| `CLOUDINARY_*` | For media | Cloud name, API key, API secret |
| `FIREBASE_*` | For push/admin | Project ID, client email, private key |
| `RESEND_API_KEY` | For email | Transactional email (see `server/utils/email.js`) |
| `PLATFORM_TICKET_FEE_PERCENT` | No | Platform fee (see `server/utils/platformFee.js`) |
| `WITHDRAWAL_PROCESSING_FEE_PERCENT`, `MIN_WITHDRAWAL_NGN` | No | Withdrawal rules |

Example **minimal** `server/.env`:

```env
PORT=8080
MONGO_URI=mongodb://localhost:27017/tickispot
JWT_SECRET=change-me-to-a-long-random-secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8080
```

### Client environment

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Base URL of the API (e.g. `http://localhost:8080`) |
| `VITE_SOCKET_URL` | Socket.IO server URL if different from the API host |
| `VITE_FIREBASE_*` | Firebase web app config when using client Firebase features |

Example **local** `client/.env`:

```env
VITE_API_URL=http://localhost:8080
VITE_SOCKET_URL=http://localhost:8080
```

Use values from your Firebase project settings only in private env files; do not commit secrets.

---

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `client/` | `npm run dev` | Vite dev server |
| `client/` | `npm run build` | Production build |
| `client/` | `npm run preview` | Preview production build |
| `server/` | `npm run dev` | Nodemon API + Socket |
| `server/` | `npm start` | Run API without file watcher |

---

## Security notes

- Store secrets only in environment variables or a secrets manager; never commit `.env` files.
- JWTs must be transmitted over HTTPS in production.
- CORS is restricted to an explicit allowlist; add production domains via `FRONTEND_URL` and `ALLOWED_ORIGINS`.
- Webhook handlers should validate provider signatures (e.g. Paystack) using configured secrets.

---

## Contributing

1. Fork the repository and create a branch for your change.  
2. Keep commits focused and describe the intent in the message.  
3. Open a pull request with a short summary of behavior and any new configuration.  
4. Ensure new features document required env vars in this README when applicable.

---

## License and ownership

Licensing terms are defined by the repository maintainers. If no `LICENSE` file is present at the root, confirm usage with the project owner before redistribution.

---

**TickiSpot** — ticketing and events, built for scale from local development to production deployment.
