# 🎬 Demo Instructions for Cloudflare Reviewers

## Quick Start (60 seconds)

### 1. Run the App
```bash
npm install
npm run dev
```
Visit: http://localhost:8787

### 2. Select a User Profile

When the app loads, you'll see a **login screen**. Select any of the 6 pre-defined users:
- **Alice Johnson** (Nurse)
- **Bob Smith** (Doctor)
- **Carol Williams** (Instructor)
- **David Brown** (Nurse)
- **Emma Davis** (Receptionist)
- **Frank Miller** (Doctor)

💡 **Tip:** Select "Alice Johnson" for the best demo experience.

### 3. Explore Pre-Loaded Features

The app loads with **4 demo shifts** in October 2025.

**Dashboard Overview:**
1. See greeting: "Hi, [Your Name]! 👋"
2. **AI Chat Widget** — Natural language interface (primary feature!)
3. **Calendar** — Current month with demo shifts
4. **Coverage Trends** — Bar chart showing requests vs availability
5. **Recent Activity** — Live feed of shift posts

**Calendar View:**
1. Navigate to "All Shifts" in the left sidebar
2. Browse through months using ◀ ▶ arrow buttons
3. Notice color coding: Your shifts (green) vs Others' shifts (gray)
4. Hover over any shift badge to see full details in a tooltip

### 4. Test AI Chat (Primary Feature)

**The AI understands natural language!** Try these examples:

```
"I need October 15th covered"
```

```
"I'm available Friday afternoon"
```

**What happens:**
1. AI extracts intent (seeking coverage vs offering availability)
2. Parses date/time information
3. Creates shift post automatically
4. **Finds matching candidates** (bidirectional matching)
5. Displays results in chat window

### 5. Test Bidirectional Matching

**Scenario:** The AI connects seekers with offerers automatically.

**Step 1:** Type "I need October 13th covered"
- Shift is created
- Calendar updates

**Step 2:** Click "Settings" → "Switch User" → Select different user
- Type "I'm available October 13th"
- **AI responds: "🎉 Found 1 person who needs coverage: [First User]!"**

✅ This is the intelligent bidirectional matching in action!

---

## 🧠 How the AI Matching Works

**The AI uses bidirectional logic:**

### When You Request Coverage:
```
User: "I need October 15th covered"
    ↓
AI extracts: date=Oct 15, intent=seeking
    ↓
Creates shift post with note "Seeking coverage"
    ↓
Checks for users who offered availability around that date
    ↓
Displays matches if found
```

### When You Offer Availability:
```
User: "I'm available October 15th"
    ↓
AI extracts: date=Oct 15, intent=offering
    ↓
Creates shift post with note "Available to cover"
    ↓
Checks for users seeking coverage around that date
    ↓
Displays matches if found: "🎉 Found 1 person who needs coverage!"
```

### Matching Priorities:
1. **Exact date match** (highest priority)
2. **Same role** (e.g., both Nurses)
3. **Date proximity** (within 3 days)

---

## Expected AI Behavior Examples

### Example 1: Perfect Match
**Given:**
- Alice posts: "I need October 15th covered" (Nurse role)
- Bob posts: "I'm available October 15th" (Nurse role)

**Result:**
```
🎯 Perfect match! Same role (Nurse) and same date (2025-10-15)!
Would you like to cover this shift?
```

### Example 2: Close Proximity Match
**Given:**
- Alice posts: "I need October 15th covered"
- Bob posts: "I'm available October 13th"

**Result:**
```
Same role, 2 days apart
Would you like to cover this shift?
```

### Example 3: No Match
**Given:**
- Alice posts: "I'm available October 15th"
- No one is seeking coverage

**Result:**
```
Perfect! I've recorded that you're available to cover shifts on 2025-10-15.
When someone needs coverage for that time, they'll be matched with you!
```

---

## Full Feature Checklist

Test all functionality:

### ✅ Login & User Management
- [ ] Login screen appears on first load
- [ ] Select a user profile
- [ ] See greeting: "Hi, [Your Name]! 👋" on dashboard
- [ ] App remembers user on page refresh (uses localStorage)
- [ ] Navigate to Settings to see profile
- [ ] Click "Switch User" to logout

### ✅ Calendar View (Dashboard)
- [ ] See current month (October 2025) on dashboard
- [ ] Click ◀ ▶ arrows to navigate months on dashboard calendar
- [ ] View shifts as colored badges (green = yours, gray = others)
- [ ] Hover over shift to see tooltip with full details
- [ ] Cells scroll if more than 2 shifts (overflow handling)

