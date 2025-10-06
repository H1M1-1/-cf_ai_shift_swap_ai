# 👔 Employer Setup Guide

**Welcome! This guide will help you run Shift Swap AI on your local machine in under 5 minutes.**

> **⚠️ SECURITY NOTICE**  
> This public repository contains **no sensitive credentials**.  
> You will need to add your own Cloudflare Account ID during setup (Step 4).  
> Your Account ID is **safe to use publicly** and is not a secret token.

---

## ⏱️ Time Required: 5 Minutes

---

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js v18 or higher** ([Download here](https://nodejs.org/))
- ✅ **A Cloudflare account** (free tier works perfectly) ([Sign up here](https://dash.cloudflare.com/sign-up))
- ✅ **Terminal/Command Prompt** access
- ✅ **A web browser** (Chrome, Firefox, or Safari)

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
cd cf_ai_shift_swap_ai
npm install
```

**Expected output:**
```
added 156 packages in 8s
```

✅ This installs all required packages including Wrangler (Cloudflare's CLI tool).

---

### Step 2: Login to Cloudflare

Run this command:

```bash
npx wrangler login
```

**What happens:**
1. A browser window opens automatically
2. You'll be asked to log in to your Cloudflare account
3. Click **"Allow"** to authorize Wrangler
4. Return to your terminal

**Expected terminal output:**
```
Successfully logged in
```

✅ Wrangler is now authorized to deploy Workers on your behalf.

---

### Step 3: Get Your Account ID

1. Open **https://dash.cloudflare.com/** in your browser
2. In the left sidebar, click **"Workers & Pages"**
3. In the right sidebar, find **"Account ID"**
4. Click the **copy icon** to copy your Account ID

**Example Account ID format:**
```
abc123def456789012345678901234567
```
(It's a 32-character hexadecimal string)

✅ Keep this handy for the next step.

---

### Step 4: Configure Your Account ID

Open the file `wrangler.toml` in any text editor.

**Find this line:**
```toml
account_id = "YOUR_ACCOUNT_ID"
```

**Replace it with your actual Account ID:**
```toml
account_id = "abc123def456789012345678901234567"
```

**Save the file.**

✅ Your Worker is now configured to deploy to your account.

---

### Step 5: Start the Local Development Server

In your terminal, run:

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

✅ The app is now running locally!

**⚠️ Leave this terminal window open** — closing it will stop the server.

---

### Step 6: Open the App in Your Browser

Visit: **http://localhost:8787**

You should see a **login screen** with 6 user profiles:

| User | Role |
|------|------|
| Alice Johnson | Nurse |
| Bob Smith | Doctor |
| Carol Williams | Instructor |
| David Brown | Nurse |
| Emma Davis | Receptionist |
| Frank Miller | Doctor |

**Click any user to log in** (no password needed — it's a demo!).

✅ You're now logged in and viewing the dashboard!

---

## 🎯 Testing the App

### Dashboard Overview

After logging in, you'll see:

1. **Greeting**: "Hi, [Your Name]! 👋" at the top
2. **AI Chat Widget**: A chat interface for natural language requests
3. **Calendar**: Current month (October 2025) with demo shifts
4. **Coverage Trends**: Bar chart showing requests vs availability
5. **Recent Activity**: Live feed of shift posts

---

### Test Feature 1: AI Chat (Natural Language)

**Try these examples in the chat box:**

```
"I need October 15th covered"
```

```
"I'm available to cover shifts on Friday"
```

```
"Can you cover my morning shift next Tuesday?"
```

**What the AI does:**
1. Understands your intent (seeking coverage vs offering availability)
2. Extracts date/time information
3. Creates a shift post
4. **Automatically finds matching candidates** (if someone is seeking coverage when you offer availability, or vice versa)
5. Displays results in the chat window

✅ **Try it now!** Type a request and see the AI respond.

---

### Test Feature 2: Bidirectional Matching

**Scenario:** See how the AI connects people automatically.

#### Step 2a: Request Coverage
1. **Type in chat**: "I need October 13th covered"
2. **Observe**: Shift is created
3. **Check calendar**: You'll see your shift on October 13th

#### Step 2b: Offer Availability (as different user)
1. **Click "Settings"** (in sidebar) → **"Switch User"**
2. **Select a different user** (e.g., if you were Alice, pick Bob)
3. **Type in chat**: "I'm available October 13th"
4. **Observe**: The AI says "🎉 Found 1 person who needs coverage around that time: [First User's Name]!"

✅ **This is the bidirectional matching in action!**

---

### Test Feature 3: Calendar Navigation

1. **Click "All Shifts"** in the left sidebar
2. **Use ◀ and ▶ buttons** to navigate between months
3. **Hover over any shift badge** to see full details
4. **Color coding**:
   - **Green badges** = Your shifts
   - **Gray badges** = Other users' shifts

✅ The calendar shows all shifts across the year.

---

### Test Feature 4: Manual Shift Posting

1. **Click "New Shift"** in the sidebar
2. **Fill out the form**:
   - **Role**: Auto-filled with your role
   - **Date**: Pick a date from the calendar picker
   - **Time**: E.g., "09:00-17:00" or "9am-5pm"
   - **Notes**: Optional, e.g., "Urgent coverage needed"
3. **Click "Post Shift"**
4. **Observe**: Success message appears, calendar updates

✅ The form is a traditional alternative to AI chat.

---

### Test Feature 5: Voice Input

1. **In the AI chat widget**, click the **"◉ Voice"** button
2. **Speak clearly**: "I need Friday afternoon covered"
3. **Click the button again** to stop recording
4. **Observe**: Your speech is converted to text and processed

✅ Voice input uses the browser's built-in speech recognition.

---

### Test Feature 6: Reset Demo Data

If you want to start fresh:

1. **Click "Settings"** in the sidebar
2. **Scroll to "Data Management"**
3. **Click "Reset Calendar & Coverage Requests"**
4. **Confirm** in the dialog box

**What this does:**
- Clears all existing shifts
- Reloads 4 pre-defined demo shifts
- Refreshes the entire UI

✅ This is useful for testing from a clean slate.

---

## 📊 What to Look For

### Technical Features

| Feature | What to Observe |
|---------|----------------|
| **Workers AI** | AI responds to natural language in chat |
| **Durable Objects** | Data persists when you refresh the page |
| **Real-time Updates** | Calendar, graphs, and activity feed update immediately after actions |
| **Bidirectional Matching** | AI proactively suggests matches when you offer availability |
| **User Context** | App remembers who you are across page refreshes |
| **Calendar UI** | Professional month view with shift badges and tooltips |

### User Experience

| UX Element | Quality Indicator |
|------------|-------------------|
| **Login System** | Smooth user selection, no passwords needed for demo |
| **Dashboard Layout** | Clean, professional SaaS-style design |
| **Color Scheme** | Monochrome (black/white/gray/green accents) |
| **Navigation** | Left sidebar with clear sections |
| **Responsiveness** | Works on different screen sizes |
| **Error Handling** | Clear error messages if something fails |

---

## 🐛 Troubleshooting

### Issue: "Port 8787 already in use"

**Solution:**

```bash
# Kill the process using port 8787
lsof -ti:8787 | xargs kill -9

# Or use a different port
npx wrangler dev --port 8788
```

Then open: http://localhost:8788

---

### Issue: "Account ID not found"

**Solution:** Make sure you updated `wrangler.toml` with your **actual** Account ID from Step 4, not the placeholder text.

---

### Issue: AI takes too long or times out

**Solution:** 
- The AI service might be busy; wait 30 seconds and try again
- Try a simpler request: "I need Friday covered"
- Use the manual form in "New Shift" section as a fallback

---

### Issue: Calendar shows October 2024 instead of 2025

**Solution:**
- Do a hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
- Clear browser cache and reload

---

### Issue: Chat messages not appearing

**Solution:**
- Open browser console: **Cmd+Option+J** (Mac) or **Ctrl+Shift+J** (Windows)
- Look for `[Chat]` log messages
- Do a hard refresh of the page

---

## 🚀 Optional: Deploy to Production

Once you've tested locally and want to deploy it live:

```bash
npm run deploy
```

**Expected output:**
```
Total Upload: 45.23 KiB / gzip: 12.84 KiB
Published cf-ai-shift-swap-ai (0.87 sec)
  https://cf-ai-shift-swap-ai.your-subdomain.workers.dev
```

✅ **Your app is now live on Cloudflare's global edge network!**

Visit the URL shown to access it from anywhere.

---

## 📚 Additional Resources

- **[README.md](./README.md)** — Full technical documentation and architecture
- **[PROMPTS.md](./PROMPTS.md)** — All AI prompts used in development
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** — Executive summary for recruiters
- **[COMMANDS.md](./COMMANDS.md)** — Complete CLI command reference

---

## ✅ Verification Checklist

After completing this guide, you should have:

- [x] Successfully installed dependencies
- [x] Logged in to Cloudflare via Wrangler
- [x] Configured your Account ID in `wrangler.toml`
- [x] Started the local development server
- [x] Opened the app at http://localhost:8787
- [x] Logged in as a demo user
- [x] Posted a shift via AI chat
- [x] Seen the calendar update in real-time
- [x] Tested bidirectional matching
- [x] Navigated through the calendar months
- [x] (Optional) Deployed to production

---

## 🎓 Understanding the Architecture

This application demonstrates:

| Cloudflare Technology | How It's Used |
|-----------------------|---------------|
| **Workers** | Serverless edge compute handling all API routes |
| **Durable Objects** | Persistent state management for shift data |
| **Workers AI** | Llama 3.3 70B for natural language understanding and intelligent matching |

**Key Design Patterns:**
- **Stateful coordination** via Durable Objects
- **Real-time updates** through optimistic UI updates
- **AI-first interface** with traditional forms as fallback
- **User context** managed via localStorage and passed to all AI requests

---

## 💼 For Recruiters & Employers

**What makes this project stand out:**

1. **Complete Product** — Not just a tech demo; it's a fully functional application
2. **Real-World Problem** — Solves actual pain points in workforce scheduling
3. **Intelligent AI** — Goes beyond simple Q&A to proactive matching
4. **Polished UX** — Professional dashboard, calendar, tooltips, and animations
5. **Thorough Documentation** — Over 3,000 lines of documentation across 5 files
6. **Production-Ready** — Includes security considerations, error handling, and deployment guide

**Technologies Demonstrated:**
- ✅ Cloudflare Workers (serverless edge compute)
- ✅ Durable Objects (persistent state)
- ✅ Workers AI (Llama 3.3 LLM)
- ✅ TypeScript
- ✅ REST API design
- ✅ Modern web UI (HTML/CSS/JavaScript)
- ✅ Natural language processing
- ✅ Voice input (Web Speech API)

**Assignment Compliance:**
- ✅ Repository prefixed with `cf_ai_`
- ✅ Uses Workers AI LLM (Llama 3.3)
- ✅ Includes workflow/coordination (Durable Objects)
- ✅ User input via multiple methods (chat, form, voice)
- ✅ Memory/state management (persistent storage)
- ✅ Comprehensive README.md with setup instructions
- ✅ PROMPTS.md documenting all AI prompts

---

## 📞 Questions or Issues?

If you encounter any issues while setting up:

1. **Check the [README.md](./README.md)** for detailed technical documentation
2. **Review the [Troubleshooting](#-troubleshooting)** section above
3. **Check browser console** for error messages (Cmd+Option+J or Ctrl+Shift+J)
4. **Verify Wrangler version**: `npx wrangler --version` (should be 4.x+)

---

**Thank you for taking the time to review this project!** 🙏

---

**© 2025 Haashim Malik** | Cloudflare Internship Assignment  
This setup guide is part of original work created for the Cloudflare 2025 Internship Application.  
**Author:** Haashim Malik  
**Project:** Shift Swap AI

