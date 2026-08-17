# Step 10 — Update User

## Scope

Implement the application-level `UpdateUser` use case as a safe partial update of the existing user record.

## Behavior

- The public identity `uuid` is immutable and is used to locate the user.
- `createdAt` is immutable and is never accepted from the update payload.
- `username`, `email`, and `phone` can be updated or cleared with `null`.
- `status`, `isActive`, and `isVerified` can be updated through domain behavior.
- At least one mutable field must be supplied.
- Soft-deleted users are not returned by `findByUuid`, so normal update requests return not-found.
- Duplicate username, email, and phone values are checked while excluding the current user's UUID.
- Database unique-constraint races are mapped to the existing safe `UserAlreadyExistsError`.
- Application responses expose only safe user fields.

## Architecture

`UpdateUserService` depends only on the domain `UserRepository` contract. Domain mutation is performed by `User`, while Prisma transaction handling and persistence remain inside `PrismaAuthenticationUserRepository`.

## Validation

The update DTO validates all supplied fields, normalizes email/string input, rejects unknown properties, and rejects an empty patch. UUID validation occurs before repository access.

## Transaction Boundary

The repository performs the single-row update through the existing `PrismaTransactionService`. The immutable UUID is used as the update selector and Prisma manages `updated_at` through the schema's `@updatedAt` mapping.
