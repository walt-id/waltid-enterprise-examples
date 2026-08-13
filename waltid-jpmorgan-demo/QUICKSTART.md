# JPMorgan Demo - Quick Start Guide

## 30-Second Setup

### 1. Install & Configure
```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` with your Walt.id details:
```
WALTID_API_URL=https://your-instance.enterprise.waltid.cloud
WALTID_API_URL_PUBLIC=https://your-instance.enterprise.waltid.cloud
WALTID_USERNAME=superadmin@walt.id
WALTID_PASSWORD=your-password
```

### 2. Run
```bash
npm run dev
```

### 3. Open
http://localhost:3000

---

## Demo Flow (5 minutes)

### Phase 1: Identity Verification (2 min)
1. Click **"Complete Identity Verification"**
2. Fill form:
   - First Name: `John`
   - Last Name: `Doe`
   - Date of Birth: `1990-01-15`
3. Click **"Complete Verification"**
4. See success + QR code
5. Explain: "User scans with wallet"

### Phase 2: Authentication (2 min)
1. Click **"Continue to Authentication"** or go back to home
2. Click **"Authenticate Now"**
3. Click **"Verify with Wallet"**
4. See verification QR code + polling status
5. Wait for "Authentication Successful ✓"

### Phase 3: Explain (1 min)
- **What we just did**: User verified → Got credential → Authenticated with credential
- **Key insight**: Credential proves identity verification, not just password
- **Security benefit**: Cryptographically verified, can't be forged
- **Use case**: MFA, strong authentication, compliance

---

## Core Concepts

### Credential
```json
{
  "credentialSubject": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "idvComplete": true    ← Gate keeper
  }
}
```

### Flows
1. **Issuance**: User info → Credential created → QR → Wallet
2. **Authentication**: Wallet scans → Credential presented → Verified → Success

### The idvComplete Claim
- **Meaning**: User completed identity verification
- **Why**: Application can enforce "only verified users" rule
- **Security**: Can't access app without it
- **Smart**: Different from password - proves external verification

---

## Files You Should Know

| File | Purpose |
|------|---------|
| `app/(jpmorgan)/page.tsx` | Home page with action cards |
| `app/(jpmorgan)/idv/page.tsx` | Identity verification form |
| `app/(jpmorgan)/authenticate/page.tsx` | Authentication with credential |
| `app/api/idv/route.ts` | Issues credential with idvComplete:true |
| `app/api/authenticate/route.ts` | Creates verification session |
| `lib/config.ts` | JPMorgan configuration |
| `lib/schemas/jpmorgan-identity.ts` | Credential schema |

---

## Customization Ideas

### Add More Claims
```typescript
// In lib/schemas/jpmorgan-identity.ts
export const jpmorgaranIdentityClaims = [
  { path: ['firstName'] },
  { path: ['lastName'] },
  { path: ['dateOfBirth'] },
  { path: ['idvComplete'] },
  { path: ['customClaim'] },  // ← Add here
];
```

### Change Branding Colors
```css
/* In app/globals.css */
--jp-primary: #8f5a39;        /* Change this */
--jp-text: #f4efe7;
--jp-accent: #b8936a;
```

### Real IDV Integration
```typescript
// In app/api/idv/route.ts
// Replace mock verification with real IDV provider
const idvResult = await realIDVProvider.verify({
  firstName, lastName, dateOfBirth
});
const idvComplete = idvResult.verified;  // Get from real provider
```

### Add Database
```typescript
// Store issued credentials
const credential = await db.credentials.create({
  userId: user.id,
  credentialType: 'jpmorgan_identity',
  issuanceDate: new Date(),
  claims: { firstName, lastName, dateOfBirth, idvComplete: true }
});
```

---

## Testing

### Happy Path
```
Form → Submit → Credential Issued ✓ → QR Shows ✓
Auth Init → QR Shows ✓ → Status Polls ✓ → Success ✓
```

### Failure Path (Optional)
Modify `/app/api/idv/route.ts`:
```typescript
idvComplete: false,  // Change from true
```
Then authentication will fail with:
```
"Credential does not contain completed identity verification"
```

---

## Architecture (Technical)

### Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Radix UI + shadcn components
- **Styling**: Tailwind CSS
- **API Client**: Walt.id Enterprise API SDK
- **Credentials**: W3C VC DM 2.0 (JWT format)

### Credential Flow
```
1. issueCredential()
   ↓ (sends to Walt.id)
2. Issuer2 Service creates signed JWT
   ↓
3. Pre-auth-code offer generated
   ↓
4. QR code created
   ↓
5. Wallet scans and receives credential
```

### Authentication Flow
```
1. createVerificationSession()
   ↓ (sends to Walt.id)
2. Verifier2 Service creates DCQL query
   ↓
3. Authorization request URL created
   ↓
4. QR code created
   ↓
5. Wallet scans and presents credential
   ↓
6. Backend validates signature + extracts claims
   ↓
7. Application checks idvComplete === true
```

---

## Deployment

### Local Development
```bash
npm run dev              # Runs on localhost:3000
```

### Build for Production
```bash
npm run build
npm start                # Runs on localhost:3000
```

### Deploy to Vercel
```bash
vercel deploy
```

---

## Support & Resources

- **Walt.id Docs**: https://docs.walt.id
- **W3C VC Spec**: https://www.w3.org/TR/vc-data-model-2.0/
- **DCQL Spec**: https://www.openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html
- **GitHub**: https://github.com/walt-id

---

## Common Questions

**Q: Can I use different credentials?**
A: Yes! Register new credentials in `lib/credentials/registry.ts`

**Q: How do I connect real IDV?**
A: Replace mock IDV in `/app/api/idv/route.ts` with real provider API

**Q: Can users store multiple credentials?**
A: Yes! This demo handles one, but architecture supports many

**Q: How is this different from a password?**
A: Password is knowledge-based. Credential is cryptographically verified and proves external verification (IDV).

**Q: What about revocation?**
A: Not shown in demo, but Walt.id supports revocation via revocation list

---

## 🎯 You're Ready!

1. Copy `.env.example` → `.env.local`
2. Add your Walt.id credentials
3. `npm install` → `npm run dev`
4. Open http://localhost:3000
5. Follow the demo flow
6. Show the client what credential-based auth can do!

**Demo Time**: 5 minutes
**Setup Time**: 5 minutes
**Total**: 10 minutes

Questions? Check README.md or DEMO_WALKTHROUGH.md
