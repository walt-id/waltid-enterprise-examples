# Limited Access Flow - Partial Identity Verification

## Overview

Users can now enroll in two ways:

1. **Full Verification** - With government ID → `idvComplete: true` → Full dashboard access
2. **Limited Enrollment** - Without government ID → `idvComplete: false` → Limited dashboard access

## User Scenarios

### Scenario 1: User Wants Full Verification (Gov ID)

```
1. Go to /idv
2. Fill identity form
3. Click "Verify with Government ID"
   ↓ (2-second biometric animation)
4. Credential issued with idvComplete: true
5. Green banner: "Full Identity Verification"
6. Scans QR → Wallet stores credential
7. Logs in with MFA
8. Dashboard shows: ✅ "Verification Complete" (GREEN)
9. Full access to all features
```

### Scenario 2: User Wants Limited Access (No Gov ID)

```
1. Go to /idv
2. Fill identity form
3. Click "Continue Without ID (Limited Access)"
   ↓ (2-second biometric animation)
4. Credential issued with idvComplete: false
5. Amber banner: "Limited Enrollment"
6. Message: "Government ID verification pending"
7. Scans QR → Wallet stores credential
8. Logs in with MFA
9. Dashboard shows: ⏳ "Verification Pending" (AMBER)
10. Limited access with option to upgrade
11. Can re-verify with government ID later
```

### Scenario 3: User Upgrades from Limited to Full

```
1. User logged in with limited access
2. Sees: "Verification Pending" banner
3. Clicks "Complete Verification"
4. Redirects to /mfa → /authenticate
5. Shows error: "Credential does not have idvComplete: true"
6. Goes back to /idv
7. Enters info again
8. This time clicks "Verify with Government ID"
9. Gets new credential with idvComplete: true
10. Logs in again
11. Dashboard now shows: ✅ "Verification Complete" (GREEN)
```

## Implementation

### IDV Form Changes

**Two button options at bottom:**

```
┌──────────────────────────────────┐
│  [Verify with Government ID]     │ (Primary)
│  ─────────────────────────────────
│            Or
│  ─────────────────────────────────
│  [Continue Without ID]           │ (Secondary)
│  (Limited Access)
└──────────────────────────────────┘
```

- **Top button** → `handleSubmit(e, true)` → idvComplete: true
- **Bottom button** → `handleSubmit(e, false)` → idvComplete: false

### API Changes

**File:** `app/api/idv/route.ts`

Now accepts `idvComplete` parameter:
```typescript
const { firstName, lastName, dateOfBirth, idvComplete } = await request.json();

const credentialData = {
  firstName,
  lastName,
  dateOfBirth,
  idvComplete: idvComplete === true,  // Set based on user choice
};
```

### Issued Credential Success Messages

#### Full Verification (idvComplete: true)
```
✓ Identity Verified
Full verification with government ID

GREEN BANNER:
✓ Full Identity Verification
Your government ID has been verified. 
You now have full access to JPMorgan services.

Button: "Proceed to Login"
```

#### Limited Enrollment (idvComplete: false)
```
✓ Credential Created
Limited access - government ID verification pending

AMBER BANNER:
⏳ Limited Enrollment
Your credential has been created but 
government ID verification is pending.
You will have limited access until you 
complete full identity verification.

Buttons:
- "Proceed to Login (Limited Access)"
- "Start Over with Government ID"
```

### Dashboard Status Display

#### Full Access (idvComplete: true)
```
✅ Verification Complete (GREEN)
Your identity has been successfully verified 
through wallet verification.

Verified via: Wallet Credential
```

#### Limited Access (idvComplete: false)
```
⏳ Verification Pending (AMBER)
Your identity verification is pending. 
Complete the verification process to 
unlock all features.

[Complete Verification Button]
  ↓ Redirects to /mfa for re-verification
```

## User Experience Flow

### Full Access Path

```
IDV Form
  ↓
[Verify with Government ID]
  ↓
Biometric Animation
  ↓
Credential: idvComplete = true
  ↓
Green Success Page
  ↓
Wallet Scan
  ↓
Login with MFA
  ↓
Dashboard
  ├─ Status: ✅ Verification Complete (GREEN)
  ├─ Full access to all features
  └─ All employee info visible
```

### Limited Access Path

```
IDV Form
  ↓
[Continue Without ID (Limited Access)]
  ↓
Biometric Animation
  ↓
Credential: idvComplete = false
  ↓
Amber Success Page
  ├─ Message: Limited access pending
  └─ Option to start over with Gov ID
  ↓
Wallet Scan
  ↓
Login with MFA
  ↓
Dashboard
  ├─ Status: ⏳ Verification Pending (AMBER)
  ├─ Limited features available
  ├─ CTA: "Complete Verification"
  └─ Can upgrade later
```

