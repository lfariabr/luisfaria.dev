# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack TypeScript portfolio application (luisfaria.dev) with a Next.js frontend and Node.js/Express/Apollo GraphQL backend. MongoDB for data, Redis for caching and rate limiting, OpenAI for AI chatbot, Resend for email.

## Build & Development Commands

### Backend (`backend/`)
```bash
npm run dev              # Start dev server with nodemon (port 4000)
npm run build            # TypeScript compile to /dist
npm run build:prod       # Production TypeScript build
npm test                 # Run Jest tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

### Frontend (`frontend/`)
```bash
npm run dev              # Next.js dev server (port 3000)
npm run build            # Production build (standalone output)
npm run lint             # ESLint
npm test                 # Run Jest tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

### Running a single test
```bash
cd backend && npx jest path/to/test.ts
cd frontend && npx jest path/to/test.tsx
```

### Docker
```bash
docker-compose up --build    # All services
docker-compose down          # Stop
```

## Architecture

### Monorepo Structure
- `frontend/` — Next.js 14+ App Router, React 19, Apollo Client, TailwindCSS 4, shadcn/ui
- `backend/` — Express + Apollo Server 5, GraphQL, Mongoose, Redis
- `_docs/` — Feature specs (`featureBreakdown/`), release notes, articles
- `copilot-instructions.md` — Detailed development guidelines (authoritative reference)

### Backend Key Paths
- **Entry point**: `backend/src/index.ts` — Express server, MongoDB/Redis connections, Apollo setup
- **Config**: `backend/src/config/config.ts`
- **GraphQL schema**: `backend/src/schemas/typeDefs.ts` (composed from `schemas/types/`)
- **Resolvers**: `backend/src/resolvers/index.ts` (composed from domain folders: `users/`, `articles/`, `projects/`, `chatbot/`, `apod/`, `resend/`, `screams/`)
- **Models**: `backend/src/models/` — Mongoose schemas (User, Article, Project, ChatMessage, Scream)
- **Services**: `backend/src/services/` — rateLimiter (Redis+Lua), redis client, openai client, resendMailer, apod service
- **Error handling**: `backend/src/utils/errors/` — shared error factories, `createErrorHandler` wrapper
- **Authorization**: `backend/src/validation/shield.ts` — GraphQL Shield rules
- **Validation**: `backend/src/validation/schemas/` — Zod schemas

### Frontend Key Paths
- **App Router pages**: `frontend/src/app/`
- **Components**: `frontend/src/components/` (ui/, chat/, apod/, sections/, layouts/)
- **GraphQL/Apollo**: `frontend/src/lib/apollo/client.ts`
- **Auth middleware**: `frontend/src/middleware.ts` — protects `/admin` routes, validates JWT from httpOnly cookies

### Data Flow
```
Browser → Next.js (SSR/CSR) → Apollo Client → GraphQL API (port 4000)
                                                  ↓
                                    MongoDB (data) + Redis (rate limits/cache)
                                    OpenAI (chatbot) + Resend (email) + NASA API (APOD)
```

## Key Patterns

### GraphQL Resolver Pattern
All resolvers use shared error infrastructure. Never create raw `GraphQLError` instances:
```typescript
import { createErrorHandler, Errors } from '../../utils/errors';

export const myResolver = createErrorHandler(async (parent, args, context) => {
  if (!context.user) throw Errors.unauthenticated();
  // resolver logic
}, 'ResolverName');
```

### Rate Limiting
Uses Redis with atomic Lua scripts. Three rate-limited features:
- Chatbot: 5 req/hr per user (`chatbot:<userId>`)
- Goggins Mode: 2 req/24hr per email (`goggins:<email>`)
- APOD: 5 req/hr per user (`apod:<userId>`)

Use `rateLimiter.limit(key, limit, windowSeconds)` from `backend/src/services/rateLimiter.ts`.

### Authentication
- JWT in httpOnly cookies (not localStorage)
- Roles: ADMIN, EDITOR, USER
- GraphQL Shield for field-level authorization
- Frontend middleware redirects unauthenticated users from `/admin`

### Adding a New GraphQL Feature
1. Define types in `backend/src/schemas/types/`
2. Import in `backend/src/schemas/typeDefs.ts`
3. Create resolver in domain folder, wrap with `createErrorHandler`
4. Add shield rules if auth required
5. Register in `backend/src/resolvers/index.ts`
6. Create frontend query/mutation in `frontend/src/lib/graphql/`
7. Write tests (backend integration + frontend component)

## Testing

- **Backend**: Jest + ts-jest, MongoDB Memory Server for in-memory DB, mocked external services (OpenAI, Resend, NASA)
- **Frontend**: Jest + React Testing Library + jsdom, Apollo Client mocks
- **CI**: GitHub Actions runs both test suites in parallel with MongoDB 7 and Redis 7 services

## Environment Variables

Backend requires: `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `NASA_API_KEY`, `DISCORD_WEBHOOK_URL`
Frontend requires: `NEXT_PUBLIC_GRAPHQL_URL` (defaults to `http://localhost:4000/graphql`)

See `backend/.env.example` for full template.

## Code Style
- TypeScript with proper types (no `any`)
- Functional patterns: React hooks, composition
- Minimal comments — code should be self-documenting
- Zod for input validation
- TailwindCSS for styling, shadcn/ui components