### ✅ Calendar View (All Shifts)
- [ ] Navigate to "All Shifts" in sidebar
- [ ] See full month calendar
- [ ] Click ◀ ▶ arrows to change months independently
- [ ] View all shifts across the year
- [ ] Hover functionality works here too

### ✅ AI Chat Widget (Primary Feature)
- [ ] Chat widget visible on dashboard
- [ ] Type natural language: "I need October 15th covered"
- [ ] See your message appear in chat
- [ ] See AI response appear
- [ ] Chat displays matches when found
- [ ] Try offering availability: "I'm available Friday"
- [ ] See bidirectional matching: "🎉 Found 1 person who needs coverage!"

### ✅ Voice Input
- [ ] Click "◉ Voice" button in chat
- [ ] Speak clearly: "I need Friday afternoon covered"
- [ ] Click button again to stop
- [ ] See speech converted to text and processed

### ✅ Post Shifts (Traditional Form)
- [ ] Navigate to "New Shift" in sidebar
- [ ] Role is pre-filled from your profile
- [ ] Pick date from calendar picker
- [ ] Enter time (e.g., "09:00-17:00")
- [ ] Add optional notes
- [ ] Click "Post Shift"
- [ ] See success message
- [ ] New shift appears in calendar

### ✅ Coverage Trends & Analytics
- [ ] View "Coverage Trends" card on dashboard
- [ ] See bar chart with "Requests" vs "Available"
- [ ] Graph updates when new shifts posted
- [ ] Check "Recent Activity" feed
- [ ] Activity feed shows latest shifts with color-coded badges

### ✅ Data Management
- [ ] Navigate to "Settings"
- [ ] Scroll to "Data Management"
- [ ] Click "Reset Calendar & Coverage Requests"
- [ ] Confirm dialog
- [ ] Calendar reloads with 4 demo shifts
- [ ] All components refresh

### ✅ Navigation
- [ ] Click through all sidebar sections:
  - [ ] Dashboard
  - [ ] All Shifts
  - [ ] New Shift
  - [ ] Settings
- [ ] Active section highlights in sidebar
- [ ] Content changes when clicking sections
- [ ] Each section loads properly

### ✅ UI/UX
- [ ] Professional SaaS-style design
- [ ] Monochrome color scheme (black/white/gray + green accents)
- [ ] Left sidebar navigation
- [ ] Responsive layout
- [ ] Smooth transitions
- [ ] Hover effects on interactive elements
- [ ] Loading states during AI requests

---

## Sample curl Commands

For API testing:

### Post a Shift (Manual)
```bash
curl -X POST http://localhost:8787/api/post \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Test User",
    "role": "Nurse",
    "date": "2025-10-15",
    "shift": "09:00-17:00",
    "notes": "Seeking coverage"
  }'
```

### List All Shifts
```bash
curl http://localhost:8787/api/list
```

### Intelligent Match (AI Chat Endpoint)
```bash
curl -X POST http://localhost:8787/api/intelligent-match \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need October 15th covered",
    "currentUser": "Alice Johnson",
    "currentRole": "Nurse"
  }'
```

### Clear All Data
```bash
curl -X POST http://localhost:8787/api/clear
```

---

## Architecture Verification

### Cloudflare Technologies Used

**Check these in the code:**

1. **Workers AI** (`src/index.ts`, lines 500-600)
   ```typescript
   // Used twice: once for intent classification, once for NLP extraction
   const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
     messages: [
       { role: 'system', content: systemPrompt },
       { role: 'user', content: userMessage },
     ],
   });
   ```

2. **Durable Objects** (`src/index.ts`, lines 82-300)
   ```typescript
   export class ShiftRoom implements DurableObject {
     async fetch(request: Request): Promise<Response> {
       await this.initialize();
       // Persistent storage via this.state.storage
       // Stores all shift posts and matches
     }
   }
   ```

3. **Worker Routes** (`src/index.ts`, lines 310-850)
   ```typescript
   if (path === '/api/post') { /* Manual shift posting */ }
   if (path === '/api/list') { /* Get all shifts */ }
   if (path === '/api/intelligent-match') { /* AI chat + matching */ }
   if (path === '/api/clear') { /* Clear all data */ }
   ```

4. **Bindings** (`wrangler.toml`)
   ```toml
   [ai]
   binding = "AI"
   
   [[durable_objects.bindings]]
   name = "SHIFT_ROOM"
   class_name = "ShiftRoom"
   
   [vars]
   CORS_ALLOW_ORIGIN = "*"
   ```

---

## Assignment Requirements Verification

### ✅ LLM Usage
- **Where:** `src/index.ts`, `/api/intelligent-match` endpoint
- **Model:** Llama 3.3 70B Instruct (fp8-fast) via Workers AI
- **Purpose:** 
  1. Classify user intent (seeking vs offering)
  2. Extract structured data from natural language
  3. Provide intelligent bidirectional matching
