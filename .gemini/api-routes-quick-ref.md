# Quick Reference: Next.js API Routes

## 🚀 Your New API Endpoints

### 1. Create Retell Web Call

```
POST /api/create-web-call
```

### 2. Create OpenAI Session

```
POST /api/create-openai-session
```

## 📝 Environment Variables Needed

Add to `.env.local`:

```bash
# Server-side only (NOT exposed to browser)
RETELL_API_KEY=your-retell-api-key-here
RETELL_AGENT_ID=your-retell-agent-id-here
OPENAI_API_KEY=your-openai-api-key-here

# Client-side (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## ✅ What Changed

| Old (Deno)                    | New (Next.js)       |
| ----------------------------- | ------------------- |
| `supabase.functions.invoke()` | `fetch('/api/...')` |
| Separate deployment           | Included in Next.js |
| Deno runtime                  | Node.js runtime     |

## 🧪 Test It

```bash
# Start dev server
npm run dev

# Test in browser console or terminal
fetch('/api/create-web-call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    metadata: {
      userId: 'test',
      applicationId: 'test',
      candidateName: 'Test User',
      jobTitle: 'Developer',
      jobRequirements: []
    }
  })
}).then(r => r.json()).then(console.log)
```

## 🗑️ Can Delete

After confirming everything works:

```bash
rm -rf functions/
```

## 📚 Full Details

See: `.gemini/edge-functions-to-nextjs-migration.md`
