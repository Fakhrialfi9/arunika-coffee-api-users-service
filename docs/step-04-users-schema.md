# Step 04 — Users Schema Audit

Status: **PASS**

## Scope

Step 04 covers the database schema contract for `authentication_users`. Prisma migrations and repository implementation are intentionally deferred to Step 05.

## Acceptance Criteria

| Requirement | Result | Evidence |
|---|---|---|
| `authentication_users` table mapping | PASS | `@@map("authentication_users")` |
| Internal primary key | PASS | `id BigInt @id @default(autoincrement()) @db.UnsignedBigInt` |
| Public UUID identity | PASS | `uuid String @unique @default(uuid()) @db.Char(36)` |
| Username uniqueness | PASS | nullable `@unique`, `VarChar(100)` |
| Email uniqueness | PASS | nullable `@unique`, `VarChar(191)` |
| Phone uniqueness | PASS | nullable `@unique`, `VarChar(30)` |
| Default user status | PASS | `status` defaults to `pending` |
| Active state | PASS | `isActive` maps to `is_active`, defaults to `true` |
| Verification state | PASS | `isVerified` maps to `is_verified`, defaults to `false` |
| Creation timestamp | PASS | `createdAt` maps to `created_at`, defaults to `now()` |
| Update timestamp | PASS | `updatedAt` maps to `updated_at`, managed by Prisma `@updatedAt` |
| Soft delete | PASS | nullable `deletedAt` maps to `deleted_at` |
| Status index | PASS | `@@index([status])` |
| Active index | PASS | `@@index([isActive])` |
| Soft-delete index | PASS | `@@index([deletedAt])` |
| Status + soft-delete index | PASS | `@@index([status, deletedAt])` |
| Active + soft-delete index | PASS | `@@index([isActive, deletedAt])` |
| Prisma schema validation | PASS | `npx prisma validate` |

## Deliberate design decisions

- The numeric `BIGINT UNSIGNED` key remains an internal relational identifier.
- The UUID is the stable external identity and is unique.
- Username, email, and phone remain nullable because the current database contract permits accounts that do not yet have every identifier. MySQL permits multiple `NULL` values in unique indexes.
- `status` remains a string with the `pending` default. The authoritative status enum/invariants belong to Step 06, so Step 04 does not prematurely constrain the database contract.
- Soft delete is represented by `deleted_at`; physical deletion is not part of this schema contract.
- Redundant indexes on `username`, `email`, `phone`, or `uuid` are not added because their unique constraints already create the required unique indexes.

## Boundary with Step 05

Step 04 does not claim that migrations or repositories are complete. Step 05 is responsible for Prisma migration lifecycle, generated client usage, repository abstraction, and transaction boundaries.
