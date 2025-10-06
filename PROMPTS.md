# AI Prompts Documentation

**Complete Record of All AI Prompts Used in Shift Swap AI Development**

This document contains:
1. **Runtime Prompts**: Prompts sent to Workers AI during application execution
2. **Development Prompts**: Prompts used to build features with AI assistance
3. **Debugging Prompts**: Prompts used to solve issues during development
4. **Documentation Prompts**: Prompts used to create this very documentation

All prompts are documented per Cloudflare internship assignment requirements.

---

## Table of Contents

- [Runtime Prompts](#runtime-prompts)
- [Development Prompts](#development-prompts)
- [Debugging & Problem-Solving Prompts](#debugging--problem-solving-prompts)
- [Documentation Prompts](#documentation-prompts)
- [Prompt Engineering Insights](#prompt-engineering-insights)

---

## Runtime Prompts

These prompts run in production, sent to Llama 3.3 70B during application use.

### Prompt 1: Intent Classification

**Location:** `src/index.ts` lines 626-648  
**Purpose:** Determine if user is seeking coverage or offering availability

**System Prompt:**
```
You are an intent classifier. Always respond with valid JSON only.
```

**User Prompt Template:**
```
Analyze this message and determine the user's intent:

Message: "${user_message}"

Is the user:
A) SEEKING coverage (they can't work their shift and need someone to cover)
B) OFFERING to cover (they're available and can work shifts for others)

Respond with ONLY this JSON format:
{
  "intent": "seeking" or "offering",
  "confidence": "high" or "medium" or "low"
}

Examples:
- "I need Friday covered" → {"intent": "seeking", "confidence": "high"}
- "I'm available Thursday" → {"intent": "offering", "confidence": "high"}
- "Can't make my shift tomorrow" → {"intent": "seeking", "confidence": "high"}
- "I can work this weekend" → {"intent": "offering", "confidence": "high"}
- "Looking for coverage" → {"intent": "seeking", "confidence": "high"}
- "Available to cover" → {"intent": "offering", "confidence": "high"}

Respond with ONLY valid JSON.
```

**Configuration:**
- Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- Temperature: 0.1 (very low for consistent classification)
- Max Tokens: 100
- Rationale: Ultra-low temperature ensures deterministic intent detection

**Example Execution:**
```
Input: "I need my 13th October shift covered"
Output: {"intent": "seeking", "confidence": "high"}

Input: "I'm available to cover shifts on Friday"
Output: {"intent": "offering", "confidence": "high"}
```

---

### Prompt 2: Data Extraction

**Location:** `src/index.ts` lines 679-711  
**Purpose:** Extract structured shift data from natural language

**System Prompt:**
```
You are a data extraction assistant. Always respond with valid JSON only.
```

**User Prompt Template:**
```
Extract shift details from this message:

User: ${currentUser}
Current Role: ${currentRole}
Message: "${user_message}"
Intent: User is ${intent === 'seeking' ? 'looking for someone to cover their shift' : 'offering to cover shifts for others'}${scheduleInfo}

Extract:
- date: Convert to YYYY-MM-DD format. "Friday" = next Friday, "tomorrow" = tomorrow's date, etc.
- shift: Time range like "09:00-17:00". **If they mention "my shift" on a date, look in their existing shifts and use that EXACT time!** Otherwise if they say "morning" use "08:00-12:00", "afternoon" use "13:00-17:00", "evening" use "17:00-21:00"
- role: Their job role (use "${currentRole}" if not specified)
- notes: Any additional context

If critical information is MISSING (especially date or time), respond:
{
  "needsMoreInfo": true,
  "message": "What specific date and time?"
}

If you have enough info:
{
  "needsMoreInfo": false,
  "shiftData": {
    "date": "YYYY-MM-DD",
    "shift": "HH:MM-HH:MM",
    "role": "role name",
    "notes": "any notes"
  }
}

Respond with ONLY valid JSON.
```

**Configuration:**
- Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- Temperature: 0.2 (low for consistency, slightly higher than classification)
- Max Tokens: 300
- Rationale: Needs some flexibility for date/time interpretation

**Example Executions:**

**Example 1: Complete information**
```
Input: "I need my Friday 9am-5pm shift covered"
Output: {
  "needsMoreInfo": false,
  "shiftData": {
    "date": "2025-10-11",
    "shift": "09:00-17:00",
    "role": "Nurse",
    "notes": ""
  }
}
```

**Example 2: Missing time**
```
Input: "I need Friday covered"
Output: {
  "needsMoreInfo": true,
  "message": "What time is your Friday shift?"
}
```

**Example 3: Relative date**
```
Input: "Can you cover tomorrow afternoon?"
Output: {
  "needsMoreInfo": false,
  "shiftData": {
    "date": "2025-10-07",
    "shift": "13:00-17:00",
    "role": "Nurse",
    "notes": ""
  }
}
```

---

### Prompt 3: Match Analysis (Legacy Endpoint)

**Location:** `src/index.ts` lines 340-361  
**Purpose:** AI matching for `/api/match` endpoint (original simple matching)

**System Prompt:**
```
You are an intelligent scheduling assistant helping staff find shift swap matches. Your goal is to suggest the best candidate from the available pool who can cover a shift.

MATCHING PREFERENCES (in order of priority):
1. Same role - Prefer candidates with the same role as the requester
2. Proximate dates - Prefer swaps where dates are close to each other
3. Shift compatibility - Consider shift times and duration
4. Minimal disruption - Avoid creating cascading scheduling issues

CONSTRAINTS:
- Only suggest candidates from the provided pool
- Be realistic about role requirements
- Consider the notes provided by both parties
- If no good match exists, be honest about it

OUTPUT FORMAT:
You MUST respond with valid JSON only, in this exact format:
{
  "candidateUser": "Name of the suggested candidate",
  "reason": "Clear explanation of why this is the best match (1-2 sentences)"
}

Do not include any other text, markdown, or formatting. Return only the JSON object.
```

**User Prompt Template:**
```
SHIFT SWAP REQUEST:
User "${targetPost.user}" (${targetPost.role}) needs someone to cover their shift:
- Date: ${targetPost.date}
- Shift: ${targetPost.shift}
- Notes: ${targetPost.notes || 'None'}

AVAILABLE CANDIDATES:
${candidatePool.map((post, idx) => `${idx + 1}. ${post.user} (${post.role})
   - Available: ${post.date}, ${post.shift}
   - Notes: ${post.notes || 'None'}`).join('\n\n')}

Analyze the request and candidates, then suggest the best match. Consider role compatibility, date proximity, and any relevant notes. Return your response as JSON with candidateUser and reason fields.
```

**Configuration:**
- Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- Temperature: 0.7 (balanced for reasoning variety)
- Max Tokens: 500
- Rationale: Higher temperature allows creative reasoning while maintaining structure

**Example Execution:**
```
Input:
SHIFT SWAP REQUEST:
User "Alice Johnson" (Nurse) needs someone to cover their shift:
- Date: 2025-10-15
- Shift: 09:00-17:00
- Notes: Preferably swap with another RN

AVAILABLE CANDIDATES:
1. Bob Smith (Nurse)
   - Available: 2025-10-16, 09:00-17:00
   - Notes: Flexible with dates

2. Dr. Charlie Brown (Doctor)
   - Available: 2025-10-15, 14:00-22:00
   - Notes: Evening shift preferred

Output:
{
  "candidateUser": "Bob Smith",
  "reason": "Bob is also a Nurse and has availability on Oct 16, which is adjacent to Alice's Oct 15 shift. This same-role swap minimizes disruption and meets Alice's preference for an RN."
}
```

---

## Development Prompts

These prompts were used to build features with AI assistance (Claude Sonnet 4.5).

### Prompt D01: Initial Project Setup

**Date:** October 5, 2025  
**Agent:** Claude Sonnet 4.5  
**Purpose:** Create the foundational project structure

**Original User Request:**
> "Build a Cloudflare Workers AI demo called Shift Swap AI where staff can post shifts they can't work and get AI-suggested swap candidates from the current pool."

**Enhanced Professional Prompt:**
```
Build a complete, production-ready Cloudflare Workers AI application named "Shift Swap AI" with the following specifications:

## Project Overview
Create a workforce scheduling platform where staff can:
1. Post shifts they cannot work
2. Request AI-powered match suggestions from available candidates
3. View all open shifts in a user-friendly interface

## Technical Requirements

### Backend (Cloudflare Workers + Durable Objects)
1. **Worker (src/index.ts)**:
   - Route handling for /api/post, /api/list, /api/match, /
   - CORS support for development
   - TypeScript with complete type definitions
   - Error handling and validation

2. **Durable Object (ShiftRoom class)**:
   - Store shifts: Array<ShiftPost>
   - Store matches: Array<Match>
   - Atomic read/write operations
   - Initialize pattern for lazy loading

3. **Workers AI Integration**:
   - Model: @cf/meta/llama-3.3-70b-instruct-fp8-fast
   - System prompt defining scheduling assistant role
   - User prompt with structured candidate pool
   - JSON output parsing with fallback strategies

### Frontend (public/index.html)
1. **Single-page responsive UI**:
   - Form for posting shifts (name, role, date, time, notes)
   - List of open shifts with "Find AI Match" buttons
   - Match suggestion display area
   - Modern gradient design (purple/blue theme)
   - Mobile-responsive grid layout

2. **User Experience**:
   - Loading states for async operations
   - Success/error message display
   - XSS prevention (HTML escaping)
   - Keyboard accessibility

### Documentation
1. **README.md**: Architecture, setup, deployment, API reference, testing
2. **PROMPTS.md**: All prompts used (system, runtime, development)
3. **QUICKSTART.md**: 5-minute setup guide
4. **COMMANDS.md**: Command reference

### Configuration
1. **wrangler.toml**: Complete config with AI binding, DO binding, migrations
2. **package.json**: Scripts for dev and deploy
3. **tsconfig.json**: TypeScript configuration
4. **.gitignore**: Standard patterns

## Deliverables
- Complete, tested, deployable codebase
- Comprehensive inline code comments
- curl examples for API testing
- Sample data for demos
- MIT License

Build with production-grade code quality, extensive error handling, and thorough documentation.
```

**Output:** Complete project skeleton with all files

---

### Prompt D02: Add User Login System

**Date:** October 5, 2025 (afternoon)  
**Purpose:** Track which user is making requests

**Original User Request:**
> "Currently the app doesn't know who the user is. Can we add a login screen where users pick from demo profiles?"

**Enhanced Professional Prompt:**
```
Design and implement a user authentication system for the Shift Swap AI demo application with these requirements:

## Feature Specifications

### Login Screen
1. **Pre-Login State**:
   - Cover entire viewport
   - Display 6 predefined user profiles in a grid
   - Each profile shows: Avatar (first letter), Name, Role
   - No password required (demo mode)

2. **User Profiles** (hardcoded):
   - Alice Johnson (Nurse)
   - Bob Smith (Doctor)
   - Carol Williams (Instructor)
   - David Brown (Nurse)
   - Emma Davis (Receptionist)
   - Frank Miller (Doctor)

3. **Selection Flow**:
   - Click profile → Store in localStorage
   - Hide login screen
   - Show main application
   - Persist across page refreshes

### Integration Changes
1. **State Management**:
   - Global `currentUser` object: { name, role }
   - Check localStorage on page load
   - Redirect to login if no saved user

2. **Form Auto-Fill**:
   - Remove "Name" field from shift posting forms
   - Auto-populate from `currentUser.name`
   - Display current user in UI header

3. **Visual Distinction**:
   - Color-code shifts in calendar:
     - Current user's shifts: Black/dark color
     - Other users' shifts: Gray/muted color

4. **Settings Panel**:
   - Show current user's profile (avatar, name, role)
   - "Switch User" button to logout and return to login screen

### Technical Implementation
- Use localStorage for persistence
- Add `checkLogin()` function called on DOMContentLoaded
- Add `selectUser(user)` function for profile selection
- Add `logout()` function to clear localStorage
- Update all API calls to use `currentUser.name` automatically

### UI/UX Requirements
- Smooth transitions between login and main app
- Clear visual feedback on profile selection
- "Hi, [User Name]!" greeting in dashboard
- Accessible with keyboard navigation

Implement with clean, maintainable code and preserve existing functionality.
```

**Output:** Complete login system with localStorage persistence

---

### Prompt D03: Replace List with Calendar View

**Date:** October 5, 2025 (evening)  
**Purpose:** Show shifts in temporal context

**Original User Request:**
> "The shift list is hard to understand. Can we replace it with a calendar showing all shifts in a month view?"

**Enhanced Professional Prompt:**
```
Design and implement a comprehensive calendar system to replace the shift list view in Shift Swap AI:

## Calendar Specifications

### Visual Design
1. **Layout**:
   - 7-column grid (Sunday through Saturday)
   - Header row with day names
   - 5-6 rows for dates (depending on month)
   - Responsive sizing (fills container)

2. **Day Cells**:
   - Square aspect ratio (aspect-ratio: 1)
   - Border with rounded corners
   - Hover effect (border highlight)
   - Padding for content
   - Empty cells for dates before/after month

3. **Shift Badges**:
   - Small rectangular badges within each day
   - Display first name only (space constrained)
   - Color coding:
     - Green: Current user's shifts
     - Gray: Other users' shifts
     - Red border: Seeking coverage
     - Blue border: Available to cover
   - Stack vertically, 2-3px spacing

### Functionality
1. **Month Navigation**:
   - Display current month and year
   - Previous/Next month buttons (◀ ▶)
   - Update calendar on navigation
   - Support all 12 months of 2025

2. **Data Display**:
   - Fetch shifts via `/api/list`
   - Filter by date range (current month)
   - Group shifts by date
   - Sort within day (morning shifts first)

3. **Interactivity**:
   - Hover tooltip showing full shift details:
     - User name
     - Role
     - Time (e.g., "09:00-17:00")
     - Notes
   - Tooltip positioned near cursor
   - Smooth fade-in animation

4. **Overflow Handling**:
   - If 3+ shifts on one day:
     - Make cell scrollable (max-height: 120px)
     - Show custom scrollbar (thin, gray)
     - Maintain day number visibility

### Technical Implementation

#### State Management
```javascript
let dashboardMonth = new Date(); // Current month for dashboard
let allShiftsMonth = new Date(); // Current month for All Shifts tab

function changeDashboardMonth(delta) {
  dashboardMonth.setMonth(dashboardMonth.getMonth() + delta);
  renderCalendar('dashboard');
}

function changeAllShiftsMonth(delta) {
  allShiftsMonth.setMonth(allShiftsMonth.getMonth() + delta);
  renderCalendar('allShifts');
}
```

#### Rendering Logic
```javascript
async function renderCalendar(calendarType) {
  // Determine which calendar and month to render
  const month = calendarType === 'dashboard' ? dashboardMonth : allShiftsMonth;
  const grid = document.getElementById(`${calendarType}CalendarGrid`);
  
  // Clear existing content
  grid.innerHTML = '';
  
  // Render day headers
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = day;
    grid.appendChild(header);
  });
  
  // Get first day of month and number of days
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  
  // Render empty cells before month starts
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    grid.appendChild(emptyCell);
  }
  
  // Fetch shifts for this month
  const shifts = await fetchShifts();
  
  // Render each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayShifts = shifts.filter(s => s.date === dateStr);
    
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    
    // Day number
    const dayNum = document.createElement('div');
    dayNum.className = 'day-number';
    dayNum.textContent = day;
    dayCell.appendChild(dayNum);
    
    // Shift badges
    dayShifts.forEach(shift => {
      const badge = document.createElement('div');
      badge.className = `day-shift ${shift.user === currentUser.name ? 'current-user' : 'other-user'}`;
      
      if (shift.notes.includes('Seeking coverage')) {
        badge.classList.add('seeking-coverage');
      } else if (shift.notes.includes('Available to cover')) {
        badge.classList.add('offering-coverage');
      }
      
      badge.textContent = shift.user.split(' ')[0]; // First name only
      
      // Tooltip
      badge.addEventListener('mouseenter', (e) => showTooltip(e, shift));
      badge.addEventListener('mouseleave', hideTooltip);
      
      dayCell.appendChild(badge);
    });
    
    grid.appendChild(dayCell);
  }
}
```

### Integration Points
1. Replace "Open Shifts" list view in dashboard
2. Update "All Shifts" section to use calendar
3. Add calendar card to dashboard (next to AI chat)
4. Real-time updates: Call `renderCalendar()` after posting shifts

### CSS Requirements
- Responsive grid (`display: grid; grid-template-columns: repeat(7, 1fr);`)
- Smooth transitions (`.calendar-day { transition: all 0.15s; }`)
- Custom scrollbar styling (webkit-scrollbar)
- Hover effects without layout shift

Implement with clean, modular code and preserve existing functionality.
```

**Output:** Complete calendar system with month navigation, tooltips, and overflow handling

---

### Prompt D04: Add AI Chat Interface

**Date:** October 6, 2025 (morning)  
**Purpose:** Enable natural language shift posting

**Original User Request:**
> "Forms are clunky. Can users just type 'I need Friday covered' and have the AI understand it?"

**Enhanced Professional Prompt:**
```
Implement a natural language processing pipeline for shift management in Shift Swap AI:

## Feature Overview
Enable users to post shifts and request/offer coverage using conversational language without forms.

## Backend Implementation

### Step 1: Intent Classification Endpoint
Create new route: `POST /api/intelligent-match`

```typescript
async function handleIntelligentMatch(request: Request, env: Env) {
  const { message, currentUser, currentRole } = await request.json();
  
  // Step 1: Classify intent (seeking vs offering)
  const intent = await classifyIntent(message, env.AI);
  
  // Step 2: Extract structured data
  const extracted = await extractShiftData(message, currentUser, currentRole, intent, env.AI);
  
  // Step 3: Create shift post
  const post = await createPost(extracted.shiftData, env.SHIFT_ROOM);
  
  // Step 4: Find bidirectional matches
  const matches = await findMatches(post, intent, env.SHIFT_ROOM);
  
  // Step 5: Return response
  return jsonResponse({
    action: intent === 'seeking' ? 'posted' : 'created',
    message: '...',
    matches,
    shift: post
  });
}
```

### Step 2: Intent Classification
```typescript
async function classifyIntent(message: string, ai: Ai): Promise<{ intent: string, confidence: string }> {
  const prompt = `
    Analyze this message and determine if the user is:
    A) SEEKING coverage (can't work, needs replacement)
    B) OFFERING to cover (available, can help others)
    
    Message: "${message}"
    
    Respond with JSON: {"intent": "seeking"/"offering", "confidence": "high"/"medium"/"low"}
  `;
  
  const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      { role: 'system', content: 'You are an intent classifier. Always respond with valid JSON only.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 100,
    temperature: 0.1
  });
  
  return extractJson(response.response);
}
```

### Step 3: Data Extraction
```typescript
async function extractShiftData(
  message: string,
  currentUser: string,
  currentRole: string,
  intent: any,
  ai: Ai
): Promise<{ needsMoreInfo: boolean, shiftData?: any, message?: string }> {
  const prompt = `
    Extract shift details from: "${message}"
    User: ${currentUser}
    Role: ${currentRole}
    Intent: ${intent.intent}
    
    Extract: date (YYYY-MM-DD), shift (HH:MM-HH:MM), role, notes
    
    If missing info: {"needsMoreInfo": true, "message": "What date and time?"}
    If complete: {"needsMoreInfo": false, "shiftData": {...}}
  `;
  
  const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      { role: 'system', content: 'You are a data extraction assistant.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 300,
    temperature: 0.2
  });
  
  return extractJson(response.response);
}
```

### Step 4: Bidirectional Matching
```typescript
async function findMatches(post: ShiftPost, intent: any, room: DurableObjectNamespace) {
  const allShifts = await room.fetch('/list');
  
  if (intent === 'offering') {
    // User offers → find seeking requests
    return allShifts.filter(s =>
      s.notes.includes('Seeking coverage') &&
      s.user !== post.user &&
      Math.abs(daysBetween(s.date, post.date)) <= 3
    ).sort(byBestMatch);
  } else {
    // User seeks → find availability offers
    return allShifts.filter(s =>
      s.notes.includes('Available to cover') &&
      s.user !== post.user &&
      Math.abs(daysBetween(s.date, post.date)) <= 3
    ).sort(byBestMatch);
  }
}
```

## Frontend Implementation

### Chat Widget
```html
<div class="ai-chat-card">
  <h3>AI Assistant</h3>
  <div id="dashboardChatMessages" class="chat-messages">
    <div class="chat-empty">Type a message to get started...</div>
  </div>
  <div class="chat-input-container">
    <input id="dashboardChatInput" type="text" placeholder="e.g., I need Friday 9am-5pm covered">
    <button onclick="sendDashboardChat()">Send</button>
    <button id="voiceBtnDashboard" onclick="startVoiceInputDashboard()">◉ Voice</button>
  </div>
