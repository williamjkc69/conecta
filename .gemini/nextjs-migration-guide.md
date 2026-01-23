# 🚀 Vite + React → Next.js Migration Guide

## 📊 Current Stack Analysis

### **Your Current Setup:**

- **Framework:** Vite + React 18
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI + shadcn/ui
- **Backend:** Supabase (Auth, DB, Edge Functions)
- **Voice AI:** Retell SDK v2
- **State:** React Hooks + Context
- **Build:** Vite 4.4.5

---

## ✅ Can You Migrate? **YES!**

### **Compatibility:**

- ✅ All your dependencies work with Next.js
- ✅ Supabase has excellent Next.js support
- ✅ Retell SDK works in Next.js
- ✅ Tailwind + Radix UI fully compatible
- ✅ Your hooks and components can be reused

### **Benefits of Migration:**

1. **Better SEO** - Server-side rendering
2. **Faster Initial Load** - Automatic code splitting
3. **API Routes** - Built-in backend (can replace some Edge Functions)
4. **Image Optimization** - Next.js Image component
5. **Better DX** - File-based routing, TypeScript support
6. **Vercel Deployment** - Optimized hosting

### **Challenges:**

1. **Routing Changes** - React Router → Next.js routing
2. **Client-Side Only Code** - Need `'use client'` directive
3. **Environment Variables** - Different naming (`NEXT_PUBLIC_`)
4. **Build Configuration** - Different from Vite
5. **Migration Time** - Estimated 2-4 days

---

## 🗺️ Migration Strategy

### **Option 1: Gradual Migration (Recommended)**

Migrate incrementally while keeping the app running.

**Timeline:** 3-5 days  
**Risk:** Low  
**Downtime:** None

### **Option 2: Full Rewrite**

Create new Next.js app and migrate everything at once.

**Timeline:** 1-2 weeks  
**Risk:** Medium  
**Downtime:** Deployment switch

### **Option 3: Keep Vite (No Migration)**

Your current setup is already excellent!

**Timeline:** 0 days  
**Risk:** None  
**Downtime:** None

---

## 📋 Migration Checklist

### **Phase 1: Setup (Day 1)**

- [ ] Create new Next.js app
- [ ] Install dependencies
- [ ] Configure Tailwind CSS
- [ ] Setup path aliases (@/)
- [ ] Configure environment variables
- [ ] Setup Supabase client

### **Phase 2: Core Files (Day 1-2)**

- [ ] Migrate constants
- [ ] Migrate lib/ utilities
- [ ] Migrate components (mark with 'use client')
- [ ] Migrate hooks
- [ ] Migrate contexts

### **Phase 3: Pages & Routing (Day 2-3)**

- [ ] Convert React Router routes to Next.js pages
- [ ] Update navigation links
- [ ] Handle dynamic routes
- [ ] Setup layouts
- [ ] Migrate authentication flow

### **Phase 4: API Integration (Day 3-4)**

- [ ] Create API routes (optional)
- [ ] Update Supabase calls
- [ ] Test Retell integration
- [ ] Verify edge functions work

### **Phase 5: Testing & Deployment (Day 4-5)**

- [ ] Test all pages
- [ ] Test authentication
- [ ] Test interview flow
- [ ] Deploy to Vercel
- [ ] Verify production build

---

## 🔧 Step-by-Step Migration

### **Step 1: Create Next.js App**

```bash
# In a new directory (or rename current project first)
npx create-next-app@latest conecta-nextjs

# Options to select:
# ✅ TypeScript? → Yes (recommended) or No
# ✅ ESLint? → Yes
# ✅ Tailwind CSS? → Yes
# ✅ src/ directory? → Yes
# ✅ App Router? → Yes (recommended)
# ✅ Import alias? → Yes (@/*)
```

### **Step 2: Install Dependencies**

```bash
cd conecta-nextjs

# Install your current dependencies
npm install @supabase/supabase-js@2.30.0
npm install retell-client-js-sdk@^2.0.5
npm install framer-motion lucide-react
npm install class-variance-authority clsx tailwind-merge
npm install recharts react-helmet

# Radix UI components
npm install @radix-ui/react-accordion
npm install @radix-ui/react-alert-dialog
npm install @radix-ui/react-avatar
npm install @radix-ui/react-checkbox
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-label
npm install @radix-ui/react-progress
npm install @radix-ui/react-select
npm install @radix-ui/react-slider
npm install @radix-ui/react-slot
npm install @radix-ui/react-tabs
npm install @radix-ui/react-toast

# Dev dependencies
npm install -D @tailwindcss/typography
```

