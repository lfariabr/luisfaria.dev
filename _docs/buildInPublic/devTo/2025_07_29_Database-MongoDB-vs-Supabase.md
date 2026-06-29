# My Database Conundrum: MongoDB vs Supabase for a Pure Python App

**Tags**:  `python` `supabase` `backend` `softwareengineering`

---

Over the past few weeks, I've been developing **TTrack - Torrens Degree Tracker**, a PyQt5 desktop application designed to help academic staff, advisors and even students visualize academic progress and match students' transcript data with course curriculum requirements.

Now that the core features are live, including transcript parsing, curriculum matching, sample data download+visualization and even match theming (light vs dark mode), I've entered a new milestone: **persistent data storage and cloud synchronization**.

And that's where my conundrum begins, an interesting architectural challenge.

![MongoDB vs Supabase Conundrum Hero](https://images.unsplash.com/photo-1738918941142-00fe2cbe3c0d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

---

## Challenge: Backend for a Desktop App

**The goal** in version 2.0.0 is enable users to:
- Save processed sessions (transcript + curriculum + progress) for each student
- Retrieve that data later using a unique session ID
- Eventually tie this to user accounts (***feature/register-and-login to be done***) with authentication

**The constraint** is that TTrack is built in pure Python with PyQt5—no Django, no Flask, no web server. Just a desktop GUI that needs cloud persistence.

So, the core question is:
> **What backend solution best supports this functionality in a pure Python (non-web) desktop app?**

---

## Option 1: MongoDB (NoSQL)

MongoDB is a natural choice for many Python developers, especially when they don’t want to worry about rigid schemas. With **PyMongo** lib, it's easy to insert JSON-like docs, and since much of my data is generated via pandas' Dataframes, I could easily convert them to dicts and drop them in.

### Pros/Cons
- ✅ Pro - Flexible, schemaless
- ✅ Pro - Easy to prototype and extend
- ✅ Pro - PyMongo is straightforward and with great support
- ❌ Con - No schema = more potential for data inconsistency
- ❌ Con - Complex queries (like cross-referencing transcript X curriculum data become harder
- ❌ Con - No built-in auth, role-based permissions or APIs - gotta build it all

---

## Option 2: Supabase + PostgreSQL

Supabase is a backend-as-a-service (BaaS) built on top of PostgreSQL - as a **Firebase for SQL lovers**, offering:
- A relational database (PostgreSQL)
- Auto-generated REST and GraphQL APIs
- Built-in authentication and row-level security
- A Python client (supabase-py) that works even without frameworks (Django, Flask, FastAPI)

### Pros/Cons
- ✅ Pro - Structured data with referential integrity
- ✅ Pro - API-first design, perfect for desktop apps without server
- ✅ Pro - Future-proof: authentication, authorization and scalable cloud storage out of the box
- ✅ Pro - 500MB free tier on Supabase
- ❌ Con - Slightly more setup (schema definition, auth config, API keys)
- ❌ Con - Not as flexible with JSON-style payloads unless wrapped in a hybrid model

---

## The dilemma: No Django. No Flask.

If this were a Django or Flask app, the decision might be different. I’d just wire up SQLAlchemy or Django’s ORM and call it a day.

But TTrack is a GUI-based desktop app - no server, no web backend — just PyQt5 and Python logic. That makes Supabase feel incredibly attractive, since it offers API access without needing to build and deploy a backend myself.

In other words:
***Supabase becomes my backend layer, without needing a backend***.

---

## My decision (so far...)

After evaluating both options, I’m currently leaning toward Supabase + PostgreSQL for the following reasons:
- My data is inherently relational (students, transcripts, curriculum, sessions),
- I want future-proofing for features like authentication, session history, and cloud sync,
- It gives me modern tooling without requiring a full web stack.

That said, I’m still prototyping both approaches — and if I hit blockers, I may still fallback to MongoDB for local-only storage. Not sure just yet... future updates to follow!

The current TTrack aplication is available as open source on [GitHub](https://github.com/lfariabr/masters-swe-ai/tree/master/T1-Software-Development-Management/projects/TTrack_v1).

---

If you’re working on a desktop app and considering how to sync your data to the cloud, I’d love to hear how you approached it... Let’s figure this stuff out together!

I'm also consulting with my professor, Dr. Atif Qureshi at Torrens University, to get architectural input before I commit to either decision, as I believe it will shape both TTrack's future and the quality and depth of what I'll be able to demonstrate in my portfolio!