# Step 08 — Read User

## Scope

Implement the application read flow for retrieving a user by UUID while keeping the domain independent from NestJS and Prisma.

## Implemented

- Added `GetUserService` as the application use case.
- Added UUID validation through `GetUserDto`.
- Added `UserNotFoundError` for missing or soft-deleted users.
- Added `GetUserValidationError` for malformed read requests.
- Updated the repository contract implementation so normal UUID reads exclude soft-deleted records.
- Added a safe response mapper that exposes only public user fields.
- Added unit tests for successful reads, missing users, soft-deleted users, invalid UUIDs, and unexpected properties.

## Acceptance Criteria

- User can be retrieved by UUID.
- Soft-deleted users are excluded from normal reads.
- Internal database identifiers and `deletedAt` are not exposed by the application result.
- Application/domain code does not depend on Prisma.
- Unit tests, lint, typecheck, formatting, and build pass.
