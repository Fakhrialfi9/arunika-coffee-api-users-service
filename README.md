# Arunika Coffee Users Service

## Project purpose

`arunika-coffee-api-users-service` is the NestJS foundation for the Arunika Coffee Users Service. It is a separate repository from the future API Gateway/Main application and will eventually own the Users domain and `arunika_coffee_users` database.

This repository is currently at **Step 01 — Project Foundation** only.

## Architecture boundary

```text
Client
  |
  v
API Gateway / Main (separate repository)
  |
  | future gRPC communication
  v
Users Service (this repository)
  |
  | future database access
  v
MySQL: arunika_coffee_users
```

The repositories remain separate:

```text
arunika-coffee/
├── arunika-coffee-api-main/
└── arunika-coffee-api-users-service/
```

The conceptual root above is documentation only; these are **not** a monorepo or npm workspace.

## Current scope: Step 01

Implemented:

- NestJS + TypeScript foundation
- strict TypeScript configuration
- ESLint and Prettier
- environment/configuration boundary
- Node.js 22.x and npm configuration
- basic NestJS bootstrap
- foundation test runner
- development/build/lint/format commands
- architecture and scope documentation

Not implemented yet:

- Users CRUD
- database connection or schema
- Prisma or another ORM
- repositories
- Users domain/application layers
- gRPC server
- gRPC CRUD contract
- API Gateway implementation
- authentication
- authorization
- audit logging
- observability
- production deployment

These belong to later roadmap steps and must not be implemented prematurely.

## Prerequisites

- Node.js 22 LTS
- npm 11.18.0

Use `.nvmrc` to select the project's Node.js major version.

## Installation

```bash
npm install
```

For a clean reproducible installation from the lockfile:

```bash
npm ci
```

## Environment

Copy `.env.example` to `.env` for local development.

Required foundation variables:

| Variable    | Purpose                          | Example                |
| ----------- | -------------------------------- | ---------------------- |
| `APP_NAME`  | Application name                 | `users-service`        |
| `NODE_ENV`  | Runtime environment              | `development`          |
| `APP_HOST`  | HTTP bootstrap host              | `127.0.0.1`            |
| `APP_PORT`  | HTTP bootstrap port              | `3000`                 |
| `GRPC_HOST` | Future gRPC host placeholder     | `127.0.0.1`            |
| `GRPC_PORT` | Future gRPC port placeholder     | `50051`                |
| `DB_NAME`   | Future database name placeholder | `arunika_coffee_users` |

Environment strategy:

- `development` — local development
- `test` — automated test execution
- `production` — production runtime configuration

Step 01 only establishes the configuration boundary. It does not connect to MySQL or start a gRPC server.

## Development

```bash
npm run start
```

Watch mode:

```bash
npm run start:dev
```

## Build

```bash
npm run build
```

## Lint and type checking

```bash
npm run lint
npm run typecheck
```

## Formatting

```bash
npm run format
npm run format:check
```

## Testing

```bash
npm test
```

Coverage:

```bash
npm run test:coverage
```

Full foundation verification:

```bash
npm run check
```

## Future proto boundary

The future shared proto location is conceptually:

```text
proto/
└── users/
    └── users.proto
```

No CRUD gRPC contract is created during Step 01. The `CreateUser`, `GetUser`, `ListUsers`, `UpdateUser`, and `DeleteUser` methods belong to Step 12.

## Repository workflow

Development for this roadmap is performed directly on the `main` branch. Feature branches and pull requests are intentionally outside the requested workflow.

## Roadmap

1. Project Foundation — current
2. Architecture
3. Database Foundation
4. Users Schema
5. ORM / Repository
6. Users Domain
7. Create User
8. Read User
9. Update User
10. Delete User
11. CRUD Validation
12. gRPC Contract
13. Users gRPC Server
14. gRPC Integration Test
15. API Gateway
16. Gateway Users CRUD
17. Error Handling
18. Authentication
19. Authorization
20. User Security
21. Audit Logging
22. Observability
23. Testing & Hardening
24. Production Hardening
25. Deployment & Final Audit

Only the current roadmap step should be implemented at a time.
