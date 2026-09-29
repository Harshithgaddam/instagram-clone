# Insta Clone

A full-stack social feed application with a React/Vite frontend and a NestJS/PostgreSQL backend. The application supports an original-post feed, user profiles, media browsing, search, likes, replies, and reposts.

## Contents

- [Architecture](#architecture)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Application Structure](#application-structure)
- [API Overview](#api-overview)
- [Post Creation](#post-creation)
- [Database](#database)
- [Testing and Quality Checks](#testing-and-quality-checks)
- [Development Notes](#development-notes)
- [Troubleshooting](#troubleshooting)

## Architecture

```text
Browser
  |
  | HTTP/JSON
  v
frontend/  React 19 + Vite
  |
  | VITE_API_BASE_URL
  v
backend/   NestJS + TypeORM
  |
  v
PostgreSQL
```

The repository is intentionally split into two independently runnable applications:

- `frontend/`: browser UI, local UI state, API client, and presentation components.
- `backend/`: HTTP API, validation, business rules, repositories, database entities, migrations, fixtures, and tests.

There is no authentication system yet. During development, the frontend uses a configured demo user ID as the author for new posts, replies, and reposts.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer
- A PostgreSQL database, for example `social_feed_dev`

Check your installed versions:

```bash
node --version
npm --version
psql --version
```

## Quick Start

### 1. Create the database

Create an empty PostgreSQL database:

```bash
createdb social_feed_dev
```

Or create it from `psql`:

```sql
CREATE DATABASE social_feed_dev;
```

### 2. Configure the backend

From the repository root:

```bash
cd backend
copy .env.example .env
npm install
```

Update `backend/.env` with your PostgreSQL credentials. The default example assumes:

```env
DATABASE_URL=postgresql://postgres:admin@localhost:5432/social_feed_dev
```

Run the migrations and seed the database:

```bash
npm run migration:run
npm run seed
```

Start the API in watch mode:

```bash
npm run start:dev
```

The backend is available at `http://localhost:3000`.

### 3. Configure the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_DEMO_USER_ID=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb
```

The demo user ID must be a user that exists in the seeded database. Start the frontend:

```bash
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Environment Variables

### Backend: `backend/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection URL. |
| `PORT` | No | API port. Defaults to `3000`. |
| `FRONTEND_ORIGIN` | No | CORS origin. Defaults to `http://localhost:5173`. |
| `DATABASE_CONNECT_TIMEOUT_MS` | No | PostgreSQL connection timeout. Defaults to `5000`. |
| `SIMULATED_IO_MS` | No | Optional artificial repository delay from `0` to `1000` ms. |
| `DEMO_USER_ID` | Currently required by backend config | Temporary viewer identity used by existing feed, search, detail, and like behavior. It must match a seeded user. It is not used as the author in `POST /posts`; the frontend sends `authorId`. |

Never commit real credentials. Use `.env.example` as the shareable template.

### Frontend: `frontend/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Base URL of the backend API. |
| `VITE_DEMO_USER_ID` | Yes for creating posts | Temporary current-user ID sent as `authorId` when creating originals, replies, and reposts. |

Vite exposes variables prefixed with `VITE_` to browser code. Do not put secrets in frontend environment variables.

## Application Structure

```text
insta-clone/
├── backend/
│   ├── src/
│   │   ├── common/          # Validation, cursor, request ID, logging, errors
│   │   ├── config/          # Environment configuration and validation
│   │   ├── data/            # Repository contracts, fixtures, and implementations
│   │   ├── database/        # TypeORM data source, entities, and seed script
│   │   ├── feed/            # Feed controller and service
│   │   ├── health/          # Liveness endpoint
│   │   ├── posts/           # Post creation, details, likes, replies, reposts
│   │   ├── search/          # Post search
│   │   └── users/           # Profiles and profile media
│   ├── migrations/          # Versioned database migrations
│   ├── db/                  # SQL schema, seed, queries, and constraint checks
│   ├── docs/                # Request lifecycle and database design notes
│   └── test/                # End-to-end and PostgreSQL integration tests
├── frontend/
│   └── src/
│       ├── api/             # HTTP client and API-to-UI mapping
│       ├── components/      # Feed, modal, profile, and notification UI
│       ├── data/            # Local seed content
│       ├── models/          # Tweet, comment, and repost models
│       └── utils/            # Storage, feed, image, and batching helpers
└── README.md
```

### Backend request flow

```text
HTTP request
  -> middleware (request ID and logging)
  -> controller (path/query/body validation)
  -> service (business rules)
  -> repository ( PostgreSQL implementation)
  -> response DTO
```

The service layer validates rules that PostgreSQL cannot express with a simple check constraint, such as requiring a reply or repost target to be an original post.

## API Overview

The default base URL is `http://localhost:3000`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health/live` | Check that the API process is alive. |
| `GET` | `/feed?limit=10&cursor=...` | Read the paginated original-post feed. |
| `GET` | `/posts/:id` | Read post details and referenced post data. |
| `POST` | `/posts` | Create an original, reply, or repost. |
| `PUT` | `/posts/:id/like` | Like a post. |
| `DELETE` | `/posts/:id/like` | Remove a like. |
| `GET` | `/users/:id` | Read a user profile. |
| `GET` | `/users/:id/media?limit=10&cursor=...` | Read a user's original-post media. |
| `GET` | `/search?q=term&limit=10&cursor=...` | Search original posts. |

Example health check:

```bash
curl http://localhost:3000/health/live
```

Successful responses include an `X-Request-Id` response header. Validation and application errors are formatted by the global HTTP exception filter.

## Post Creation

The frontend calls `frontend/src/api/postsApi.js`, which sends `POST /posts` to the backend. The request must include `authorId` and `kind`.

### Original post

```json
{
  "authorId": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "kind": "original",
  "text": "Hello from the social feed"
}
```

### Reply

```json
{
  "authorId": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "kind": "reply",
  "text": "Thanks for sharing this",
  "replyToId": "11111111-1111-4111-8111-111111111111"
}
```

### Repost

```json
{
  "authorId": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "kind": "repost",
  "repostOfId": "11111111-1111-4111-8111-111111111111"
}
```

The backend rejects unknown fields, invalid UUIDs, invalid post kinds, missing required fields, invalid target posts, and text outside the 1-to-280-character range. Reposting the same original more than once for the same author is also rejected by the database constraint.

## Database

The main tables are:

- `users`: handles, profile information, and avatars.
- `posts`: original posts, replies, and reposts.
- `post_media`: ordered image metadata for a post.
- `likes`: unique user/post likes.
- `follows`: user relationships.

Database design documentation is in `backend/docs/db/`, including the ERD, normalization decisions, and data dictionary. The executable SQL references are in `backend/db/`.

Useful migration commands from `backend/`:

```bash
npm run migration:show
npm run migration:run
npm run migration:revert
```

The application uses `synchronize: false`; schema changes must be made through migrations.

## Testing and Quality Checks

Run backend commands from `backend/`:

```bash
npm test
npm run test:e2e
npm run test:cov
npm run lint
npm run build
```

Run frontend commands from `frontend/`:

```bash
npm run build
npm run lint
```

The PostgreSQL integration tests require a reachable database and the relevant environment variables. Unit tests can use the fixture repositories and do not require PostgreSQL.

## Development Notes

- Keep API contracts in DTOs and validate request data at the controller/service boundary.
- Keep database access behind repository interfaces so fixture and TypeORM implementations remain replaceable.
- Use cursor pagination for feed, profile media, and search endpoints; do not add offset pagination to new endpoints without documenting the tradeoff.
- Add a migration for every schema change. Do not enable TypeORM synchronization in development or production.
- Keep frontend API calls in `frontend/src/api/` rather than calling `fetch` directly from presentation components.
- The current local UI also stores some user-created content and interaction state in browser storage; the API remains the source of truth for server-backed posts.
- Authentication, authorization, real file uploads, and production user sessions are not implemented yet.

## Troubleshooting

### The backend cannot connect to PostgreSQL

Check that PostgreSQL is running, the database exists, and `DATABASE_URL` contains the correct username, password, host, port, and database name.

### The frontend shows a network error

Confirm that the backend is running on the URL in `VITE_API_BASE_URL`. Restart Vite after changing frontend environment variables.

### Post creation rejects the author ID

`authorId` must be a valid UUID belonging to a user in the database. Check `VITE_DEMO_USER_ID` and the seeded users.

### The API reports a CORS error

Set `FRONTEND_ORIGIN` in `backend/.env` to the exact frontend origin, including the port, then restart the backend.

### VS Code shows TypeScript errors in `tsconfig.json`

The backend has separate application, build, and test TypeScript configurations. Open the Problems panel and inspect the specific file path; errors can occur when files outside `src/` are included by the application config.

## License

This project is currently private and does not declare an open-source license.
