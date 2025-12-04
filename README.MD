# Luis Faria Portfolio Project

## Project Overview
A modern portfolio application built with Next.js, TypeScript, Node.js, GraphQL and DigitalOcean.

## Key Features
| Version | Feature | Milestone | Status
| --- | --- | --- | ---
| **v1.1.0** | `feature/portfolio` | Portfolio showcase with project highlights | ✅ Complete |
| **v1.2.0** | `feature/articles` | Articles section with categorization | ✅ Complete |
| **v1.3.0** | `feature/auth` | Secure login area with JWT authentication | ✅ Complete |
| **v1.4.0** | `feature/chatbot` | AI-powered chatbot (rate-limited to 1 question per hour per user) | ✅ Complete |
| **v2.0.0** | `feature/goggins-mode` | Goggins Mode feature (rate-limited to 2 questions per 24h per user) | ✅ Complete |
| **v2.0.1** | `feature/atomic-rate-limiting` | Atomic rate limiting with Lua scripts | ✅ Complete |
| **v3.0.0** | `feature/resend` | Resend integration | ⚠️ In Progress |

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
9. Resend integration
10. ***Who knows?*** Stay tuned!