# Luis Faria Portfolio Project

[![Build Status](https://github.com/lfariabr/luisfaria/workflows/CI/badge.svg)](https://github.com/lfariabr/luisfaria/actions)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://luisfaria.dev)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

## Project Overview
A modern portfolio application built with Next.js, TypeScript, Node.js, GraphQL and DigitalOcean.
This project is live at [luisfaria.dev](https://luisfaria.dev)
It has been used as a skeleton for my Wedstack Project. Read more about it: [Groomzilla](https://luisfaria.dev/projects/from-groomzilla-to-full-stack-engineer-building-wedstack)

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
9. ***Who knows?*** Stay tuned!