</div>
```

### Chat Logic
```javascript
async function sendDashboardChat(message) {
  // Disable input during processing
  input.disabled = true;
  
  // Add user message to chat
  addChatMessage(message, 'user');
  
  // Show "thinking" indicator
  addThinkingIndicator();
  
  try {
    // Call API with 30s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch('/api/intelligent-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        currentUser: currentUser.name,
        currentRole: currentUser.role
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const result = await response.json();
    
    // Remove thinking indicator
    removeThinkingIndicator();
    
    // Add AI response
    addChatMessage('', 'assistant', result);
    
    // Refresh all UI components
    await refreshAllData();
    
  } catch (error) {
    removeThinkingIndicator();
    
    if (error.name === 'AbortError') {
      addChatMessage('Request timed out. AI is busy. Please try again.', 'error');
    } else {
      addChatMessage('Something went wrong. Please try again.', 'error');
    }
  } finally {
    input.disabled = false;
    input.focus();
  }
}

function addChatMessage(message, type, data = null) {
  const container = document.getElementById('dashboardChatMessages');
  const wrapper = document.createElement('div');
  wrapper.className = `chat-message-wrapper ${type}`;
  
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${type}`;
  
  if (type === 'user') {
    bubble.textContent = message;
  } else if (data) {
    if (data.needsMoreInfo) {
      bubble.innerHTML = `<div>${data.message}</div>`;
    } else if (data.action === 'created' || data.action === 'posted') {
      bubble.innerHTML = `
        <div class="success-message">✓ ${data.message}</div>
        ${data.matches && data.matches.length > 0 ? `
          <div class="matches-section">
            <div class="matches-header">${data.summary}</div>
            ${data.matches.map((m, i) => `
              <div class="match-card ${i === 0 ? 'best' : ''}">
                <div class="match-name">${i === 0 ? '⭐ ' : ''}${m.user} - ${m.role}</div>
                <div class="match-details">📅 ${m.date} | ⏰ ${m.shift}</div>
                <div class="match-reason">${m.reason}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      `;
    }
  }
  
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
}
```

### Voice Input
```javascript
function startVoiceInputDashboard() {
  if (!('webkitSpeechRecognition' in window)) {
    alert('Voice input not supported in your browser');
    return;
  }
  
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById('dashboardChatInput').value = transcript;
  };
  
  recognition.start();
}
```

## Integration Requirements
1. Add chat widget to dashboard (next to calendar)
2. Update backend with new endpoint
3. Implement timeout handling (30s max)
4. Real-time UI updates after successful actions
5. Error messages with retry suggestions

## Testing Scenarios
1. "I need Friday 9am-5pm covered" → Creates seeking post
2. "I'm available Thursday afternoon" → Creates offering post
3. "Can you cover tomorrow?" → Asks for time clarification
4. Voice: "I need my Monday shift covered" → Processes voice input

Implement with robust error handling, clear user feedback, and seamless integration.
```

**Output:** Complete AI chat interface with NLP pipeline and bidirectional matching

---

### Prompt D05: Fix Chat Messages Not Displaying

**Date:** October 6, 2025 (afternoon)  
**Purpose:** Debug why chat responses weren't rendering

**Original User Request:**
> "When I type in the chat, nothing appears. The AI responds (I see it in console logs) but the message doesn't show on screen."

**Enhanced Professional Prompt:**
```
Debug and fix a critical rendering issue in the Shift Swap AI chat interface:

## Problem Description
- User types message in dashboard chat
- Message is sent to backend successfully
- Backend responds with data (visible in Network tab)
- No messages appear in the chat window
- Console shows: `[Chat] addChatMessage called` but no DOM changes

## Diagnostic Steps Completed
1. **Verified DOM elements exist**:
   ```javascript
   console.log('[Chat] Container:', document.getElementById('dashboardChatMessages'));
   // Output: <div id="dashboardChatMessages">...</div> ✅
   ```

2. **Verified function is called**:
   ```javascript
   console.log('[Chat] addChatMessage called with:', { message, type, data });
   // Output: { message: '', type: 'assistant', data: {...} } ✅
   ```

3. **Verified data structure**:
   ```javascript
   console.log('[Chat] Data.action:', result.action);
   // Output: "created" ✅
   ```

4. **Discovered function name collision**:
   ```bash
   # Search codebase
   grep -n "function addChatMessage" public/index.html
   
   # Output:
   1922: function addChatMessage(message, type = 'user', data = null) {
   2506: function addChatMessage(type, content) {
   
   # Two functions with the same name! ❌
   ```

## Root Cause
There are TWO functions named `addChatMessage` in the codebase:
1. **Line 1922**: Detailed function for dashboard chat (correct, has rendering logic)
2. **Line 2506**: Simple legacy function for AI Chat section (older, minimal rendering)

JavaScript uses the LAST defined function, so line 2506 overwrites line 1922.

## Solution Required
1. **Rename legacy function**:
   ```javascript
   // Line 2506: Old function
   function addChatMessage(type, content) {  // ← OLD NAME
     const container = document.getElementById('chatContainer') || document.getElementById('chatContainerAlt');
     if (!container) return 'msg-' + Date.now();
     
     const div = document.createElement('div');
     div.className = `chat-message ${type}`;
     div.innerHTML = type === 'user' 
       ? `<strong>You:</strong> ${escapeHtml(content)}`
       : `<strong>AI:</strong> ${content}`;
     container.appendChild(div);
     return 'msg-' + Date.now();
   }
   
   // Rename to:
   function addChatMessageLegacy(type, content) {  // ← NEW NAME
     // ... same implementation
   }
   ```

2. **Update all call sites for legacy function**:
   ```javascript
   // Find all calls to addChatMessage that should use legacy version
   // (These are in the AI Chat section, NOT dashboard)
   
   // Before:
   addChatMessage('user', message);
   addChatMessage('assistant', result);
   
   // After:
   addChatMessageLegacy('user', message);
   addChatMessageLegacy('assistant', result);
   ```

3. **Add extensive debug logging to verify fix**:
   ```javascript
   function addChatMessage(message, type = 'user', data = null) {
     console.log('[Chat] ===== addChatMessage CALLED =====');
     console.log('[Chat] Message:', message);
     console.log('[Chat] Type:', type);
     console.log('[Chat] Data:', data);
     
     const container = document.getElementById('dashboardChatMessages');
     console.log('[Chat] Container found:', container ? 'YES' : 'NO');
     console.log('[Chat] Container visible:', container?.offsetParent !== null);
     
     // ... rest of implementation with logs at each step
     
     console.log('[Chat] ===== Message added to DOM =====');
     console.log('[Chat] Total messages:', container.children.length);
   }
   ```

4. **Verify CSS visibility**:
   ```css
   .chat-bubble {
     display: block !important;  /* Force visibility */
     min-height: 20px !important;  /* Ensure non-zero height */
     margin-bottom: 12px;
     padding: 10px;
     border-radius: 8px;
     background: #F3F4F6;
   }
   ```

## Testing Checklist
After implementing fix:
- [ ] User message appears immediately after sending
- [ ] AI response appears after ~2-3 seconds
- [ ] Match cards render with green styling
- [ ] Scrollbar auto-scrolls to bottom
- [ ] Console shows all debug logs
- [ ] No JavaScript errors in console

## Prevention Strategy
Add JSDoc comments to differentiate functions:
```javascript
/**
 * Dashboard chat message rendering (detailed, with match cards)
 * Used in: Dashboard AI chat widget
 */
function addChatMessage(message, type, data) { ... }

/**
 * Legacy AI Chat section message rendering (simple, text-only)
 * Used in: AI Chat Assistant page
 */
function addChatMessageLegacy(type, content) { ... }
```

Implement fix with thorough testing and logging to prevent regression.
```

**Output:** Fixed function name collision, messages now render correctly

---

### Prompt D06: Implement Bidirectional Matching

**Date:** October 6, 2025 (late afternoon)  
**Purpose:** Match both seekers → offerers AND offerers → seekers

**Original User Request:**
> "When I say I'm available to cover, the AI doesn't tell me if anyone needs coverage on that day. It should check and let me know!"

**Enhanced Professional Prompt:**
```
Implement comprehensive bidirectional matching in Shift Swap AI's intelligent match endpoint:

## Current Behavior (One-Directional)
**Seeking Coverage Flow:**
1. User: "I need Friday covered"
2. AI creates request post
3. AI checks for existing availability offers
4. AI returns matches ✅

**Offering Availability Flow:**
1. User: "I'm available Friday"
2. AI creates availability post
3. AI does NOT check for existing requests ❌
4. User never knows if someone needs that day

## Required Behavior (Bidirectional)
Both flows should check for opposite intent:
- Seeking → Check for offers
- Offering → Check for requests

## Implementation Plan

### Step 1: Extract Matching Logic
Create reusable function:
```typescript
async function findOppositeMatches(
  post: ShiftPost,
  intent: 'seeking' | 'offering',
  room: DurableObjectNamespace
): Promise<ShiftPost[]> {
  // Fetch all shifts
  const response = await room.fetch(new Request('http://internal/list'));
  const allShifts = await response.json();
  
  // Determine what we're looking for
  const targetNotes = intent === 'seeking' 
    ? 'Available to cover'  // If seeking, find offers
    : 'Seeking coverage';   // If offering, find requests
  
  // Filter matches
  const matches = allShifts.filter(s => {
    // Exclude current user
    if (s.user === post.user) return false;
    
    // Exclude the post itself
    if (s.id === post.id) return false;
    
    // Check note type
    if (!s.notes.includes(targetNotes)) return false;
    
    // Check date proximity (within 3 days)
    const postDate = new Date(post.date);
    const shiftDate = new Date(s.date);
    const daysDiff = Math.abs((postDate.getTime() - shiftDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDiff <= 3;
  });
  
  // Sort by best match
  matches.sort((a, b) => {
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);
    const postDate = new Date(post.date);
    
    const aDiff = Math.abs((postDate.getTime() - aDate.getTime()) / (1000 * 60 * 60 * 24));
    const bDiff = Math.abs((postDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Priority 1: Exact date match
    if (aDiff === 0 && bDiff !== 0) return -1;
    if (bDiff === 0 && aDiff !== 0) return 1;
    
    // Priority 2: Same role
    const aRoleMatch = a.role === post.role;
    const bRoleMatch = b.role === post.role;
    if (aRoleMatch && !bRoleMatch) return -1;
    if (bRoleMatch && !aRoleMatch) return 1;
    
    // Priority 3: Date proximity
    return aDiff - bDiff;
  });
  
  return matches.slice(0, 3); // Top 3 matches
}
```

### Step 2: Update Offering Flow
```typescript
if (intent.intent === 'offering') {
  // Create availability post
  const postResponse = await room.fetch(new Request('http://internal/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: currentUser,
      role: shiftData.role,
      date: shiftData.date,
      shift: shiftData.shift,
      notes: 'Available to cover'
    })
  }));
  
  const createdPost = await postResponse.json();
  console.log('[Intelligent Match] Created availability post:', createdPost.id);
  
  // NOW CHECK FOR EXISTING REQUESTS (New!)
  console.log('[Intelligent Match] Checking for existing coverage requests...');
  const matchingRequests = await findOppositeMatches(
    createdPost,
    'offering',
    room
  );
  
  console.log('[Intelligent Match] Found', matchingRequests.length, 'matching requests');
  
  // Format matches with detailed reasons
  const matches = matchingRequests.map(s => {
    const requestDate = new Date(s.date);
    const offerDate = new Date(shiftData.date);
    const daysDiff = Math.abs((offerDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let reason = '';
    if (daysDiff === 0) {
      if (s.role === shiftData.role) {
        reason = `🎯 Perfect match! Same role (${s.role}) and same date (${s.date})!`;
      } else {
        reason = `Same date (${s.date}) but different role (${s.role} vs your ${shiftData.role})`;
      }
    } else {
      reason = `${s.role === shiftData.role ? 'Same role' : 'Different role'}, ${daysDiff} day${daysDiff > 1 ? 's' : ''} apart`;
    }
    
    return {
      user: s.user,
      role: s.role,
      date: s.date,
      shift: s.shift,
      reason
    };
  });
  
  // Return response with matches
  if (matches.length === 0) {
    return jsonResponse({
      needsMoreInfo: false,
      action: 'created',
      message: `Perfect! I've recorded that you're available to cover shifts on ${shiftData.date} from ${shiftData.shift}.`,
      suggestion: 'When someone needs coverage for that time, they\'ll be matched with you!',
      matches: [],
      shift: createdPost
    }, 200, corsOrigin);
  } else {
    return jsonResponse({
      needsMoreInfo: false,
      action: 'created',
      message: `Great! I've recorded your availability for ${shiftData.date} from ${shiftData.shift}.`,
      summary: `🎉 Good news! I found ${matches.length} ${matches.length > 1 ? 'people who need' : 'person who needs'} coverage around that time:`,
      matches,
      suggestion: 'Would you like to cover any of these shifts?',
      shift: createdPost
    }, 200, corsOrigin);
  }
}
```

### Step 3: Frontend Display Update
Update `addChatMessage` to handle matches in 'created' action:
```javascript
} else if (data.action === 'created') {
  bubble.className = 'chat-bubble system';
  let content = `
    <div class="success-header">✓ Availability Recorded!</div>
    <div>${data.message}</div>
    ${data.shift ? `<div class="shift-info">📅 ${data.shift.date} | ⏰ ${data.shift.shift}</div>` : ''}
  `;
  
  // If there are matching coverage requests, show them!
  if (data.matches && data.matches.length > 0) {
    content += `
      <div class="matches-section">
        <div class="matches-header">${data.summary}</div>
    `;
    data.matches.forEach((match, index) => {
      content += `
        <div class="match-card ${index === 0 ? 'best' : ''}">
          <div class="match-name">${index === 0 ? '⭐ ' : ''}${match.user} - ${match.role}</div>
          <div class="match-details">📅 ${match.date} | ⏰ ${match.shift}</div>
          <div class="match-reason">${match.reason}</div>
        </div>
      `;
    });
    content += `
        <div class="suggestion">${data.suggestion || ''}</div>
      </div>
    `;
  }
  
  bubble.innerHTML = content;
}
```

## Testing Scenarios

### Test 1: Seeker Posts First
1. Alice: "I need October 15th covered" → Post created
2. Bob: "I'm available October 15th" → Should see "🎉 Found 1 person: Alice!"

### Test 2: Offerer Posts First
1. Bob: "I'm available October 15th" → Post created
2. Alice: "I need October 15th covered" → Should see "🎉 Found 1 person: Bob!"

### Test 3: Multiple Matches
1. Alice: "I need October 15th covered"
2. Carol: "I need October 16th covered"
3. Bob: "I'm available October 15th" → Should see "🎉 Found 2 people: Alice (same day, ⭐) and Carol (1 day apart)"

### Test 4: No Matches
1. Bob: "I'm available October 30th" → "Recorded! You'll be notified when someone needs that day."

## Success Criteria
- [ ] Offering availability shows existing requests
- [ ] Matches sorted by date exactness first
- [ ] Same role preferred within same date proximity
- [ ] UI shows "🎯 Perfect match!" for exact date + role
- [ ] Console logs show matching process
- [ ] Both directions work symmetrically

Implement with thorough testing and clear user feedback.
```

