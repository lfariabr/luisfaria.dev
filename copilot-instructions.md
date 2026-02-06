# GitHub Copilot Instructions for luisfaria.dev

## Project Overview
This is a full-stack TypeScript portfolio application showcasing modern web development, AI integration, and production engineering practices. The project serves as Luis Faria's digital home for projects, articles, and AI tools.

**Live Site:** https://luisfaria.dev

## Architecture

### Tech Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Apollo Client, TailwindCSS, shadcn/ui, NextAuth.js
- **Backend**: Node.js, Express, Apollo Server, GraphQL
- **Database**: MongoDB (data storage)
- **Cache & Rate Limiting**: Redis (with atomic Lua scripts)
- **AI**: OpenAI GPT-3.5 for chatbot and Goggins Mode
- **Email**: Resend integration for notifications
- **DevOps**: Docker Compose, GitHub Actions CI/CD, DigitalOcean deployment

### Project Structure
```
luisfaria/
├── _docs/              # Documentation & feature breakdowns
│   ├── featureBreakdown/  # Detailed feature specs and implementation notes
│   ├── releaseNotes/      # Version history
│   └── devTo/            # Articles for publishing
├── frontend/           # Next.js application
├── backend/            # Node.js GraphQL API
└── docker-compose.yml  # Container orchestration
```

## Development Guidelines

### Code Style & Standards
- **TypeScript First**: All new code must be TypeScript with proper types
- **Functional Patterns**: Prefer functional components, hooks, and composition
- **Minimal Comments**: Only comment complex logic; code should be self-documenting
- **Error Handling**: Use shared error handling infrastructure (see GraphQL errors section)
- **Testing**: All features require tests (Jest for both frontend and backend)

### Key Design Patterns

#### Backend
- **Repository Pattern**: Data access layer abstraction
- **Middleware Pattern**: Authentication, authorization, error handling
- **Rate Limiting**: Sliding window algorithm with Redis + Lua scripts
- **GraphQL Schema**: Modular with resolver composition

#### Frontend
- **Server Components**: Leverage Next.js App Router SSR
- **Apollo Client**: GraphQL state management with normalized cache
- **Component Architecture**: Reusable, composable UI components
- **Responsive Design**: Mobile-first with TailwindCSS

## Feature Context

### Authentication (v1.3.0 - feat/auth)
- JWT-based authentication with httpOnly cookies
- bcrypt password hashing
- Role-based access control: ADMIN, EDITOR, USER
- Protected routes and resolver shields

### AI Chatbot (v1.4.0 - feat/chatbot)
- OpenAI GPT-3.5 integration
- Rate limited: 5 questions per hour per authenticated user
- Chat history persistence (MongoDB)
- Custom prompt engineering
- Real-time quota display in UI

### Goggins Mode (v2.0.0 - feat/goggins-mode) *DEPRECATED*
- Motivational AI coach with tough-love persona
- Two modes: 18+ (explicit language) and 18- (respectful tone)
- Rate limited: 2 requests per 24 hours per email
- Email notifications via Resend (v3.0.0)
- Modal-based activation with email validation
- Optional: Discord webhook notifications

### Security & Auth Improvements (v2.2.0 - feat/sec-auth)
- Enhanced authentication security
- QA regression tests
- Monitoring and observability improvements
- Response to security incident (cryptominer attack)

### AI Assistant UX (v2.3.0 - feat/assistant-ux)
- Dual-pane workspace layout (info rail + chat canvas)
- Transparent rate limiting with usage meter
- Guided interactions with suggested prompts
- Mode/persona toggle system
- Authentication trust bar
- Enhanced conversation UI with message grouping

### NASA APOD Feature (v2.4.0 - feat/apod)
- Astronomy Picture of the Day integration
- NASA API connection with error handling
- Redis caching (24-hour TTL)
- Rate limiting: 5 requests per hour
- Historical browsing for authenticated users
- Analytics and usage tracking
- Floating action button (FAB) UI component

### GraphQL Error Handling (v2.5.0 - feat/graphql-errors)
- Shared error handling infrastructure
- Standardized error codes and HTTP status mapping
- Error factories and wrappers
- Consistent error extensions across all resolvers
- Migrated resolvers: chatbot, articles, projects, users

