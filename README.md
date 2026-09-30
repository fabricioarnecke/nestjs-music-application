# NestJS Music API

REST API for managing users and their music playlists. Users sign up, log in with a JWT and manage their own
playlists. Admins manage users and can see and edit every playlist.

## Features

- Sign up and log in with JWT (tokens expire after 1 hour); passwords are hashed with bcrypt
- Two roles, `ADMIN` and `USER`, enforced with Nest guards and a custom `@Roles()` decorator
- Playlists with a name, a genre and a list of songs; users manage only their own, admins manage all of them
- User management (CRUD), restricted to admins
- Request validation with `class-validator` DTOs; unknown fields are rejected
- Interactive API docs with Swagger
- End-to-end tests with Jest and Supertest
- Runs with Docker Compose: database migrations and the admin user are applied on startup

## Security

- The app refuses to start without `JWT_SECRET`; there is no default signing key
- The admin credentials come from environment variables, not from the code
- Unexpected errors return a generic `500` response; the details only go to the server log
- Every playlist route checks ownership, so a user can't read or change someone else's playlist
- Docker Compose publishes the API and the database on `127.0.0.1` only

## Tech stack

TypeScript · Node.js 24 · NestJS 11 · Prisma 6 · PostgreSQL 15 · Passport JWT · Swagger · Jest · Docker

## Getting started

You need Docker with Docker Compose, and ports `3000` and `5432` free.

```bash
cp .env.example .env
# edit .env: set JWT_SECRET (e.g. openssl rand -base64 32) and the admin credentials
docker compose up
```

The API runs at http://localhost:3000 and the Swagger docs at http://localhost:3000/api.

On startup the container applies the migrations and creates the admin user from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
To call protected routes, log in with `POST /auth/login`, copy the `access_token` and paste it into **Authorize**
in Swagger.

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Key used to sign the JWTs (required) |
| `ADMIN_EMAIL` | Email of the admin user created on startup |
| `ADMIN_PASSWORD` | Password of that admin user |

> The values in `.env.example` are for local development only.

## API overview

| Method | Route | Access |
|---|---|---|
| `POST` | `/auth/register` | Public |
| `POST` | `/auth/login` | Public |
| `GET`, `POST` | `/playlists` | Any logged-in user (admins see all playlists) |
| `GET`, `PATCH`, `DELETE` | `/playlists/:id` | Playlist owner or admin |
| `GET`, `POST` | `/users` | Admin |
| `GET`, `PATCH`, `DELETE` | `/users/:id` | Admin |

## Running the tests

The end-to-end tests need a PostgreSQL database and **delete its users and playlists**, so point `DATABASE_URL`
at a database used only for testing.

```bash
npm install
export DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
export JWT_SECRET="test-secret"
npx prisma migrate deploy
npm run test:e2e
```

## Project structure

```
src/
├── auth/        # login, register, JWT strategy
├── users/       # user CRUD (admin only)
├── playlists/   # playlist CRUD with ownership checks
├── common/      # guards (JWT and roles)
├── decorators/  # @Roles() and @User()
└── prisma/      # Prisma service
prisma/          # schema, migrations and seed script
test/            # end-to-end tests
```
