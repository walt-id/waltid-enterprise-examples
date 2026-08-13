# idvComplete Claim Validation - Quick Reference

## What is idvComplete?

A **boolean claim** in the credential's `credentialSubject` that indicates whether a user's identity has been completed verified.

## Claim Flow

```
Issuance       Storage        Presentation      Validation      Authorization
─────────────────────────────────────────────────────────────────────────────

idvComplete    Wallet         User presents     Backend checks  If true:
set to true    stores with    credential with   extracts claim  ✅ Access
during         idvComplete:   idvComplete:      value            granted
credential     true           true              
creation
```

## Code References

### 1. Setting the Claim (Issuance)

**File:** `app/api/idv/route.ts`
```typescript
const credentialData = {
  firstName,
  lastName,
  dateOfBirth,
  idvComplete: true,  // ← Always set to true for IDV
};
```

### 2. Extracting the Claim (Verification)

**File:** `app/api/authenticate/status/route.ts`
```typescript
if (isSuccessful && result.session?.presented_credentials) {
  const jpmorganCreds = presented_credentials['jpmorgan_identity_credential'][0];
  const subject = jpmorganCreds.credentialData.credentialSubject;
  
  // Extract idvComplete claim
  if ('idvComplete' in subject) {
    idvComplete = subject.idvComplete === true;  // ← Strict boolean check
  }
}
```

### 3. Validating the Claim (Authorization)

**File:** `app/(jpmorgan)/authenticate/page.tsx`
```typescript
const response = await fetch(`/api/authenticate/status?sessionId=${id}`);
const data = await response.json();

if (data.idvComplete === true) {
  ✅ // Grant access
  router.push('/dashboard');
} else {
  ✗ // Deny access
  setError('Credential does not contain completed identity verification.');
}
```

### 4. Displaying Status (Dashboard)

**File:** `app/(jpmorgan)/dashboard/page.tsx`
```typescript
const idvComplete = sessionStorage.getItem('idvComplete') === 'true';

if (idvComplete) {
  // Show: ✅ Verification Complete (green)
} else {
  // Show: ⏳ Verification Pending (amber)
}
```

## Validation Logic

### Backend Validation (API)

```
1. Get verification session status
2. Check session.status === 'SUCCESSFUL'
3. Get presented_credentials['jpmorgan_identity_credential']
4. Extract credentialData.credentialSubject.idvComplete
5. Return { status: 'done', idvComplete: true/false }
```

### Frontend Validation (Client)

```
1. Fetch /api/authenticate/status?sessionId=...
2. Check response.status === 'done'
3. Check response.idvComplete === true (STRICT)
4. If true: Allow dashboard access
5. If false: Show error, don't allow access
```

## Important: Strict Equality Required

```typescript
// ❌ WRONG - This will fail for string "false"
if (data.idvComplete) { ... }

// ✅ CORRECT - Strict boolean check
if (data.idvComplete === true) { ... }
```

## Debug Logs

Enable browser console to see validation:

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

## Testing Scenarios

| Scenario | idvComplete | Result |
|----------|-------------|--------|
| Valid credential from IDV | `true` | ✅ Dashboard access |
| Missing claim | `undefined` | ✗ Access denied |
| False value | `false` | ✗ Access denied |
| String "true" | `"true"` | ✗ Access denied (not boolean) |

## Claim Location in Response

When verification completes, the claim is in:

```
response.session.presented_credentials
  ↓
['jpmorgan_identity_credential']
  ↓
[0] (first credential)
  ↓
.credentialData
  ↓
.credentialSubject
  ↓
.idvComplete  ← THE CLAIM
```

## Credential Subject Example

```json
{
  "credentialSubject": {
    "firstName": "John",
    "lastName": "Doe", 
    "dateOfBirth": "1990-01-01",
    "idvComplete": true         ← Claim is HERE
  }
}
```

## Error Handling

### If Claim is Missing
```
Error: "Credential does not contain completed identity verification."
Cause: idvComplete field not in credentialSubject
Fix: Ensure credential issued with idvComplete: true
```

### If Claim is False
```
Error: "Credential does not contain completed identity verification."
Cause: idvComplete === false
Fix: User needs to complete IDV first
```

### If Session Failed
```
Error: "Unable to verify credential."
Cause: session.status !== 'SUCCESSFUL'
Fix: Check Walt.id backend, verify policies passed
```

## Checklist for Implementation

- [x] IDV endpoint sets `idvComplete: true`
- [x] Schema defines `idvComplete` field
- [x] Credential registry includes idvComplete claim
- [x] Status endpoint extracts idvComplete from presented credentials
- [x] Frontend checks `idvComplete === true` (strict)
- [x] Dashboard displays status based on claim
- [x] Error messages are clear
- [x] Console logging shows validation flow

## Status Code Summary

| Component | Sets | Reads | Validates |
|-----------|------|-------|-----------|
| `/api/idv` | `idvComplete: true` | - | - |
| `/api/authenticate/status` | - | From credential | Check !== undefined |
| `/authenticate` page | - | From API response | Check === true |
| `/dashboard` page | - | From sessionStorage | Show green/amber |

---

**Key Point:** The `idvComplete` claim is the **definitive authorization gate**. Without it being `true`, dashboard access is denied.
