# Docker & Local Development Guide

This guide covers running the monolithic Jewellery eCommerce application with Docker and Docker Compose.

---

## 1. Prerequisites

You only need the following installed on your host machine:
- **Git**
- **Docker** (>= 24.x)
- **Docker Compose** (V2 / >= 2.20.x, built-in as `docker compose`)

*Note: You do not need to install Node.js, MySQL, or Redis on your host machine.*

---

## 2. Architecture Overview

The container setup runs a cohesive local development and production-oriented monolithic topology:

```
                  Host Browser
                       |
             http://localhost:3000
                       |
                       v
         +----------------------------+
         |     jewellery_app          | (Next.js 16 Standalone / Node 22)
         |     Non-root (nextjs)      |
         +-------------+--------------+
                       |  (Docker Internal Network: jewellery_internal_network)
             +---------+---------+
             |                   |
             v                   v
   +-------------------+ +-------------------+
   |   jewellery_db    | |  jewellery_redis  |
   |    (MySQL 8.0)    | |  (Redis 7 Alpine) |
   +-------------------+ +-------------------+
             |
             +---- Named Volume: `mysql_data`
```

Additionally, **Mailpit** (`jewellery_mailpit`) runs on ports `8025` (Web UI) and `1025` (SMTP) to inspect outgoing transactional emails without sending them externally.

---

## 3. Quick Start

### Step 1: Clone and Configure Environment
```bash
# Copy example environment
cp .env.example .env
```

### Step 2: Build and Launch All Services
```bash
docker compose up -d --build
```

### Step 3: Access Services
- **Storefront & Admin:** [http://localhost:3000](http://localhost:3000)
- **Liveness Health Check:** [http://localhost:3000/api/health/live](http://localhost:3000/api/health/live)
- **Readiness Health Check (Database Probe):** [http://localhost:3000/api/health/ready](http://localhost:3000/api/health/ready)
- **Mailpit Email UI:** [http://localhost:8025](http://localhost:8025)

---

## 4. Useful Docker Commands

### Managing Containers
```bash
# Check container status and health
docker compose ps

# View real-time logs for all services
docker compose logs -f

# View logs for the application only
docker compose logs -f app

# Stop containers gracefully
docker compose down

# Stop containers and remove volumes (WIPES DB DATA)
docker compose down -v
```

### Database & Migrations
```bash
# Enter MySQL shell inside the container
docker compose exec db mysql -ujeweluser -pjewelpassword jewellery_db

# Run Prisma schema push manually
docker compose exec app ./node_modules/.bin/prisma db push

# Open Prisma Studio (from host if running node locally)
npm run db:studio
```

### Redis Inspection
```bash
# Open Redis CLI inside the container
docker compose exec redis redis-cli

# Test ping
docker compose exec redis redis-cli ping
```

### Interactive Shell
```bash
# Open a shell in the running application container (as nextjs non-root user)
docker compose exec app sh
```

---

## 5. Security & Best Practices Implemented

1. **Non-Root Execution:** The application container runs under an unprivileged system user (`nextjs:nodejs`, UID/GID `1001`).
2. **Minimal Multi-Stage Build:** Dependencies and build tools are discarded. Only the Next.js standalone runner, public assets, and required runtime modules are packaged.
3. **No Hardcoded Secrets:** Dockerfiles contain no actual secrets. All credentials are injected via runtime environment variables.
4. **Isolated Networking:** Containers communicate over a dedicated bridge network (`jewellery_internal_network`).
5. **Data Persistence:** Database data resides in the named volume `mysql_data`, ensuring data survives container restarts and upgrades.
6. **Built-in Health Checks:** All services (App, DB, Redis, Mailpit) feature automated health checks with dependency conditions (`service_healthy`).

---

## 6. Production Deployment Guidance

### Deploying the Production Image
1. **Build and Tag with Git SHA:**
   ```bash
   docker build -t <your-registry>/jewellery-app:$(git rev-parse --short HEAD) .
   ```
2. **Run Migrations via Pre-Deploy Job:**
   In orchestration environments (AWS ECS, Kubernetes, Cloud Run), execute database migrations as a discrete one-off pre-deploy task rather than in continuous web replicas:
   ```bash
   ./node_modules/.bin/prisma db push
   ```
3. **Set Production Environment Secrets:**
   Configure `DATABASE_URL` pointing to your managed MySQL (e.g. AWS RDS / Aiven / PlanetScale) and external `REDIS_URL`. Set `AUTO_MIGRATE=false` in production multi-replica deployments.
