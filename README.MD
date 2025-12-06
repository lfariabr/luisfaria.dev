# Luis Faria Portfolio Project
Modern full-stack portfolio powering projects, articles, AI tools, and Goggins Mode.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://luisfaria.dev)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

## Project Overview
This repository contains my personal portfolio, built with Next.js, Node.js, GraphQL, and Redis. It serves as my digital home for:
- Showcasing engineering projects
- Writing technical articles
- Demonstrating full-stack and AI capabilities
- Hosting an authenticated AI assistant
- Running Goggins Mode, a motivational AI mini-product

Live at: [luisfaria.dev](https://luisfaria.dev)

This codebase also became the starter foundation for Wedstack, a full-stack event platform that I've shipped: [From Groomzilla to Full-Stack Engineer: Building Wedstack](https://luisfaria.dev/projects/from-groomzilla-to-full-stack-engineer-building-wedstack)

## Key Features
| Version | Feature | Milestone
| --- | --- | ---
| **v1.1.0** | `feature/portfolio` | Portfolio showcase with project highlights |
| **v1.2.0** | `feature/articles` | Articles section with categorization |
| **v1.3.0** | `feature/auth` | Secure login area with JWT authentication |
| **v1.4.0** | `feature/chatbot` | AI-powered chatbot (rate-limited to 1 question per hour per user) |
| **v2.0.0** | `feature/goggins-mode` | Goggins Mode feature (rate-limited to 2 questions per 24h per user) |
| **v2.0.1** | `feature/atomic-rate-limiting` | Atomic rate limiting with Lua scripts |
| **v2.0.2** | `feature/home` | V2 home page with improved design |

## Tech Stack
### Frontend
- Next.js 14+ with TypeScript
- Apollo Client for GraphQL integration
- TailwindCSS for styling
- shadcn/ui for components
- NextAuth.js for authentication
- OpenAI for AI chatbot
- Goggins Mode component

### Backend
- Node.js with Express
- Apollo Server for GraphQL
- Relay for efficient data fetching
- Redis for caching and rate limiting
- MongoDB for data storage
- JWT for secure authentication
- OpenAI client
- Resend for email notifications

## Project Structure
```
luisfaria/
├── _docs/          # Project documentation
├── frontend/       # Next.js with TypeScript
├── backend/        # Node.js, Apollo, GraphQL API
└── server/         # Nginx and GoLive procedure (hidden)
```

## Architecture

### System Design
- **Frontend**: Next.js 14+ with App Router, Server-Side Rendering (SSR)
- **API Layer**: GraphQL with Apollo Server (type-safe, efficient queries)
- **State Management**: Apollo Client cache + Context API
- **Authentication**: JWT with secure httpOnly cookies
- **Rate Limiting**: Redis-based with atomic Lua scripts
- **Caching Strategy**: Multi-layer (Redis + Apollo cache)

### Key Design Patterns
- Repository pattern for data access
- Middleware pattern for authentication/authorization
- Rate limiting with sliding window algorithm
- Modular GraphQL schema with resolver composition

### Frontend Components
- **TimelineSection**: Displays career timeline entries with styled milestones
- **MetricsSection**: Presents performance metrics on home page
- **Header**: Navigation and authentication UI
- **Footer**: Site information and links
- **ArticleList**: Displays articles with filtering and pagination
- **ProjectGrid**: Shows project cards with tags and descriptions
- **Chatbot**: AI-powered chat interface with rate limiting
- **ArticleDetail**: Single article view with comments
- **ProjectDetail**: Individual project page with detailed information

## Testing

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

## Feature Highlights

### 🤖 AI-Powered Chatbot
- GPT-3.5-turbo integration with custom prompt engineering
- Rate-limited (5 questions/hour) to manage API costs
- Authenticated access with chat history
- Real-time rate limit display

### 💪 Goggins Mode
- Motivational AI coach inspired by David Goggins
- Enhanced rate limiting (2 questions/24h) for premium experience
- Personalized responses based on user context
- Discord webhook integration for notifications

### 🔐 Secure Authentication
- JWT with httpOnly cookies
- Role-based access control (ADMIN, EDITOR, USER)
- Password hashing with bcrypt
- CSRF protection

### ⚡ Performance Optimizations
- Redis caching for frequently accessed data
- Apollo Client cache optimization
- Code splitting and lazy loading
- Image optimization with Next.js Image component

## Getting Started
1. Clone this repository
2. Set up environment variables
3. Install dependencies
   - Frontend: `cd frontend && npm install`
   - Backend: `cd backend && npm install`
4. Run development servers
   - Frontend: `cd frontend && npm run dev`
   - Backend: `cd backend && npm run dev`

## Development Roadmap
1. Project setup and configuration
2. Backend API development
3. Frontend pages and components
4. Authentication and user management
5. AI chatbot integration
6. Testing and deployment
7. SEO optimization
8. Goggins Mode integration
9. Home page redesign
10. ***Who knows?*** Stay tuned!

---

Built with ❤️ & ☕ using the MERN stack + Next.js