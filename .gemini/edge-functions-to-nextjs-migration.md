# Migration from Supabase Edge Functions to Next.js API Routes

## Date: 2026-01-23

## Overview

Converted all Deno-based Supabase Edge Functions to Next.js API Routes for better integration with the Next.js application.

## ✅ Why This Change?

### Before (Supabase Edge Functions - Deno)

- ❌ Required separate Deno runtime
- ❌ Deployed separately from Next.js app
- ❌ Additional deployment complexity
- ❌ Different environment variable management
- ❌ Required `supabase.functions.invoke()` calls

### After (Next.js API Routes)

- ✅ Native Next.js integration
- ✅ Single deployment (Next.js app includes API routes)
- ✅ Unified environment variables
- ✅ Standard `fetch()` API calls
- ✅ Better TypeScript support
- ✅ Easier local development

## 📁 Files Created

### 1. `/src/app/api/create-web-call/route.ts`

**Purpose:** Create Retell AI web call sessions

**Endpoint:** `POST /api/create-web-call`

**Request Body:**

```json
{
  "metadata": {
    "userId": "string",
    "applicationId": "string",
    "candidateName": "string",
    "jobTitle": "string",
    "jobRequirements": ["string"]
  }
}
```

**Response:**

```json
{
  "access_token": "string",
  "call_id": "string"
}
```

**Environment Variables Required:**

- `RETELL_API_KEY` - Your Retell API key (server-side only)
- `RETELL_AGENT_ID` - Your Retell agent ID (server-side only)

### 2. `/src/app/api/create-openai-session/route.ts`

**Purpose:** Create OpenAI Realtime API sessions

**Endpoint:** `POST /api/create-openai-session`

**Request Body:** None (empty POST)

**Response:**

```json
{
  "id": "string",
  "model": "string",
  "client_secret": {
    "value": "string",
    "expires_at": 1234567890
  },
  "expires_at": 1234567890
}
```

**Environment Variables Required:**

- `OPENAI_API_KEY` - Your OpenAI API key (server-side only)

## 🔄 Code Changes

### Updated Files

#### 1. `/src/hooks/useRetellConnection.js`

**Before:**

```javascript
const { data, error: funcError } = await supabase.functions.invoke(
  SUPABASE_FUNCTIONS.CREATE_WEB_CALL,
  {
    body: {
      metadata: {
        /* ... */
      }
    }
  }
);
```

**After:**

```javascript
const response = await fetch("/api/create-web-call", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    metadata: {
      /* ... */
    }
  })
});

const data = await response.json();
```

#### 2. `/src/hooks/useOpenAIRealtimeInterview.js`

**Before:**

```javascript
const { data, error: funcError } = await supabase.functions.invoke(
  "create-openai-session"
);
```

**After:**

```javascript
const response = await fetch("/api/create-openai-session", {
  method: "POST",
  headers: { "Content-Type": "application/json" }
});

const data = await response.json();
```

## 🔐 Environment Variables

### Server-Side Only (No NEXT*PUBLIC* prefix)

These are **NOT** exposed to the browser:

```bash
# Retell AI
RETELL_API_KEY=your-retell-api-key
RETELL_AGENT_ID=your-retell-agent-id

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

### Client-Side (NEXT*PUBLIC* prefix)

These ARE exposed to the browser:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Retell configuration (if needed in browser)
NEXT_PUBLIC_USE_RETELL=false
```

## 🗑️ Files That Can Be Removed

You can now safely delete the Deno Edge Functions:

```bash
# These are no longer needed
/functions/create-web-call/
  ├── index.ts
  ├── constants.ts
  └── cors.ts

/functions/create-openai-session/
  ├── index.ts
  └── cors.ts
```

**Command to remove:**

```bash
rm -rf functions/
```

## 🚀 Deployment

### Local Development

No changes needed - API routes work automatically:

```bash
npm run dev
```

API routes available at:

- `http://localhost:3000/api/create-web-call`
- `http://localhost:3000/api/create-openai-session`

### Production Deployment (Vercel)

1. **Environment Variables:**
   - Add `RETELL_API_KEY`, `RETELL_AGENT_ID`, `OPENAI_API_KEY` to Vercel dashboard
   - These are server-side only (no NEXT*PUBLIC* prefix)

2. **Deploy:**

   ```bash
   vercel deploy --prod
   ```

3. **API Routes are automatically deployed** with your Next.js app!

### Production Deployment (Other Platforms)

For platforms like Netlify, Railway, or self-hosted:

1. Ensure environment variables are set
2. Deploy Next.js app normally
3. API routes are included automatically

## ✅ Testing

### Test API Routes Locally

**Test create-web-call:**

```bash
curl -X POST http://localhost:3000/api/create-web-call \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "userId": "test-user",
      "applicationId": "test-app",
      "candidateName": "Test Candidate",
      "jobTitle": "Software Engineer",
      "jobRequirements": ["JavaScript", "React"]
    }
  }'
```

**Test create-openai-session:**

```bash
curl -X POST http://localhost:3000/api/create-openai-session \
  -H "Content-Type: application/json"
```

## 🔍 Troubleshooting

### Error: "API key is not set"

**Solution:** Check your `.env.local` file has the required variables:

```bash
RETELL_API_KEY=your-key-here
RETELL_AGENT_ID=your-agent-id-here
OPENAI_API_KEY=your-key-here
```

### Error: "Failed to fetch"

**Solution:**

- Ensure dev server is running (`npm run dev`)
- Check browser console for CORS errors
- Verify API route path is correct (`/api/create-web-call`)

### Error: 404 on API route

**Solution:**

- Verify file exists at `src/app/api/[route-name]/route.ts`
- Restart dev server
- Check file exports `POST` function

## 📊 Benefits Summary

| Aspect          | Before (Deno)                 | After (Next.js)   |
| --------------- | ----------------------------- | ----------------- |
| **Deployment**  | Separate (Supabase CLI)       | Unified (Next.js) |
| **Local Dev**   | `supabase functions serve`    | `npm run dev`     |
| **Environment** | Deno runtime                  | Node.js           |
| **API Calls**   | `supabase.functions.invoke()` | `fetch()`         |
| **TypeScript**  | Deno types                    | Next.js types     |
| **Complexity**  | Higher                        | Lower             |

## 🎯 Next Steps

1. ✅ **Test the API routes** locally
2. ✅ **Update environment variables** in production
3. ✅ **Deploy to production**
4. ✅ **Remove old Deno functions** (optional, after confirming everything works)
5. ✅ **Update any documentation** that references Supabase Edge Functions

## 📝 Notes

- API routes are server-side only - API keys are never exposed to the browser
- CORS is handled automatically by Next.js API routes
- Error handling is improved with proper HTTP status codes
- Logging is consistent with `console.log` (visible in server logs)
