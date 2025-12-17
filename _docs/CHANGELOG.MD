# Backlog / Changelog
> This document is a list of features and bug fixes that have been completed, are in progress, or are planned for future development. DRAFT MODE ONLY!

---

## 🔥 IN PROGRESS

![Running](https://media.istockphoto.com/id/904171918/photo/taking-my-fitness-outdoors.jpg?s=612x612&w=0&k=20&c=02oxKdpbN8J5HnP3NwYpln7L_7Dkxm4H2UYy72XRZAI=)

- TBD

---

## 📂 BACKLOG
*Post feat-sec https://github.com/lfariabr/luisfaria.dev/pull/42*
- Redis blacklist: Store invalidated JTIs (JWT IDs) with TTL matching token expiry
- Token version: Add tokenVersion field to User model, increment on logout, reject tokens with old version
- Short-lived tokens + refresh: Use 15-min access tokens with refresh token rotation
- Enhance openAi service for more intelligent and context-aware responses
- Refactor AI assistant UX/UI
- Integrate Resend to send emails to users when they create account + 1 per month CRM
- When rate limit is achieved, load previous message from registered email
- Check SEO's progress
- Add a second tab later: "APOD Time Travel" using NASA for an image-based surprise

---

## ✅ DONE
> From newest to oldest

### v2.2.0 ✅ | `feature/secure-authentication`

I've found some vulnerabilities in the current authentication system and need to secure it. [Feature Secure Authentication](https://github.com/lfariabr/luisfaria.dev/blob/master/_docs/featureBreakdown/v2.2-secAuth.MD)

Also, I have gotten some attacks on my server, so I need to secure the authentication system and the application itself. [Security Incident Report](https://github.com/lfariabr/luisfaria.dev/blob/master/_docs/featureBreakdown/v2.2-secIncident.MD)

### v2.0.0 ✅ | `feature/goglins-mode`
> Goal: Activate "Goggins Mode" — a mysterious floating button opens a modal asking for email. After a valid email and clicking "Surprise Me", generate a short, intense, motivational message tailored for builders version 18+ and version 18- (depending on choice, either safe and respectful tone or adult language, profanity or insults; motivate with discipline, ownership, and action.) using the existing OpenAI service.

- [X] backend: tests, api, rate limit, schema, resolver, mutation, zod schema, typeDefs, 
- [X] frontend: component, layout fine tune, modal, floating button, graphql call, 
  - [X] Add avatar to the dialog + hide email + quote visualization + disclaiemr about mode (whatsapp ref)
  - [X] persist email and auto hide field from dialog for better UX
  - [X] persist last generated quote
  - [X] tests


- Fix "tags" at projects that are not being properly saved
- Integrate discord webhook to notify about new users + chatbot messages 
- Integrate google analytics
- Add support to markdown on Projects and Articles
- Add support to images on Projects and Articles (uses markdown syntax)
- Optimize the flow of chatbot, make it more clear to user
- Update Articles and Projects URL exhibition to match url strucutre instead of random code

