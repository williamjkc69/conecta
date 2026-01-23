# Retell Integration Quick Reference

## 📦 Constants Import Guide

### **Import Everything**

```javascript
import {
  CALL_STATES,
  RETELL_EVENTS,
  INTERVIEW_STATUS,
  APPLICATION_STATUS,
  TABLES,
  SUPABASE_FUNCTIONS,
  ERROR_MESSAGES,
  TIMEOUTS,
  AUDIO_CONFIG
} from "@/constants";
```

### **Import Specific**

```javascript
import { CALL_STATES } from "@/constants/retell";
import { TABLES } from "@/constants/supabase";
import { RETELL_API } from "@/constants/api";
```

---

## 🎯 Common Usage Patterns

### **Call States**

```javascript
// Setting state
setCallState(CALL_STATES.IDLE);
setCallState(CALL_STATES.CONNECTING);
setCallState(CALL_STATES.CONNECTED);
setCallState(CALL_STATES.ENDED);
setCallState(CALL_STATES.ERROR);

// Checking state
if (callState === CALL_STATES.CONNECTED) { ... }
```

### **Retell Events (SDK v2)**

```javascript
client.on(RETELL_EVENTS.CONVERSATION_STARTED, () => { ... });
client.on(RETELL_EVENTS.CONVERSATION_ENDED, ({ code, reason, call }) => { ... });
client.on(RETELL_EVENTS.UPDATE, (update) => { ... });
client.on(RETELL_EVENTS.ERROR, (error) => { ... });
```

### **Interview Status**

```javascript
// Valid statuses
INTERVIEW_STATUS.INVITED
INTERVIEW_STATUS.IN_PROGRESS
INTERVIEW_STATUS.INTERVIEWING
INTERVIEW_STATUS.COMPLETED
INTERVIEW_STATUS.REVIEWED

// Usage
if (application.interview_status === INTERVIEW_STATUS.INVITED) { ... }
```

### **Application Status**

```javascript
APPLICATION_STATUS.APPLIED;
APPLICATION_STATUS.INVITED;
APPLICATION_STATUS.INTERVIEWING;
APPLICATION_STATUS.REVIEWED;
APPLICATION_STATUS.REJECTED;
```

### **Supabase Tables**

```javascript
// Instead of hardcoded strings
await supabase.from(TABLES.APPLICATIONS).select("*");
await supabase.from(TABLES.JOBS).select("*");
await supabase.from(TABLES.USERS).select("*");
```

### **Supabase Functions**

```javascript
// Instead of hardcoded strings
await supabase.functions.invoke(SUPABASE_FUNCTIONS.CREATE_WEB_CALL, { ... });
await supabase.functions.invoke(SUPABASE_FUNCTIONS.CREATE_OPENAI_SESSION, { ... });
```

### **Error Messages**

```javascript
setError(ERROR_MESSAGES.NO_MICROPHONE);
setError(ERROR_MESSAGES.CONNECTION_TIMEOUT);
setError(ERROR_MESSAGES.NO_ACCESS_TOKEN);
setError(ERROR_MESSAGES.CALL_FAILED);
```

### **Timeouts**

```javascript
setTimeout(() => { ... }, TIMEOUTS.CONNECTION_TIMEOUT); // 180000ms (3 min)
setTimeout(() => { ... }, TIMEOUTS.RETRY_DELAY); // 1000ms (1 sec)
```

### **Audio Config**

```javascript
analyser.fftSize = AUDIO_CONFIG.FFT_SIZE; // 512
// Sample rate: AUDIO_CONFIG.SAMPLE_RATE (24000 Hz)
```

---

## 🔧 Edge Function (Deno)

### **Constants Import**

```typescript
import {
  RETELL_API_BASE_URL,
  RETELL_ENDPOINTS,
  HEADERS,
  ERROR_MESSAGES,
  HTTP_STATUS
} from "./constants.ts";
```

### **Building URLs**

```typescript
// v2 API
const url = `${RETELL_API_BASE_URL}${RETELL_ENDPOINTS.CREATE_WEB_CALL(agentId)}`;
// Results in: https://api.retellai.com/v2/agents/{agentId}/web-calls
```

### **Headers**

```typescript
headers: {
  "Content-Type": HEADERS.CONTENT_TYPE,
  Authorization: HEADERS.AUTHORIZATION(RETELL_API_KEY),
}
```

