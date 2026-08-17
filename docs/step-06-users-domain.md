# Step 06 — Users Domain

## Scope

The Users domain is independent from NestJS and Prisma. The domain owns the `User` entity, user lifecycle invariants, and the repository contract used by application services.

## Implemented

- UUID is the stable domain identity; the database `bigint` primary key is not exposed by the domain entity.
- User defaults match the Users database contract: `pending`, active, and unverified.
- Domain field length invariants match `authentication_users`.
- User lifecycle operations are explicit: activate, deactivate, verify, unverify, status change, soft delete, and restore.
- Deleted users cannot be activated or verified until restored.
- Prisma models are mapped to/from the domain entity only inside the infrastructure repository adapter.
- `UserRepository` exposes domain types only and has no Prisma/NestJS dependency.

## Acceptance Criteria

- User entity exists and owns user state/invariants.
- UUID is the domain identity.
- Active/verified/deleted state transitions are explicit and guarded.
- Repository abstraction is defined in the domain layer.
- Infrastructure implements the domain repository contract without leaking Prisma types through the domain boundary.
- Unit tests cover defaults, reconstitution, UUID validation, database-aligned limits, soft delete, and restore.
