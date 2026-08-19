# Step 24 — Containerization

## Build

```bash
docker build --no-cache -t arunika-coffee-users-service:latest .
```

## Local container verification

The production image defaults to `NODE_ENV=production`. Production validation intentionally rejects development database credentials, weak passwords, local database hosts, debug logging, and local CORS origins.

For local Step 24 verification against the existing local development MySQL instance, run the container in development mode:

```bash
sh scripts/docker-run-local.sh
```

The helper connects to MySQL through `host.docker.internal` and publishes gRPC on port `50051`.

Verify:

```bash
docker ps --filter name=arunika-coffee-users-service
docker inspect --format='{{json .State.Health}}' arunika-coffee-users-service
docker logs arunika-coffee-users-service
```

## Production runtime

Copy the production template and replace every placeholder with real infrastructure values:

```bash
cp .env.production.example .env.production
```

The production database user must be a dedicated non-development credential, and the database host must not be `localhost` or `127.0.0.1`.

Run:

```bash
docker run -d \
  --name arunika-coffee-users-service \
  -p 50051:50051 \
  --env-file .env.production \
  arunika-coffee-users-service:latest
```
