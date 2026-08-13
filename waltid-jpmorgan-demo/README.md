# JPMorgan Credential-Based Authentication Demo

This demo showcases a two-stage credential-based authentication flow:

1. **Identity Verification (IDV)** - User provides basic identity information (first name, last name, date of birth)
2. **Credential Issuance** - A verifiable credential with `idvComplete: true` is issued to the user's wallet
3. **Authentication/MFA** - User presents the credential to authenticate to an application
4. **Verification** - The application verifies the credential and checks the `idvComplete` claim

## Architecture

This demo reuses the existing Walt.id enterprise stack architecture:

- **Credential Format**: JWT VC (W3C VC DM 2.0 format)
- **Issuance Flow**: Pre-auth code flow (wallet scans QR code)
- **Verification**: DCQL query requesting specific credential claims
- **Trust Model**: Single issuer and verifier tenant

## Directory Structure

```
waltid-jpmorgan-demo/
├── app/
│   ├── (jpmorgan)/              # Route group for JPMorgan-branded pages
│   │   ├── layout.tsx           # Header/footer layout
│   │   ├── page.tsx             # Home page
│   │   ├── idv/                 # Identity verification
│   │   │   └── page.tsx         # IDV form + QR code display
│   │   └── authenticate/        # Authentication flow
│   │       └── page.tsx         # Verify with credential + QR code
│   ├── api/
│   │   ├── idv/route.ts         # Mock IDV + credential issuance
│   │   ├── issue/route.ts       # Generic credential issuance
│   │   └── authenticate/
│   │       ├── route.ts         # Create verification session
│   │       └── status/route.ts  # Check verification status
│   ├── layout.tsx               # Root layout
│   └── globals.css              # JPMorgan branding colors
├── lib/
│   ├── api/client.ts            # Walt.id API client (reused)
│   ├── config.ts                # JPMorgan-specific config
│   ├── branding.ts              # JPMorgan branding
│   ├── credentials/registry.ts  # Credential registration
│   └── schemas/jpmorgan-identity.ts  # Identity credential schema
├── components/
│   ├── QRCodeDisplay.tsx        # QR code rendering (reused)
│   └── ui/                      # Shadcn UI components (reused)
└── package.json                 # Next.js project config

```

## Flow Diagram

### Phase 1: Identity Verification & Credential Issuance

```
User visits IDV page
    ↓
Submits form (firstName, lastName, dateOfBirth)
    ↓
POST /api/idv with identity data
    ↓
Backend calls issueCredential(jpmorgan_identity)
    ↓
Backend creates credential with idvComplete: true
    ↓
Credential offer generated (pre-auth code)
    ↓
QR code displayed to user
    ↓
User scans QR with wallet → Credential added to wallet
```

### Phase 2: Authentication

```
User visits authenticate page
    ↓
Clicks "Verify with Wallet" button
    ↓
POST /api/authenticate
    ↓
Backend creates verification session requesting jpmorgan_identity credential
    ↓
Verification session URL generated
    ↓
QR code displayed
    ↓
User scans QR with wallet → Presents credential
    ↓
Poll GET /api/authenticate/status?sessionId={id}
    ↓
Verification backend validates credential and extracts idvComplete claim
    ↓
Backend returns idvComplete value
    ↓
If idvComplete === true → Authentication Successful ✓
If idvComplete === false → Authentication Failed (show error)
```

## Branding

JPMorgan branding is applied via CSS variables:

- **Primary Color**: `#8f5a39` (brown)
- **Button Text**: `#f4efe7` (light cream)
- **Accent Color**: `#b8936a` (lighter brown)

These are defined in:
- `app/globals.css` - CSS variables
- `lib/branding.ts` - Display name, tagline, logo path
- Component classes use `bg-jp-primary`, `text-jp-primary`, `hover:bg-jp-primary/90`

## Environment Configuration

Required environment variables (see `.env.example`):

```bash
# Walt.id Enterprise API
WALTID_API_URL=https://your-instance.enterprise.waltid.cloud
WALTID_API_URL_PUBLIC=https://your-instance.enterprise.waltid.cloud
WALTID_USERNAME=superadmin@walt.id
WALTID_PASSWORD=your-password

# JPMorgan Tenant Configuration
WALTID_ORGANIZATION=waltid
JPMORGAN_TENANT=jpmorgan-demo
```

The config automatically builds:
- `issuerTarget`: `{organization}.{tenant}.issuer`
- `verifierTarget`: `{organization}.{tenant}.verifier`

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and update with your Walt.id instance details:

