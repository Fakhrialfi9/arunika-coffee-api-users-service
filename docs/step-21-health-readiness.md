# Step 21 — Health & Readiness

## Health model

Users Service exposes the standard gRPC Health Checking Protocol on the same gRPC listener.

| Service name | Meaning | Healthy when |
| --- | --- | --- |
| `liveness` | Process/application is alive | gRPC health server is running |
| `readiness` | Service can accept normal traffic | Users database health check succeeds |
| `arunika.coffee.users.v1.UsersService` | Users RPC readiness | Users database health check succeeds |
| `''` | Overall service readiness | Users database health check succeeds |

`liveness` intentionally does not depend on MySQL. `readiness` does.

## Runtime behavior

- Health starts as `NOT_SERVING` for readiness until the database check succeeds.
- The database is checked immediately after the gRPC server starts.
- Readiness is re-evaluated every 10 seconds.
- Database failure changes readiness to `NOT_SERVING` without changing liveness.
- Database recovery changes readiness back to `SERVING`.
- Shutdown changes readiness and overall status to `NOT_SERVING`.

## Manual verification

Start the service normally, then use `grpcurl`:

```bash
grpcurl -plaintext 127.0.0.1:50051 grpc.health.v1.Health/Check
```

Expected while the database is ready:

```json
{
  "status": "SERVING"
}
```

Check liveness explicitly:

```bash
grpcurl -plaintext -d '{"service":"liveness"}' 127.0.0.1:50051 grpc.health.v1.Health/Check
```

Check readiness explicitly:

```bash
grpcurl -plaintext -d '{"service":"readiness"}' 127.0.0.1:50051 grpc.health.v1.Health/Check
```

When MySQL becomes unavailable, `liveness` remains `SERVING` while `readiness` becomes `NOT_SERVING` after the next health refresh.