### **Step 3: Project Structure**

```
conecta-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page (/)
│   │   ├── interview/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Interview page
│   │   ├── candidate-dashboard/
│   │   │   └── page.tsx
│   │   └── api/                # API routes (optional)
│   │       └── create-web-call/
│   │           └── route.ts
│   ├── components/             # Your existing components
│   ├── hooks/                  # Your existing hooks
│   ├── lib/                    # Your existing lib
│   ├── constants/              # Your existing constants
│   └── contexts/               # Your existing contexts
├── public/                     # Static files
├── .env.local                  # Environment variables
├── next.config.js              # Next.js config
└── tailwind.config.js          # Tailwind config
```

### **Step 4: Environment Variables**

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Retell
NEXT_PUBLIC_RETELL_AGENT_ID=agent_57214d296013d9ee650a91a59c
NEXT_PUBLIC_CREATE_WEB_CALL_URL=https://xxx.supabase.co/functions/v1/create-web-call

# OpenAI (fallback)
NEXT_PUBLIC_OPENAI_REALTIME_URL=wss://api.openai.com/v1/realtime
NEXT_PUBLIC_OPENAI_REALTIME_MODEL=gpt-4o-mini-realtime-preview-2024-12-17

# Server-side only (no NEXT_PUBLIC_ prefix)
RETELL_API_KEY=key_xxx
```

**⚠️ Important:** In Next.js, client-side env vars need `NEXT_PUBLIC_` prefix!

### **Step 5: Update Constants**

Update `src/constants/retell.js`:

```javascript
/**
 * Retell AI Configuration Constants
 * SDK Version: 2.x
 */

// Retell Agent Configuration
export const RETELL_AGENT_ID = process.env.NEXT_PUBLIC_RETELL_AGENT_ID;

// Supabase Function URLs
export const RETELL_CREATE_WEB_CALL_URL =
  process.env.NEXT_PUBLIC_CREATE_WEB_CALL_URL;

// Feature Flags
export const USE_RETELL =
  process.env.NEXT_PUBLIC_USE_RETELL === "true" ||
  !!process.env.NEXT_PUBLIC_RETELL_AGENT_ID;

// Rest of constants remain the same...
```

Update `src/constants/api.js`:

```javascript
export const OPENAI_API = {
  REALTIME_URL:
    process.env.NEXT_PUBLIC_OPENAI_REALTIME_URL ||
    "wss://api.openai.com/v1/realtime",
  MODEL:
    process.env.NEXT_PUBLIC_OPENAI_REALTIME_MODEL ||
    "gpt-4o-mini-realtime-preview-2024-12-17"
};
```

### **Step 6: Create Root Layout**

`src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Conecta - Interview Platform',
  description: 'AI-powered interview platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### **Step 7: Migrate Pages**

#### **Interview Page Example:**

`src/app/interview/[id]/page.tsx`:

```typescript
'use client'; // Important: Mark as client component

import { useParams } from 'next/navigation';
import InterviewPage from '@/components/pages/InterviewPage';

export default function Interview() {
  const params = useParams();
  const applicationId = params.id as string;

  return <InterviewPage applicationId={applicationId} />;
}
```

Then move your current `InterviewPage.jsx` to `src/components/pages/InterviewPage.tsx` and add `'use client'` at the top.

### **Step 8: Update Navigation**

**Before (React Router):**

```jsx
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();
navigate("/candidate-dashboard");
```

**After (Next.js):**

```jsx
import { useRouter } from "next/navigation";

const router = useRouter();
router.push("/candidate-dashboard");
```

**For Links:**

```jsx
// Before
import { Link } from "react-router-dom";
<Link to="/interview">Start</Link>;

// After
import Link from "next/link";
<Link href="/interview">Start</Link>;
```

### **Step 9: Mark Client Components**

Add `'use client'` to files that use:

