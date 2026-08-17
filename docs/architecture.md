# Users Service Architecture

## 1. Purpose

`users-service` adalah microservice yang bertanggung jawab terhadap domain Users pada Arunika Coffee Backend.

Service ini memiliki ownership penuh terhadap:

- User identity
- User profile
- User credentials
- User security state
- User sessions
- Two-factor authentication
- Roles
- Permissions
- User-role assignments
- Role-permission assignments
- User audit logs

Service lain tidak boleh mengakses database `arunika_coffee_users` secara langsung.

Komunikasi antar-service dilakukan melalui contract yang telah ditentukan, terutama gRPC.

---

# 2. Architecture Style

Users Service menggunakan layered architecture dengan dependency direction yang terkontrol.

```text
Presentation
    ↓
Application
    ↓
Domain
    ↑
Infrastructure
