# Arunika Coffee API — Users Service

Users Service for the Arunika Coffee backend microservices architecture.

## Purpose

The Users Service owns the user domain and its database.

It is an internal microservice and communicates with other services through gRPC.

Public HTTP traffic is handled by the API Gateway.

## Technology

- Node.js 22 LTS
- TypeScript
- NestJS
- npm
- ESM
- MySQL
- Prisma
- Vitest
- ESLint
- Prettier
- OpenTelemetry

## Database

Database:

`arunika_coffee_users`

The Users Service owns this database.

Other services must not access this database directly.

## Architecture

```text
API Gateway
     |
    gRPC
     |
Users Service
     |
Repository
     |
Prisma
     |
MySQL
