---
name: React & Next.js Senior Best Practices
description: A comprehensive guide for senior-level React and Next.js development, covering performance, architecture (SOLID), and code optimization.
---

# React & Next.js Senior Best Practices (2024 Edition)

This skill provides a set of strict guidelines and best practices for developing high-performance, scalable, and maintainable applications using React and Next.js.

## 📚 Core Documentation

When working on React/Next.js tasks, refer to the following specific guides included in this skill:

1.  **[Architecture & Design Patterns](./architecture.md)**
    - SOLID Principles applied to React components.
    - Component Composition patterns.
    - State Management rules (Server vs Client state).
    - Directory structure and modularity.

2.  **[Performance Optimization](./performance.md)**
    - Core Web Vitals optimization.
    - Rendering strategies (RSC, SSR, ISR, SSG).
    - Image, Font, and Script optimization.
    - Memoization and re-render prevention.

3.  **[Code Quality & Standards](./best-practices.md)**
    - Hook usage rules (`useMemo`, `useCallback`, `useEffect`).
    - TypeScript best practices.
    - Error handling and boundaries.
    - Accessibility (a11y) standards.

## 🚀 Quick Checklist for Every PR

Before finalizing any code, verify against this senior-level checklist:

- **Render Efficiency:** Are there unnecessary re-renders? Are stable references used for callbacks/objects passed as props?
- **Data Fetching:** Is data fetched on the server (RSC) where possible? Is client-side fetching deduplicated/cached (SWR/TanStack Query)?
- **Bundle Size:** Are large dependencies lazy-loaded? Are imports tree-shakable?
- **Security:** Are API routes protected? Is user input sanitized?
- **Accessibility:** Do all interactive elements have semantic HTML and ARIA attributes where needed?
- **Type Safety:** Are `any` types avoided? Are props and state interfaces strictly defined?

## 🛑 Anti-Patterns to Avoid

- **Prop Drilling:** Use Composition, Context, or State Management instead.
- **God Components:** Break down large components (`SRP`).
- **Effect Spaghetti:** Avoid complex chains of `useEffect`. Prefer event handlers or derived state.
- **Premature Optimization:** Don't memoize everything blindly. Measure first.
- **Client-Side Waterfalls:** Parallelize data fetching or move to the server.

---

**Usage:**
When given a task involving React or Next.js, explicitly check which area (Performance, Architecture, Coding Standards) applies and consult the relevant documentation within this skill folder.