### Resend Email Integration (v3.0.0 - feat/resend)
- Email delivery for Goggins Mode activations
- Domain verification: goggins@luisfaria.dev
- HTML email templates
- Resilient error handling (email failures don't block mutations)
- Prepared for scheduled delivery (daily, weekly, monthly)
- Shield-protected mutations (authentication required)

### CI/CD Pipeline (v2.6.0 - feat/ci-cd-epic)
- GitHub Actions automated testing
- Parallel test execution (backend + frontend)
- Docker image building and push to GHCR
- Secure server deployment with dedicated deploy user
- Zero-downtime deployments
- Coverage reports as artifacts

## Rate Limiting Rules

**Critical**: All rate-limited features use Redis with atomic Lua scripts for accuracy.

| Feature | Limit | Window | Key Pattern |
|---------|-------|--------|-------------|
| Chatbot | 5 requests | 1 hour | `chatbot:<userId>` |
| Goggins Mode | 2 requests | 24 hours | `goggins:<normalizedEmail>` |
| APOD | 5 requests | 1 hour | `apod:<userId>` |

**Implementation**: Use `rateLimiter.limit(key, limit, windowSeconds)` from `backend/src/services/rateLimiter.ts`

## Testing Standards

### Backend Tests (Jest)
- **Location**: `backend/src/__tests__/`
- **Run**: `cd backend && npm test`
- **Coverage**: Unit tests for validation schemas, integration tests for resolvers
- **Mocks**: MongoDB Memory Server, mocked OpenAI, mocked Resend
- **Current Coverage**: 8 test suites, 28+ tests

### Frontend Tests (Jest + React Testing Library)
- **Location**: `frontend/src/__tests__/`
- **Run**: `cd frontend && npm test`
- **Coverage**: Component tests, custom hook tests, page rendering tests
- **Mocks**: Apollo Client mocks for GraphQL
- **Current Coverage**: 6 test suites, 21+ tests

### Test Requirements for New Features
1. Unit tests for business logic and validation
2. Integration tests for GraphQL resolvers
3. Component tests for UI elements
4. Mock external services (APIs, databases)
5. Test both happy paths and error cases
6. Test rate limiting behavior

## GraphQL Best Practices

### Schema Design
- Use SDL (Schema Definition Language) in `backend/src/schemas/`
- Modular type definitions by domain
- Clear input/output types with proper nullability
- Document types and fields with descriptions

### Resolver Structure
```
backend/src/resolvers/
├── index.ts           # Main resolver composition
├── articles/          # Article domain
├── chatbot/           # Chatbot domain
├── projects/          # Projects domain
├── users/             # User domain
└── apod/              # APOD domain
```

### Error Handling
- **Always** use shared error infrastructure from `backend/src/utils/errors/`
- Use `createErrorHandler` wrapper for resolvers
- Use `ErrorCodes` enum for standardized error codes
- Include proper HTTP status mapping
- Never create raw `GraphQLError` instances manually

Example:
```typescript
import { createErrorHandler, ErrorCodes, Errors } from '../../utils/errors';

export const myResolver = createErrorHandler(async (parent, args, context) => {
  if (!context.user) {
    throw Errors.unauthenticated();
  }
  // ... resolver logic
}, 'MyResolver');
```

## Component Guidelines

### Key Frontend Components
- **TimelineSection**: Career milestones display
- **MetricsSection**: Performance metrics on home
- **Header/Footer**: Navigation and site information
- **ArticleList**: Article browsing with filters
- **ProjectGrid**: Project showcase cards
- **Chatbot**: AI chat interface with rate limiting
- **ApodFab/ApodDialog**: NASA APOD floating action button
- **GogginsMode**: Motivational AI interface (*deprecated*)

### Component Structure
- Use TypeScript with proper prop types
- Implement proper loading and error states
- Include accessibility attributes (ARIA)
- Use TailwindCSS for styling
- Leverage shadcn/ui components where appropriate

## Environment Variables

### Backend (`backend/.env`)
```
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
JWT_SECRET=...
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
DISCORD_WEBHOOK_URL=https://...
NASA_API_KEY=...
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## Common Tasks

### Running the Application
```bash
# Development
cd frontend && npm run dev  # Port 3000
cd backend && npm run dev   # Port 4000

# With Docker
docker-compose up --build
```

### Running Tests
```bash
# Backend
cd backend
npm test                   # All tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage

# Frontend
cd frontend
npm test                   # All tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
```

### GraphQL Playground
- Development: http://localhost:4000/graphql
- Use Apollo Studio for testing mutations with authentication

## Migration Guides

### Adding a New Rate-Limited Feature
1. Define rate limit constants (limit, window)
2. Create Redis key pattern (e.g., `feature:<userId>`)
3. Add rate limiter call in resolver
4. Return `RateLimitInfo` type with `remaining`, `resetIn`, `limit`
5. Display rate limit info in UI with countdown
6. Add tests for rate limit behavior

### Adding a New GraphQL Resolver
1. Define types in `backend/src/schemas/types/`
2. Import types in `backend/src/schemas/typeDefs.ts`
3. Create resolver in appropriate domain folder
4. Wrap with `createErrorHandler`
5. Add authentication shield if needed
6. Register in `backend/src/resolvers/index.ts`
7. Write integration tests
8. Create frontend query/mutation in `frontend/src/lib/graphql/`

### Adding a New Feature
1. Create feature breakdown document in `_docs/featureBreakdown/`
2. Plan backend changes (schema, resolvers, services)
3. Implement backend with tests
4. Implement frontend components with tests
5. Update README with feature information
6. Document environment variables if needed
7. Update this copilot-instructions.md

## Security Considerations

### Authentication
- JWT tokens in httpOnly cookies only
- Never expose JWT_SECRET or API keys
- Use bcrypt for password hashing (never plain text)
- Implement proper CORS configuration

### Rate Limiting
- Always use atomic Lua scripts for Redis operations
- Never trust client-side rate limit checks
- Log rate limit violations for monitoring

### Input Validation
- Use Zod schemas for all user inputs
- Validate in resolvers before processing
- Sanitize HTML content from AI responses
- Escape user-generated content in emails

### Secrets Management
- Never commit .env files
- Use GitHub Secrets for CI/CD
- Rotate API keys regularly
- Use environment-specific secrets

## Known Issues & Technical Debt

### Current Work In Progress
- CI pipeline improvements (artifact handling)
- Performance monitoring dashboard
- Extended API documentation

### Deprecated Features
- **Goggins Mode FAB**: Legacy floating action button (kept for backwards compatibility)
  - Newer implementations should use inline mode picker in AI assistant
  - May be removed in future major version

### Future Enhancements
- Background job queue (BullMQ/SQS) for email delivery
- Email template system (MJML/React Email)
- User preferences for email schedules
- Compliance features (opt-out, unsubscribe links)
- Performance monitoring and observability
- Monetization hooks for rate limit upgrades

## Observability & Monitoring

### Logging
- Structured logs with consistent format
- Log level: ERROR for failures, INFO for key events
- Hash sensitive data (emails) in logs
- Include correlation IDs for request tracing

### Metrics to Track
- Rate limit hits per feature
- AI response times and costs
- Authentication success/failure rates
- Email delivery status
- Cache hit/miss rates

### Monitoring Integrations
- Optional Discord webhooks for alerts
- Redis key expiration tracking
- GraphQL error rates by resolver

## Documentation

### Where to Find Information
- **Project Overview**: `README.MD`
- **Feature Details**: `_docs/featureBreakdown/`
- **Release History**: `_docs/releaseNotes/`
- **This File**: Architecture and development guidelines

### Documentation Standards
- Update README.MD for user-facing changes
- Create feature breakdown for new features (>50 LOC)
- Document all environment variables
- Include setup instructions for third-party services
- Update this file when patterns or architecture change

## Questions or Clarifications?
When in doubt:
1. Check feature breakdown docs in `_docs/featureBreakdown/`
2. Look at similar existing implementations
3. Follow established patterns (repositories, error handling, rate limiting)
4. Write tests first to clarify requirements
5. Ask for guidance rather than guessing

---

**Last Updated**: v3.0.0 (feat/resend)
**Maintainer**: Luis Faria
**Repository**: https://github.com/lfariabr/luisfaria.dev
