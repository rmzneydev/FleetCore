# FleetCore

REST API for managing fleet vehicles, mechanics, workshops, and maintenance records. Built with NestJS, TypeScript, PostgreSQL, and TypeORM. Private endpoints use JWT authentication and role authorization; external partners can query completed maintenance history with an API key.

**Swagger UI:** `http://localhost:3000/docs` (replace `3000` with your `PORT`).

## Author

### Neyder Ramirez - RA Node/NestJS AM

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
| `API_KEYS` | Accepted key or keys for the partner integration, comma-separated. |
| `BCRYPT_SALT_ROUNDS` | Password hashing cost. |
| `CORS_ORIGINS` | Allowed CORS origins. |
| `DB_SYNCHRONIZE` | Entity synchronization; keep `false` and use migrations. |

## Run with Docker

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec api npm run seed
```

Compose starts PostgreSQL with a persistent volume on an internal network, waits for it to become healthy, and applies pending migrations when the API starts. The seed loads the demo data. Swagger is then available at `http://localhost:3000/docs`.

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

`npm run seed` builds the project, applies pending TypeORM migrations, and creates or updates demo records. Running it again does not duplicate records, and it does not delete unrelated ones. To apply migrations without seeding, run `npm run build && npm run migration:run`.

## Demo data

The seed creates:

- 1 `ADMIN` user and 2 `TECHNICIAN` users.
- 3 mechanics: 2 active and linked to the technician accounts, 1 inactive.
- 2 workshops: `Taller Centro` (active) and `Taller Norte` (inactive).
- 4 vehicles: `SEED-001` and `SEED-002` (`AVAILABLE`), `SEED-003` (`IN_MAINTENANCE`, with its `IN_PROGRESS` maintenance), and `SEED-004` (`INACTIVE`).
- 1 `COMPLETED` maintenance for `SEED-001`, so its history is not empty, plus the status audit trail of each demo maintenance.

### Demo accounts

| Role | Email | Default password |
| --- | --- | --- |
| ADMIN | `seed.admin@fleetcore.test` | `FleetCoreAdmin123!` |
| TECHNICIAN | `seed.technician1@fleetcore.test` | `FleetCoreTech123!` |
| TECHNICIAN | `seed.technician2@fleetcore.test` | `FleetCoreTech456!` |

Override the passwords with `SEED_ADMIN_PASSWORD`, `SEED_TECHNICIAN_ONE_PASSWORD`, and `SEED_TECHNICIAN_TWO_PASSWORD`. Default credentials are for development only.

## Database dump

[database/fleetcore.sql](database/fleetcore.sql) is a plain `pg_dump` (PostgreSQL 16) of the structure and data used for the delivery: every table, enum, index and relation, the applied migrations, the demo records, and the maintenance created during the Swagger tests. It contains no object owners or privileges, so it can be restored with any database user.

Restore it into an empty database. With Docker:

```bash
docker compose down -v
docker compose up -d db
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < database/fleetcore.sql
docker compose up --build -d
```

The dump already records both migrations, so the API starts without re-applying them. Do not run the seed on top of a restored dump unless you want the original demo plates back: the seed re-creates any missing `SEED-*` vehicle.

Without Docker, against an empty database:

```bash
psql -h localhost -U <user> -d <database> -f database/fleetcore.sql
```

The dump uses the `\restrict` guard added in PostgreSQL 16.10, so use `psql` 16.10 or newer (the `postgres:16-alpine` container already includes it).

## Using the API

1. Open Swagger at `/docs`.
2. Run `POST /auth/login` with a demo account and copy `data.accessToken`.
3. Click **Authorize** and paste the token (without the `Bearer` prefix).
4. For the partner integration, also set the `x-api-key` scheme to one of the values in `API_KEYS`.

Successful responses use `{ success, statusCode, data, timestamp }`; errors use `{ success, statusCode, message, path, timestamp }`.

### Endpoints

