# JPMorgan Credential-Based Authentication Demo Walkthrough

This document provides a step-by-step guide for demonstrating the JPMorgan credential-based authentication flow to clients.

## Pre-Demo Setup

1. Ensure Walt.id Enterprise Stack is running
2. Configure environment variables in `.env.local`:
   ```bash
   WALTID_API_URL=<your-walt-id-instance>
   WALTID_API_URL_PUBLIC=<your-public-url>
   WALTID_USERNAME=superadmin@walt.id
   WALTID_PASSWORD=<password>
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in browser

## Demo Scenario

**User Story**: A new user needs to:
1. Complete identity verification with JPMorgan
2. Receive a digital credential proving their identity
3. Later authenticate to the JPMorgan application using that credential

---

## Phase 1: Identity Verification (5 minutes)

### Step 1: Home Page Introduction (30 seconds)
- Show the home page
- Point out the two main flows: "Complete Identity Verification" and "Authenticate Now"
- Explain: "Today we'll demonstrate both flows with a single user"

### Step 2: Identity Verification Page (2 minutes)
- Click "Complete Identity Verification"
- Show the form with disclaimer: "Mock Government IDV - This is a demonstration"
- Explain: "In production, this would verify with actual government systems"
- Fill in sample data:
  - First Name: `John`
  - Last Name: `Doe`
  - Date of Birth: `1990-01-15`
- Click "Complete Verification"

**What's Happening Behind the Scenes**:
```
Frontend submits form → POST /api/idv
API calls issueCredential() with:
  - credentialType: jpmorgan_identity
  - credentialData: { firstName, lastName, dateOfBirth, idvComplete: true }
  - flowType: pre-auth-code
Walt.id creates credential offer & returns QR code
```

### Step 3: Credential Issuance via QR Code (2 minutes)
- Show success message: "Identity Verified ✓"
- Display QR code
- Explain the credential:
  ```json
  {
    "credentialSubject": {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-15",
      "idvComplete": true
    }
  }
  ```
- Explain: "This credential is digitally signed and tamper-proof"

**Wallet Scanning**:
- For demo purposes, you can simulate this by noting the offer URL
- In real scenario: "User would now scan this QR code with their mobile wallet"
- Credential is added to user's wallet

---

## Phase 2: Authentication/MFA (5 minutes)

### Step 4: Authentication Page (30 seconds)
- Click "Continue to Authentication" or navigate back to home
- Click "Authenticate Now"
- Show the application page with message:
  - "JPMorgan Application"
  - "Additional verification is required"

### Step 5: Verification Session (2 minutes)
- Click "Verify with Wallet"
- Backend creates verification session requesting the credential:
  ```json
  {
    "flow_type": "cross_device",
    "core_flow": {
      "dcql_query": {
        "credentials": [{
          "format": "jwt_vc_json",
          "claims": ["firstName", "lastName", "dateOfBirth", "idvComplete"]
        }]
      }
    }
  }
  ```
- Show QR code
- Explain: "This QR code requests the user to present their credential"

### Step 6: Credential Presentation & Verification (2 minutes)
- Show polling message: "Verifying credential..."
- Explain the verification process:
  1. Wallet scans QR and presents credential
  2. Verifier checks cryptographic signature
  3. Verifier validates issuer
  4. Verifier extracts `idvComplete` claim
  5. If `idvComplete === true`, authentication succeeds

**Key Message**: "The credential proves the user completed identity verification - it's not just a password!"

### Step 7: Authentication Success (1 minute)
- Show success message:
  ```
  Authentication Successful ✓
  Your credential has been verified and you are authenticated.
  ```
- Explain: "The user can now access the application"
- Show the idvComplete claim validation:
  - "Without idvComplete=true, authentication would be rejected"
  - This is more secure than traditional passwords

---

## Demonstrating the Failure Path (Optional, 3 minutes)

### To Show What Happens When idvComplete=false:

1. Go back to home
2. **Modify** `/app/api/idv/route.ts` temporarily:
   ```typescript
   idvComplete: false,  // Change from true
   ```

3. Restart dev server
4. Repeat identity verification flow
5. Go to authentication
6. Show error message:
   ```
   Authentication Failed
   This credential does not contain a completed identity verification.
   ```

7. **Revert** the change before demo ends

**Key Point**: "The application can enforce specific credential requirements, not just credential possession"

---

## Key Talking Points

### Security Benefits

1. **Cryptographic Proof**: Credentials are digitally signed, impossible to forge
2. **Selective Disclosure**: Only reveals necessary information (e.g., just idvComplete, not full identity)
3. **Offline Capable**: Verification can work without contacting issuer (in real scenario)
4. **Audit Trail**: All presentations are logged and can be audited

### User Experience Benefits

1. **No Passwords**: Users don't need to remember passwords for this flow
2. **Wallet Integration**: Credentials stored securely in user's wallet
3. **Cross-Service**: Same credential works across multiple services that trust the issuer
4. **Seamless**: After getting credential once, authentication is fast

### Business Benefits

1. **Reduced Fraud**: Strong identity verification before credential issuance
2. **Regulatory Compliance**: Provable identity verification audit trail
3. **Scalable**: Decentralized verification reduces backend load
4. **Flexible**: Can issue credentials with different claims for different use cases

---

## Technical Architecture (Optional Deep-Dive)

If audience is technical, explain:

### Credential Issuance
```
User Form → issueCredential() → Issuer2 Service
  ↓
