# Security Baseline

The Users Service is an internal gRPC microservice. Authentication, authorization, credentials, sessions, 2FA, and audit data remain inside the Users Service boundary; other services must not access `arunika_coffee_users` directly.

## Response and data boundary

- User responses expose only fields required by the Users contract.
- Credential/security records such as `password_hash` and encrypted 2FA secrets are not part of the public Users response model.
- Database errors are translated into application/domain errors instead of leaking SQL, Prisma, or infrastructure details.
- Soft-deleted users are excluded from normal user queries.

## Input and transport controls

- gRPC payloads are validated before entering application use cases.
- Message receive/send sizes are capped by `SECURITY_GRPC_MAX_MESSAGE_BYTES`.
- Database access uses Prisma/repository abstractions rather than raw SQL assembled from user input.
- Rate-limit and body-limit configuration is kept in the security configuration boundary.
- CORS/proxy configuration is environment-specific and must not use permissive production defaults.

## Credential boundary

The service is prepared to own credential data but does not prematurely expose login behavior through the Users CRUD contract. Password hashing/verification belongs in the authentication/security workflow, not in generic user response DTOs.

Never log passwords, password hashes, 2FA secrets, session secrets, database URLs containing credentials, or other authentication material.

## Production secrets

- `.env.production.example` contains placeholders only.
- Real production credentials must be injected by the deployment environment/secret manager and must never be committed.
- Development/test credentials are not valid production credentials.

## Container security

The production image uses a multi-stage build, installs only production dependencies in the runtime stage, runs as the non-root `node` user, and exposes a gRPC healthcheck. The Docker runtime must not require privileged mode.

## Verification

Run the repository security suite with:

```bash
npm run test:security
```

The complete Step 25 quality gate also runs unit, CRUD integration, gRPC integration, typecheck, lint, format, build, and Docker smoke/health verification through CI.
