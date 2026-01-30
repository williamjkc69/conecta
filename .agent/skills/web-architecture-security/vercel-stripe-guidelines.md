# Vercel & Stripe Engineering Guidelines

## Stripe: Financial-Grade Security Patterns

### 1. Webhook Verification

- **Signature Checking:** Always verify the `stripe-signature` header. Never blindly trust the event body.
- **Time Tolerance:** Replay attacks are prevented by checking the timestamp tolerance (usually 5 mins).
- **Raw Body:** Verification requires the _raw_ unparsed request body. In Next.js, you must disable the body parser for webhook routes:
  ```typescript
  export const config = { api: { bodyParser: false } };
  ```

### 2. Idempotency

- **Idempotency Keys:** For critical operations (payments, balance updates), send an `Idempotency-Key` header.
- **Retry Logic:** If an API call fails (network error), retry with the **same** idempotency key. This ensures the operation (e.g., charge card) happens exactly once, even if the request is retried 10 times.

### 3. Data Tokenization

- **PCI-DSS Scope:** never let raw card numbers touch your server. Use Stripe.js elements to tokenize data on the frontend client. Only send the `token` or `payment_method_id` to your backend.

---

## Vercel: Edge & Deployment Standards

### 1. Edge Security

- **Attack Challenge Mode:** Use Vercel's firewall features to challenge suspicious requests (CAPTCHA) before they hit your serverless functions.
- **Region Locking:** If your app serves only Brazil, block traffic from other regions at the firewall level.

### 2. Deployment Safety

- **Immutable Deployments:** Vercel creates a immutable URL for every commit. Use this for testing changes in a production-like environment (Preview Mode) before merging to `main`.
- **Database Connections:**
  - **Serverless:** Use connection pooling (Supabase Transaction Pooler) because serverless functions can spin up 1000s of instances instantly, exhausting DB connections.
  - **Cold Starts:** Minimize dependency size (`npm` packages) to keep function "Cold Start" times under 500ms.

### 3. Headers & Caching

- **Stale-While-Revalidate:** Use `Cache-Control: s-maxage=1, stale-while-revalidate` for high-performance public pages.
- **Security Headers:** Always include:
  - `X-DNS-Prefetch-Control: on`
  - `Strict-Transport-Security` (HSTS)
  - `X-Frame-Options: DENY` (Prevent clickjacking)
