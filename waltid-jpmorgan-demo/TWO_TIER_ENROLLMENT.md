# Two-Tier Enrollment System

## Quick Overview

Users can now choose their enrollment level during identity verification:

### Tier 1: Full Verification ✅
- Provide government ID
- `idvComplete: true`
- Full dashboard access
- Green status indicator

### Tier 2: Limited Enrollment ⏳  
- Skip government ID
- `idvComplete: false`
- Limited dashboard access
- Amber status indicator
- Can upgrade anytime

## Visual Flow

```
/idv (Identity Verification Form)
  ↓
Choose enrollment path:
  ├─ [Verify with Government ID] → Full (idvComplete: true)
  └─ [Continue Without ID] → Limited (idvComplete: false)
  ↓
Biometric Animation (2 seconds)
  ↓
Success Page (different message per tier)
  ├─ Full: Green banner, full access info
  └─ Limited: Amber banner, pending info
  ↓
Scan QR → Wallet stores credential
  ↓
/login → /mfa → /authenticate
  ↓
Verify credential with wallet
  ↓
/dashboard
  ├─ Full: ✅ Green, "Verification Complete"
  └─ Limited: ⏳ Amber, "Verification Pending"
```

## IDV Page Changes

### Two Buttons at Bottom

```
Primary Button (Full Verification):
┌─────────────────────────────────────┐
│ Verify with Government ID           │
│ (Recommended)                       │
└─────────────────────────────────────┘
         ↓
    idvComplete: true

        OR

Secondary Button (Limited Enrollment):
┌─────────────────────────────────────┐
│ Continue Without ID (Limited Access)│
└─────────────────────────────────────┘
         ↓
    idvComplete: false
```

## Success Pages

### Full Verification (Green)
```
✓ Identity Verified
Full verification with government ID

GREEN BANNER:
✓ Full Identity Verification
Your government ID has been verified. 
You now have full access to JPMorgan services.

[Proceed to Login]
```

### Limited Enrollment (Amber)
```
✓ Credential Created
Limited access - government ID verification pending

AMBER BANNER:
⏳ Limited Enrollment
Your credential has been created but 
government ID verification is pending.
Will have limited access until completion.

[Proceed to Login (Limited Access)]
[Start Over with Government ID]
```

## Dashboard Status Display

### For Full Verification Users

```
✅ Verification Complete (GREEN)

Your identity has been successfully 
verified through wallet verification.

Verified via: Wallet Credential
```

### For Limited Enrollment Users

```
⏳ Verification Pending (AMBER)

Your identity verification is pending.
Complete the verification process to 
unlock all features.

[Complete Verification] button
  ↓ Returns to /mfa for re-verification
```

## Code Changes

### 1. IDV Page (`/idv`)
- Added second button for limited enrollment
- Tracks `isFullVerification` state
- Different success messages per tier

### 2. IDV API (`/api/idv`)
- Now accepts `idvComplete` parameter
- Can issue credential at either tier
- Returns appropriate message

### 3. Status Endpoint (`/api/authenticate/status`)
- Extracts `idvComplete` claim value
- Returns true or false

### 4. Authenticate Page (`/authenticate`)
- Only allows access if `idvComplete === true`
- Rejects limited enrollment credentials
- Shows error message

### 5. Dashboard (`/dashboard`)
- Checks `idvComplete` sessionStorage value
- Shows green status if true
- Shows amber status if false
- Provides CTA to upgrade

## Testing Scenarios

### Scenario 1: Full Verification User

```
1. /idv → Fill form
2. Click "Verify with Government ID"
3. See green success page
4. Login and authenticate
5. Dashboard: ✅ Green, full access
```

Result: ✅ Fully verified, full dashboard access

### Scenario 2: Limited Enrollment User

```
1. /idv → Fill form
2. Click "Continue Without ID"
3. See amber success page
4. Login and attempt to authenticate
5. Error: idvComplete is not true
6. Cannot access dashboard
```

Result: ⏳ Limited, cannot access dashboard yet

### Scenario 3: Upgrade from Limited to Full

```
1. User with limited credential attempts login
2. Sees error in verification
3. Goes back to /idv
4. This time provides all info
5. Clicks "Verify with Government ID"
6. Gets new credential with idvComplete: true
7. Logs in successfully
8. Dashboard: ✅ Green, full access
```

Result: ✅ Successfully upgraded to full access

## Key Differences Per Tier

| Feature | Full | Limited |
|---------|------|---------|
| idvComplete | true | false |
| Can access dashboard | ✅ Yes | ❌ No |
| Dashboard status | ✅ Complete | ⏳ Pending |
| Status color | Green | Amber |
| Message | "Verified" | "Pending" |
| Can upgrade | - | ✅ Yes |
| Button on IDV | "Proceed to Login" | "Proceed to Login (Limited)" |

## Error Messages

### Limited User Tries to Access Dashboard

```
Error: "Credential does not contain 
completed identity verification. 
Please ensure your credential has 
the idvComplete claim set to true."
```

### Suggested Actions
- Go back to /idv
- Get new credential with Gov ID
- Try login again

## Console Logging

### Full Verification
```
[API] Issuing credential with idvComplete: true
[Log] Credential issued with full identity verification
```

### Limited Enrollment
```
[API] Issuing credential with idvComplete: false
[API] User will have limited access - needs to provide government ID later
[Log] Credential issued with limited access - government ID verification pending
```

### Verification Success
```
✓ Verification complete
✓ IDV Complete claim value: true
✓ idvComplete is TRUE - Granting access
```

### Verification Failure
```
✓ Verification complete
✓ IDV Complete claim value: false
✗ idvComplete is NOT TRUE - Access denied
```

## Files Modified

```
app/(jpmorgan)/
├── idv/page.tsx                 ✏️ Two button options
├── dashboard/page.tsx           ✏️ Shows tier-based status
└── authenticate/page.tsx        ✏️ Only allows full tier

app/api/
├── idv/route.ts                 ✏️ Accept idvComplete parameter
└── authenticate/status/route.ts ✏️ Extract claim
```

## Documentation Added

- `LIMITED_ACCESS_FLOW.md` - Detailed flow documentation
- `TWO_TIER_ENROLLMENT.md` - This file

## Summary

✅ **Users can now choose enrollment level**
- Quick enrollment without gov ID
- Full verification with gov ID
- Clear visual indicators per tier
- Can upgrade from limited to full
- Professional error handling
- Complete documentation

**Status: ✅ READY TO DEMO**
