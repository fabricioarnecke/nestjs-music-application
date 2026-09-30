# NestJS Music API

REST API for managing users and music playlists, with JWT authentication and role-based access control.

Built in two days as a take-home challenge for a junior backend developer position.

## Features

- Sign up and log in with JWT (tokens expire after 1 hour); passwords are hashed with bcrypt
- Two roles, `ADMIN` and `USER`, enforced with Nest guards and a custom `@Roles()` decorator
- Playlist CRUD: users manage only their own playlists, admins can manage all of them
- User management (CRUD), restricted to admins
- Request validation with `class-validator` DTOs; unknown fields are rejected
- Interactive API docs with Swagger
- End-to-end tests with Jest and Supertest
- Runs with Docker Compose: migrations and an admin seed user are applied on startup

## Tech stack

TypeScript · NestJS 11 · Prisma 6 · PostgreSQL 15 · Passport JWT · Swagger · Jest · Docker

## Getting started

You need Docker with Docker Compose, and ports `3000` and `5432` free.

```bash
cp .env.example .env
docker compose up
```

The API runs at http://localhost:3000 and the Swagger docs at http://localhost:3000/api.

On startup the container applies the database migrations and creates an admin user for local testing:

| Email | Password |
|---|---|
| `admin@admin.com` | `admin` |

To call protected routes, log in with `POST /auth/login`, copy the `access_token` and paste it into **Authorize** in Swagger.

> The admin credentials and the values in `.env.example` are for local development only.

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
DATABASE_URL="postgresql://user:password@localhost:5432/test_db" npx prisma migrate deploy
DATABASE_URL="postgresql://user:password@localhost:5432/test_db" npm run test:e2e
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
