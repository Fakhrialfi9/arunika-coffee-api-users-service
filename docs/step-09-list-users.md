# Step 09 — List User

## Scope

Implement the application-level `ListUsers` use case with reliable pagination, filtering, searching, sorting, and deterministic ordering.

## Behavior

- Default pagination: page `1`, limit `20`.
- Maximum page size: `100`.
- Search checks username, email, and phone.
- Optional exact filters are available for username, email, phone, status, active state, and verified state.
- Supported sort fields: `createdAt`, `updatedAt`, `username`, `email`, `status`, and `uuid`.
- Supported sort orders: `asc` and `desc`.
- Soft-deleted users are excluded at repository level.
- Sorting always adds `uuid ASC` as a stable tie-breaker.
- Application responses expose only safe user fields and pagination metadata.

## Architecture

The application service depends on the domain `UserRepository` contract. Prisma-specific filtering, pagination, counting, and ordering remain inside the infrastructure repository implementation.

## Validation

The list DTO validates pagination boundaries, filter lengths, boolean values, and supported sorting options before the repository is called.
