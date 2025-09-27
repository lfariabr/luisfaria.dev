# Fingent Interview

## Event: 
Interview 

## Date / Time / Location:
Monday 7h30pm-8h30pm Sydney, NSW 

##  Tech Stack:
MERN Stack 

## Context
I was interviewed Monday but I've left the chat with the feeling I didn't go well.
I wrote everything I can remember that we discussed, and I want to study the concepts to master them.

We talked about my previous experiences and I've been asked ***a lot*** of questions:

1. What is difference between Javascript and Typescript (FE)
2. What is the difference between Client Side vs Server Side
3. How do I deal with scale on growing data on the frontend (I said useMemo)
4. What are React Hooks and how do I plug in a fetch data (FE) I believe it is useEffect, but i'm not sure
5. Why did I chose Next.js rather than building my own components
6. If I had to go live, what sort of infra would I use? I replied Digital Ocean + Droplet, but i feel they expected AWS, especially to deal with high amount of access (does Digital Ocean has that? I have no idea)
7. How do I guarantee 99% uptime? No idea how to take on that
8. What are alternatives for Redux? Have I used it? 
9. A lot of questions about Redis, token, setLocalStorage, how do I guarantee its true and not, how do I implement rate limiting
10. GraphQL do we need to worry about version on the schema? What happens if it change?
11. If I have used data loaders and how they work: yes I had on the Woovi challenge, but not here. Maybe we can implement
12. What are resolvers in graphql, what to use there
13. How would I structure a project with MERN stack for an ecommerce
14. What are React Hooks? It was the last question and I couldn't reply that one assertively. Maybe brain fogged? I could've replied with useState, useEffect, useMemo, useCallback, useQuery, useMutation, useSubscription...

## Replies

1. The core difference is: Typescript = Javascript + Static Type System
In my current porfolio, I use it on Backend and Frontend:
- Frontend: *.tsx files
- Backend: *.ts files

_Examples:_
```typescript
// My GraphQL types (at the backend)
interface User {
    id: string;
    email: string;
    role: UserRole; // This is an enum that prevents invalid roles
}

// My React component (at the frontend)
interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary'; // To prevent typos
}
```

_Comment:_
The Typescript adds compie-time type checking to JavaScript. In my portfolio, it prevents runtime errors, improves IDE autocomplete and makes refactoring safer.
For example, my GraphQL schema types ensure that I never pass wrong data between the frontend and backend.
