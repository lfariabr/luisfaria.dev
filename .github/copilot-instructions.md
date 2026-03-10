# Copilot Instructions

## Project Overview
Full-stack TypeScript portfolio app (luisfaria.dev). Next.js frontend + Node.js/Express/Apollo GraphQL backend. MongoDB for data, Redis for caching/rate-limiting, OpenAI for chatbot, Resend for email.

## Commands

### Backend (`backend/`)
```bash
npm run dev              # nodemon dev server (port 4000)
npm run build            # tsc compile to /dist
npm test                 # Jest tests
npm run test:coverage    # with coverage
npx jest path/to/test.ts # single test
```

### Frontend (`frontend/`)
```bash
npm run dev              # Next.js dev server (port 3000)
npm run build            # production build (standalone output)
npm run lint             # ESLint
npm test                 # Jest tests
npm run test:coverage    # with coverage
npx jest path/to/test.tsx # single test
```

## Architecture

```
Browser → Next.js (SSR/CSR) → Apollo Client → GraphQL API (port 4000)
                                                  ↓
                                    MongoDB + Redis + OpenAI + Resend + NASA API
```

### Backend key paths
- Entry: `backend/src/index.ts`
- GraphQL schema: `backend/src/schemas/typeDefs.ts` (composed from `schemas/types/`)
- Resolvers: `backend/src/resolvers/index.ts` (domains: `users/`, `articles/`, `projects/`, `chatbot/`, `apod/`, `resend/`, `screams/`)
- Models: `backend/src/models/` — Mongoose schemas
- Services: `backend/src/services/` — rateLimiter (Redis+Lua), openai, resend, apod
- Error infrastructure: `backend/src/utils/errors/`
- Authorization: `backend/src/validation/shield.ts` — GraphQL Shield
- Validation: `backend/src/validation/schemas/` — Zod schemas

### Frontend key paths
- Pages: `frontend/src/app/` (App Router)
- Components: `frontend/src/components/` (`ui/`, `chat/`, `apod/`, `sections/`, `layouts/`)
- Apollo client: `frontend/src/lib/apollo/client.ts`
- Auth middleware: `frontend/src/middleware.ts` — protects `/admin`, reads JWT from httpOnly cookies

## Key Patterns

### GraphQL resolver — always use `createErrorHandler`
```typescript
import { createErrorHandler, Errors } from '../../utils/errors';

export const myResolver = createErrorHandler(async (parent, args, context) => {
  if (!context.user) throw Errors.unauthenticated();
  // resolver logic
}, 'ResolverName');
```
Never create raw `GraphQLError` instances.

### Rate limiting
Use `rateLimiter.limit(key, limit, windowSeconds)` from `backend/src/services/rateLimiter.ts` (Redis + atomic Lua scripts).

| Feature     | Limit | Window  | Key pattern              |
|-------------|-------|---------|--------------------------|
| Chatbot     | 5     | 1 hr    | `chatbot:<userId>`       |
| Goggins Mode| 2     | 24 hrs  | `goggins:<email>`        |
| APOD        | 5     | 1 hr    | `apod:<userId>`          |

### Authentication
- JWT in httpOnly cookies only (never localStorage)
- Roles: `ADMIN`, `EDITOR`, `USER`
- GraphQL Shield handles field-level authorization

### Adding a new GraphQL feature
1. Define types in `backend/src/schemas/types/`
2. Import in `backend/src/schemas/typeDefs.ts`
3. Create resolver in domain folder, wrap with `createErrorHandler`
4. Add shield rules if auth required
5. Register in `backend/src/resolvers/index.ts`
6. Create frontend query/mutation in `frontend/src/lib/graphql/`
7. Write tests (backend integration + frontend component)

## Testing
- **Backend**: Jest + ts-jest, MongoDB Memory Server, mocked OpenAI/Resend/NASA
- **Frontend**: Jest + React Testing Library + jsdom, Apollo Client mocks
- **CI**: GitHub Actions runs both suites in parallel with MongoDB 7 + Redis 7

## Code Style
- TypeScript strict — no `any`
- Functional React: hooks and composition
- Zod for all input validation
- TailwindCSS + shadcn/ui for UI
- Minimal comments — code should be self-documenting

## Environment Variables
Backend (`backend/.env`): `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `NASA_API_KEY`, `DISCORD_WEBHOOK_URL` — see `backend/.env.example`

Frontend (`frontend/.env.local`): `NEXT_PUBLIC_GRAPHQL_URL` (defaults to `http://localhost:4000/graphql`)