### **Status Codes**

```typescript
if (response.status === HTTP_STATUS.UNAUTHORIZED) { ... }
if (response.status === HTTP_STATUS.NOT_FOUND) { ... }
if (response.status === HTTP_STATUS.TOO_MANY_REQUESTS) { ... }
```

---

## 📋 Complete Constants Reference

### **CALL_STATES**

```javascript
{
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ENDED: 'ended',
  ERROR: 'error',
}
```

### **RETELL_EVENTS**

```javascript
{
  CONVERSATION_STARTED: 'conversationStarted',
  CONVERSATION_ENDED: 'conversationEnded',
  UPDATE: 'update',
  ERROR: 'error',
  AGENT_START_TALKING: 'agent_start_talking',
  AGENT_STOP_TALKING: 'agent_stop_talking',
}
```

### **INTERVIEW_STATUS**

```javascript
{
  INVITED: 'invited',
  IN_PROGRESS: 'in_progress',
  INTERVIEWING: 'interviewing',
  COMPLETED: 'completed',
  REVIEWED: 'reviewed',
}
```

### **APPLICATION_STATUS**

```javascript
{
  APPLIED: 'applied',
  INVITED: 'invited',
  INTERVIEWING: 'interviewing',
  REVIEWED: 'reviewed',
  REJECTED: 'rejected',
}
```

### **TABLES**

```javascript
{
  APPLICATIONS: 'applications',
  JOBS: 'jobs',
  USERS: 'users',
}
```

### **SUPABASE_FUNCTIONS**

```javascript
{
  CREATE_WEB_CALL: 'create-web-call',
  CREATE_OPENAI_SESSION: 'create-openai-session',
}
```

### **ERROR_MESSAGES**

```javascript
{
  NO_MICROPHONE: 'No se pudo acceder al micrófono. Revisa los permisos.',
  CONNECTION_TIMEOUT: 'La conexión tardó demasiado. Inténtalo de nuevo.',
  NO_ACCESS_TOKEN: 'Did not receive access_token from server.',
  CALL_FAILED: 'Ocurrió un error en la llamada.',
  SAVE_FAILED: 'No se pudo guardar la entrevista.',
  START_FAILED: 'No se pudo iniciar la entrevista.',
}
```

### **TIMEOUTS**

```javascript
{
  CONNECTION_TIMEOUT: 180000, // 3 minutes
  RETRY_DELAY: 1000, // 1 second
}
```

### **AUDIO_CONFIG**

```javascript
{
  FFT_SIZE: 512,
  SAMPLE_RATE: 24000, // 24kHz
}
```

---

## 🚀 Deployment Commands

### **Deploy Edge Function**

```bash
supabase functions deploy create-web-call
```

### **Set Secrets**

```bash
supabase secrets set RETELL_API_KEY=key_xxx
supabase secrets set RETELL_AGENT_ID=agent_xxx
```

### **List Secrets**

```bash
supabase secrets list
```

### **Build Frontend**

```bash
npm run build
```

### **Run Dev Server**

```bash
npm run dev
```

---

## 🐛 Debugging

### **Check Console Logs**

Look for `[Retell]` prefixed logs:

```
[Retell] Updating application status to interviewing...
[Retell] Initializing Retell client...
[Retell] Event: conversationStarted
[Retell] Event: conversationEnded
```

### **Check Edge Function Logs**

```bash
supabase functions logs create-web-call
```

Look for:

```
[create-web-call] Function invoked
[create-web-call] Retell API v2 URL: https://...
[create-web-call] Successfully created web call
```

### **Common Issues**

1. **"Missing RETELL_API_KEY"**
   - Set secrets in Supabase dashboard
   - Redeploy function

2. **"Invalid Retell API key"**
   - Check API key is correct
   - Verify it's not expired

3. **"Retell agent not found"**
   - Check RETELL_AGENT_ID is correct
   - Verify agent exists in Retell dashboard

4. **CORS errors**
   - Ensure `cors.ts` file exists
   - Check CORS headers are returned

---

## ✅ Testing Checklist

- [ ] Import constants work without errors
- [ ] Build completes successfully
- [ ] Interview starts and connects
- [ ] Transcript updates in real-time
- [ ] Interview ends and saves data
- [ ] Debug panel shows all green checkmarks
- [ ] No console errors
- [ ] Edge function logs show success
