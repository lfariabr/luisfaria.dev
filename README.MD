# luisfaria.dev
Welcome to my modern full-stack portfolio powering projects, articles, AI tools, and more.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://luisfaria.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/lfariabr/luisfaria.dev)

## Project Overview
This repository contains my personal portfolio, built with Next.js, TypeScript, Node.js, GraphQL, MongoDB, and Redis. It serves as my digital home for:

- Showcasing engineering projects and real-world architectures
- Publishing long-form technical articles
- Demonstrating full-stack and AI integration patterns
- Hosting an authenticated AI assistant with rate limiting

**If you're reviewing this for collaboration or hiring**, start here:

- Visit the live site: [luisfaria.dev](https://luisfaria.dev)
- Try the AI chatbot (authenticated users, rate-limited)
- Browse the Articles and Projects sections
- Check out the article: [From Groomzilla to Full-Stack Engineer](https://luisfaria.dev/projects/from-groomzilla-to-full-stack-engineer-building-wedstack). I built it by replicating this portfolio.

---

## Features & Milestones

| Version | Feature | Milestone
| --- | --- | ---
| **v1.1.0** | `feature/portfolio` | Portfolio showcase with project highlights |
| **v1.2.0** | `feature/articles` | Articles section with categorization |
| **v1.3.0** | `feature/auth` | Secure login area with JWT authentication |
| **v1.4.0** | `feature/chatbot` | AI-powered chatbot (rate-limited to 5 questions per hour per user) |
| **v2.0.0** | `feature/goggins-mode` | Goggins Mode feature (rate-limited to 2 questions per 24h per user) |
| **v2.0.1** | `feature/atomic-rate-limiting` | Atomic rate limiting with Lua scripts |
| **v2.0.2** | `feature/home` | V2 home page with improved design |
| **v2.2.0** | `feature/sec-auth` | Security and authentication improvements with QA regression tests and monitoring |
| **v2.4.0** | `feature/apod` | NASA Astronomy Picture of the Day with caching, rate limiting, and analytics |
| **v2.5.0** | `refactor/graphql-errors` | Shared GraphQL error handling infrastructure with standardized codes and HTTP status |

---

## Tech Stack

| **Frontend** | **Backend** |
|----------|---------|
| Next.js 14+ with TypeScript | Node.js with Express |
| Apollo Client for GraphQL integration | Apollo Server for GraphQL |
| TailwindCSS for styling | Redis for caching and rate limiting |
| shadcn/ui for components | MongoDB for data storage |
| NextAuth.js for authentication (UI & flows) | JWT for secure authentication |
| OpenAI for AI chatbot | OpenAI client |
| Goggins Mode component | Resend for email notifications |

---

## Project Structure & Architecture
```
luisfaria/
├── _docs/          # Project documentation & changelogs
├── frontend/       # Next.js 14+ with TypeScript, Apollo Client
├── backend/        # Node.js, Express, Apollo Server, GraphQL API
└── docker-compose.yml  # Container orchestration
```

## Architecture

### System Design
- **Frontend**: Next.js 14+ with App Router, Server-Side Rendering (SSR)
- **API Layer**: GraphQL with Apollo Server (type-safe, efficient queries)
- **State Management**: Apollo Client cache + Context API
- **Authentication**: JWT with secure httpOnly cookies
- **Rate Limiting**: Redis-based with atomic Lua scripts
- **Caching Strategy**: Multi-layer (Redis + Apollo cache)

---

### Key Design Patterns

- **Backend**
  - Repository pattern for data access
  - Middleware pattern for authentication/authorization
  - Rate limiting with sliding window algorithm

- **GraphQL**
  - Modular schema with resolver composition
  - Typed operations with shared input/output contracts

- **Frontend Components**
  - **TimelineSection**: Displays career timeline entries with styled milestones
  - **MetricsSection**: Presents performance metrics on home page
  - **Header**: Navigation and authentication UI
  - **Footer**: Site information and links
  - **ArticleList**: Displays articles with filtering and pagination
  - **ProjectGrid**: Shows project cards with tags and descriptions
  - **Chatbot**: AI-powered chat interface with rate limiting
  - **ApodFab/ApodDialog**: NASA APOD floating action button with historical browsing
  - **ArticleDetail**: Single article view with comments
  - **ProjectDetail**: Individual project page with detailed information
  - **GogginsMode**: Motivational AI mini-product interface (*deprecated*)
   
> Note: *These are some of the reusable components that showcase UI architecture and state management.*

---

## Testing

> *This project treats testing as a first-class citizen, with both backend and frontend covered by automated tests.*

---

### Backend Tests

```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

#### Backend Test Coverage
- Unit tests for validation schemas
- Integration tests for GraphQL resolvers
- MongoDB Memory Server for database testing
- Mocked external services (OpenAI, Resend)

---

### Frontend Tests
```bash
cd frontend
npm test                    # Run Jest tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

#### Frontend Test Coverage
- Component tests with React Testing Library
- Custom hook tests with Apollo mocks
- Page rendering and navigation tests

---

## Highlights

| Feature | Description | Tech | Notes |
|--------|-------------|------|-------|
| **AI-Powered Chatbot** | Conversational assistant with custom prompt engineering | OpenAI (GPT-3.5), GraphQL, Next.js | Authenticated, stores chat history |
| **Rate Limiting** | Per-user quotas for chatbot + Goggins Mode | Redis + Lua scripts | 5 req/hr (standard), 2 req/24h (Goggins) |
| **Performance Optimizations** | Faster loads & API responses | Redis cache, Apollo Client | Code splitting, image optimization |
| **Authentication** | Secure login & role-based access | JWT (httpOnly), bcrypt | Roles: ADMIN, EDITOR, USER |
| **Real-Time Limit Display** | Shows remaining questions | GraphQL subscriptions | Live updates in UI |
| **Goggins Mode** | Motivational AI coach with tough-love persona (*deprecated*) | OpenAI, Redis | Discord webhook integration |
| **APOD Feature** | NASA Astronomy Picture of the Day | NASA API, Redis, GraphQL | Rate limiting (5/hr), caching (24h), historical browsing for auth users |

---

## Getting Started

1. Clone this repository
2. Set up environment variables
3. Install dependencies
   - Frontend: `cd frontend && npm install`
   - Backend: `cd backend && npm install`
4. Run development servers
   - Frontend: `cd frontend && npm run dev`
   - Backend: `cd backend && npm run dev`

> *Note: For containerized development and production deployment, see `docker-compose.yml` and the docs in `backend/docs/` and `frontend/docs/`.*

---

## Roadmap

**Completed**
1. Project setup and configuration
2. Backend API development
3. Frontend pages and components
4. Authentication and user management
5. AI chatbot integration
6. Testing and deployment
7. SEO optimization
8. Goggins Mode integration (*deprecated*)
9. Home page redesign
10. Security Authentication (`feature/secure-authentication`)
11. APOD Feature (`feature/apod`) — NASA API integration with caching and analytics

**Work In Progress**
- CI/CD pipeline improvements

**Planned / Future**
- Performance monitoring dashboard
- Extended API documentation

---

Built with ❤️ & ☕ using the MERN stack + Next.js