Creates signed JWT VC
  ↓
Pre-auth-code offer generated
  ↓
QR code displayed
```

### Credential Verification
```
Wallet scans QR → createVerificationSession()
  ↓
Verifier2 Service creates DCQL query
  ↓
User presents credential from wallet
  ↓
Signature validated
  ↓
Claims extracted & returned
  ↓
Application checks idvComplete claim
```

### Components Reused

- Credential registry pattern (from gov-service demo)
- QR code display component
- API client (Walt.id Enterprise API SDK)
- UI components (shadcn/ui)

---

## Timeline Summary

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Home page intro | 30s |
| 1 | Fill IDV form | 1m |
| 1 | Show credential issuance | 1.5m |
| - | Explain architecture | 1m |
| 2 | Navigate to auth page | 30s |
| 2 | Create verification session | 1m |
| 2 | Show verification polling | 1m |
| 2 | Explain success message | 1m |
| 3 | (Optional) Failure path | 3m |
| - | **Total** | **~10-12 min** |

---

## Troubleshooting During Demo

### "Verification takes too long"
- Normal - polling is checking status every 500ms
- In real scenario, wallet sends presentation to verifier
- Explain: "Backend is polling for credential presentation"

### "QR code doesn't show"
- Check browser console for errors
- Verify API endpoints are responding
- Ensure WALTID_API_URL is correct in .env.local

### "Credential not verified"
- Check that wallet returned credential in expected format
- Verify API server logs for verification errors
- May need to restart dev server

### "idvComplete claim not extracted"
- Check /api/authenticate/status response format
- Verify credential structure in Walt.id

---

## Post-Demo Discussion

Suggested talking points for client:

1. **For Banks/Financial**: "This reduces account opening time and fraud"
2. **For Government**: "Enables citizen digital identity ecosystem"
3. **For Enterprises**: "Strong MFA without relying on passwords"
4. **For Integrators**: "Reusable across multiple applications"

---

## Files Modified for Demo

Key files to review before presenting:

1. `app/(jpmorgan)/page.tsx` - Home page
2. `app/(jpmorgan)/idv/page.tsx` - Identity verification
3. `app/(jpmorgan)/authenticate/page.tsx` - Authentication
4. `lib/schemas/jpmorgan-identity.ts` - Credential schema
5. `README.md` - Technical documentation

---

## Next Steps for Client

1. Customize credential schema for their use case
2. Connect real IDV provider instead of mock
3. Add more credential types
4. Implement user sessions and UI
5. Deploy to production environment
