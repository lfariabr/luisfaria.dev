<div align="center">

# luisfaria.dev

A full-stack TypeScript portfolio application featuring AI-powered tools, technical articles, and project showcases.

[![Live Site](https://img.shields.io/badge/live-luisfaria.dev-000?style=for-the-badge&logo=vercel&logoColor=white)](https://luisfaria.dev)

[![CI Pipeline](https://github.com/lfariabr/luisfaria.dev/actions/workflows/ci.yml/badge.svg)](https://github.com/lfariabr/luisfaria.dev/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![GraphQL](https://img.shields.io/badge/GraphQL-E10098?logo=graphql&logoColor=white)](https://graphql.org/)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/lfariabr/luisfaria.dev)

</div>

---

## Overview

This repository powers [luisfaria.dev](https://luisfaria.dev) — a portfolio built with Next.js, Node.js, GraphQL, MongoDB, and Redis. It goes beyond a static portfolio by integrating modern patterns: an authenticated AI assistant, atomic rate limiting, CI/CD pipelines, and a layered caching strategy.

**Highlights for reviewers:**
- [Live site](https://luisfaria.dev) — browse projects, articles, and the AI chatbot
- [From Groomzilla to Full-Stack Engineer](https://luisfaria.dev/projects/from-groomzilla-to-full-stack-engineer-building-wedstack) — case study built on this stack
- [Security Incident Report: Cryptominer Attack](https://dev.to/lfariaus/security-incident-report-cryptominer-attack-on-nextjs-application-1df4) — led to the `feat/sec-auth` hardening milestone

---

## Architecture

```
Browser ─── Next.js (SSR/CSR) ─── Apollo Client ─── GraphQL API (:4000)
                                                         │
                                          ┌──────────────┼──────────────┐
                                          │              │              │
                                       MongoDB        Redis        External
                                       (data)     (cache/rate)    APIs
                                                                  ├─ OpenAI
                                                                  ├─ Resend
                                                                  └─ NASA
```

```
luisfaria/
├── _docs/              # Feature specs, release notes, articles
├── backend/            # Express, Apollo Server 5, Mongoose, Redis
├── frontend/           # Next.js 14+, React 19, Apollo Client, TailwindCSS 4, shadcn/ui
└── docker-compose.yml
```

### Design Decisions

| Concern | Approach |
|---|---|
| **API** | GraphQL with modular schema composition and resolver-level error handling |
| **Auth** | JWT in httpOnly cookies, role-based access (ADMIN / EDITOR / USER), GraphQL Shield |
| **Rate Limiting** | Redis + atomic Lua scripts — sliding window per user per feature |
| **Caching** | Multi-layer: Redis (server), Apollo Client cache (client) |
| **Validation** | Zod schemas for all GraphQL inputs |
| **Error Handling** | Shared error factories (`createErrorHandler`) with standardized codes |
| **CI/CD** | GitHub Actions with parallel test suites, Docker, minimal-downtime deploys |

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14+, React 19, TypeScript, Apollo Client, TailwindCSS 4, shadcn/ui |
| **Backend** | Node.js, Express, Apollo Server 5, GraphQL, Mongoose |
| **Data** | MongoDB, Redis |
| **Integrations** | OpenAI (chatbot), Resend (email), NASA API (APOD) |
| **Infrastructure** | Docker, GitHub Actions, Vercel |
| **Testing** | Jest, React Testing Library, MongoDB Memory Server |

---

## Features

| Version | Feature | Description |
|---|---|---|
| v1.1 | Portfolio | Project showcase with highlights and filtering |
| v1.2 | Articles | Technical articles with categorization |
| v1.3 | Auth | JWT authentication with role-based access |
| v1.4 | Chatbot | AI assistant — 5 req/hr per user, conversation history |
| v1.13 | SEO | Meta tags, sitemap, robots.txt, social sharing |
| v1.15 | Markdown | Image support + code syntax highlighting |
| v2.0 | Goggins Mode | Motivational AI coach with rate limiting *(deprecated)* |
| v2.0.1 | Atomic Rate Limiting | Redis + Lua scripts for race-condition-free limits |
| v2.2 | Security Hardening | Auth improvements, QA regression tests, monitoring |
| v2.3 | Assistant UX | Guided prompts, clearer rate-limit feedback |
| v2.4 | APOD | NASA Astronomy Picture of the Day — cached, rate-limited, browsable |
| v2.5 | Error Infrastructure | Shared GraphQL error handling with standardized codes |
| v2.6 | CI/CD | GitHub Actions pipeline, Docker, minimal-downtime deployment |
| v2.7 | Sentry Integration | Error tracking with source maps and release management |
| ~~v3.0~~ | ~~Resend Integration~~ | ~~Transactional emails~~ |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis

### Setup

```bash
# Clone
git clone https://github.com/lfariabr/luisfaria.dev.git
cd luisfaria.dev

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your keys (see Environment Variables below)

# Start development servers
cd backend && npm run dev   # GraphQL API on :4000
cd frontend && npm run dev  # Next.js on :3000
```

Or with Docker:

```bash
docker-compose up --build
```

### Environment Variables

| Variable | Service |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Auth token signing |
| `OPENAI_API_KEY` | AI chatbot |
| `RESEND_API_KEY` | Transactional email |
| `NASA_API_KEY` | APOD feature |
| `DISCORD_WEBHOOK_URL` | Notifications |
| `FRONTEND_URL` | Backend redirect base URL for Stripe checkout |
| `STRIPE_SECRET_KEY` | Stripe server secret key |
| `STRIPE_COFFEE_PRICE_ID` | Stripe Price ID for coffee checkout item |
| `STRIPE_MEETING_PRICE_ID` | Stripe Price ID for meeting checkout item |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature secret *(reserved for phase 2)* |
| `NEXT_PUBLIC_GRAPHQL_URL` | Frontend → API (defaults to `http://localhost:4000/graphql`) |

### Stripe Local Setup

The Stripe checkout flow requires a few one-time steps to run locally.

**1. Get test API keys**

Log in to the [Stripe Dashboard](https://dashboard.stripe.com) and toggle to **Test mode**.
Navigate to [Developers → API keys](https://dashboard.stripe.com/test/apikeys) and copy the **Secret key** (`sk_test_...`).

**2. Create test products and prices**

Go to [Products](https://dashboard.stripe.com/test/products) in Test mode and create two products:

| Product | Suggested price | `backend/.env` variable |
|---|---|---|
| Coffee | AUD 5 one-time | `STRIPE_COFFEE_PRICE_ID` |
| Meeting | AUD 150 one-time | `STRIPE_MEETING_PRICE_ID` |

After saving each product, copy its **Price ID** (`price_...`) into your `backend/.env`.

**3. Set `FRONTEND_URL`**

```bash
# backend/.env
FRONTEND_URL=http://localhost:3000   # no trailing slash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_COFFEE_PRICE_ID=price_...
STRIPE_MEETING_PRICE_ID=price_...
```

`FRONTEND_URL` is used to build the `cancel_url` and `success_url` sent to Stripe, so it must match the URL the frontend is actually running on. A trailing slash or extra path will cause redirect failures.

**4. `STRIPE_WEBHOOK_SECRET` — Phase 2 (deferred)**

Webhook fulfillment (persisting payment results to the database, sending confirmation emails) is planned for a future release. `STRIPE_WEBHOOK_SECRET` is wired into the config but **not required** to run the checkout flow today — leave it blank locally. When webhook support is added, create a webhook endpoint in the [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks) pointing to `/api/stripe/webhook` and paste the signing secret into this variable.

---

## Testing

Both suites run in CI with MongoDB 7 and Redis 7 service containers.

```bash
# Backend
cd backend
npm test                   # All tests
npm run test:coverage      # With coverage

# Frontend
cd frontend
npm test                   # All tests
npm run test:coverage      # With coverage

# Single test file
cd backend && npx jest path/to/test.ts
cd frontend && npx jest path/to/test.tsx
```

**Backend**: Jest + ts-jest, MongoDB Memory Server, mocked external services (OpenAI, Resend, NASA)
**Frontend**: Jest + React Testing Library + jsdom, Apollo Client mocks

---

## License

This project is the source code for [luisfaria.dev](https://luisfaria.dev). Feel free to reference the architecture and patterns for your own projects.
