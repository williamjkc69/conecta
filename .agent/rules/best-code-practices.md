---
trigger: always_on
---

# Clean Code Guidelines

Follow these practices strictly:

## Constants & Text

- NO hardcoded strings in JSX, functions, or conditionals
- Move ALL text to a constants file (e.g., `constants.js` or `config.js`)
- Move ALL URLs to constants: images, links, API endpoints, external resources
- Use descriptive constant names: `ERROR_MESSAGES`, `UI_TEXT`, `API_ENDPOINTS`, `ASSETS`

## DRY Principle (Don't Repeat Yourself)

- NO duplicated code - extract to reusable functions
- NO duplicated components - create shared components
- If you write the same logic twice, refactor it

## Additional Best Practices

- Use meaningful variable/function names (no `x`, `temp`, `data1`)
- Keep functions small and single-purpose
- Extract complex conditionals into named functions
- Group related constants together
- Use object/array destructuring to reduce repetition
- Avoid magic numbers - use named constants

## Example

❌ Bad:

```js
if (user.role === "admin") { ... }
<img src="https://example.com/logo.png" />
fetch("https://api.example.com/users")
<a href="https://example.com/about">About</a>
```

✅ Good:

```js
// constants.js
export const ROLES = { ADMIN: "admin" };
export const ASSETS = {
  LOGO: "https://example.com/logo.png"
};
export const API = {
  USERS: "https://api.example.com/users"
};
export const LINKS = {
  ABOUT: "https://example.com/about"
};

// component.js
if (user.role === ROLES.ADMIN) { ... }
<img src={ASSETS.LOGO} />
fetch(API.USERS)
<a href={LINKS.ABOUT}>About</a>
```

Before writing code, plan your constants file structure.
