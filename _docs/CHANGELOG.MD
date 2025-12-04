# Backlog / Changelog
> This document is a list of features and bug fixes that have been completed, are in progress, or are planned for future development. DRAFT MODE ONLY!

## Done:
- Fix "tags" at projects that are not being properly saved
- Integrate discord webhook to notify about new users + chatbot messages 
- Integrate google analytics
- Add support to markdown on Projects and Articles
- Add support to images on Projects and Articles (uses markdown syntax)
- Optimize the flow of chatbot, make it more clear to user
- Update Articles and Projects URL exhibition to match url strucutre instead of random code

### v2.0.0 🔥 | `feature/goglins-mode`
> Goal: Activate "Goggins Mode" — a mysterious floating button opens a modal asking for email. After a valid email and clicking "Surprise Me", generate a short, intense, motivational message tailored for builders version 18+ and version 18- (depending on choice, either safe and respectful tone or adult language, profanity or insults; motivate with discipline, ownership, and action.) using the existing OpenAI service.

- [X] backend: tests, api, rate limit, schema, resolver, mutation, zod schema, typeDefs, 
- [X] frontend: component, layout fine tune, modal, floating button, graphql call, 
  - [X] Add avatar to the dialog + hide email + quote visualization + disclaiemr about mode (whatsapp ref)
  - [X] persist email and auto hide field from dialog for better UX
  - [X] persist last generated quote
  - [X] tests

---

## Backlog:
- Core tech stack display component
- Integrate Resend to send emails to users when they create account + 1 per month CRM
- When rate limit is achieved, load previous message from registered email
- Check SEO's progress
- Add a second tab later: "APOD Time Travel" using NASA for an image-based surprise
