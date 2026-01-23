# Environment Variables Quick Reference

## Next.js Environment Variable Rules

### ✅ DO:

- Use `NEXT_PUBLIC_` prefix for browser-accessible variables
- Use `process.env.VARIABLE_NAME` to access variables
- Restart dev server after changing `.env` files

### ❌ DON'T:

- Use `import.meta.env` (Vite-specific, won't work)
- Use `VITE_` prefix (won't be recognized)
- Forget to restart after env changes

## Variable Mapping

| Old (Vite)                   | New (Next.js)                       | Required? |
| ---------------------------- | ----------------------------------- | --------- |
| `VITE_RETELL_AGENT_ID`       | `NEXT_PUBLIC_RETELL_AGENT_ID`       | Optional  |
| `VITE_USE_RETELL`            | `NEXT_PUBLIC_USE_RETELL`            | Optional  |
| `VITE_CREATE_WEB_CALL_URL`   | `NEXT_PUBLIC_CREATE_WEB_CALL_URL`   | Optional  |
| `VITE_OPENAI_REALTIME_URL`   | `NEXT_PUBLIC_OPENAI_REALTIME_URL`   | Optional  |
| `VITE_OPENAI_REALTIME_MODEL` | `NEXT_PUBLIC_OPENAI_REALTIME_MODEL` | Optional  |

## Example `.env.local`

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Retell AI (Optional - only if using Retell)
NEXT_PUBLIC_RETELL_AGENT_ID=your-agent-id
NEXT_PUBLIC_USE_RETELL=false
NEXT_PUBLIC_CREATE_WEB_CALL_URL=your-function-url

# OpenAI Realtime (Optional - only if using OpenAI)
NEXT_PUBLIC_OPENAI_REALTIME_URL=wss://api.openai.com/v1/realtime
NEXT_PUBLIC_OPENAI_REALTIME_MODEL=gpt-4o-mini-realtime-preview-2024-12-17
```

## Testing

After updating environment variables:

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Restart it
npm run dev

# 3. Check browser console for errors
# Navigate to http://localhost:3000/interview/[some-id]
# Should not see "undefined is not an object" error
```

## Troubleshooting

**Error: "undefined is not an object (evaluating 'undefined.VITE\_...')"**

- ✅ Solution: Update variable name from `VITE_*` to `NEXT_PUBLIC_*` in `.env.local`
- ✅ Solution: Restart dev server

**Error: "process.env.NEXT*PUBLIC*... is undefined"**

- ✅ Solution: Check `.env.local` exists and has the variable
- ✅ Solution: Restart dev server
- ✅ Solution: Variable name must start with `NEXT_PUBLIC_` for client-side access

**Variables not updating:**

- ✅ Solution: Always restart dev server after changing `.env` files
- ✅ Solution: Clear browser cache and hard reload
