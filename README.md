# Cylon Vehicle Rental System

A booking platform for vehicle rentals in Sri Lanka. Guests browse and book cars directly — no account needed; car owners and agencies register to list and manage their vehicles; admins run the platform with a full oversight panel.

Monorepo layout:

| Directory | Tech | Status |
|---|---|---|
| `backend/` | Java 21, Spring Boot 3, PostgreSQL 16 (Flyway) | Completed |
| `web-frontend/` | Next.js 15, Tailwind, TypeScript, Leaflet | Completed (public site, owner dashboard, admin panel) |
| `mobile-frontend/` | Expo (React Native) | Planned (Phase 3) |

## Core design

- **Guest booking** — renters browse cars and book without an account; contact + ID (NIC or passport) are captured at booking time.
- **Advertiser signup only** — registration is limited to owners/agencies (LOCAL vs FOREIGNER panels) and admins.
- **Availability** — overlapping bookings rejected at the app level (409) and enforced by a Postgres exclusion constraint.
- **Payments** — reserved for future work: `payment_status` (NONE/PENDING/PAID/REFUNDED) on bookings plus a `payments` table; gateways planned are PayHere (local cards) and Stripe (foreign cards).
- **Reviews** — renters can review a car once their booking is completed.
- **Admin oversight** — stats, suspend/activate users (suspended accounts can't log in or use existing tokens), hide/delete cars, cancel bookings, delete reviews.

## What to download before running

| Tool | Version | Notes |
|---|---|---|
| [JDK](https://adoptium.net) (Temurin recommended) | 21 | Required to run the Spring Boot backend |
| [Node.js](https://nodejs.org) + npm | 20 LTS or newer | Required to run the Next.js frontend |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Any recent | Runs PostgreSQL 16 + Adminer locally |
| [Git](https://git-scm.com) | 2.x | For cloning the repo; already bundled with intelliJ/GitHub Desktop if you use those |

> On Windows, Gradle is invoked via `.\gradlew.bat`. No separate Gradle install is needed — the wrapper downloads everything.

## How to run

### 1. Clone the repo

```bash
git clone https://github.com/pamindu-w/Cylon-Vehicle-Rental-System.git
cd Cylon-Vehicle-Rental-System
```

### 2. Start the database

PostgreSQL runs in Docker on host port **5433** (avoiding conflicts with any local PostgreSQL on 5432):

```bash
docker compose up -d
```

### 3. Start the backend API

```bash
cd backend
.\gradlew.bat bootRun
```

The API is at `http://localhost:8080`. No `.env` setup needed — sane local defaults are baked into `backend/src/main/resources/application.yml` (the repo root `.env.example` documents every override).

- Swagger UI: http://localhost:8080/swagger-ui.html
- Adminer (DB browser): http://localhost:8081

### 4. Start the web frontend

In a second terminal:

```bash
cd web-frontend
npm install
npm run dev
```

Open http://localhost:3000. The API base URL defaults to `http://localhost:8080`; override with `NEXT_PUBLIC_API_URL` in `web-frontend/.env.local` if needed.

## Working on the dev branch

`main` holds the stable snapshot; active work happens on `dev`:

```bash
git checkout dev
git pull origin dev
# ...make changes...
git add .
git commit -m "your change"
git push origin dev
```

Merge `dev` back into `main` once a milestone is verified.

**Web features**

- Public: home + hero search, browse with filters (city, type, seats, transmission, with-driver) and a Leaflet map, car detail with gallery/specs/reviews and a booking widget.
- Guest booking: no login — date picker, optional driver, ID entry (NIC/passport), live price summary, confirmation screen.
- Advertiser auth: login + two-panel register (Sri Lankan owner with NIC, or foreign agency with passport + nationality).
- Owner dashboard: overview stats, car CRUD + photo upload/delete, activate/hide listings, confirm/decline bookings.
- Admin panel (`/admin`, ADMIN role): overview stats, user suspend/activate, car hide/delete, booking cancel, review delete.

## Seed data

Enabled by default (`app.seed-data: true`). Logins:

| Email | Password | Role | Type |
|---|---|---|---|
| `owner@test.com` | `test1234` | OWNER | LOCAL (NIC 851234567V) |
| `foreign-owner@test.com` | `test1234` | OWNER | FOREIGNER (passport A1234567, UK) |
| `admin@test.com` | `admin1234` | ADMIN | LOCAL |

Four sample cars are seeded (Toyota Axio, Suzuki Swift, Honda Vezel, Kia Grand Carnival), all `ACTIVE` with optional with-driver.

## Main API endpoints

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register` | Public (OWNER/ADMIN signup, local/foreign panels) |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| GET | `/api/cars` | Public (filter: city, price, type, seats, transmission, withDriver) |
| GET | `/api/cars/{id}` | Public |
| GET/POST/PUT/PATCH | `/api/cars/...` (mine, {id}, status, images) | OWNER |
| POST | `/api/bookings` | Public (guest) |
| GET | `/api/bookings...` | OWNER |
| PATCH | `/api/bookings/{id}/status?status=CONFIRMED\|CANCELLED` | OWNER |
| POST | `/api/reviews` | Public (COMPLETED booking only) |
| GET | `/api/reviews/car/{carId}` | Public |
| GET | `/api/admin/stats` | ADMIN |
| GET | `/api/admin/users` / `/api/admin/cars` / `/api/admin/bookings` / `/api/admin/reviews` | ADMIN |
| PATCH | `/api/admin/users/{id}/enabled` | ADMIN (suspend/activate) |
| PATCH | `/api/admin/cars/{id}/status` | ADMIN (ACTIVE/HIDDEN) |
| DELETE | `/api/admin/cars/{id}` | ADMIN (blocked while the car has booking history) |
| PATCH | `/api/admin/bookings/{id}/status` | ADMIN (CANCELLED only) |
| DELETE | `/api/admin/reviews/{id}` | ADMIN |

A scheduled job (02:00 daily) marks confirmed bookings whose rental period has ended as `COMPLETED`, enabling reviews.