# Step 05 — Prisma / ORM Foundation

Status: **PASS**

## Scope

Step 05 establishes Prisma as the infrastructure ORM boundary for Users Service without moving CRUD orchestration into controllers or prematurely defining domain rules.

## Implemented

- Prisma 7 configuration uses the repository-level `prisma.config.js` and `prisma/schema` multi-file schema.
- Prisma Client generation uses ESM output to match the application `type: module` runtime and `.js` import convention.
- Added explicit migration commands for deployment and migration status inspection.
- Added a versioned MySQL baseline migration covering the existing `arunika_coffee_users` schema. The migration uses `CREATE TABLE IF NOT EXISTS` so a pre-provisioned database is not destructively recreated.
- Added `PrismaAuthenticationUserRepository` as the infrastructure persistence adapter for the `authentication_users` model.
- Added `PrismaTransactionService` as the transaction boundary for application operations that need atomic persistence.
- Exported the Prisma repository and transaction boundary from `DatabaseModule`.
- Prisma generation is part of typecheck/test execution so a clean checkout does not depend on a previously generated client.

## Dependency Direction

```text
Application / future Domain
        ↓
Infrastructure persistence adapter
        ↓
PrismaService / Prisma Client
        ↓
MySQL
```

Controllers and presentation code do not access Prisma directly.

## Migration Safety

The repository owns the schema through Prisma migrations. The current database is already provisioned, so the baseline migration is deliberately idempotent at table-creation level. Deploying it records the migration without dropping or recreating existing tables.

Before using the migration history against a pre-existing environment, verify the live schema with the Step 04 contract. Do not use `prisma migrate reset` against a shared or production database.

## Acceptance Criteria

| Requirement | Result |
|---|---|
| Prisma config | PASS |
| Prisma multi-file schema | PASS |
| Prisma Client generation | PASS |
| ESM generated client | PASS |
| Migration directory and MySQL lock | PASS |
| Baseline migration | PASS |
| Repository abstraction | PASS |
| Transaction boundary | PASS |
| Controller-independent persistence | PASS |
| Clean-checkout generated-client lifecycle | PASS |

## Verification

Run locally after pulling `main`:

```bash
npx prisma validate
npx prisma generate
npm run format
npm run lint
npm run typecheck
npm run test
npm run build
npm run check:health
```

The database-dependent migration commands should be run against the intended environment only after verifying the database connection and migration state.