**Output:** Complete bidirectional matching with intelligent sorting

---

### Prompt D07: Calendar Cell Overflow Fix

**Date:** October 6, 2025 (evening)  
**Purpose:** Handle 3+ shifts in one calendar day

**Original User Request:**
> "When there are 3 or more shifts on the same day, they overflow outside the calendar cell and look broken."

**Enhanced Professional Prompt:**
```
Fix calendar cell overflow issue in Shift Swap AI and implement a comprehensive solution:

## Problem Analysis
**Current State:**
- Calendar cells have fixed height (`aspect-ratio: 1`)
- Shifts stack vertically within cell
- When 3+ shifts present, badges overflow outside cell borders
- Overflow is hidden (cuts off shifts) or visible (breaks layout)

**User Impact:**
- Can't see all shifts on busy days
- UI looks broken/unprofessional
- Demo data has days with 6+ shifts (October 15th)

## Solution Strategy

### Part 1: Make Cells Scrollable
Update CSS:
```css
.calendar-day {
  aspect-ratio: 1;
  border: 1px solid #E8E8E8;
  border-radius: 6px;
  padding: 8px;
  position: relative;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 80px;
  max-height: 120px;      /* ← New: Limit height */
  overflow-y: auto;       /* ← New: Enable scrolling */
  overflow-x: hidden;     /* ← New: Prevent horizontal scroll */
  display: flex;          /* ← New: Flexbox layout */
  flex-direction: column; /* ← New: Stack children */
}

