# Authentication & MFA Guide

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOME PAGE (/)                             │
│  Two main paths:                                                 │
│  • Complete Identity Verification → /idv                         │
│  • Secure Login → /login                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                ┌─────────────────────────┐
                │   CHOOSE YOUR PATH      │
                └─────────────────────────┘
                    ↙                 ↘
          ┌─────────────────┐   ┌──────────────────┐
          │   GET CREDENTIAL │   │   LOGIN & MFA    │
          │   (/idv)         │   │   (/login)       │
          └─────────────────┘   └──────────────────┘
                ↓                        ↓
        ┌──────────────┐         ┌─────────────────┐
        │ Identity Form│         │ Email & Password│
        └──────────────┘         └─────────────────┘
                ↓                        ↓
        ┌──────────────┐         ┌─────────────────┐
        │Biometric Scan│ (2s)    │ MFA Selection   │
        │Animation     │         │ (/mfa)          │
        └──────────────┘         └─────────────────┘
                ↓                    ↙          ↘
                │         ┌─────────────────┐  ┌──────────┐
                │         │ Wallet (Primary)│  │ SMS      │
                │         │ (/authenticate) │  │ (Demo)   │
                │         └─────────────────┘  └──────────┘
                │                ↓                  ↓
                │         ┌─────────────────┐  ┌──────────┐
                │         │ Show QR Code    │  │ Direct   │
                │         │ Scan & Verify   │  │ Access   │
                │         └─────────────────┘  └──────────┘
                │                ↓                  ↓
                └────────────────→┴────────────────┘
                                  ↓
                        ┌──────────────────┐
                        │ DASHBOARD        │
                        │ (/dashboard)     │
                        │                  │
                        │ ✓ IDV Status     │
                        │ ✓ Account Info   │
                        │ ✓ Security Tools │
                        └──────────────────┘
                                  ↓
                        ┌──────────────────┐
                        │ LOGOUT           │
                        │ Back to Login    │
                        └──────────────────┘
```

## IDV (Identity Verification) Flow

### Three Stages:
1. **Form Stage** - User enters identity information
2. **Biometric Stage** - 2-second animation showing passport & face scanning
3. **Credential Issued** - Shows QR code to add credential to wallet

### Flow Diagram:
```
┌──────────────────────┐
│   FORM STAGE         │
│                      │
│ First Name [ ]       │
│ Last Name  [ ]       │
│ DOB        [ ]       │
│                      │
│ [Complete Verifyn]   │
└──────────────────────┘
         ↓ (submit)
┌──────────────────────┐
│ BIOMETRIC STAGE      │
│                      │
│  ┌──────────────┐    │
│  │  Passport    │    │ ← Animated scanning line
│  │  Scanner     │    │
│  └──────────────┘    │
│                      │
│   ┌─────────────┐    │
│   │  Face Scan  │    │ ← Rotating arc
│   │   Circle    │    │
│   └─────────────┘    │
│                      │
│ Verifying... (2sec)  │
└──────────────────────┘
         ↓ (auto after 2s)
┌──────────────────────┐
│ ISSUED STAGE         │
│                      │
│ ✓ Identity Verified  │
│                      │
│  ┌──────────────┐    │
│  │   QR CODE    │    │ ← Scan with wallet
│  │   [ ][ ]     │    │
│  │   [ ][ ]     │    │
│  └──────────────┘    │
│                      │
│ [Continue to Auth]   │
└──────────────────────┘
```

## MFA (Multi-Factor Authentication) Flow

### Two Factor Methods:
1. **Wallet** (Recommended)
   - Uses credential with IDV claim
   - User scans QR code
   - Backend verifies credential
   
2. **SMS** (Placeholder)
   - Future implementation
   - Currently direct access for demo

### Flow Diagram:
```
┌──────────────────────┐
│   LOGIN PAGE         │
│                      │
│ Email    [ ]         │
│ Password [ ]         │
│                      │
│ [Sign In]            │
└──────────────────────┘
         ↓ (auth success)
