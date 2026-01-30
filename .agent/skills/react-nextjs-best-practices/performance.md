# Performance Optimization

## Core Web Vitals (CWV)

### 1. Largest Contentful Paint (LCP) - Loading Performance

- **Image Optimization:**
  - Use `next/image` for automatic resizing, lazy loading, and WebP/AVIF formats.
  - Add `priority` prop to the LCP image (usually the hero image) to preload it.
  - Define `sizes` prop correctly to serve appropriate resolutions.
- **Font optimization:**
  - Use `next/font` to self-host and optimize Google Fonts at build time.
  - Use `subset` to load only used glyphs.
  - Use `display: swap` to prevent FOIT (Flash of Invisible Text).
- **Server-Side Rendering:** Use React Server Components to render the LCP element on the server, sending HTML immediately.

### 2. Interaction to Next Paint (INP) - Interactivity

- **Minimize Main Thread Work:** Break up long tasks.
- **React 18 Concurrency:** Use `useTransition` for non-urgent updates (filtering lists, searching) to keep the UI responsive for urgent inputs like typing.
- **Event Handling:** Avoid complex logic directly in event handlers. Deload to workers or optimize algorithmic complexity.

### 3. Cumulative Layout Shift (CLS) - Visual Stability

- **Static Dimensions:** Always set `width` and `height` attributes on images and videos.
- **Skeleton Loading:** Use skeletons that match the final content size to reserve space while loading.
- **Font Loading:** Ensure fallback fonts match the metrics of web fonts (`size-adjust`) to prevent layout shifts when fonts load.

---

## Code Optimization strategies

### 1. Render Optimization

- **Memoization:**
  - Use `React.memo` for components that render often with the same props (e.g., list items).
  - Use `useMemo` for expensive computations (filtering/sorting large arrays).
  - Use `useCallback` for functions passed as props to memoized children.
  - _Note:_ Do not memoize primitives or simple calculations; the overhead outweighs the benefit.
- **Context Optimization:** Split large Contexts. If a Context changes often, split it into separate contexts (e.g., `ThemeContext` vs `UserContext`) so unrelated consumers don't re-render.
- **List Virtualization:** Use `react-window` or `react-virtuoso` for rendering long lists (100+ items). Only render what is in the viewport.

### 2. Bundle Size Reduction

- **Dynamic Imports:**
  - Use `next/dynamic` (Lazy Loading) for heavy components that are not immediately visible (modals, heavy charts, below-the-fold content).
  - `const HeavyComponent = dynamic(() => import('./HeavyComponent'), { ssr: false })`
- **Tree Shaking:**
  - Audit imports. Import specific functions (`import { map } from 'lodash'`) rather than entire libraries, or use modern modular alternatives (`lodash-es`).
  - Use tools like `@next/bundle-analyzer` to identify large packages.
- **Dependency Management:** Regularly audit `package.json`. Remove unused deps. Prefer lightweight alternatives (e.g., `date-fns` over `moment`).

### 3. Caching Strategies

- **Request Memoization (Next.js):** Fetch requests in Server Components are automatically deduped. You can safely call `getUser()` in Layout and Page without double fetching.
- **Data Cache:** Use `fetch('...', { next: { revalidate: 3600 } })` for ISR (Incremental Static Regeneration).
- **Client Cache:** Use libraries like **TanStack Query** or **SWR** for client-side data. They handle caching, background refetching, and deduping out of the box.

---

## Loading Timing Rules

1.  **Critical Path First:** Load only HTML/CSS/JS needed for the viewport (Above the Fold) first. Lazy load the rest.
2.  **Streaming:** Use `<Suspense>` boundaries in Next.js/React to stream UI chunks. Show a skeleton immediately while the server fetches data for that specific chunk.
3.  **Third-Party Scripts:** Use `next/script` with strategies:
    - `beforeInteractive`: Critical scripts (rare).
    - `afterInteractive`: Tag managers, analytics (default).
    - `lazyOnload`: Chat widgets, social feeds (low priority).
