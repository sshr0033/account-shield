# Account Shield — Fraud Detection Platform

> Real-time authentication fraud detection for superannuation funds, powered by event-driven architecture, AI-assisted triage, and multi-tenant access control.

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.6-brightgreen)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-orange)](https://openjdk.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red)](https://redis.io/)
[![Kafka](https://img.shields.io/badge/Apache%20Kafka-4.1-black)](https://kafka.apache.org/)
[![Deployed on Render](https://img.shields.io/badge/Deployed-Render-purple)](https://render.com/)

---

## Overview

Account Shield is a full-stack, multi-tenant fraud detection system designed for the Australian superannuation industry. It monitors login activity across member funds in real time, applies rule-based detection algorithms to identify brute-force and credential-stuffing attacks, and surfaces actionable alerts to fraud analysts — with AI-generated explanations powered by Google Gemini.

The system is built for **security-critical, multi-organisation environments** where each fund (tenant) has isolated data, role-based access, and an independent administrator hierarchy — while a platform-level team retains global visibility and control.

---

## Live Demo

| Service | URL |
|---|---|
| Fraud Detection Console | [account-shield-frontend.onrender.com](https://account-shield-frontend.onrender.com) |
| Demo Super Fund (attack simulator) | [account-shield-demo-fund.onrender.com](https://account-shield-demo-fund.onrender.com) |
| Backend API | [account-shield.onrender.com](https://account-shield.onrender.com) |

### Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| Fraud Analyst | `analyst@demo.test` | `Analyst123!` | Alert dashboard, login activity, AI explain |
| Tenant Admin | `tenant-admin@demo.test` | `TenantAdmin123!` | Member management, block resets |
| Platform Admin | `platform-admin@demo.test` | `PlatformAdmin123!` | All tenants, enquiry approvals, global resets |
| Member | `member@demo.test` | `Member123!` | Fund portal login (demo-fund only) |

### Suggested Demo Flow

1. Open the **Demo Fund** site in one tab and the **Detection Console** in another.
2. On the Demo Fund, click **"Trigger Brute Force"** — this fires 10 rapid failed logins against a single account.
3. Switch to the Detection Console, log in as `analyst@demo.test`.
4. Watch the `BRUTE_FORCE` alert appear in the dashboard with HIGH severity.
5. Click **"Explain"** on the alert — Gemini generates a plain-English triage explanation.
6. Click **"Block Forever"** to permanently block the attacking IP.

---

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                             │
│   React SPA (Fraud Console)        React SPA (Demo Fund)        │
│   CloudFront / S3                  Static Site                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS + JWT
┌───────────────────────▼─────────────────────────────────────────┐
│                       API TIER                                  │
│   Spring Boot 4 / Tomcat / JWT Auth Filter                      │
│   Role-scoped REST endpoints                                    │
│                       │                                         │
│   ┌────────────────────┼────────────────────────────────────┐   │
│   │  sync mode         │ kafka mode                         │   │
│   │  Direct call       ▼                                    │   │
│   │            Apache Kafka → Consumer → DetectionService   │   │
│   └─────────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                       DATA TIER                                 │
│   PostgreSQL (RDS / Render)    Redis (Upstash / ElastiCache)    │
│   - app_users                  - IP failure counters            │
│   - tenants                    - Email failure counters         │
│   - login_attempts             - Permanent IP blocks            │
│   - alerts                                                      │
│   - enquiries                                                   │
└─────────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                     EXTERNAL SERVICES                           │
│               Google Gemini 2.0 Flash (AI Explain)             │
└─────────────────────────────────────────────────────────────────┘
```

### Detection Pipeline

Every login attempt flows through a two-stage pipeline:

**Stage 1 — Rate Limiting (Redis, synchronous)**
Before the password is even checked, the requesting IP is evaluated against Redis counters. If the IP has exceeded 5 failures in a 10-minute window, or is permanently blocked, the request is rejected with HTTP 429 — no database query, no password check.

**Stage 2 — Fraud Detection (sync or async via Kafka)**
After the attempt is recorded to PostgreSQL, detection runs in one of two modes:
- `sync` — `DetectionService.analyzeAttempt()` is called inline on the request thread. Used for the Render deployment.
- `kafka` — the login attempt ID is published to the `login-attempts` Kafka topic. The consumer retrieves the full attempt and runs detection asynchronously. Used for the full-stack local deployment.

Detection applies two rules:
- **Brute Force**: ≥5 failed attempts against the same email in 10 minutes → HIGH severity alert
- **Credential Stuffing**: ≥10 distinct email targets from one IP in 5 minutes → HIGH severity alert

Alerts are deduplicated with a 15-minute window to avoid spam.

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Runtime |
| Spring Boot | 4.0.6 | Application framework |
| Spring Security | 7.x | JWT auth filter, RBAC |
| Spring Data JPA | 7.x | ORM, repository layer |
| Flyway | 11.x | Database migrations |
| Apache Kafka | 4.1.2 | Async event streaming |
| Redis (Lettuce) | 7.x | Rate limiting, IP blocking |
| jjwt | 0.12.x | JWT generation and validation |
| samstevens/java-totp | 1.1 | TOTP MFA (RFC 6238) |
| Lombok | 1.18.x | Boilerplate reduction |
| HikariCP | 7.x | Connection pooling |
| Tomcat | 11.x | Embedded servlet container |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5.x | Build tool |
| Redux Toolkit | 2.x | Global auth state |
| Material UI (MUI) | 5.x | Component library |
| React Router | 6.x | SPA routing |

### Infrastructure

| Service | Provider | Purpose |
|---|---|---|
| Backend hosting | Render (Web Service) | Spring Boot container |
| Frontend hosting | Render (Static Site) | React build artifacts |
| Database | Render PostgreSQL | Persistent data store |
| Cache | Upstash Redis | Rate limiting counters |
| AI | Google Gemini 2.0 Flash | Alert explanations |
| Container | Docker (multi-stage) | Build and runtime |

---

## Features

### Authentication & Security
- JWT-based stateless authentication (HS256, 1-hour expiry)
- BCrypt password hashing (cost factor 10)
- TOTP-based Multi-Factor Authentication for Fraud Analysts (RFC 6238 compliant)
- IP-level rate limiting via Redis atomic counters
- Per-email failure tracking and reset
- Permanent IP blocking with admin override
- `X-Forwarded-For` header parsing for correct IP extraction behind proxies

### Fraud Detection
- Real-time brute-force detection (5 failures / 10 minutes per email)
- Real-time credential-stuffing detection (10 email targets / 5 minutes per IP)
- Alert deduplication (15-minute suppression window)
- Dual detection modes: synchronous (lightweight) and Kafka-async (scalable)
- Alert lifecycle management: OPEN → RESOLVED / BLOCKED / RELEASED

### AI-Assisted Triage
- Google Gemini 2.0 Flash integration for contextual alert explanations
- Prompt engineering for superannuation domain context
- Graceful degradation with fallback messages on API unavailability or rate limits

### Multi-Tenant Architecture
- Full data isolation by `tenant_id` at every database query
- Four-role RBAC: MEMBER, FRAUD_ANALYST, TENANT_ADMIN, PLATFORM_ADMIN
- Tenant admins scoped exclusively to their own tenant's data
- Platform admins have cross-tenant visibility and control
- Tenant onboarding via enquiry → approval → automatic provisioning workflow

### Observability & Admin
- Login activity audit trail with IP address and timestamp
- Per-member failure count queries for tenant admins
- Global block reset for platform admins
- Cross-tenant alert and activity views for platform admins
- Health check endpoint for uptime monitoring

---

## Project Structure

```
account-shield/
├── src/
│   └── main/
│       ├── java/com/example/account_shield/
│       │   ├── ai/                     # Gemini integration
│       │   ├── alert/                  # Alert entity, detection, actions
│       │   ├── controller/             # Auth, admin, tenant, health
│       │   ├── domain/                 # Role enum
│       │   ├── entity/                 # JPA entities
│       │   ├── kafka/                  # Producer and consumer
│       │   ├── mfa/                    # TOTP service and controller
│       │   ├── ratelimit/              # Redis rate limiter
│       │   ├── repository/             # Spring Data repositories
│       │   ├── security/               # JWT filter, config, seeder
│       │   └── web/dto/                # Request/response records
│       └── resources/
│           ├── application.yml
│           └── db/migration/           # Flyway SQL migrations
├── frontend/
│   ├── src/
│   │   ├── store/                      # Redux auth slice
│   │   ├── App.jsx                     # Router
│   │   ├── Login.jsx                   # Auth + MFA flow
│   │   ├── Dashboard.jsx               # Analyst view
│   │   ├── TenantAdminDashboard.jsx    # Tenant admin view
│   │   ├── AdminDashboard.jsx          # Platform admin view
│   │   ├── MFAVerification.jsx         # MFA login step
│   │   ├── MFASetup.jsx                # MFA enrollment
│   │   ├── ProtectedRoute.jsx          # Route guard
│   │   └── api.js                      # API client
│   └── vite.config.js
├── demo-fund/                          # Attack simulation frontend
│   └── src/
│       ├── App.jsx                     # Fund portal + attack buttons
│       └── api.js
├── docker-compose.yml                  # Local dev: PG + Redis + Kafka
└── Dockerfile                          # Multi-stage production build
```

---

## Local Development

### Prerequisites

- Docker & Docker Compose
- Java 21
- Node.js 20+
- Maven 3.9+

### Start infrastructure

```bash
docker-compose up -d
```

This starts:
- PostgreSQL 16 on `localhost:5432`
- Redis 7 on `localhost:6379`
- Kafka + Zookeeper on `localhost:9092`

### Run the backend

```bash
./mvnw spring-boot:run
```

Flyway runs migrations automatically. `DataSeeder` creates the four demo users on first run.

### Run the frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### Run the demo fund

```bash
cd demo-fund
npm install
npm run dev        # http://localhost:5174
```

### Environment variables

All have defaults for local development — no `.env` file required for local runs.

| Variable | Default | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/accountshield` | JDBC connection string |
| `DB_USERNAME` | `shield` | Database username |
| `DB_PASSWORD` | `shield_pw` | Database password |
| `REDIS_HOST` | `localhost` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | _(empty)_ | Redis password (required on Upstash) |
| `REDIS_SSL` | `false` | Enable SSL for Redis (Upstash requires `true`) |
| `JWT_SECRET` | `default-secret-for-testing` | HMAC-SHA256 signing key |
| `DETECTION_MODE` | `kafka` | `kafka` or `sync` |
| `KAFKA_SERVERS` | `localhost:9092` | Kafka bootstrap servers |
| `KAFKA_ENABLED` | `true` | `false` to disable listener (sync mode) |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:5174` | Comma-separated allowed origins |
| `GEMINI_API_KEY` | _(empty)_ | Google AI Studio API key |
| `SERVER_PORT` | `8080` | Application port |

---

## API Reference

### Public Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate and receive JWT |
| `POST` | `/api/enquiries` | Submit a fund access enquiry |
| `GET` | `/api/healthCheck` | Health check |

### Fraud Analyst (`FRAUD_ANALYST` role)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/analyst/alerts` | List all alerts for the platform |
| `POST` | `/api/analyst/alerts/{id}/explain` | AI-generated explanation |
| `POST` | `/api/analyst/alerts/{id}/resolve` | Mark alert as resolved |
| `POST` | `/api/analyst/alerts/{id}/block-forever` | Permanently block attacking IP |
| `POST` | `/api/analyst/alerts/{id}/release-block` | Release a permanent block |
| `GET` | `/api/analyst/login-attempts` | Recent login activity (all tenants) |
| `POST` | `/api/me/mfa/enroll` | Generate MFA QR code |

### Tenant Admin (`TENANT_ADMIN` role)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tenant-admin/users` | List users in own tenant |
| `POST` | `/api/tenant-admin/users` | Add member to own tenant |
| `PUT` | `/api/tenant-admin/users/{id}` | Update member |
| `DELETE` | `/api/tenant-admin/users/{id}` | Remove member |
| `GET` | `/api/tenant-admin/users/{id}/login-attempts` | Member login history |
| `POST` | `/api/tenant-admin/users/{id}/reset-block` | Reset member's failure count |

### Platform Admin (`PLATFORM_ADMIN` role)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/platform-admin/enquiries` | List pending enquiries |
| `POST` | `/api/platform-admin/enquiries/{id}/approve` | Approve enquiry, provision tenant |
| `GET` | `/api/platform-admin/tenants/{id}/users` | Users in a specific tenant |
| `GET` | `/api/platform-admin/tenants/{id}/alerts` | Alerts for a specific tenant |
| `GET` | `/api/platform-admin/tenants/{id}/login-attempts` | Activity for a specific tenant |
| `POST` | `/api/platform-admin/reset-blocks` | Clear all IP blocks globally |
| `DELETE` | `/api/platform-admin/users/{id}` | Delete any user |

---

## Database Schema

### `app_users`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Auto-increment |
| `tenant_id` | BIGINT | Not null, FK to tenants |
| `email` | VARCHAR | Unique by application logic |
| `password_hash` | VARCHAR | BCrypt encoded |
| `role` | VARCHAR | MEMBER / FRAUD_ANALYST / TENANT_ADMIN / PLATFORM_ADMIN |
| `mfa_enabled` | BOOLEAN | Default false |
| `mfa_secret` | VARCHAR | Base32 TOTP secret |
| `created_at` | TIMESTAMPTZ | Auto-set |

### `login_attempts`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `tenant_id` | BIGINT | |
| `user_id` | BIGINT | Nullable (unknown user attempts) |
| `email_attempted` | VARCHAR | |
| `ip_address` | VARCHAR | |
| `country` | VARCHAR | Nullable |
| `success` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

### `alerts`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `tenant_id` | BIGINT | |
| `type` | VARCHAR(40) | BRUTE_FORCE / CREDENTIAL_STUFFING |
| `severity` | VARCHAR(20) | HIGH / MEDIUM / LOW |
| `details` | VARCHAR | Human-readable description |
| `login_attempt_id` | BIGINT | FK to triggering attempt |
| `status` | VARCHAR(20) | OPEN / RESOLVED / BLOCKED |
| `created_at` | TIMESTAMPTZ | |

### `tenants`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `name` | VARCHAR | Fund name |
| `created_at` | TIMESTAMPTZ | |

### `enquiries`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `company_name` | VARCHAR | |
| `contact_email` | VARCHAR | |
| `message` | VARCHAR | |
| `status` | VARCHAR(20) | PENDING / APPROVED / REJECTED |
| `created_at` | TIMESTAMPTZ | |

---

## Security Design

### Authentication Flow

```
Client                 API                   Redis            PostgreSQL
  │                     │                      │                  │
  ├──POST /login──────► │                      │                  │
  │                     ├──isBlocked(ip)?─────►│                  │
  │                     │◄────────────────────┤                  │
  │                     ├──findByEmail()────────────────────────►│
  │                     │◄───────────────────────────────────────┤
  │                     ├──BCrypt.matches()                       │
  │                     ├──saveAttempt()────────────────────────►│
  │                     │◄───────────────────────────────────────┤
  │                     ├──analyzeAttempt() [sync or via Kafka]  │
  │                     ├──recordFailure(ip)──►│                  │
  │◄──JWT token─────────┤                      │                  │
```

### MFA Flow (FRAUD_ANALYST)

```
1. POST /api/me/mfa/enroll
   ← QR code data URI (TOTP secret stored in DB)

2. User scans QR code with authenticator app

3. POST /api/auth/login (email + password)
   ← { mfaRequired: true } if MFA enabled and no code provided

4. POST /api/auth/login (email + password + mfaCode)
   ← JWT token on success
```

### Rate Limiting Strategy

Redis stores three key types:
- `failed_attempts:{ip}` — rolling counter, TTL 10 minutes
- `failed_attempts:email:{email}` — per-account counter, TTL 10 minutes
- `permanent_block:{ip}` — no TTL, requires admin action to clear

---

## Deployment

### Docker (production build)

```bash
# Build multi-stage image
docker build -t account-shield .

# Run with environment variables
docker run -p 8080:8080 \
  -e DB_URL=jdbc:postgresql://... \
  -e DB_USERNAME=... \
  -e DB_PASSWORD=... \
  -e REDIS_HOST=... \
  -e REDIS_PASSWORD=... \
  -e REDIS_SSL=true \
  -e JWT_SECRET=... \
  -e DETECTION_MODE=sync \
  -e CORS_ORIGINS=https://your-frontend.com \
  account-shield
```

### Render (current deployment)

The application is deployed on Render's free tier:
- Web Service (Docker runtime) for the Spring Boot backend
- Static Site for the React frontend
- Static Site for the demo fund
- Managed PostgreSQL for the database
- Upstash Redis for the cache

`DETECTION_MODE=sync` and `KAFKA_ENABLED=false` disable Kafka entirely — all detection runs synchronously on the request thread, which is appropriate for portfolio/demo workloads.

---

## Future Roadmap

### Time-Series Anomaly Detection with ARIMA/SARIMA

The current detection engine uses fixed thresholds (5 failures / 10 minutes). A significant enhancement would replace or augment these with statistical time-series models:

**ARIMA (AutoRegressive Integrated Moving Average)**
- Model the baseline hourly/daily login volume per tenant
- Flag deviations beyond a configurable confidence interval (e.g. 3σ)
- Detect slow-burn attacks that stay below fixed thresholds but are statistically anomalous for the fund's normal pattern

**SARIMA (Seasonal ARIMA)**
- Extend ARIMA with seasonal components to handle predictable patterns: Monday morning login spikes, end-of-month superannuation activity, annual statement period surges
- Prevents false positives during expected high-volume periods
- Trained per-tenant so each fund's unique seasonality is modelled independently

**Implementation plan**: Store login counts in a time-series table aggregated by 5-minute windows, fit models on 90-day rolling windows, generate prediction intervals at inference time, and emit `ANOMALOUS_VOLUME` alerts when observed counts fall outside the predicted range.

### Enhanced AI Triage (Gemini + Temporal Context)

The current Gemini integration generates explanations based only on the static alert fields. Future work would pass temporal context:
- Time-indexed attack progression (attack started at T, escalated at T+2m, peaked at T+5m)
- Historical patterns for the source IP (first seen, known attack signatures)
- Peer comparison (how does this attack compare to others seen across all tenants?)
- Recommended response playbooks specific to the attack type and severity trajectory

### Additional Detection Rules

- **Account takeover detection**: successful login from a new country/IP after recent failed attempts
- **Distributed brute force**: same password tried across many accounts from many IPs (low-and-slow variant)
- **Impossible travel**: two successful logins from geographically incompatible locations within a short window
- **Velocity abuse**: unusual spike in password reset requests
- **Device fingerprinting**: flag logins from unknown device signatures

### IP Spoofing Hardening

The current rate limiter trusts the `X-Forwarded-For` header to extract the client IP:

```java
String forwarded = request.getHeader("X-Forwarded-For");
if (forwarded != null && !forwarded.isBlank()) {
    return forwarded.split(",")[0].trim();
}
return request.getRemoteAddr();
```

This is vulnerable to **header injection** — an attacker can rotate fake IPs in `X-Forwarded-For` on every request, giving themselves 5 fresh attempts per rotation and bypassing rate limiting entirely:

```
X-Forwarded-For: 1.1.1.1  → 5 attempts, blocked
X-Forwarded-For: 2.2.2.2  → 5 attempts, blocked
X-Forwarded-For: 3.3.3.3  → 5 attempts, blocked  (infinite)
```

**Planned fix — dual IP tracking**: Rate limit on both the forwarded IP and the real TCP connection IP (`request.getRemoteAddr()`). Even if the attacker rotates the header, their real connection IP accumulates failures and gets blocked after 5:

```java
String clientIp = extractClientIp(httpReq);   // X-Forwarded-For
String realIp   = httpReq.getRemoteAddr();      // actual TCP connection

if (rateLimiter.isBlocked(clientIp) || rateLimiter.isBlocked(realIp)) {
    return ResponseEntity.status(429).body(...);
}

// on failure, record both
rateLimiter.recordFailure(clientIp);
rateLimiter.recordFailure(realIp);
```

**Planned fix — trusted proxy validation**: Configure Spring Boot to only honour `X-Forwarded-For` when the connection originates from a known proxy IP range (Render's infrastructure). One-line fix in `application.yml`:

```yaml
server:
  forward-headers-strategy: framework
```

This delegates header parsing to Spring's `ForwardedHeaderFilter`, which validates the header comes from the infrastructure layer rather than the client directly.

**On Render specifically**, the risk is partially mitigated because Render's edge injects `X-Forwarded-For` at the infrastructure level before the request reaches the container — a direct client cannot easily spoof it at the network layer. However, the dual-IP tracking fix is the correct long-term solution for any deployment topology.

### Platform Enhancements

- **MFA enforcement policies**: require MFA for all TENANT_ADMIN accounts, configurable per tenant
- **Backup codes**: emergency access codes generated alongside MFA enrollment
- **WebAuthn/FIDO2**: hardware security key support for high-privilege accounts
- **Webhook alerts**: push notifications to Slack, PagerDuty, or email on HIGH severity alerts
- **Audit log export**: downloadable CSV of all login attempts for compliance reporting
- **Tenant-level alert thresholds**: configurable sensitivity per fund based on their member count and risk profile
- **ML-based IP reputation scoring**: integrate threat intelligence feeds (AbuseIPDB, Shodan) to pre-score IPs before any attempts
- **JWT revocation**: maintain a Redis blocklist of invalidated tokens to handle logout and compromised session scenarios — currently valid tokens from blocked IPs remain usable until the 1-hour expiry

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/arima-detection`)
3. Commit your changes (`git commit -m 'add ARIMA time-series detection'`)
4. Push to the branch (`git push origin feature/arima-detection`)
5. Open a pull request

---

## License

MIT License — see `LICENSE` file for details.

---

## Author

Built as a portfolio project demonstrating enterprise-grade fraud detection architecture using modern Java, event-driven patterns, and AI-assisted security tooling.
