# MFA Authentication - Quick Start Guide

## 🚀 In 5 Minutes

### Step 1: Start the Application
```bash
npm run dev
# Open http://localhost:3000
```

### Step 2: Get a Credential (One-time setup)
1. Click **"Complete Identity Verification"**
2. Fill in any name and date: 
   - First Name: `John`
   - Last Name: `Doe`
   - DOB: `1990-01-01`
3. Watch the **2-second biometric animation**
4. **Scan QR code** with your wallet (same machine or another device)
5. Credential issued with `idvComplete: true` ✓

### Step 3: Login with MFA
1. Click **"Secure Login"**
2. Enter any email and password:
   - Email: `test@example.com`
   - Password: `anything`
3. Click **"Sign In"**
4. See **MFA Selection** with two options
5. Choose **"Verify with Wallet"** (recommended)
6. **Scan QR code** with your wallet
7. **Dashboard appears** showing:
   - ✅ "Verification Complete"
   - Employee information
   - Security status

## 🔐 Authentication Flow (Visual)

```
┌─────────────────────────────────────────────────┐
│ Home: Choose Your Path                          │
├─────────────────────────────────────────────────┤
│ • Get Credential                │ • Login       │
│   (1-time setup)                │   (every time)│
└─────────┬───────────────────────┬───────────────┘
          │                       │
    [Complete IDV]          [Sign In]
          │                       │
    [Biometric]             [MFA Select]
    Animation               (Wallet/SMS)
    (2 sec)                     │
          │              [Wallet QR Code]
    [Wallet QR]                 │
          │                     │
          └─────────┬───────────┘
                    │
           [Dashboard]
           ✓ IDV Status
           ✓ Employee Info
           ✓ Security Tools
```

## 🎮 Three Demo Scenarios

### Scenario 1: First-Time User (Gets Credential)
```
Home
  ↓
Complete Identity Verification (/idv)
  • Fill form
  • Biometric animation (2 sec)
  • Scan QR
  ↓
Credential issued with idvComplete: true
  ↓
Ready to login
```

### Scenario 2: User with Credential (Wallet MFA)
```
Home
  ↓
Secure Login (/login)
  • Email: test@example.com
  • Password: anything
  ↓
MFA Selection (/mfa)
  • Choose "Verify with Wallet"
  ↓
Verify (/authenticate)
  • Scan QR with wallet
  • Present credential
  ↓
Dashboard (/dashboard)
  • Status: ✓ Verification Complete
```

### Scenario 3: SMS Demo Path
```
Home
  ↓
Secure Login (/login)
  ↓
MFA Selection (/mfa)
  • Choose "Verify with SMS"
  ↓
Dashboard (/dashboard)
  • Direct access (SMS is placeholder)
```

## 📄 Pages Explained

| Page | URL | Purpose | Next |
|------|-----|---------|------|
| **Home** | `/` | Entry point, choose your path | → IDV or Login |
| **Login** | `/login` | Email/password authentication | → MFA Selection |
| **MFA** | `/mfa` | Choose verification method | → Authenticate or Dashboard |
| **IDV** | `/idv` | Get credential with IDV | → Can login after this |
| **Auth** | `/authenticate` | Verify credential for MFA | → Dashboard |
| **Dashboard** | `/dashboard` | Employee portal, see IDV status | → Logout |

## 🏷️ IDV Status on Dashboard

### ✅ Status: COMPLETED
Shows when credential has `idvComplete: true`
- Green success banner
- "Verification Complete" heading
- "Verified via: Wallet Credential"

### ⏳ Status: PENDING
Shows when credential missing or `idvComplete: false`
- Amber warning banner
- "Verification Pending" heading
- "Complete Verification" button to restart MFA

## 🔑 Demo Credentials

Any email/password combination works:
```
Email:    test@example.com  (or any email)
Password: anything          (or any password)
```

The demo doesn't validate against a real auth system.

## 🧪 Testing Checklist

Quick verification that everything works:

- [ ] Home page loads with two options
- [ ] IDV path shows form → animation → QR
- [ ] Login shows email/password fields
- [ ] MFA shows Wallet (recommended) and SMS options
- [ ] Wallet path shows QR code
- [ ] Dashboard shows welcome message
- [ ] Dashboard shows IDV status (completed or pending)
- [ ] Logout button works
- [ ] Logout clears session and returns to login
- [ ] Can re-login after logout

## ⚙️ Session Storage (Developer)

Open browser DevTools → Application → Session Storage:

**After Login:**
```
loginEmail: "test@example.com"
mfaMethod: "wallet"
```

**After Verification:**
```
loginEmail: "test@example.com"
mfaMethod: "wallet"
mfaVerified: "true"
idvComplete: "true"
```

**After Logout:**
```
[All cleared]
```

## 🎨 Colors Used

| Use | Color | Hex |
|-----|-------|-----|
| Primary Button | Brown | `#8f5a39` |
| Accent Button | Tan | `#b8936a` |
| Success | Green | `#16a34a` |
| Warning | Amber | `#d97706` |
| Error | Red | `#dc2626` |
| Background | Cream | `#f4efe7` |

## 🚨 Troubleshooting

### "Redirect to login" after clicking button
- **Cause:** sessionStorage was cleared
- **Fix:** Refresh page and start from home

### QR code not showing
- **Cause:** Verification session failed
- **Fix:** Check console for errors, try again

### Dashboard shows "Pending"
- **Cause:** idvComplete claim is false
- **Fix:** Complete IDV flow first to get credential with claim set to true

### Logout not working
- **Cause:** Session data still exists
- **Fix:** Check browser session storage is being cleared

## 📱 Using with a Wallet

To actually scan QR codes and present credentials:

1. **Get Wallet App**
   - Download any OpenID4VC compatible wallet
   - Examples: Lissi, esatus, identity.com

2. **Scan Credential QR** (at `/idv`)
   - Wallet prompts to accept credential
   - Stores credential with `idvComplete: true` claim

3. **Scan Verification QR** (at `/authenticate`)
   - Wallet shows credential (with IDV claim)
   - You select which credential to present
   - Wallet sends credential back
   - Dashboard shows verification complete ✓

## 🔗 Related Documentation

- **MFA_FLOW.md** - Detailed flow description
- **AUTHENTICATION_GUIDE.md** - Visual diagrams and full guide
- **NEW_FEATURES.md** - Complete feature documentation
- **TROUBLESHOOTING.md** - Common issues and solutions

## 📞 Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Check for type errors
npm run type-check

# Run linter
npm run lint
```

---

**Ready to demo? 🎉**
1. `npm run dev`
2. Open http://localhost:3000
3. Choose your scenario above
4. Enjoy!
