# idvComplete Claim Validation

## Overview

The JPMorgan MFA system validates the `idvComplete` claim from presented credentials to determine if a user's identity has been properly verified. This claim is the key authorization mechanism for granting access to the protected dashboard.

## Claim Lifecycle

### 1. Issuance (IDV Flow)

When a user completes identity verification (`/idv`):

```typescript
// app/api/idv/route.ts
const credentialData = {
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1990-01-01',
  idvComplete: true,  // ← Set to true during issuance
};

const result = await issueCredential(
  'jpmorgan_identity_credential',
  credentialData,
  'pre-auth-code'
);
```

**Result:** Credential issued with `idvComplete: true` in the `credentialSubject`

### 2. Credential Structure

The issued credential contains:

```json
{
  "credentialSubject": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "idvComplete": true
  },
  "type": ["VerifiableCredential", "JPMorganIdentityCredential"],
  "issuer": "...",
  "issuanceDate": "2026-08-12T...",
  "expirationDate": "2027-08-12T..."
}
```

### 3. Storage

User stores the credential in their wallet with the `idvComplete: true` claim.

### 4. Presentation (MFA Verification)

When user logs in and uses wallet for MFA (`/authenticate`):

1. **Verification session created** with DCQL query requesting JPMorganIdentityCredential
2. **User scans QR code** with wallet
3. **Wallet presents credential** including all claims
4. **Walt.id verifies** the credential signature and policies
5. **Backend extracts** the `idvComplete` claim value

### 5. Validation (Status Check)

In `app/api/authenticate/status/route.ts`:

```typescript
// Extract idvComplete from presented credentials
if (result.session?.presented_credentials) {
  const presentedCreds = result.session.presented_credentials;
  const jpmorganCreds = presentedCreds['jpmorgan_identity_credential'][0];
  
  if (jpmorganCreds?.credentialData?.credentialSubject) {
    const subject = jpmorganCreds.credentialData.credentialSubject;
    
    // Check the idvComplete claim
    if ('idvComplete' in subject) {
      idvComplete = subject.idvComplete === true;
    }
  }
}
```

### 6. Authorization Decision

```typescript
if (idvComplete === true) {
  // ✓ Access granted
  setStatus('success');
  sessionStorage.setItem('mfaVerified', 'true');
  sessionStorage.setItem('idvComplete', 'true');
  router.push('/dashboard');
} else {
  // ✗ Access denied
  setStatus('failed');
  setError('Credential does not contain completed identity verification.');
}
```

## Validation Points

### Backend Validation (API)

**File:** `app/api/authenticate/status/route.ts`

**Validation Logic:**
1. Check session status is 'SUCCESSFUL'
2. Check credential was presented
3. Extract `idvComplete` from `credentialData.credentialSubject`
4. Verify value is strictly `true` (not string or other truthy value)
5. Return validation result

**Response:**
```json
{
  "status": "done",
  "idvComplete": true,  // ← Key validation result
  "session": { ... }
}
```

### Frontend Validation (Client)

**File:** `app/(jpmorgan)/authenticate/page.tsx`

**Validation Logic:**
1. Poll `/api/authenticate/status?sessionId=...`
2. Check response status is 'done'
3. Check `idvComplete === true` (strict equality)
4. If true: Grant access
5. If false: Deny access with error message

**Console Logging:**
```
✓ Verification complete
✓ IDV Complete claim value: true (type: boolean)
✓ idvComplete is TRUE - Granting access
```

or

```
✗ Verification complete
✗ IDV Complete claim value: false (type: boolean)
✗ idvComplete is NOT TRUE - Access denied
  Expected: true, Got: false
```

## Dashboard Status Display

After successful authentication, the dashboard shows IDV status:

### File: `app/(jpmorgan)/dashboard/page.tsx`

```typescript
useEffect(() => {
  const idvComplete = sessionStorage.getItem('idvComplete');
  setIdvStatus(idvComplete === 'true' ? 'completed' : 'pending');
}, []);
```

**If `idvComplete === 'true'`:**
```
✅ Verification Complete
Your identity has been successfully verified through wallet verification.
Verified via: Wallet Credential
```

**If `idvComplete !== 'true'`:**
```
⏳ Verification Pending
Your identity verification is pending. Complete the verification process 
to unlock all features.
[Complete Verification Button]
```

## Security Considerations

### ✅ What's Verified

1. **Credential Signature** - Walt.id verifies the credential is cryptographically signed
2. **Issuer Trust** - Credential issued by trusted issuer
3. **Claim Value** - `idvComplete` claim is extracted and checked
4. **Session Integrity** - Verification session matches presented credential

### ✅ Authorization Level

- **Without `idvComplete: true`** - No dashboard access
- **With `idvComplete: true`** - Full dashboard access