| Area | Endpoints | Access |
| --- | --- | --- |
| Auth | `POST /auth/register` (always creates a `TECHNICIAN`), `POST /auth/login` | Public |
| Auth | `GET /auth/me` | Any authenticated user |
| Auth | `POST /auth/users` (any role, including `ADMIN`) | ADMIN |
| Vehicles | `GET /vehicles`, `GET /vehicles/:id`, `GET /vehicles/plate/:plate` | ADMIN, TECHNICIAN |
| Vehicles | `POST /vehicles`, `PATCH /vehicles/:id`, `DELETE /vehicles/:id` (inactivates) | ADMIN |
| Mechanics | `GET /mechanics`, `GET /mechanics/:id` | ADMIN, TECHNICIAN |
| Mechanics | `POST /mechanics`, `PATCH /mechanics/:id` (also activates), `DELETE /mechanics/:id` (inactivates) | ADMIN |
| Workshops | `GET /workshops` (active only), `GET /workshops/:id` | ADMIN, TECHNICIAN |
| Workshops | `POST /workshops`, `PATCH /workshops/:id` (also activates), `DELETE /workshops/:id` (inactivates) | ADMIN |
| Maintenances | `POST /maintenances`, `GET /maintenances`, `GET /maintenances/active` | ADMIN |
| Maintenances | `GET /maintenances/vehicle/:id`, `GET /maintenances/vehicle/:id/history`, `GET /maintenances/mechanic/:id` | ADMIN |
| Maintenances | `GET /maintenances/audit`, `GET /maintenances/:id/audit` (status change log with user and time) | ADMIN |
| Maintenances | `GET /maintenances/my` (assigned maintenances with vehicle and workshop) | TECHNICIAN |
| Maintenances | `PATCH /maintenances/:id/status` | ADMIN, or the TECHNICIAN assigned to it |
| Integrations | `GET /integrations/vehicles/:plate/maintenances` | `x-api-key` header |

Every non-public endpoint requires `Authorization: Bearer <token>`.

### Business rules

- Allowed transitions: `SCHEDULED → IN_PROGRESS | CANCELLED` and `IN_PROGRESS → COMPLETED | CANCELLED`. `COMPLETED` and `CANCELLED` are final. Invalid transitions return `400` with a descriptive message.
- Completing a maintenance requires `workPerformed`, `finalCost`, `finishedAt`, and `finalMileage`. The final mileage cannot be lower than the recorded one.
- Starting a maintenance sets the vehicle to `IN_MAINTENANCE`. Completing it, or cancelling it while in progress, sets the vehicle back to `AVAILABLE`.
- A vehicle's `IN_MAINTENANCE` status is set and cleared only by the maintenance workflow. Manual updates may switch a vehicle only between `AVAILABLE` and `INACTIVE`.
- Maintenances cannot use missing or inactive vehicles, mechanics, or workshops, and the scheduled mileage cannot be lower than the vehicle's current mileage.
- "Only one active maintenance at a time" is enforced per time window. A vehicle or mechanic cannot have overlapping `SCHEDULED`/`IN_PROGRESS` maintenances, in the same workshop or a different one, and cannot have two `IN_PROGRESS` at once. Back-to-back windows (for example 7:30–9:00 and 9:00–10:00) are allowed.
- Vehicles, mechanics, and workshops with `SCHEDULED` or `IN_PROGRESS` maintenances cannot be inactivated (`409`). Inactivation never deletes maintenance history.

## Tests and checks

Jest is the test runner for unit and e2e tests.

```bash
npm run build
npm run lint
npm test
npm run test:cov    # fails if coverage drops below 40 %
npm run test:e2e
```

The e2e tests require PostgreSQL reachable from the host at `localhost`. Their setup accepts environment values for the port, database name, and credentials.

The latest results (37 unit tests, 1 e2e test, about 67 % statement coverage) and the list of covered scenarios are in [EVIDENCIA-PRUEBAS-JEST.md](evidencias/Jest.md).
