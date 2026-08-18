# gRPC Contract & Server — Users Service

## Source of truth

The canonical Users Service contract is:

`proto/users/v1/users.proto`

The contract uses package `arunika.coffee.users.v1`. The `v1` package is the compatibility boundary for internal service-to-service communication.

The database remains the source of truth for persistence, while this protobuf contract is the source of truth for the Users Service gRPC interface.

## RPCs

| RPC | Request | Response | Purpose |
| --- | --- | --- | --- |
| `CreateUser` | `CreateUserRequest` | `CreateUserResponse` | Create a user identity |
| `GetUser` | `GetUserRequest` | `GetUserResponse` | Read one non-deleted user by UUID |
| `ListUsers` | `ListUsersRequest` | `ListUsersResponse` | Paginated/filterable/sortable user listing |
| `UpdateUser` | `UpdateUserRequest` | `UpdateUserResponse` | Partial update of user state/identity |
| `DeleteUser` | `DeleteUserRequest` | `DeleteUserResponse` | Soft-delete a user |

## User response boundary

`User` intentionally exposes only the current Users CRUD application result:

- `uuid`
- `username`
- `email`
- `phone`
- `status`
- `is_active`
- `is_verified`
- `created_at`
- `updated_at`

Sensitive persistence data such as `password_hash`, session data, 2FA secrets, security counters, and audit internals are not part of this contract.

## Optional fields and partial updates

Proto3 `optional` is used where field presence matters. This is important for `UpdateUserRequest`: omitted fields mean "do not change this field".

`CreateUserRequest` requires at least one of `username`, `email`, or `phone` at application-validation time. The protobuf contract does not duplicate business validation rules that belong to the application layer.

## Pagination, filtering, and sorting

`ListUsersRequest` mirrors the existing Users application contract:

- `page` — 1-based page number.
- `limit` — page size, currently bounded by the application layer to 1–100.
- `search` — general user search.
- `username`, `email`, `phone`, `status` — field filters.
- `is_active`, `is_verified` — boolean filters.
- `sort_by` — created time, updated time, username, email, status, or UUID.
- `sort_order` — ascending or descending.

Unspecified pagination/sorting values are normalized by the application layer to the existing defaults (`page=1`, `limit=20`, `createdAt`, descending).

## gRPC server

NestJS starts the Users gRPC transport alongside the existing application bootstrap. The server implements the `UsersService` contract and binds all five CRUD RPCs to the existing application services:

- `CreateUser` → `CreateUserService`
- `GetUser` → `GetUserService`
- `ListUsers` → `ListUsersService`
- `UpdateUser` → `UpdateUserService`
- `DeleteUser` → `DeleteUserService`

The bind address is controlled by `GRPC_USERS_HOST` and `GRPC_USERS_PORT`. The canonical local configuration uses `localhost:50051`.

The gRPC controller maps application results to the protobuf response shape without exposing Prisma models or sensitive database concerns.

## Status and error convention

Successful RPCs use the normal gRPC `OK` status and return the declared response message. Errors use standard gRPC status codes; errors are not embedded as ad-hoc response payloads.

| Application condition | gRPC status |
| --- | --- |
| Malformed/invalid request | `INVALID_ARGUMENT` |
| User UUID does not identify an available user | `NOT_FOUND` |
| Username/email/phone already exists | `ALREADY_EXISTS` |
| Unexpected application/repository failure | `INTERNAL` |
| RPC deadline exceeded | `DEADLINE_EXCEEDED` |
| Service unavailable | `UNAVAILABLE` |
| RPC not implemented | `UNIMPLEMENTED` |

Detailed application-error to gRPC-status mapping is handled in Step 17.

## Compatibility rules

1. Never reuse an existing protobuf field number for a different semantic meaning.
2. Additive fields are preferred for backward-compatible evolution.
3. Removed fields must be reserved in a future contract revision.
4. Breaking changes require a new package version such as `v2`; do not silently change the meaning of `v1`.
5. Database columns and protobuf fields are not required to have one-to-one correspondence.
6. Authentication credentials, authorization internals, security secrets, and audit implementation details must remain outside the CRUD `User` payload unless a later roadmap step explicitly introduces a dedicated contract.

## Contract ownership

`users-service` owns the Users Service protobuf contract. Consumers must depend on the versioned protobuf contract, not on the Users Service database schema or Prisma models.

Payload validation and application-error mapping are intentionally deferred to Step 17. Full real-client gRPC integration testing is deferred to Step 18.
