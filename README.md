# Techverse 2026 — Backend

Express + MongoDB API powering [Techverse 2026](https://github.com/Amaju20/TechVerse2026): JWT auth
(sign up, log in with email *or* username, log out), account settings (edit name, change password),
and RSVP persistence for conference sessions.

## Stack

Node ESM (`"type": "module"`), Express, Mongoose/MongoDB Atlas, JWT in an httpOnly cookie, Joi
validation, bcrypt password hashing, `express-rate-limit` on auth routes, `helmet` for security
headers.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in your own values
npm run dev             # nodemon, auto-reload
```

`npm start` runs it without nodemon. `npm test` runs the test suite (see below).

### Environment variables

See `.env.example`. All of these are required — the app refuses to start if any are missing:

| Variable          | Purpose                                                              |
| ------------------ | --------------------------------------------------------------------- |
| `NODE_ENV`        | `development` or `production` — controls cookie `secure`/`sameSite` |
| `PORT`             | Port the server listens on                                           |
| `MONGODB_URI`      | MongoDB Atlas connection string                                      |
| `JWT_SECRET`       | Signing secret for auth tokens                                       |
| `JWT_EXPIRES_IN`   | Token lifetime, e.g. `7d`                                             |
| `CLIENT_URL`       | Frontend origin — used for the CORS allowlist, must match exactly    |

## Architecture

Layered: `routes/` → `validators/` (Joi, via `validate.middleware.js`) → `controllers/` → `models/`
(Mongoose).

- **`app.js`** wires up the middleware chain: env validation → `connectDB()` → `helmet()` → CORS →
  JSON/cookie parsing → `/api/health` → `/api/auth` → `/api/rsvps` → `notFound` → `errorHandler`.
- **Auth** (`auth.controller.js`): `signup`/`login` issue a JWT (`{ sub: userId }`) as an httpOnly
  cookie and in the JSON body. `auth.middleware.js`'s `protect` reads the token from the cookie or
  an `Authorization: Bearer` header and loads `req.user`.
- **Account settings**: `PATCH /api/auth/profile` (name) and `PATCH /api/auth/password` (requires
  the current password) — both `protect`-ed.
- **RSVPs** (`rsvp.controller.js`, `Rsvp.model.js`): one document per `(user, sessionId)` pair,
  enforced by a unique compound index. `GET /api/rsvps` returns the session ids the logged-in user
  has RSVP'd to; `POST /api/rsvps/:sessionId` toggles one. Session data itself lives in the frontend
  (`src/data/sessions.js`) — this just tracks which ids a user has picked.
- **Password hashing** happens in a Mongoose `pre('save')` hook on `User.model.js`. `password` is
  `select: false` — routes that need it must `.select('+password')` explicitly.
- **Error handling**: controllers call `next(error)`; `error.middleware.js` maps errors to HTTP
  responses, including Mongo duplicate-key errors (`err.code === 11000`) → 409.

## API

| Method | Path                  | Auth | Description                         |
| ------ | ---------------------- | ---- | ------------------------------------ |
| GET    | `/api/health`          | —    | Liveness check                       |
| POST   | `/api/auth/signup`     | —    | Create an account                    |
| POST   | `/api/auth/login`      | —    | Log in with email or username        |
| POST   | `/api/auth/logout`     | —    | Clear the session cookie             |
| GET    | `/api/auth/me`         | ✅   | Current user                         |
| PATCH  | `/api/auth/profile`    | ✅   | Update name                          |
| PATCH  | `/api/auth/password`   | ✅   | Change password                      |
| GET    | `/api/rsvps`           | ✅   | List the current user's RSVP'd session ids |
| POST   | `/api/rsvps/:sessionId`| ✅   | Toggle RSVP for one session          |

## Tests

```bash
npm test
```

Runs on Node's built-in test runner (`node --test`). Coverage is deliberately scoped to logic that
doesn't need a live database — Joi validators, JWT sign/verify, and the error-handling middleware —
rather than spinning up a real MongoDB connection in CI.
