# Architecture & Design Patterns (SOLID in React)

## SOLID Principles in React

### 1. Single Responsibility Principle (SRP)

**Rule:** A component should have one reason to change. Check if your component is doing too much (e.g., fetching data _and_ rendering UI _and_ handling complex business logic).

- **Implementation:**
  - **Container/Presentational Pattern:** Separate data fetching logic (Container) from rendering logic (Presentational).
  - **Custom Hooks:** Extract complex logic or side effects into custom hooks (e.g., `useUser`, `useFormSubmit`).
  - **Atomic Design:** Break generic UI elements into atoms, molecules, and organisms.

### 2. Open/Closed Principle (OCP)

**Rule:** Components should be open for extension but closed for modification. You should be able to add new functionality without rewriting existing code.

- **Implementation:**
  - **Composition over Inheritance:** Pass components as `children` or explicit props (slots) rather than hardcoding children.
  - **Polymorphic Components:** Use `as` prop pattern to change the underlying HTML element while keeping behavior (e.g., `<Button as="a" ... />`).
  - **Render Props:** Allow parents to control how children render internal state.

### 3. Liskov Substitution Principle (LSP)

**Rule:** A sub-component should be interchangeable with its base component without breaking the app.

- **Implementation:**
  - **Prop Consistency:** If a `Card` component accepts generic `className` or `style` props, its specialized variations (`UserCard`) should also accept and forward them correctly to the underlying HTML element.
  - **API Predictability:** Avoid changing the expected behavior of standard props (e.g., don't make `onClick` synchronous if the standard is async or vice-versa without clear type definitions).

### 4. Interface Segregation Principle (ISP)

**Rule:** Components should not depend on props they don't use.

- **Implementation:**
  - **Narrow Props:** Instead of passing a huge `user` object to a `UserAvatar` component, pass only `{ src: user.avatarUrl, alt: user.name }`.
  - **TypeScript Interfaces:** Define precise interfaces for component props. Avoid "God interfaces" that combine unrelated types.

### 5. Dependency Inversion Principle (DIP)

**Rule:** High-level components should not depend on low-level implementation details. Both should depend on abstractions.

- **Implementation:**
  - **Context API:** Inject dependencies like theme, auth, or API clients via Context rather than importing singletons directly into leaf components.
  - **HOCs / Hooks Injection:** Use hooks to access services (e.g., `useAuth()`) rather than direct imports, allowing for easier mocking and testing.

---

## Next.js Specific Architecture

### Server vs. Client Components

- **Default to Server Components:** In the App Router, make everything a Server Component by default. Move to Client Components (`"use client"`) only when interactivity (hooks, event listeners) is needed.
- **Leaf Client Components:** Push `"use client"` directives as far down the component tree as possible to keep the majority of the page strictly server-rendered and zero-bundle-size.
- **Boundary Management:** Be mindful of the serializable boundary between Server and Client. Pass data as JSON-serializable props. Pass functions/JSX as children (Composition) to interleave Server components inside Client components.

### Modular Directory Structure

- **Colocation:** Keep related tests, styles, and utils alongside the component code (e.g., `components/Button/index.tsx`, `components/Button/Button.test.tsx`, `components/Button/styles.module.css`).
- **Feature-Based Folders:** Group code by feature domain (e.g., `features/auth`, `features/checkout`) rather than technical type, especially for complex apps.

### Data Flow

- **Server-Side Fetching:** Prefer fetching data directly in Server Components using `async/await`. This eliminates "loading" states on the client and reduces waterfalls.
- **Shared Layouts:** Use `layout.tsx` for shared UI (nav, sidebars) to preserve state on navigation.
