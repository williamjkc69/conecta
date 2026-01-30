# Architecture Patterns (Defense-in-Depth)

## Defense-in-Depth Strategy

Security is not a single wall; it's a series of layers. If one fails, the next catches the attack.

1.  **Network Layer:** Vercel/Cloudflare Firewall, DDoS protection, Rate Limiting.
2.  **App Layer:** Authentication (JWT), Input Validation (Zod), CSRF tokens.
3.  **Data Layer:** Row Level Security (RLS), Parameterized Queries, Encryption at Rest.

## Zero Trust Architecture

- **Principle:** "Never trust, always verify."
- **Implementation:**
  - Treat your internal API routes as public. Even if called from your own frontend, validate authentication tokens again.
  - Do not trust internal traffic. Access to the database from an API route should usage strict credentials, not superuser.
  - Service-to-Service communication (e.g., Webhook to API) must use verify signatures or mutual auth.

## Scalable Serverless Architecture

- **Statelessness:** Serverless functions must be stateless. Do not store session data in memory variables; use Redis or Database.
- **Async Processing:**
  - **Queue Pattern:** for long running tasks (generating PDF, AI analysis), don't block the HTTP request.
  - _Implementation:_
    1.  Client sends `POST /analyze`.
    2.  Server adds job to Queue (e.g., QStash, BullMQ) and returns `202 Accepted`.
    3.  Worker processes job asynchronously.
    4.  Client polls for status or receives Webhook.

## Error Handling Architecture

- **Operational vs Programmer Errors:**
  - _Operational:_ Network down, 500 error, DB timeout. (Retry-able).
  - _Programmer:_ Null pointer, Type error. (Fix code).
- **Centralized Logging:** Pipe all server-side logs to a monitoring service (Datadog, Sentry, Axiom). Never rely on `console.log` in production only.