```bash
cp .env.example .env.local
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run the demo

1. **Start at home** → Choose "Complete Identity Verification"
2. **IDV Page** → Fill form with any name and date, click verify
3. **Wallet Setup** → Scan QR with EUDI wallet or compatible mobile wallet
4. **Receive Credential** → Credential added to wallet
5. **Authenticate** → Click "Authenticate Now" from home page
6. **Verification** → Scan QR with wallet, present credential
7. **Success** → If credential contains `idvComplete: true`, authentication succeeds

## Credential Schema

### JPMorgan Identity Credential

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
  ],
  "type": ["VerifiableCredential", "JPMorganIdentityCredential"],
  "issuer": {
    "name": "JPMorgan Identity Verification",
    "id": "did:...:issuer"
  },
  "credentialSubject": {
    "id": "did:...:subject",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "idvComplete": true
  }
}
```

## Key Design Decisions

1. **Reused Architecture** - Uses existing gov-service structure, credential registry, API client
2. **Single Credential Type** - Simplified for demo (one JPMorgan identity credential)
3. **Mock IDV** - No real government integration; IDV is simulated
4. **Happy Path** - Focused on successful flow; error handling covers main failure cases
5. **Polling** - Authentication uses polling for async verification session completion
6. **idvComplete Validation** - Authentication only succeeds if credential explicitly contains `idvComplete: true`
7. **Pre-Auth Code Flow** - Uses pre-authorized code (wallet scans QR) for simplicity

## Files Modified/Created

**New Files:**
- `app/(jpmorgan)/page.tsx` - Home page
- `app/(jpmorgan)/idv/page.tsx` - Identity verification page
- `app/(jpmorgan)/authenticate/page.tsx` - Authentication page
- `app/api/idv/route.ts` - IDV endpoint
- `app/api/issue/route.ts` - Issuance endpoint
- `app/api/authenticate/route.ts` - Verification session creation
- `app/api/authenticate/status/route.ts` - Status polling endpoint
- `lib/schemas/jpmorgan-identity.ts` - Identity credential schema
- `lib/branding.ts` - JPMorgan branding configuration
- `README.md` - This file

**Modified Files:**
- `lib/config.ts` - Simplified for JPMorgan (single tenant, single credential type)
- `lib/credentials/registry.ts` - JPMorgan-specific credential registration
- `lib/api/client.ts` - Updated imports for JPMorgan config
- `app/globals.css` - JPMorgan color scheme
- `app/(jpmorgan)/layout.tsx` - Header/footer updates (colors, links)

**Removed Files:**
- Government service-specific schemas (employee-status, photo-id, address-proof, etc.)
- Government service-specific pages (issue, verify)

## Testing the Flow

### Manual Testing

1. Visit home page
2. Click "Complete Identity Verification"
3. Fill form: First Name, Last Name, Date of Birth
4. Click "Complete Verification"
5. Scan QR code with EUDI wallet or Lissi wallet
6. Return to home page
7. Click "Authenticate Now"
8. Click "Verify with Wallet"
9. Scan QR code with wallet (same wallet from step 5)
10. Verify success message displays

### Simulating Failure

To test the failure path, modify the IDV API to set `idvComplete: false`. Authentication will then fail with the message "This credential does not contain a completed identity verification."

## Production Considerations

This is a demo. For production:

- **Real IDV**: Integrate with actual government IDV service (not mock)
- **Session Management**: Store sessions in database, not memory
- **Security**: Implement proper authentication, CSRF protection, CORS
- **Logging**: Add comprehensive logging and monitoring
- **Rate Limiting**: Add rate limiting on API endpoints
- **Error Handling**: Expand error scenarios and recovery flows
- **Customization**: Extend credential schema with additional claims
- **Revocation**: Implement credential revocation mechanism
- **Compliance**: Add audit logging for regulatory compliance

## Reused Components

The following components are shared with existing demos:

- **UI Components** - All from `components/ui/` (shadcn-style components)
- **QR Code Display** - `components/QRCodeDisplay.tsx`
- **API Client** - `lib/api/client.ts` (Walt.id enterprise API client)
- **Credential Registry Pattern** - `lib/credentials/registry.ts`

## Support

For questions or issues, refer to:
- Walt.id documentation: https://docs.walt.id
- Walt.id GitHub: https://github.com/walt-id
- Walt.id support: https://support.walt.id