┌──────────────────────┐
│ MFA SELECTION        │
│                      │
│ ┌────────────────┐   │
│ │ 📱 Wallet      │   │ ← Selected by default
│ │ Recommended    │   │
│ └────────────────┘   │
│                      │
│ ┌────────────────┐   │
│ │ 💬 SMS         │   │
│ │ One-time code  │   │
│ └────────────────┘   │
└──────────────────────┘
         ↙          ↘
    [Wallet]      [SMS]
         ↓          ↓
    QR Code      Direct
         ↓        Access
         └──────→ DASHBOARD
```

## Dashboard - Identity Verification Status

### Status: COMPLETED ✓
```
┌─────────────────────────────────────┐
│ 🛡️ Identity Verification            │
│                                      │
│ ✅ Verification Complete             │
│                                      │
│ Your identity has been successfully │
│ verified through wallet verification│
│                                      │
│ Verified via: Wallet Credential     │
└─────────────────────────────────────┘
```

### Status: PENDING ⏳
```
┌─────────────────────────────────────┐
│ 🛡️ Identity Verification            │
│                                      │
│ ⏳ Verification Pending               │
│                                      │
│ Your identity verification is       │
│ pending. Complete the verification  │
│ process to unlock all features.     │
│                                      │
│ [Complete Verification]             │
└─────────────────────────────────────┘
```

## Session Management

### Session Storage (Browser SessionStorage)

```javascript
// After successful login
sessionStorage.setItem('loginEmail', 'john@company.com');

// After selecting MFA method
sessionStorage.setItem('mfaMethod', 'wallet');

// After successful verification
sessionStorage.setItem('mfaVerified', 'true');
sessionStorage.setItem('idvComplete', 'true');

// On logout
sessionStorage.clear();
```

### Page Protection Logic

```
Page            Requires              Redirects To
─────────────────────────────────────────────────
/login          -                     (public)
/mfa            loginEmail            /login
/authenticate   loginEmail            /login
/dashboard      loginEmail            /login
                + mfaVerified

/idv            -                     (public)
/                -                     (public)
```

## Key State Indicators

### In Transit to Dashboard
- Shows loading spinner
- Text: "Redirecting to your dashboard..."
- Waits 1.5 seconds before redirect

### Failed Verification
- Shows red error banner
- Error message displayed
- "Try Again" button to retry
- "Return to Login" button to abort

### Session Expired
- User redirected to `/login`
- SessionStorage cleared
- Must re-authenticate

## Color Scheme (JPMorgan Branding)

```
Primary Color:    #8f5a39 (Brown)
Accent Color:     #b8936a (Tan)
Background:       #f4efe7 (Light Cream)
Success:          #16a34a (Green)
Warning:          #d97706 (Amber)
Error:            #dc2626 (Red)
```

## Demo Testing Steps

### Test 1: Get Credential
```
1. Go to http://localhost:3000/
2. Click "Complete Identity Verification"
3. Fill form: John Doe, DOB 1990-01-01
4. Wait for biometric animation (2 seconds)
5. Scan QR code with wallet
6. Credential issued with idvComplete: true
```

### Test 2: Login with Credential
```
1. Go to http://localhost:3000/
2. Click "Secure Login"
3. Enter email: test@example.com
4. Enter password: anything
5. Click "Sign In"
6. See MFA selection with Wallet highlighted
7. Click "Verify with Wallet"
8. Scan QR code
9. Dashboard shows "Verification Complete" ✓
```

### Test 3: SMS Path (Demo)
```
1. Go to http://localhost:3000/
2. Click "Secure Login"
3. Enter credentials
4. Click "Sign In"
5. Click "Verify with SMS"
6. Immediately shows dashboard
```

### Test 4: Logout
```
1. From dashboard, click "Logout" button
2. Returns to /login
3. SessionStorage cleared
4. Can re-login
```
