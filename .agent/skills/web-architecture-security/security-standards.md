# General Security Standards (OWASP & Industry Best Practices)

## Input Validation & Sanitization

- **Principle:** "Trust No One". All input (body, query, headers) is malicious until proven otherwise.
- **Implementation:**
  - **Zod/Yup:** Use schema validation libraries for strict typing support.
  - **Strip HTML:** Sanitize user-generated text using `dompurify` (frontend) or `sanitize-html` (backend) to prevent XSS.
  - **SQL Parameters:** Never concatenate strings into SQL queries. Use parameterized queries (Supabase/Prisma handles this automatically).

## Authentication & Authorization

- **MFA (Multi-Factor Auth):** Mandatory for Admin/Sensitive roles. (Standard practice at Stripe/Google).
- **Session Management:**
  - Use `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
  - Short-lived Access Tokens (15m-1h) + Rotatable Refresh Tokens.
- **Least Privilege:** Users should only have access to resources strictly necessary for their role. Review RLS policies regularly.

## API Security

- **Rate Limiting:** Implement "Token Bucket" or "Leaky Bucket" algorithms to prevent DDoS/Brute Force.
  - _Vercel/Next.js:_ Use `@upstash/ratelimit` or Vercel Edge Middleware.
- **CORS:** Restrict `Access-Control-Allow-Origin` to known trusted domains. Never use `*` in production.
- **Method Restrictions:** Reject unexpected HTTP methods (e.g., if an endpoint only accepts POST, explicitly 405 other methods).

## Secrets Management

- **Environment Variables:** Store secrets in `.env.local` (local) and Vercel Project Settings (prod).
- **Rotation:** Regularly rotate API keys (especially after employee offboarding).
- **No Commits:** Use tools like `git-secrets` or pre-commit hooks to prevent accidental commit of `.env` files.