## Testing the Flow

### Test 1: Full Verification Path

```bash
1. Open http://localhost:3000/idv
2. Fill form (any values)
3. Click "Verify with Government ID"
4. Wait for animation (2 seconds)
5. See green success banner
6. Scan QR with wallet
7. Login: /login → /mfa → /authenticate
8. Dashboard shows: ✅ "Verification Complete"
```

Expected: ✅ Green status, full access

### Test 2: Limited Enrollment Path

```bash
1. Open http://localhost:3000/idv
2. Fill form (any values)
3. Click "Continue Without ID (Limited Access)"
4. Wait for animation (2 seconds)
5. See amber success banner
6. See message about limited access
7. Scan QR with wallet
8. Login: /login → /mfa → /authenticate
9. Dashboard shows: ⏳ "Verification Pending"
```

Expected: ⏳ Amber status, limited access

### Test 3: Upgrade Path

```bash
1. User on dashboard with ⏳ "Verification Pending"
2. Click "Complete Verification" button
3. Redirected to /mfa → /authenticate
4. Attempt verification with current credential
5. Error: "idvComplete: false in credential"
6. Return to form
7. This time choose "Verify with Government ID"
8. New credential issued with idvComplete: true
9. Login again
10. Dashboard now shows: ✅ "Verification Complete"
```

Expected: Can upgrade from limited to full

## Data Structures

### Credential with Full Verification

```json
{
  "credentialSubject": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "idvComplete": true
  }
}
```

### Credential with Limited Enrollment

```json
{
  "credentialSubject": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "idvComplete": false
  }
}
```

## Console Logging

### Full Verification

```
[API] Issuing credential with idvComplete: true
[API] IDV Issuance result: { ... }
[API] Message: "Credential issued with full identity verification"
```

### Limited Enrollment

```
[API] Issuing credential with idvComplete: false
[API] User will have limited access - needs to provide government ID later
[API] IDV Issuance result: { ... }
[API] Message: "Credential issued with limited access - government ID verification pending"
```

### Verification Check

**Full Access (Success):**
```
✓ Verification complete
✓ IDV Complete claim value: true (type: boolean)
✓ idvComplete is TRUE - Granting access
```

**Limited Access (Denied):**
```
✓ Verification complete
✓ IDV Complete claim value: false (type: boolean)
✗ idvComplete is NOT TRUE - Access denied
  Expected: true, Got: false
```

## Security Model

### Authorization Levels

| Credential | idvComplete | Access | Can See |
|-----------|-------------|--------|---------|
| With Gov ID | true | Full | All dashboard features |
| Without Gov ID | false | Limited | Dashboard shows pending status |

### Claim-Based Gating

```
User Verification
  ↓
Check idvComplete claim
  ├─ true → Full Access ✅
  │         • All features enabled
  │         • Green status banner
  │         • Can manage credentials
  │
  └─ false → Limited Access ⏳
            • Dashboard accessible
            • Status shows pending
            • CTA to complete verification
            • Can upgrade anytime
```

## Business Logic

### When to Show What

| Component | idvComplete | Display |
|-----------|-------------|---------|
| IDV Success Page | true | Green banner, "Full Identity Verified" |
| IDV Success Page | false | Amber banner, "Limited Enrollment" |
| Dashboard Status | true | ✅ Green, "Verification Complete" |
| Dashboard Status | false | ⏳ Amber, "Verification Pending" |
| Verification Flow | true | Grant dashboard access |
| Verification Flow | false | Show "idvComplete not true" error |

## User Messaging

### Full Verification

**Success:**
```
✓ Full Identity Verification
Your government ID has been verified. 
You now have full access to JPMorgan services.
```

### Limited Enrollment

**Success:**
```
⏳ Limited Enrollment
Your credential has been created but 
government ID verification is pending.
You will have limited access until you 
complete full identity verification.

You can log in and use MFA, but will need 
to complete government ID verification to 
unlock all features.
```

**On Dashboard:**
```
Your identity verification is pending. 
Complete the verification process to 
unlock all features.

[Complete Verification] button available
```

## Future Features

- [ ] Show limited features indicator on dashboard
- [ ] Add countdown timer for verification deadline
- [ ] Send reminders to upgrade
- [ ] Track user journey (limited → full upgrade)
- [ ] Different features available at each tier
- [ ] Require full verification for sensitive operations
