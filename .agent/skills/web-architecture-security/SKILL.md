---
name: Web Architecture & Security Standards (Senior Level)
description: Comprehensive security and architecture guidelines based on standards from Vercel, Stripe, Google, and OWASP.
---

# Web Architecture & Security Standards (Senior Level)

This skill encapsulates the best practices used by top tech companies (Vercel, Stripe, Google) to build secure, scalable, and resilient web applications.

## 📚 Core Documentation

1.  **[Security Standards (OWASP+)](./security-standards.md)**
    - Input Validation & Sanitization (XSS, SQLi).
    - Authentication & Authorization (MFA, RBAC).
    - OWASP Top 10 Mitigation.
    - Secrets Management.

2.  **[Vercel & Stripe Guidelines](./vercel-stripe-guidelines.md)**
    - **Vercel:** Edge security, Headers, Deployment protection.
    - **Stripe:** Webhook signatures, Idempotency keys, PCI Data security.

3.  **[Architecture Patterns](./architecture-patterns.md)**
    - Defense-in-Depth.
    - Zero Trust Architecture.
    - Secure API Design (Rate Limiting, Throttling).

## 🛡️ Security by Design Checklist (Pre-Merge)

- **secrets:** Are API keys/secrets moved to `.env` and NOT hardcoded?
- **validation:** Is Zod/Yup used for ALL user inputs (API & Forms)?
- **auth:** Is "Least Privilege" applied? (No unnecessary admin roles).
- **database:** Is RLS enabled on all Supabase tables?
- **headers:** Are security headers set? (`Content-Security-Policy`, `X-Content-Type-Options`).
- **logging:** Are errors logged _without_ leaking sensitive PII?
- **deps:** Have you audited `npm` packages for vulnerabilities?

## 🚫 Critical Anti-Patterns

- **Trusting Client Input:** Never trust `req.body` directly. Always validate on the server.
- **Leaking Errors:** Never indiscriminately dump execution stack traces to the frontend client.
- **Weak JWTs:** Never store sensitive data (like `is_admin`) in unencrypted JWTs without server-side verification.
- **Inline Scripts:** Avoid inline Javascript (`<script>...`) to prevent XSS and enable strict CSP.

---

**Usage:**
Consult this skill when designing new features, adding API routes, or integrating third-party services like Stripe/Retell.