- **Calls:** 2 AI calls per request (intent + extraction)

### ✅ Workflow/State Management
- **Where:** `src/index.ts`, lines 82-300 (ShiftRoom Durable Object)
- **Storage:** Persistent via `this.state.storage`
- **Data:** All shift posts stored indefinitely
- **Coordination:** Single Durable Object instance coordinates all matching logic

### ✅ User Input (Multiple Methods)
- **Where:** `public/index.html`
- **Methods:**
  1. **AI Chat** (primary): Natural language text input
  2. **Voice Input**: Speech-to-text via Web Speech API
  3. **Traditional Form**: Manual entry in "New Shift" section
- **Inputs:** User context, role, date, time, notes

### ✅ Memory/Context
- **Where:** Durable Object + localStorage
- **Persistence:** 
  - Shift data survives Worker restarts (Durable Object)
  - User profile persists across sessions (localStorage)
- **Usage:** AI matching considers entire shift history

---

## Performance Expectations

### Response Times
- **POST /api/post:** 50-100ms (manual shift posting)
- **GET /api/list:** 20-50ms (fetch all shifts)
- **POST /api/intelligent-match:** 2-5 seconds (includes 2 AI calls)
- **POST /api/clear:** 50ms (clear all data)

### AI Model Details
- **Model:** `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- **Temperature:** 0.3 (intent classification), 0.5 (data extraction)
- **Max Tokens:** 200 (intent), 400 (extraction)
- **Output:** JSON with structured shift data
- **Timeout:** 30 seconds (frontend timeout)

---

## Troubleshooting

### Chat messages not displaying
**Cause:** Function name collision (fixed in v1.5+)
**Solution:** 
- Do a hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check browser console for `[Chat]` log messages

### AI times out after 30 seconds
**Cause:** Workers AI service is busy
**Solution:** 
- Wait a moment and try again
- Use simpler request: "I need Friday covered"
- Use manual form in "New Shift" section as fallback

### Calendar shows wrong year (October 2024)
**Cause:** Cached old version
**Solution:** 
- Hard refresh: Cmd+Shift+R or Ctrl+Shift+R
- Check code has `let dashboardMonth = new Date();` (not hardcoded)

### Durable Object not persisting
**Check:** `wrangler.toml` has correct migration:
```toml
[[migrations]]
tag = "v1"
new_sqlite_classes = ["ShiftRoom"]
```

### Port 8787 already in use
**Solution:**
```bash
lsof -ti:8787 | xargs kill -9
# Then restart: npm run dev
```

---

## Production Deployment

### Deploy
```bash
npm run deploy
```

**Expected output:**
```
Total Upload: 45.23 KiB / gzip: 12.84 KiB
Published cf-ai-shift-swap-ai (0.87 sec)
  https://cf-ai-shift-swap-ai.your-subdomain.workers.dev
```

### Test Production
Visit your deployed URL and follow the same steps as local testing.

---

## Contact & Documentation

- **[EMPLOYER_SETUP.md](./EMPLOYER_SETUP.md)**: Step-by-step guide for employers (this file!)
- **[README.md](./README.md)**: Complete architecture and technical documentation
- **[PROMPTS.md](./PROMPTS.md)**: All AI prompts and engineering notes
- **[QUICKSTART.md](./QUICKSTART.md)**: 5-minute setup guide
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)**: Executive summary for recruiters
- **[COMMANDS.md](./COMMANDS.md)**: Complete CLI command reference

---

**🎯 Ready for Review!**

### All Cloudflare Technologies Integrated:
✅ **Workers** — Serverless edge compute  
✅ **Durable Objects** — Persistent state management  
✅ **Workers AI** — Llama 3.3 LLM inference  

### All Assignment Requirements Met:
✅ **LLM Usage** — Intent classification + data extraction  
✅ **Workflow/State** — Coordinated via Durable Objects  
✅ **User Input** — Chat, voice, and forms  
✅ **Memory/Context** — Persistent storage + user context  

### Additional Features:
✅ **Bidirectional Matching** — AI proactively suggests matches  
✅ **Real-time Updates** — Calendar and dashboard sync immediately  
✅ **Multiple Input Methods** — Natural language, voice, forms  
✅ **Professional UI** — SaaS-style dashboard with calendar  
✅ **Comprehensive Documentation** — Over 3,000 lines across 6 files  

---

**© 2025 Haashim Malik** | Cloudflare Internship Assignment  
This demo guide is part of original work created for the Cloudflare 2025 Internship Application.  
**Author:** Haashim Malik  
**Project:** Shift Swap AI

