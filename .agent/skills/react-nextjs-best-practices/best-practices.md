# General Coding Standards & Best Practices

## Hooks Guidelines

- **Rules of Hooks:** Always adhere strictly. No hooks inside loops or conditions.
- **Encapsulation:** Prefer Custom Hooks over complex `useEffect` logic inside components.
  - _Bad:_ Fetching data + setting loading + setting error inside `useEffect` in a component.
  - _Good:_ `const { data, loading, error } = useUserData(id);`
- **Dependency Arrays:** ALWAYS include all dependencies in `useEffect` and `useCallback`. If you feel you need to omit one to "fix" a bug, your logic is likely wrong (refactor to logic outside the effect or use `useRef` for mutable values you don't want to trigger re-runs).
- **Cleanup:** Always return a cleanup function in `useEffect` when setting up subscriptions, timers, or event listeners.

## State Management

- **Local vs Global:** Keep state as close to where it's used as possible. Don't put everything in Redux/Context.
- **Server State:** Do not store server data (API responses) in global client stores like Redux manually. Use **TanStack Query** or **SWR**.
- **Derived State:** Avoid state for values that can be calculated from props or other state.
  - _Bad:_ `const [fullName, setFullName] = useState(firstName + lastName)`
  - _Good:_ `const fullName = firstName + " " + lastName` (memoize if expensive).

## TypeScript Rules

- **No Explicit Enum:** Prefer Union Types (`type Status = 'idle' | 'loading' | 'error'`) over TypeScript Enums (`enum Status { ... }`) for smaller bundle size and better simplicity.
- **Explicit Return Types:** Define return types for functions and hooks to prevent accidental API leaks.
- **Props Interfaces:** Export prop interfaces if they are reusable.
- **Avoid `any`:** Use `unknown` if the type is truly not known yet, or use Generics.

## Accessibility (a11y)

- **Semantic HTML:** Use `<button>` for clicks, `<a>` for links. Don't use `<div onClick>`.
- **Forms:** All inputs must have associated labels (`htmlFor` or nesting).
- **Dynamic Content:** Use `aria-live` for dynamic updates (toasts, validation errors).
- **Keyboard Navigation:** Ensure all interactive elements are focusable and usable via keyboard (`Tab`, `Enter`, `Space`).

## Component Structure

- **One Component Per File:** Generally, keep one main component per file unless they are tightly coupled small sub-components.
- **Exports:** Prefer Named Exports (`export const Button = ...`) over Default Exports (`export default Button`) for better refactoring support and explicit imports.
- **Prop Types:** Destructure props in the function signature for clarity. `const Button = ({ label, onClick }: ButtonProps) => ...`

## Error Handling

- **Error Boundaries:** Wrap major application sections (or specific widgets) in Error Boundaries so a crash in one part doesn't white-screen the entire app.
- **API Errors:** distinct handling for Network Errors (offline), Server Errors (500), and Validation Errors (400).
- **User Feedback:** Always show visual feedback for errors (Toast, Inline Alert). Silent failures are forbidden.
