# FleetCore

REST API for managing fleet vehicles, mechanics, workshops, and maintenance records. Built with NestJS, TypeScript, PostgreSQL, and TypeORM. Private endpoints use JWT authentication and role authorization; external partners can query completed maintenance history with an API key.

## Requirements

- Node.js 20 or newer and npm.
- PostgreSQL 16 for running without Docker.
- Docker Compose for the bundled development environment.

## Configuration

Create a local environment file:

```bash
cp .env.example .env
```

The example sets `DB_HOST=db`, the PostgreSQL service name used by Docker Compose. When running the app or seed directly on the host, change it to `DB_HOST=localhost` and configure the connection for your local PostgreSQL instance. Replace `JWT_SECRET` and `API_KEYS` with values appropriate for your environment.

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port for the API. |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL connection. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | JWT signing secret and expiration. |
| `API_KEYS` | Accepted key or keys for the partner integration. |
| `BCRYPT_SALT_ROUNDS` | Password hashing cost. |
| `CORS_ORIGINS` | Allowed CORS origins. |
| `DB_SYNCHRONIZE` | Entity synchronization; keep `false` and use migrations. |

## Run with Docker

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec api npm run seed
```

Compose waits for PostgreSQL to become healthy and applies the initial migration when the API starts. The seed loads the demo data. Swagger is available at `http://localhost:3000/docs` (or the configured `PORT`).

The development database is disposable. To remove the PostgreSQL volume and start with an empty database:

```bash
docker compose down -v
docker compose up --build -d
docker compose exec api npm run seed
```

`docker compose down -v` permanently deletes the local PostgreSQL volume and its data.

## Run without Docker

With PostgreSQL running and `.env` configured with `DB_HOST=localhost`:

```bash
npm ci
npm run seed
npm run start:dev
```

`npm run seed` builds the project, applies pending TypeORM migrations, and creates or updates demo records. It does not delete unrelated database records. To apply migrations without seeding, run `npm run build && npm run migration:run`.

## Demo accounts

The seed creates these accounts for local use:

| Role | Email | Default password |
| --- | --- | --- |
| ADMIN | `seed.admin@fleetcore.test` | `FleetCoreAdmin123!` |
| TECHNICIAN | `seed.technician1@fleetcore.test` | `FleetCoreTech123!` |
| TECHNICIAN | `seed.technician2@fleetcore.test` | `FleetCoreTech456!` |

Override the passwords with `SEED_ADMIN_PASSWORD`, `SEED_TECHNICIAN_ONE_PASSWORD`, and `SEED_TECHNICIAN_TWO_PASSWORD`. Default credentials are for development only.

## API

- `POST /auth/register` registers a `TECHNICIAN` account and issues a JWT; public sign-up cannot choose a role. `POST /auth/login` issues a JWT.
- `POST /auth/users` (ADMIN) creates an account with any role, including `ADMIN`.
- `GET /auth/me` returns the authenticated user.
- Vehicle, mechanic, workshop, and maintenance endpoints enforce permissions for the `ADMIN` and `TECHNICIAN` roles.
- `GET /maintenances/audit` and `GET /maintenances/:id/audit` (ADMIN) list every maintenance status change with the previous status, the new status, the user who made it, and the time.
- `GET /integrations/vehicles/:plate/maintenances` returns completed maintenance history and requires the `x-api-key` header configured through `API_KEYS`.

### Business rules worth knowing

- A vehicle's `IN_MAINTENANCE` status is set and cleared only by the maintenance workflow. Manual updates may switch a vehicle only between `AVAILABLE` and `INACTIVE`.
- Vehicles, mechanics, and workshops with `SCHEDULED` or `IN_PROGRESS` maintenances cannot be inactivated (`409`); finish or cancel those maintenances first.
- "Only one active maintenance at a time" is enforced per time window: a vehicle or mechanic cannot have overlapping `SCHEDULED`/`IN_PROGRESS` maintenances, and cannot have two `IN_PROGRESS` at once. Back-to-back windows (e.g. 7:30–9:00 and 9:00–10:00) are allowed, matching the mechanic scheduling examples in the requirements.
- Swagger UI is available at `/docs`.

Private endpoints require `Authorization: Bearer <token>`.

## Tests and checks

Jest is the configured test runner for unit and e2e tests. Vite and Vitest remain available in the Nest development dependencies/configuration, but are not invoked by the project's test scripts.

```bash
npm run build
npm run lint
npm test
npm run test:cov
npm run test:e2e
```

The e2e tests require PostgreSQL reachable from the host at `localhost`. Their setup accepts environment values for the port, database name, and credentials.

## Author

### Neyder Ramirez - RA Node/NestJS AM