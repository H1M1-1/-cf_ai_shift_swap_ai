# Command Reference

**Complete list of all commands for Shift Swap AI development, testing, and deployment.**

> **Quick Links:**  
> [Setup](#initial-setup) | [Development](#local-development) | [Testing](#testing-with-curl) | [Deployment](#deployment) | [Troubleshooting](#troubleshooting-commands)

## Initial Setup

### 1. Install Dependencies
```bash
cd cf_ai_shift_swap_ai
npm install
```

### 2. Authenticate with Cloudflare
```bash
npx wrangler login
```

### 3. Get Account ID
Visit: https://dash.cloudflare.com/
Copy your Account ID from the right sidebar.

### 4. Update wrangler.toml
```bash
# Open wrangler.toml and replace YOUR_ACCOUNT_ID with your actual account ID
nano wrangler.toml
# or use your preferred editor
```

---

## Local Development

### Start Development Server
```bash
npm run dev
# or
npx wrangler dev
```

Access at: http://localhost:8787

### Stop Development Server
Press `Ctrl+C` in the terminal

---

## Testing with curl

### Post a Shift (Local)
```bash
curl -X POST http://localhost:8787/api/post \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Alice Johnson",
    "role": "Nurse",
    "date": "2025-10-15",
    "shift": "09:00-17:00",
    "notes": "Preferably swap with another RN"
  }'
```

### List All Shifts (Local)
```bash
curl http://localhost:8787/api/list
```

### Request AI Match (Local)
```bash
# First, get a shift ID from the list command above
curl -X POST http://localhost:8787/api/match \
  -H "Content-Type: application/json" \
  -d '{"requestId": "PASTE_SHIFT_ID_HERE"}'
```

---

## Deployment

### Deploy to Production
```bash
npm run deploy
# or
npx wrangler deploy
```

### View Deployment
```bash
# The deploy command outputs your URL:
# https://cf-ai-shift-swap-ai.<your-subdomain>.workers.dev
# Example: https://cf-ai-shift-swap-ai.h1m1-1.workers.dev
```

### View Logs
```bash
npx wrangler tail
```

---

## Testing Production Deployment

**⚠️ Important:** Replace `<your-subdomain>` with your actual Workers subdomain from the deployment output.

### Post a Shift (Production)
```bash
curl -X POST https://cf-ai-shift-swap-ai.<your-subdomain>.workers.dev/api/post \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Alice Johnson",
    "role": "Nurse",
    "date": "2025-10-15",
    "shift": "09:00-17:00",
    "notes": "Preferably swap with another RN"
  }'
```

### List All Shifts (Production)
```bash
curl https://cf-ai-shift-swap-ai.<your-subdomain>.workers.dev/api/list
```

### Request AI Match (Production)
```bash
curl -X POST https://cf-ai-shift-swap-ai.<your-subdomain>.workers.dev/api/match \
  -H "Content-Type: application/json" \
  -d '{"requestId": "PASTE_SHIFT_ID_HERE"}'
```

---

## Batch Testing Script

Create a file `test.sh`:

```bash
#!/bin/bash

BASE_URL="${1:-http://localhost:8787}"

echo "=== Posting Sample Shifts ==="

# Post shift 1
SHIFT1=$(curl -s -X POST "$BASE_URL/api/post" \
  -H "Content-Type: application/json" \
  -d '{"user":"Alice Johnson","role":"Nurse","date":"2025-10-15","shift":"09:00-17:00","notes":"Preferably swap with another RN"}' \
  | jq -r '.id')
echo "Posted shift 1: $SHIFT1"

# Post shift 2
SHIFT2=$(curl -s -X POST "$BASE_URL/api/post" \
  -H "Content-Type: application/json" \
  -d '{"user":"Bob Smith","role":"Nurse","date":"2025-10-16","shift":"09:00-17:00","notes":"Flexible with dates"}' \
  | jq -r '.id')
echo "Posted shift 2: $SHIFT2"

# Post shift 3
SHIFT3=$(curl -s -X POST "$BASE_URL/api/post" \
  -H "Content-Type: application/json" \
  -d '{"user":"Dr. Charlie Brown","role":"Doctor","date":"2025-10-15","shift":"14:00-22:00","notes":"Evening shift preferred"}' \
  | jq -r '.id')
echo "Posted shift 3: $SHIFT3"

echo ""
echo "=== Listing All Shifts ==="
curl -s "$BASE_URL/api/list" | jq

echo ""
echo "=== Requesting AI Match for Shift 1 ==="
curl -s -X POST "$BASE_URL/api/match" \
  -H "Content-Type: application/json" \
  -d "{\"requestId\":\"$SHIFT1\"}" \
  | jq

echo ""
echo "=== Test Complete ==="
```

Make it executable and run:
```bash
chmod +x test.sh
./test.sh http://localhost:8787
# or for production:
./test.sh https://cf-ai-shift-swap-ai.<your-subdomain>.workers.dev
```

**Note:** Requires `jq` for JSON parsing. Install with:
- macOS: `brew install jq`
- Ubuntu: `sudo apt-get install jq`

---

## Maintenance Commands

### View Current Deployments
```bash
npx wrangler deployments list
```

### Rollback to Previous Version
```bash
npx wrangler rollback
```

### Delete Deployment
```bash
npx wrangler delete
```

### View Worker Status
```bash
npx wrangler whoami
```

---

## Development Workflow

**Typical development cycle:**

```bash
# 1. Make changes to src/index.ts or public/index.html
# 2. Test locally
npm run dev
# 3. Test in browser and with curl
# 4. Deploy when ready
npm run deploy
# 5. Verify production
curl https://cf-ai-shift-swap-ai.<your-subdomain>.workers.dev/api/list
```

---

## Troubleshooting Commands

### Clear Local Wrangler Cache
```bash
rm -rf .wrangler/
npm run dev
```

### View Detailed Logs
```bash
npx wrangler tail --format pretty
```

### Test Durable Object Directly
```bash
# This is advanced - normally not needed
npx wrangler dev --local --persist
```

---

## Environment Variables (Advanced)

If you want to use external LLM providers:

### Set a Secret
```bash
npx wrangler secret put OPENAI_API_KEY
# Enter your API key when prompted
```

### List Secrets
```bash
npx wrangler secret list
```

### Delete a Secret
```bash
npx wrangler secret delete OPENAI_API_KEY
```

---

## Summary of All Commands in Order

```bash
# Setup
cd cf_ai_shift_swap_ai
npm install
npx wrangler login
# (Update wrangler.toml with account ID)

# Development
npm run dev
# Test in browser: http://localhost:8787

# Testing with curl
curl -X POST http://localhost:8787/api/post -H "Content-Type: application/json" -d '{"user":"Alice","role":"Nurse","date":"2025-10-15","shift":"09:00-17:00","notes":"Test"}'
curl http://localhost:8787/api/list

# Deployment
npm run deploy

# Production test
curl https://cf-ai-shift-swap-ai.<your-subdomain>.workers.dev/api/list

# Done!
```

---

**For more details, see [README.md](./README.md)**

---

**© 2025 Haashim Malik** | Cloudflare Internship Assignment  
This command reference is part of original work created for the Cloudflare 2025 Internship Application.  
**Author:** Haashim Malik  
**Project:** Shift Swap AI

