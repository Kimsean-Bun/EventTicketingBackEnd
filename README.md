# 🎟️ Event Ticketing System API

A RESTful API for managing events, user registration, and ticket bookings. Built with Node.js, Express, MongoDB, Mongoose, and JWT authentication.

---

## Installation

```bash
git clone https://github.com/your-username/event-ticketing-api.git
cd event-ticketing-api
npm install
```

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your values in `.env` (see below).

---

## Environment Variables

| Variable         | Description                            |
|------------------|----------------------------------------|
| `PORT`           | Port the server runs on (default 5000) |
| `MONGO_URI`      | MongoDB Atlas connection string        |
| `JWT_SECRET`     | Secret key used to sign JWT tokens     |
| `JWT_EXPIRES_IN` | JWT expiry duration (e.g. `7d`)        |

---

## Running Locally

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:3000`

---

## Deployed API

> https://your-project-name.onrender.com

---

## Endpoints

### Auth
| Method | Endpoint           | Description         | Auth |
|--------|--------------------|---------------------|------|
| POST   | /api/auth/register | Register a new user | No   |
| POST   | /api/auth/login    | Login, receive JWT  | No   |

### Events
| Method | Endpoint        | Description         | Auth       |
|--------|-----------------|---------------------|------------|
| GET    | /api/events     | Get all events      | No         |
| GET    | /api/events/:id | Get one event by ID | No         |
| POST   | /api/events     | Create a new event  | Admin only |
| PUT    | /api/events/:id | Update an event     | Admin only |
| DELETE | /api/events/:id | Delete an event     | Admin only |

### Bookings
| Method | Endpoint          | Description                         | Auth     |
|--------|-------------------|-------------------------------------|----------|
| GET    | /api/bookings     | Get all bookings for logged-in user | Required |
| GET    | /api/bookings/:id | Get one booking (owner only)        | Required |
| POST   | /api/bookings     | Book tickets for an event           | Required |

### Bonus Endpoints
| Method | Endpoint                      | Description                              | Auth       |
|--------|-------------------------------|------------------------------------------|------------|
| GET    | /api/bookings/validate/:id    | Validate a booking by ID (QR code scan) | No         |
| GET    | /api/admin/dashboard          | All events + bookings + revenue summary  | Admin only |



Filter events using optional query parameters on `GET /api/events`:

| Parameter  | Description               | Example                       |
|------------|---------------------------|-------------------------------|
| `category` | Filter by category name   | `/api/events?category=music`  |
| `date`     | Filter by date YYYY-MM-DD | `/api/events?date=2025-12-25` |

Parameters can be combined:
```
GET /api/events?category=music&date=2025-12-25
```

---

## Design Decisions

### Event Deletion Policy
If an event has existing bookings, deletion is **prevented** and a `400` error is returned with the number of active bookings. This protects users who have already booked tickets. To delete the event, all associated bookings must be cancelled first.

### Booking Ownership
Users may only view their own bookings. Attempting to access another user's booking by ID returns a `403 Forbidden` error.

### Seat Capacity Guard
When updating an event via `PUT /api/events/:id`, `seatCapacity` cannot be reduced below the current number of `bookedSeats`. This prevents overbooking on existing reservations.

---

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_token>
```

Tokens are returned on successful login or registration.

---

## Notes

- Passwords are hashed with `bcryptjs` before storage — plain text is never saved
- Admin role can be assigned at registration via `"role": "admin"`
- Category filtering is case-insensitive
- The root URL `/` serves an HTML welcome page
- Invalid routes return `404 Not Found` as HTML or JSON depending on the `Accept` header