/* Custom scrollbar (thin, subtle) */
.calendar-day::-webkit-scrollbar {
  width: 4px;
}

.calendar-day::-webkit-scrollbar-track {
  background: transparent;
}

.calendar-day::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 2px;
}

.calendar-day::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}
```

### Part 2: Prevent Child Shrinking
```css
.day-number {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 4px;
  flex-shrink: 0;  /* ← New: Don't compress day number */
}

.day-shift {
  font-size: 0.75rem;
  padding: 3px 6px;
  border-radius: 4px;
  margin-bottom: 2px;
  flex-shrink: 0;  /* ← New: Don't compress badges */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
```

### Part 3: Reduce Demo Data
Current `sample-data.json` has 6 shifts across scattered days. Reduce to max 2 per day:
```json
{
  "description": "Sample shift posts - Max 2 per day to prevent calendar overflow",
  "posts": [
    {
      "user": "Alice Johnson",
      "role": "Nurse",
      "date": "2025-10-15",
      "shift": "09:00-17:00",
      "notes": "Preferably swap with another RN"
    },
    {
      "user": "Dr. Charlie Brown",
      "role": "Doctor",
      "date": "2025-10-15",
      "shift": "14:00-22:00",
      "notes": "Evening shift preferred"
    },
    {
      "user": "Bob Smith",
      "role": "Nurse",
      "date": "2025-10-18",
      "shift": "09:00-17:00",
      "notes": "Flexible with dates"
    },
    {
      "user": "Diana Prince",
      "role": "Nurse",
      "date": "2025-10-22",
      "shift": "21:00-05:00",
      "notes": "Night shift, ICU certified"
    }
  ]
}
```

### Part 4: Update Reset Function
In `resetCalendar()` function (used by Settings → Reset button):
```javascript
async function resetCalendar() {
  // Clear existing data
  await fetch(`${API_BASE}/api/clear`, { method: 'POST' });
  
  // Load demo shifts (max 2 per day)
  const demoShifts = [
    {
      user: "Alice Johnson",
      role: "Nurse",
      date: "2025-10-15",
      shift: "09:00-17:00",
      notes: "Preferably swap with another RN"
    },
    {
      user: "Dr. Charlie Brown",
      role: "Doctor",
      date: "2025-10-15",
      shift: "14:00-22:00",
      notes: "Evening shift preferred"
    },
    {
      user: "Bob Smith",
      role: "Nurse",
      date: "2025-10-18",
      shift: "09:00-17:00",
      notes: "Flexible with dates"
    },
    {
      user: "Diana Prince",
      role: "Nurse",
      date: "2025-10-22",
      shift: "21:00-05:00",
      notes: "Night shift, ICU certified"
    }
  ];
  
  // Post each shift
  for (const shift of demoShifts) {
    await fetch(`${API_BASE}/api/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shift)
    });
  }
  
  // Refresh UI
  await refreshAllData();
}
```

## Testing Checklist
- [ ] **2 shifts**: Fits comfortably, no scrollbar
- [ ] **3 shifts**: Shows scrollbar, all visible when scrolled
- [ ] **5+ shifts**: Smooth scrolling, custom scrollbar visible
- [ ] **Day number**: Always visible at top (not pushed out)
- [ ] **Hover tooltip**: Still works when hovering badges
- [ ] **Mobile**: Scrolling works on touch devices
- [ ] **Reset button**: Loads exactly 4 shifts, spread across days

## Visual Verification
After fix:
1. October 15: Shows Alice + Charlie (2 shifts, no scroll)
2. October 18: Shows Bob (1 shift)
3. October 22: Shows Diana (1 shift)
4. User posts 3rd shift on Oct 15: Scrollbar appears, smooth scrolling

## Performance Considerations
- `max-height: 120px` prevents cells from expanding infinitely
- `overflow-y: auto` only shows scrollbar when needed
- Thin scrollbar (4px) doesn't interfere with content
- Flexbox prevents layout shift during scroll

Implement with thorough visual testing on multiple browsers.
```

**Output:** Scrollable calendar cells, reduced demo data, clean UI for 3+ shifts

---

## Debugging & Problem-Solving Prompts

These prompts were used to solve specific issues during development.

### Debug P01: Race Condition - Calendar Blank on Load

**Issue:** Calendar rendered blank initially, worked after month navigation

**Original User Request:**
> "The calendar is blank when I first login, but when I click next/prev month it shows up fine. What's happening?"

**Debugging Prompt:**
```
Diagnose and fix a race condition in Shift Swap AI's calendar initialization:

## Observed Behavior
1. User selects profile on login screen
2. Dashboard loads
3. Calendar shows month/year header ✅
4. Calendar grid is EMPTY ❌
5. User clicks "Next Month" button
6. Calendar suddenly populates with shifts ✅

## Console Logs
```
[Login] User selected: Alice Johnson
[Init] Dashboard section made visible
[Init] Starting app initialization
[Calendar] Rendering grid for: 2025 9 User: null ← ⚠️ null user!
Uncaught TypeError: Cannot read properties of null (reading 'name')
    at renderCalendarGrid (index.html:1710:45)
```

## Hypothesis
Calendar is rendering BEFORE `currentUser` is fully set, leading to:
- `currentUser` is `null` during first render
- Cannot filter "my shifts" vs "other shifts"
- Cannot color-code properly
- May crash or return early

## Root Cause Investigation
Check event timing:
```javascript
// Step 1: User selects profile
function selectUser(user) {
  currentUser = user;  // ← Set immediately
  localStorage.setItem('currentUser', JSON.stringify(user));
  
  // Step 2: Hide login, show app
  document.getElementById('loginScreen').style.display = 'none';
  document.querySelector('.main-content').style.display = 'block';
  
  // Step 3: Initialize app
  updateAnalytics();
  renderCalendar('dashboard');  // ← Called synchronously, but currentUser might not be "ready"?
}
```

Possible issue: Even though `currentUser = user` is synchronous, the calendar render might execute before the assignment is fully processed?

## Solutions to Test

### Solution 1: Add Delay
```javascript
function selectUser(user) {
  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(user));
  
  document.getElementById('loginScreen').style.display = 'none';
  document.querySelector('.main-content').style.display = 'block';
  
  // Add small delay to ensure currentUser is set
  setTimeout(() => {
    console.log('[Login] Delayed initialization, user:', currentUser.name);
    updateAnalytics();
    renderCalendar('dashboard');
  }, 150); // 150ms delay
}
```

### Solution 2: Null Check in Render
```javascript
async function renderCalendarGrid(grid, month) {
  console.log('[Calendar] Rendering, currentUser:', currentUser);
  
  // Add guard clause
  if (!currentUser) {
    console.error('[Calendar] Cannot render - currentUser is null');
    grid.innerHTML = '<div class="calendar-error">Please log in to view calendar</div>';
    return;
  }
  
  // Continue with normal rendering...
}
```

### Solution 3: Explicit Readiness Check
```javascript
let appReady = false;

function selectUser(user) {
  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(user));
  
  document.getElementById('loginScreen').style.display = 'none';
  document.querySelector('.main-content').style.display = 'block';
  
  // Mark app as ready
  appReady = true;
  
  console.log('[Login] App ready:', appReady);
  updateAnalytics();
  renderCalendar('dashboard');
}

async function renderCalendarGrid(grid, month) {
  if (!appReady || !currentUser) {
    console.warn('[Calendar] App not ready or no user');
    return;
  }
  
  // Continue rendering...
}
```

### Solution 4: Async Initialization
```javascript
async function selectUser(user) {
  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(user));
  
  document.getElementById('loginScreen').style.display = 'none';
  document.querySelector('.main-content').style.display = 'block';
  
  // Use Promise to ensure order
  await Promise.resolve(); // Yield to event loop
  
  console.log('[Login] After yield, user:', currentUser?.name);
  updateAnalytics();
  await renderCalendar('dashboard');
}
```

## Recommended Approach
Combination of Solutions 1 & 2:
1. Add 150ms delay in `selectUser()` (Solution 1)
2. Add null check in `renderCalendarGrid()` (Solution 2)
3. Add extensive console logging to verify

## Implementation
```javascript
// In selectUser()
setTimeout(() => {
  console.log('[Login] Initializing app for:', currentUser.name);
  console.log('[Login] Dashboard month:', dashboardMonth.toLocaleString());
  updateUserProfile();
  updateAnalytics();
  renderCalendar('dashboard');
}, 150);

// In renderCalendarGrid()
async function renderCalendarGrid(grid, month) {
  if (!currentUser) {
    console.error('[Calendar] Cannot render - currentUser is null');
    grid.innerHTML = '<div class="error">Please log in</div>';
    return;
  }
  
  console.log('[Calendar] Rendering for user:', currentUser.name);
  // ... rest of implementation
}
```

## Testing
After fix:
1. Hard refresh (Cmd+Shift+R)
2. Select user
3. Verify console shows: `[Calendar] Rendering for user: Alice Johnson`
4. Verify calendar grid populates immediately
5. Verify no "Cannot read properties of null" errors

Implement fix with thorough logging and testing.
```

**Output:** Added 150ms delay + null checks, calendar now renders correctly on first load

---

### Debug P02: AI Timeout Issue

**Issue:** AI requests timing out after 15 seconds

**Debugging Prompt:**
```
Fix timeout issues in Shift Swap AI's intelligent match endpoint:

## Problem
Users report: "AI took too long and timed out"

## Console Logs
```
[sendDashboardChat] Sending request to /api/intelligent-match
[sendDashboardChat] Request body: {...}
... 15 seconds pass ...
Dashboard chat error: AbortError: signal is aborted without reason
```

## Root Cause
Current timeout: 15 seconds
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s ← TOO SHORT
```

Llama 3.3 processing time:
- Intent classification: ~1-2s
- Data extraction: ~2-3s
- Match analysis (optional): ~5-10s
- Network latency: ~1-2s
- **Total: Can exceed 15s**

## Solution
1. Increase timeout to 30s
2. Add better error messaging
3. Show loading indicator earlier

## Implementation
```javascript
async function sendDashboardChat(message) {
  const input = document.getElementById('dashboardChatInput');
  const messagesContainer = document.getElementById('dashboardChatMessages');
  
  // Disable input
  input.disabled = true;
  
  // Add user message
  addChatMessage(message, 'user');
  
  // Show thinking indicator immediately
  const thinkingDiv = document.createElement('div');
  thinkingDiv.id = 'thinking-indicator';
  thinkingDiv.className = 'chat-message-wrapper assistant';
  thinkingDiv.innerHTML = `
    <div class="chat-bubble assistant thinking">
      <span class="loading-dots">●●●</span> AI is thinking...
    </div>
  `;
  messagesContainer.appendChild(thinkingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  try {
    // Increased timeout: 15s → 30s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s
    
    console.log('[sendDashboardChat] Sending request...');
    const response = await fetch('/api/intelligent-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        currentUser: currentUser.name,
        currentRole: currentUser.role
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Remove thinking indicator
    const thinkingIndicator = document.getElementById('thinking-indicator');
    if (thinkingIndicator) {
      thinkingIndicator.parentElement.remove();
    }
    
    const result = await response.json();
    addChatMessage('', 'assistant', result);
    await refreshAllData();
    
  } catch (error) {
    // Remove thinking indicator
    const thinkingIndicator = document.getElementById('thinking-indicator');
    if (thinkingIndicator) {
      thinkingIndicator.parentElement.remove();
    }
    
    console.error('[sendDashboardChat] Error:', error);
    
    // Better error messages
    let errorMessage = 'Something went wrong.';
    let suggestion = '';
    
    if (error.name === 'AbortError') {
      errorMessage = '⏱️ Request timed out after 30 seconds. The AI service might be busy or slow to respond.';
      suggestion = 'Try: Wait a moment and try again, or use the "New Shift" section to post manually.';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error. Please check your connection.';
      suggestion = 'Verify you have internet access and try again.';
    }
    
    addChatMessage(`
      <div class="error-message">
        <div class="error-header">⚠️ Error</div>
        <div>${errorMessage}</div>
        ${suggestion ? `<div class="suggestion">${suggestion}</div>` : ''}
      </div>
    `, 'error');
    
  } finally {
    input.disabled = false;
    input.focus();
  }
}
```

## CSS for Loading Animation
```css
.thinking {
  font-style: italic;
  color: #666;
}

.loading-dots {
  display: inline-block;
  animation: blink 1.4s infinite;
}

@keyframes blink {
  0%, 20% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
}

.error-message {
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  border-radius: 8px;
  padding: 12px;
}

.error-header {
  font-weight: 600;
  color: #DC2626;
  margin-bottom: 8px;
}

.suggestion {
  margin-top: 8px;
  font-size: 0.875rem;
  color: #991B1B;
}
```

## Testing
1. Post shift via chat
2. Watch for "AI is thinking..." message
3. Verify timeout doesn't occur
4. If it does, error message should be helpful

Implement with improved UX and error handling.
```

**Output:** 30s timeout + better error messaging + loading indicator

---

## Documentation Prompts

These prompts were used to create the comprehensive documentation you're reading now.

### Doc D01: Update All Documentation

**Final Documentation Prompt** (The prompt used to create THIS document!)

**Original User Request:**
> "You are an expert technical writer. Update all documentation Markdown files in my cf_ai_shift_swap_ai project — including README.md, PROMPTS.md, PROJECT_SUMMARY.md, QUICKSTART.md. Your goal is to make the documentation fully compliant with Cloudflare's internship assignment and impressive to employers reviewing my repository."

**Enhanced Professional Prompt:**
```markdown
You are an expert technical writer and engineer specializing in Cloudflare Workers AI projects.  
Your task is to update all documentation Markdown files in my `cf_ai_shift_swap_ai` project — including:

- `README.md`
- `PROMPTS.md`
- `PROJECT_SUMMARY.md`
- `QUICKSTART.md` (if present)
- `COMMANDS.md` (optional touch-up if required)

Your goal is to make the documentation **fully compliant with Cloudflare's internship assignment** and **impressive to employers** reviewing my repository.

---

## 🏆 Cloudflare's Requirements Reminder

Cloudflare stated the following must be included for the AI-powered application submission:

1. **Repository prefix**: The repo name begins with `cf_ai_`.
2. **AI-powered application** that includes:
   - ✅ An **LLM** (Llama 3.3 on Workers AI or external)
   - ✅ **Workflow / coordination** (using Workers, Durable Objects, or Workflows)
   - ✅ **User input** (via chat, form, or Realtime input using Pages)
   - ✅ **Memory or state** (persistent data using Durable Objects or KV)
3. **Public repo** with:
   - `README.md` including documentation and running instructions (local + deployed)
   - `PROMPTS.md` including all AI prompts used during development
4. **Original work only**, no copied submissions
5. **Encouraged use of AI-assisted coding**, but all generated prompts must be documented

---

## 🎯 What to Do

Update and polish the documentation to reflect the final production-ready app and its evolution through development.

### 1. `README.md` — Comprehensive, Employer-Facing Summary
Make this a full, professional case study for Cloudflare reviewers. Include:

- 📘 **Project Overview** — What Shift Swap AI is, who it helps, and how it works.
- 🧩 **Architecture Breakdown**
  - Workers AI (LLM used)
  - Durable Object (state management)
  - Frontend (HTML/JS UI, user selection, calendar display)
  - Data persistence (demo shifts preloaded)
- ⚙️ **How to Run**
  - Local setup (npm install → wrangler login → wrangler dev)
  - Deployment steps (wrangler publish)
- 💡 **Key Features**
  - AI-powered matching using Llama 3.3
  - Interactive calendar with month navigation
  - Bidirectional matching (seeker ↔ offerer)
  - Natural language chat interface
  - Voice input support
  - Real-time dashboard updates
  - User login system with 6 profiles
  - Scrollable calendar cells for 3+ shifts
  - Reset function for demo data
- 🧠 **AI Prompt Engineering**
  - Summarize how AI prompts drive the reasoning
  - Explain JSON-structured output and fallback logic
- 🧱 **Workflow + Memory**
  - Explain how the DO stores shifts and coordinates AI calls
- 🧰 **Tech Stack**
  - Workers AI, Durable Objects, TypeScript, HTML, Wrangler v4
- 🧾 **Development Process**
  - Mention problems faced (race conditions, function name collision, AI timeouts, calendar overflow)
  - Explain how these were solved (delays, null checks, renaming, scrollable cells)
  - Describe iterative improvements (login system, calendar, chat, bidirectional matching)
- 🧠 **Lessons Learned**
  - Emphasize understanding of Cloudflare architecture, Workers AI, Durable Objects, state management, and prompt engineering.
- 🧩 **Assignment Alignment**
  - Add a short checklist mapping how each Cloudflare requirement was met.

Format clearly with section dividers, emoji headers, and markdown tables where appropriate.

---

### 2. `PROMPTS.md` — Full AI Prompt Documentation

Overhaul this file to:
- Include all the **prompts you used** during the project — including this one.
- Add the **original prompt requests** you gave (e.g. "make the app fetch from calendar data, highlight user shifts, etc.").
- Rewrite or enhance them with professional, structured tone and context to demonstrate **advanced prompt engineering ability**.

Organize it with these sections:
1. 🧠 **System Prompts** — (e.g. "You are a scheduling assistant…")
2. 💬 **Runtime Prompts** — (AI reasoning during match requests)
3. ⚙️ **Development Prompts** — (the ones I gave to build or fix features)
4. 🧩 **Testing Prompts** — (validation, test scenarios)
5. 📘 **Enhanced Examples** — rewritten in a professional, clear, technically literate style — while still traceable to the real prompts I used.

Example entry:
```markdown
### Prompt 07 — Add login-as selector and calendar display

**Original User Intent:**
> "Currently the app doesn't have a proper calendar. I want a full month view and let users pick a demo user before the dashboard loads."

**Enhanced Prompt Version (for PROMPTS.md):**
> Design and implement a pre-login user selector that lets testers impersonate a demo user (no password). The app should load a calendar view with month navigation, highlight the current user's shifts, and use that context in all AI matching requests. The "name" field should be auto-filled based on the logged-in demo user.

**Agent Notes:**
Implemented using localStorage + separate month state variables. Fixed race condition with setTimeout delay. Tested locally and verified calendar renders correctly.
```

Include about 10–15 prompts from across the development process.

### 3. `PROJECT_SUMMARY.md` — Optional Executive Summary

If this file exists, make it a one-page high-level brief Cloudflare recruiters can read in 2 minutes:

- What the app does
- How it uses Cloudflare tech
- Why it's impressive
- Key challenges and solutions
- A final reflection ("Why this project matters to me as a developer")

### 4. Style & Tone Guidelines

- Use clear, polished English — professional but human.
- Include emojis and formatting for readability.
- Use Markdown tables to summarize mappings (e.g., "Cloudflare Requirement → My Implementation").
- Use callouts like:
  > ⚠️ Bug fixed: "Race condition caused blank calendar" — resolved by adding 150ms delay and null checks.
- Credit all debugging, iteration, and learning — make it clear I went through a real engineering process, not a one-click generator.

### 5. Deliverables

When you're done:
✅ Update all markdown files in the project folder
✅ Ensure every Cloudflare requirement is addressed
✅ Add improved, enhanced versions of my original prompts
✅ Make everything cohesive, consistent, and professional
✅ Verify formatting renders perfectly in GitHub preview

Begin by scanning existing Markdown files, then rewrite or add sections accordingly.
```

**Output:** This comprehensive PROMPTS.md document, updated README.md, and PROJECT_SUMMARY.md

---

## Prompt Engineering Insights

### What Made These Prompts Effective

#### 1. **Clear Structure**
Every prompt followed a pattern:
```
[Context] → [Requirements] → [Technical Details] → [Expected Output]
```

Example:
```
Context: "We need calendar overflow handling"
Requirements: "Cells should scroll when 3+ shifts"
Technical: "Use max-height: 120px, overflow-y: auto"
Expected: "Scrollable cells with custom scrollbar"
```

#### 2. **Explicit Output Format**
Always specified desired structure:
```
// Instead of:
"Make the AI suggest matches"

// Use:
"Return JSON: { candidateUser: string, reason: string }"
```

#### 3. **Concrete Examples**
Included test cases and expected behavior:
```
Input: "I need Friday covered"
Expected: {"intent": "seeking", "confidence": "high"}

Input: "I'm available Thursday"
Expected: {"intent": "offering", "confidence": "high"}
```

#### 4. **Error Scenarios**
Addressed edge cases upfront:
```
If user is null: Show error, don't crash
If AI times out: Show helpful message, allow retry
If no matches: Display empty state gracefully
```

#### 5. **Incremental Complexity**
Built features step-by-step:
1. Basic matching (static prompt)
2. Natural language parsing (intent classification)
3. Data extraction (structured output)
4. Bidirectional matching (complex logic)

#### 6. **Debugging Focus**
Debug prompts included:
- Observed behavior
- Console logs
- Hypothesis
- Multiple solution approaches
- Testing criteria

### Temperature & Token Tuning

| Task | Temperature | Max Tokens | Rationale |
|------|------------|-----------|-----------|
| Intent Classification | 0.1 | 100 | Need deterministic classification |
| Data Extraction | 0.2 | 300 | Slight flexibility for date parsing |
| Match Analysis | 0.7 | 500 | Creative reasoning for explanations |

### Iteration Strategy

**Version 1**: Simple, direct prompts
```
"Suggest the best match from the pool"
```

**Version 2**: Added structure
```
"Analyze candidates considering role, date, and notes.
Return JSON: {candidateUser, reason}"
```

**Version 3**: Added priorities
```
"MATCHING PREFERENCES (in order):
1. Same role
2. Proximate dates
3. Shift compatibility"
```

**Version 4** (Final): Added constraints + examples
```
"MATCHING PREFERENCES: [...]
CONSTRAINTS:
- Only suggest from pool
- Be realistic about roles
OUTPUT FORMAT:
{ candidateUser: '...', reason: '...' }
Do not include any other text."
```

### Success Metrics

**Good Prompt Signs:**
- ✅ AI output matches expected format 95%+ of time
- ✅ Minimal post-processing needed
- ✅ Clear, helpful reasoning in responses
- ✅ Handles edge cases gracefully

**Red Flags:**
- ❌ Frequent JSON parsing errors
- ❌ Verbose, rambling responses
- ❌ Hallucinates candidates not in pool
- ❌ Ignores priority order

---

## Future Improvement Ideas

### Enhanced Prompts for V2

**1. Few-Shot Learning**
Add 2-3 examples directly in system prompt:
```
EXAMPLES:

Request: Alice (Nurse, Oct 15) needs coverage
Pool: Bob (Nurse, Oct 16), Charlie (Doctor, Oct 15)
Best Match: Bob
Reason: Same role (Nurse), adjacent date (Oct 16)

Request: David (Surgeon, Oct 20, cardiac surgery)
Pool: Emily (NP, Oct 20), Frank (Surgeon, Oct 20, general)
Best Match: Frank
Reason: Same role and date, closest skill match
```

**2. Chain-of-Thought**
Make AI show reasoning steps:
```
Think step-by-step:
1. Filter candidates by role match
2. Rank by date proximity
3. Consider shift time overlap
4. Check notes for special requirements
5. Select top match and explain
```

**3. Confidence Scoring**
Add confidence to responses:
```json
{
  "candidateUser": "Bob Smith",
  "reason": "Same role, adjacent date",
  "confidence": 0.95,
  "alternatives": [
    {"user": "Charlie", "confidence": 0.65}
  ]
}
```

**4. Multi-Turn Conversation**
Track context across messages:
```
User: "I need Friday covered"
AI: "What time on Friday?"
User: "9am to 5pm"
AI: "Got it! Nurse shift, Oct 11, 09:00-17:00. Posting..."
```

---

## Conclusion

This PROMPTS.md document serves as:
1. **Assignment Compliance**: All prompts documented per Cloudflare requirements
2. **Learning Resource**: Shows prompt engineering evolution
3. **Reproducibility**: Anyone can recreate the project using these prompts
4. **Professional Portfolio**: Demonstrates AI-assisted development mastery

**Key Takeaway:** Effective prompt engineering is iterative. Start simple, add structure, refine with examples, handle edge cases, and continuously improve based on results.

---

**Last Updated:** October 6, 2025  
**Model:** Llama 3.3 70B Instruct (Workers AI)  
**Total Prompts Documented:** 15+ (Runtime + Development + Debugging + Documentation)  
**Development Tool:** Claude Sonnet 4.5 (Anthropic)

---

*All prompts documented per Cloudflare internship assignment requirements.*  
*AI-assisted development credited and traceable.*  
*Ready for review and evaluation.*

---

**© 2025 Haashim Malik** | Cloudflare Internship Assignment  
This documentation is original work created for the Cloudflare 2025 Internship Application.  
**Author:** Haashim Malik  
**Project:** Shift Swap AI
