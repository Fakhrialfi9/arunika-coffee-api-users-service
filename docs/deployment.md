# Production Deployment

This document defines the supported production deployment contract for the Users Service.

## Runtime contract

- Runtime: Node.js 22 LTS.
- Transport: gRPC only; public HTTP traffic belongs to the API Gateway.
- Service port: `GRPC_USERS_PORT` (default `50051`).
- Database ownership: `arunika_coffee_users` belongs exclusively to Users Service.
- The container runs as the non-root `node` user and exposes a gRPC healthcheck.

## Production configuration

Start from `.env.production.example` and replace every placeholder before deployment. Never commit real credentials or production secrets.

Required production properties:

- `NODE_ENV=production`.
- `DATABASE_HOST` must point to the production database and must not be `localhost` or `127.0.0.1`.
- `DATABASE_USER` and `DATABASE_PASSWORD` must be dedicated production credentials, not development/test credentials.
- `DATABASE_URL` must match the production database connection.
- `SECURITY_CORS_ORIGINS` must contain only explicitly allowed production origins.
- `SECURITY_TRUST_PROXY` must identify only trusted infrastructure proxies.
- `LOG_LEVEL` should normally be `info` or stricter; do not use development `debug` logging in production without an explicit operational reason.
- OpenTelemetry exporters/collection endpoints must be supplied through deployment infrastructure when telemetry is enabled.

## Docker deployment

Build the production image:

```bash
docker build --no-cache -t arunika-coffee-users-service:latest .
```

Run it with the production environment:

```bash
docker run -d \
  --name arunika-coffee-users-service \
  --restart unless-stopped \
  -p 50051:50051 \
  --env-file .env.production \
  arunika-coffee-users-service:latest
```

Verify runtime health:

```bash
docker ps --filter name=arunika-coffee-users-service
docker inspect --format='{{json .State.Health}}' arunika-coffee-users-service
docker logs arunika-coffee-users-service
```

The image healthcheck queries the gRPC health service and requires the `liveness` service to report `SERVING`.

## Database migrations

Apply committed Prisma migrations before or as part of deployment:

```bash
npm run prisma:deploy
```

Do not run `prisma migrate dev` against a production database.

## Rollout verification

After deployment verify, in order:

1. Container is running as the non-root `node` user.
2. gRPC healthcheck is `healthy`.
3. Database connectivity/readiness is healthy.
4. gRPC CRUD integration tests pass against the deployed-compatible environment.
5. Logs contain startup/error context without credentials, password hashes, or other sensitive values.

## Rollback

Rollback means redeploying the previous known-good image and applying only migrations that are backward compatible with the deployed application version. Database rollback must be treated as a separate migration decision; never assume application rollback can safely reverse a schema migration.
