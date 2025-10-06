# 🔐 Security & Configuration

## Public Repository Notice

This is a **public GitHub repository** created for the Cloudflare 2025 Internship Application. It contains:

✅ **Safe to share publicly:**
- Source code (`src/index.ts`, `public/index.html`)
- Documentation (all `.md` files)
- Configuration templates with placeholders (`wrangler.toml`)
- Demo scripts (`demo-setup.sh`)
- Sample data (`sample-data.json`)

❌ **NOT included (protected):**
- Real Cloudflare Account IDs
- API tokens or secrets
- Private environment variables
- Personal credentials

---

## Configuration Before Running

Before you can run this application locally or deploy it, you **must** configure:

### 1. Cloudflare Account ID

**Location:** `wrangler.toml` (line 12)

**Current value:**
```toml
account_id = "YOUR_ACCOUNT_ID_HERE"
```

**How to find your Account ID:**
1. Visit [dash.cloudflare.com](https://dash.cloudflare.com/)
2. Click "Workers & Pages" in the left sidebar
3. Find "Account ID" in the right sidebar
4. Click the copy icon

**Replace the placeholder:**
```toml
account_id = "abc123def456789012345678901234567"  # Your actual 32-character ID
```

> **Note:** Your Account ID is **safe to use publicly**. It's not a secret token and cannot be used to access your account without authentication.

---

## What's Protected by .gitignore

The following files are automatically excluded from version control:

```
.env                 # Environment variables (if you create one)
.dev.vars            # Wrangler secrets (if you create one)
.wrangler/           # Wrangler cache and build outputs
node_modules/        # Dependencies
dist/                # Build artifacts
*.log                # Log files
.DS_Store            # macOS system files
```

**Never commit:**
- API keys or tokens
- Private credentials
- `.env` or `.dev.vars` files with secrets
- Wrangler authentication tokens

---

## Cloudflare Workers AI Security

### Authentication

This application uses **Cloudflare Workers AI**, which is authenticated via:
- Your Cloudflare account (during `wrangler login`)
- Account ID in `wrangler.toml`
- No API keys required for Workers AI

### Bindings

The app uses these Cloudflare bindings (configured in `wrangler.toml`):

```toml
[ai]
binding = "AI"  # Workers AI access
```

```toml
[[durable_objects.bindings]]
name = "SHIFT_ROOM"
class_name = "ShiftRoom"  # Persistent state storage
```

These bindings are **automatically authenticated** when deployed to Cloudflare Workers. No additional secrets needed!

---

## Deployment Security

### Local Development (`npm run dev`)
- Runs on `http://localhost:8787`
- Uses your Wrangler authentication
- Data stored in local Durable Object instance
- CORS set to `*` for development (see `wrangler.toml`)

### Production Deployment (`npm run deploy`)
- Deployed to Cloudflare's global edge network
- Uses your authenticated Wrangler CLI
- Durable Object persists data in production
- **Recommendation:** Restrict CORS in production:
  ```toml
  [vars]
  CORS_ALLOW_ORIGIN = "https://yourdomain.com"
  ```

---

## Security Best Practices

### ✅ DO:
- Keep your Cloudflare account secured with 2FA
- Use `wrangler login` (browser-based auth) instead of API tokens
- Review `.gitignore` before committing
- Replace placeholders with real values locally only
- Use environment variables for any secrets you add

### ❌ DON'T:
- Commit `.env` or `.dev.vars` files
- Share your Wrangler authentication token
- Expose API keys in source code
- Push real Account IDs to public repos (use placeholders)
- Disable `.gitignore` protections

---

## What This Project Does NOT Collect

This is a **demo application** with:
- ✅ No real user authentication (profile selector for demo purposes)
- ✅ No password storage
- ✅ No personal data collection
- ✅ No external API calls (except Cloudflare Workers AI)
- ✅ No analytics or tracking
- ✅ No payment processing

**All data is stored in Cloudflare Durable Objects**, which:
- Persist only shift information (user name, role, date, time, notes)
- Are scoped to your Cloudflare account
- Are automatically deleted when you delete your Worker

---

## Reporting Security Issues

If you discover a security vulnerability in this codebase:

1. **Do NOT open a public GitHub issue**
2. Email the repository owner (see `LICENSE` file for contact info)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if applicable)

---

## License & Attribution

**MIT License**  
**Copyright © 2025 Haashim Malik**

See [LICENSE](./LICENSE) for full terms.

---

## Verification Checklist

Before pushing to GitHub, verify:

- [ ] `wrangler.toml` contains placeholder `"YOUR_ACCOUNT_ID_HERE"`
- [ ] No `.env` or `.dev.vars` files in repository
- [ ] `.gitignore` includes sensitive files
- [ ] No personal file paths (e.g., `/Users/yourname/...`)
- [ ] No API keys or tokens in source code
- [ ] Documentation references placeholders, not real IDs
- [ ] Attribution (Haashim Malik) remains in LICENSE and code headers

---

**Last Updated:** October 6, 2025  
**Author:** Haashim Malik  
**Project:** Shift Swap AI — Cloudflare 2025 Internship Submission

