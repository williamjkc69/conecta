# Next.js Migration & Refactoring Plan

## 🎯 Objectives

- **Framework**: Migrate to Next.js (App Router).
- **State**: Implement Zustand.
- **Language**: Convert to TypeScript (.tsx).
- **Structure**: Optimize for scalability (App Router, atomic design).
- **Design**: Preserve existing UI/UX.

## 📦 Phase 1: Environment & Configuration

1.  **Dependency Updates**:
    - Remove: `vite`, `react-router-dom`, `react-helmet`.
    - Add: `next`, `zustand`, `typescript`, types.
2.  **Configuration**:
    - Create `next.config.js`.
    - Create `tsconfig.json`.
    - Update `tailwind.config.js`.
    - Update `package.json` scripts.

## 🛠 Phase 2: Core Architecture & State

1.  **Type Definitions**:
    - Create `src/types` directory.
    - Define global types (User, Supabase definitions).
2.  **State Management (Zustand)**:
    - Create `src/store`.
    - Migrate `SupabaseAuthContext` to `useAuthStore`.
3.  **Project Structure**:
    - `src/app`: Next.js App Router (Layouts, Pages).
    - `src/components`:
      - `ui`: Atomic components (Buttons, Inputs).
      - `features`: Complex logic components.
      - `layout`: Header, Sidebar.
    - `src/lib`: Utilities (Supabase client, helpers).
    - `src/hooks`: Custom hooks.

## 🚀 Phase 3: Page & Router Migration

1.  **Layouts**:
    - Create Root Layout (`app/layout.tsx`).
    - Create Providers wrapper (`app/providers.tsx`).
2.  **Routes** (Migrate from `App.jsx`):
    - `/` (Home/Landing).
    - `/login`, `/register`.
    - `/dashboard` (Candidate/Admin).
    - `/interview/:id`.
    - Admin routes.
3.  **Page Component Strategy**:
    - `app/[route]/page.tsx`: Handles SEO/Metadata and imports the main view component.
    - View Component: Contains the page logic (migrated from `src/pages/*.jsx`).

## ⚡ Phase 4: Component Refactoring & TypeScript

1.  **Convert Components**:
    - Iterate through `src/components`.
    - Add strictly typed interfaces.
    - Extract subcomponents (e.g., `CardTitle`, `SubmitButton`).
2.  **Logic Extraction**:
    - Move heavy logic to `src/lib` or custom hooks.
    - Use `src/constants` for magic values.

## 🧹 Phase 5: Cleanup & Optimization

1.  **Dead Code Removal**: Delete `vite.config.js`, `index.html`.
2.  **Linting**: Run `next lint`.
3.  **Verification**: Test all flows (Auth, Interview, Admin).

---

## 📝 Execution Log

- [ ] Dependencies updated.
- [ ] Config files created.
- [ ] Types defined.
- [ ] Store created.
- [ ] Layouts implemented.
- [ ] Pages migrated.
- [ ] Components converted.
- [ ] Cleanup.
