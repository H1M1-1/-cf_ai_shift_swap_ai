# Quick Start Guide

**Get Shift Swap AI running in 5 minutes!**

> **⚠️ SECURITY NOTICE**  
> This repository contains **no private credentials**. You must add your Cloudflare Account ID in `wrangler.toml` before running (see Step 4).

---

## Prerequisites

- ✅ **Node.js** v18+ installed ([Download](https://nodejs.org/))
- ✅ **Cloudflare Account** (free tier works) ([Sign up](https://dash.cloudflare.com/sign-up))
- ✅ **5 minutes** of your time

---

## Setup Steps

### 1️⃣ Install Dependencies

```bash
cd cf_ai_shift_swap_ai
npm install
```

**Expected output:**
```
added 156 packages in 8s
```

---

### 2️⃣ Login to Cloudflare

```bash
npx wrangler login
```

- Browser window opens automatically
- Click **"Allow"** to authorize Wrangler
- Return to terminal (you'll see "Successfully logged in")

---

### 3️⃣ Get Your Account ID

**Visit:** https://dash.cloudflare.com/

1. Click **"Workers & Pages"** in left sidebar
2. Look for **"Account ID"** in the right sidebar
3. Click the copy icon to copy your ID

**Example:** `abc123def456...` (32-character hex string)

---

### 4️⃣ Update Configuration

**Edit `wrangler.toml`:**
```bash
nano wrangler.toml
# or use VS Code, TextEdit, etc.
```

**Find this line:**
```toml
account_id = "YOUR_ACCOUNT_ID"
```

**Replace with your actual Account ID:**
```toml
account_id = "abc123def456..."
```

**Save and close** (Cmd+X, Y, Enter if using nano)

---

### 5️⃣ Run Locally

```bash
npm run dev
```

**Expected output:**
```
⛅️ wrangler 4.42.0
-------------------
Your Worker has access to the following bindings:
- Durable Objects:
  - SHIFT_ROOM: ShiftRoom
- AI:
  - Name: AI
⎔ Starting local server...
[wrangler:info] Ready on http://localhost:8787
```

---

### 6️⃣ Open in Browser

**Visit:** http://localhost:8787

You should see a **login screen** with 6 user profiles:
- Alice Johnson (Nurse)
- Bob Smith (Doctor)
- Carol Williams (Instructor)
- David Brown (Nurse)
- Emma Davis (Receptionist)
- Frank Miller (Doctor)

**Click any user** to log in (no password needed!)

---

## 🎉 You're In! Now What?

### Explore the Dashboard

After logging in, you'll see:

1. **Greeting**: "Hi, [Your Name]! 👋"
2. **AI Chat Widget**: Type natural language requests
3. **Calendar**: Current month with demo shifts
4. **Coverage Trends**: Bar chart showing requests vs availability
5. **Recent Activity**: Live feed of shift posts

### Try These Features

#### 📅 Calendar Navigation
- **Dashboard**: Shows current month (October 2025)
- **All Shifts** (sidebar): Browse all months with ◀ ▶ buttons
- **Hover**: See full shift details in tooltip
- **Color Coding**:
  - Green badges = Your shifts
  - Gray badges = Other users' shifts

#### 💬 AI Chat (Natural Language)
**Examples:**
```
"I need Friday 9am-5pm covered"
"I'm available October 15th"
"Can you cover my Thursday shift?"
```

The AI will:
1. Understand your intent (seeking vs offering)
2. Extract date/time details
3. Create the shift post
4. Find matching candidates automatically
5. Display results in chat

#### 🎤 Voice Input
1. Click the **"◉ Voice"** button in chat
2. Speak your request clearly
3. Click again to stop
4. AI processes your speech as text

#### 📝 Manual Form (Traditional Way)
1. Click **"New Shift"** in sidebar
2. Fill out form:
   - Role (pre-filled from your profile)
   - Date (calendar picker)
   - Time (e.g., "09:00-17:00")
   - Notes (optional)
3. Click **"Post Shift"**

---

## 🧪 Test Bidirectional Matching

**Scenario:** See how the AI connects seekers with offerers

### Step 1: Post a Request
1. **Login as Alice** (or stay logged in)
2. **Type in chat**: "I need October 15th covered"
3. **Observe**: Shift created, no matches yet

### Step 2: Offer Availability
1. **Click "Settings"** → **"Switch User"**
2. **Login as Bob**
3. **Type in chat**: "I'm available October 15th"
4. **Observe**: Bob sees "🎉 Found 1 person who needs coverage: Alice!"

### Step 3: Verify Calendar
1. **Navigate to "All Shifts"**
2. **Browse to October**
3. **See October 15th** has both Alice's and Bob's shifts

---

## 🔄 Reset Demo Data

If you want to start fresh:

1. **Click "Settings"** in sidebar
2. **Scroll to "Data Management"**
3. **Click "Reset Calendar & Coverage Requests"**
4. **Confirm** the dialog

This will:
- Clear all current shifts
- Reload 4 demo shifts (spread across October)
- Refresh all UI components

---

## 🚀 Deploy to Production

Once you're happy with local testing:

```bash
npm run deploy
```

**Expected output:**
```
Total Upload: 45.23 KiB / gzip: 12.84 KiB
Published cf-ai-shift-swap-ai (0.87 sec)
  https://cf-ai-shift-swap-ai.your-subdomain.workers.dev
```

**Your app is now live!** Visit the URL shown.

---

## 🐛 Common Issues

### ❌ "Account ID not found"
**Solution:** Make sure you updated `wrangler.toml` with your ACTUAL account ID (not the placeholder)

---

### ❌ "Port 8787 already in use"
**Solution:**
```bash
# Find process using port 8787
lsof -ti:8787

# Kill it
kill -9 $(lsof -ti:8787)

# Try again
npm run dev
```

Or use a different port:
```bash
npx wrangler dev --port 8788
```

---

### ❌ "AI binding not found"
**Solution:**
- Workers AI is automatically available
- Verify `[ai]` section exists in `wrangler.toml`
- Try deploying to production (local dev can be flaky)

---

### ❌ Calendar shows October 2024 (old year)
**Solution:**
- This is fixed in latest version
- Do a hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
- Check: Code should have `let dashboardMonth = new Date();` (not hardcoded date)

---

### ❌ Chat messages not appearing
**Solution:**
- Open browser console (Cmd+Option+J)
- Look for `[Chat]` log messages
- This bug was fixed in v1.5+ (function name collision)
- Make sure you have latest code

---

### ❌ "Request timed out after 30 seconds"
**Solution:**
- AI service is busy, wait a moment
- Try simpler request: "I need Friday covered"
- Use manual form as fallback (New Shift section)

---

## 📚 Next Steps

### Learn More
- **Architecture Details**: See [README.md](./README.md)
- **All Prompts**: See [PROMPTS.md](./PROMPTS.md)
- **Command Reference**: See [COMMANDS.md](./COMMANDS.md)
- **Project Summary**: See [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

### Customize the App
- **Change UI colors**: Edit `public/index.html` CSS (search for `#059669` for green accent)
- **Modify AI behavior**: Edit `src/index.ts` system prompts
- **Add users**: Update profile list in `selectUser()` function
- **Adjust matching logic**: Change priority order in backend

### Test with curl
```bash
# Post a shift
curl -X POST http://localhost:8787/api/post \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Test User",
    "role": "Nurse",
    "date": "2025-10-25",
    "shift": "09:00-17:00",
    "notes": "Need coverage"
  }'

# List all shifts
curl http://localhost:8787/api/list

# Request AI match (requires shift ID from list)
curl -X POST http://localhost:8787/api/match \
  -H "Content-Type: application/json" \
  -d '{"requestId": "PASTE_ID_HERE"}'
```

---

## ✅ Success Checklist

After completing this guide, you should have:

- [x] App running locally at http://localhost:8787
- [x] Successfully logged in as a user
- [x] Posted a shift via AI chat
- [x] Seen the calendar update in real-time
- [x] Tested bidirectional matching
- [x] Deployed to production (optional)

---

## 🎓 What You Built

**Shift Swap AI** is a complete, production-ready application demonstrating:
- ✅ Cloudflare Workers (serverless edge compute)
- ✅ Durable Objects (persistent state management)
- ✅ Workers AI (Llama 3.3 for NLP and matching)
- ✅ Real-time UI updates
- ✅ Natural language processing
- ✅ Interactive calendar with month navigation
- ✅ Bidirectional intelligent matching
- ✅ Voice input support
- ✅ Comprehensive error handling

**You're ready to show this to employers!** 🚀

---

## 📞 Need Help?

**Documentation:**
- [README.md](./README.md) — Full documentation
- [PROMPTS.md](./PROMPTS.md) — All AI prompts
- [Troubleshooting](#-common-issues) — Common issues (above)

**Cloudflare Resources:**
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [Community Forum](https://community.cloudflare.com/)

---

**Happy shift swapping! 🔄**

*From setup to deployment in 5 minutes. From idea to production-ready app.*

---

**© 2025 Haashim Malik** | Cloudflare Internship Assignment  
This quick start guide is part of original work created for the Cloudflare 2025 Internship Application.  
**Author:** Haashim Malik  
**Project:** Shift Swap AI