### ⚠️ Limitations

- No revocation checking (credential could expire)
- No issued-at time validation (clock skew possible)
- No issuer DID validation in demo
- No credential holder binding validation beyond signature

### 🔒 Best Practices

1. **Always check both:**
   - Session status is SUCCESSFUL
   - `idvComplete === true`

2. **Never trust:**
   - Only the session status without claim
   - Client-side claim value without backend verification
   - Expired credentials

3. **Log all validation:**
   - Successful verification
   - Denied verification
   - Claim mismatches

## Testing idvComplete Validation

### Test Scenario 1: Valid Credential

```
1. Complete IDV flow (/idv)
   → Credential issued with idvComplete: true
   
2. Login and select wallet MFA
   → Credential presented
   
3. Backend validates
   → Finds idvComplete: true
   
4. Frontend checks
   → idvComplete === true
   
5. Result
   ✅ Dashboard access granted
   ✅ Status shows "Verification Complete"
```

**Expected Console Output:**
```
✓ IDV Complete claim value: true (type: boolean)
✓ idvComplete is TRUE - Granting access
```

### Test Scenario 2: Invalid Credential (Missing Claim)

```
1. Use credential without idvComplete claim
   
2. Backend validates
   → idvComplete is undefined
   
3. Frontend checks
   → idvComplete !== true
   
4. Result
   ✗ Dashboard access denied
   ✗ Error: "Credential does not contain completed identity verification"
```

**Expected Console Output:**
```
✗ IDV Complete claim value: undefined (type: undefined)
✗ idvComplete is NOT TRUE - Access denied
  Expected: true, Got: undefined
```

### Test Scenario 3: Invalid Credential (False Value)

```
1. Use credential with idvComplete: false
   
2. Backend validates
   → idvComplete is false
   
3. Frontend checks
   → idvComplete !== true
   
4. Result
   ✗ Dashboard access denied
```

**Expected Console Output:**
```
✗ IDV Complete claim value: false (type: boolean)
✗ idvComplete is NOT TRUE - Access denied
  Expected: true, Got: false
```

## Debugging

### Check Backend Response

1. Open browser DevTools → Network
2. Trigger verification
3. Watch requests to `/api/authenticate/status?sessionId=...`
4. Check response JSON for `idvComplete` field

**Example Response:**
```json
{
  "status": "done",
  "idvComplete": true,
  "session": { ... }
}
```

### Check Frontend Console

1. Open browser DevTools → Console
2. Complete verification flow
3. Look for log messages:
   - `[Poll attempt X] Status: ..., IDV Complete: ...`
   - `✓ Verification complete`
   - `✓ IDV Complete claim value: true`

### Check SessionStorage

1. Open DevTools → Application → Session Storage
2. After successful verification:
   - `idvComplete: "true"` (string value)

## Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│ Identity Verification (/idv)                    │
│ User fills form → Get Credential                │
│ credentialSubject.idvComplete = true            │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────┐
        │ Wallet Storage         │
        │ (User's device)        │
        │ Stores credential with │
        │ idvComplete: true      │
        └────────────┬───────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│ Login & MFA (/mfa → /authenticate)              │
│ User selects wallet verification                │
│ Scans QR code with wallet                       │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │ Walt.id Verifier           │
        │ Receives credential        │
        │ Verifies signature         │
        │ Validates claim policies   │
        └────────────┬───────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────┐
│ Status Check (/api/authenticate/status)         │
│ Backend extracts:                                │
│ result.session.presented_credentials             │
│   .jpmorgan_identity_credential[0]               │
│   .credentialData.credentialSubject              │
│   .idvComplete = true                            │
└──────────────────┬───────────────────────────────┘
                   │
                   ↓
      ┌────────────────────────┐
      │ Authorization Decision │
      │                        │
      │ if (idvComplete ===    │
      │     true)             │
      │   Access Granted ✓    │
      │ else                  │
      │   Access Denied ✗     │
      └────────────┬──────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │ Dashboard (/dashboard)
        │                      │
        │ IF idvComplete:      │
        │   Status: Completed  │
        │   Green banner ✅    │
        │ ELSE:                │
        │   Status: Pending    │
        │   Amber banner ⏳    │
        └──────────────────────┘
```

## Summary

The `idvComplete` claim is a **key security mechanism** that:

1. **Marks credentials** as having completed identity verification
2. **Validates authenticity** during wallet verification flow
3. **Authorizes access** to the protected dashboard
4. **Shows status** on the employee portal

**The claim must be:**
- ✅ Set to `true` during credential issuance
- ✅ Extracted during verification status check
- ✅ Validated strictly (`=== true`, not truthy)
- ✅ Used for authorization decisions
- ✅ Displayed to users for transparency

Without `idvComplete: true`, users cannot access the dashboard.