- `useState`, `useEffect`, `useContext`
- Browser APIs (window, document)
- Event handlers (onClick, onChange)
- Retell SDK (browser-only)

```typescript
"use client";

import { useState } from "react";
// ... rest of your component
```

### **Step 10: Optional - Create API Route**

Instead of Supabase Edge Function, you can use Next.js API route:

`src/app/api/create-web-call/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

const RETELL_API_KEY = process.env.RETELL_API_KEY;
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID;

export async function POST(request: NextRequest) {
  try {
    const { metadata } = await request.json();

    const response = await fetch(
      `https://api.retellai.com/v2/agents/${RETELL_AGENT_ID}/web-calls`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RETELL_API_KEY}`
        },
        body: JSON.stringify({ metadata })
      }
    );

    const data = await response.json();

    return NextResponse.json({
      access_token: data.access_token,
      call_id: data.call_id
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

Then update your hook to call `/api/create-web-call` instead of Supabase function.

### **Step 11: Configure next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["your-supabase-url.supabase.co"]
  },
  // If you need to support WebSockets
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil"
    });
    return config;
  }
};

module.exports = nextConfig;
```

### **Step 12: Update Tailwind Config**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      // Your existing theme config
    }
  },
  plugins: [require("tailwindcss-animate")]
};
```

---

## 🔄 Routing Migration Map

| Vite (React Router)    | Next.js (App Router)                   |
| ---------------------- | -------------------------------------- |
| `/`                    | `src/app/page.tsx`                     |
| `/interview/:id`       | `src/app/interview/[id]/page.tsx`      |
| `/candidate-dashboard` | `src/app/candidate-dashboard/page.tsx` |
| `/admin`               | `src/app/admin/page.tsx`               |
| `/login`               | `src/app/login/page.tsx`               |

---

## ⚠️ Common Pitfalls

### **1. Forgetting 'use client'**

**Error:** "You're importing a component that needs useState..."

**Solution:** Add `'use client'` at the top of the file.

### **2. Environment Variables**

**Error:** `undefined` when accessing env vars

**Solution:** Use `NEXT_PUBLIC_` prefix for client-side vars.

### **3. Window/Document Access**

**Error:** "window is not defined"

**Solution:**

```javascript
if (typeof window !== "undefined") {
  // Browser-only code
}
```

### **4. Dynamic Imports**

For heavy client-side libraries:

```javascript
import dynamic from "next/dynamic";

const RetellClient = dynamic(() => import("@/components/RetellClient"), {
  ssr: false
});
```

---

## 📊 Migration Effort Estimate

| Task                    | Estimated Time             |
| ----------------------- | -------------------------- |
| Setup Next.js project   | 2 hours                    |
| Migrate constants & lib | 2 hours                    |
| Migrate components      | 4-6 hours                  |
| Migrate pages & routing | 6-8 hours                  |
| Fix 'use client' issues | 2-4 hours                  |
| Test & debug            | 4-6 hours                  |
| Deploy to Vercel        | 1 hour                     |
| **Total**               | **21-29 hours (3-4 days)** |

---

## 🎯 Recommendation

### **Should You Migrate?**

**✅ Migrate if:**

- You need better SEO
- You want faster initial page loads
- You're deploying to Vercel
- You want built-in API routes
- You're starting a new feature

**❌ Don't migrate if:**

- Your current setup works well
- You don't need SSR
- You're on a tight deadline
- Team isn't familiar with Next.js

### **My Recommendation:**

**Keep Vite for now!** Your current setup is:

- ✅ Well-architected
- ✅ Using modern practices
- ✅ Production-ready
- ✅ Fast with Vite

**Consider Next.js later if:**

- You need SEO for public pages
- You want to consolidate backend (API routes)
- You're scaling to millions of users

---

## 🚀 If You Decide to Migrate

I can help you with:

1. **Automated migration script** - Convert files automatically
2. **Step-by-step guidance** - Walk through each phase
3. **Code review** - Ensure best practices
4. **Testing strategy** - Comprehensive test plan
5. **Deployment** - Vercel setup

Just let me know and I'll create the migration scripts!

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Migrating from Vite](https://nextjs.org/docs/app/building-your-application/upgrading/from-vite)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)

---

**Decision Time:** Do you want to proceed with migration? 🤔
