# mDoc Photo ID - Quick Start Guide

## What is mDoc?

**mDoc (mso_mdoc)** is a mobile photo ID credential format based on ISO/IEC 23220-4 standard:

- 📱 Mobile-first credential format
- 🔒 Privacy-preserving with selective disclosure
- 📦 Binary CBOR encoding (smaller than JSON)
- 🌐 International standard
- ✈️ Works offline

## Two Credential Formats Available

### Format 1: W3C VC (Traditional)
```
GET /idv
POST /api/idv

Type: jpmorgan_identity_credential
Format: jwt_vc_json
Use: Standard identity verification
```

### Format 2: mDoc Photo ID (NEW)
```
POST /api/photo-id

Type: jpmorgan_photo_id
Format: mso_mdoc
Use: Mobile driver's license
```

## Using mDoc Credentials

### Issue mDoc Photo ID

```bash
curl -X POST http://localhost:3000/api/photo-id \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "issueDate": "2024-08-12",
    "expiryDate": "2032-08-12",
    "idvComplete": true
  }'
```

**Response:**
```json
{
  "offerUrl": "openid-credential-offer://...",
  "offerId": "uuid",
  "format": "mso_mdoc",
  "credentialType": "org.iso.18013.5.1.mDL",
  "message": "mDoc Photo ID issued with full identity verification"
}
```

### Data Format

**Input (Form Data):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "issueDate": "2024-08-12",
  "expiryDate": "2032-08-12",
  "idvComplete": true
}
```

**Converted to mDoc (Internal):**
```json
{
  "given_name": "John",
  "family_name": "Doe",
  "date_of_birth": 10957,
  "issue_date": 19606,
  "expiry_date": 20287,
  "idv_complete": "true"
}
```

## ISO/IEC 23220-4 Mapping

| Form Field | mDoc Element | Type | Example |
|-----------|-------------|------|---------|
| firstName | given_name | String | "John" |
| lastName | family_name | String | "Doe" |
| dateOfBirth | date_of_birth | Unix Days | 10957 |
| issueDate | issue_date | Unix Days | 19606 |
| expiryDate | expiry_date | Unix Days | 20287 |
| idvComplete | idv_complete | String | "true" |

## Namespace

```
org.iso.23220.photoid.1
```

All mDoc elements reside in this ISO/IEC 23220-4 standard namespace.

## Element Types

- **tstr** - Text String (for names, status)
- **int** - Integer (for dates in Unix days)
- **date** - Date encoded as Unix epoch days

## Dates in mDoc

Dates are encoded as **days since Unix epoch** (1970-01-01):

```javascript
// Example: 1990-01-15
Date: 1990-01-15
Days since epoch: 10,957 days

// Example: 2024-08-12
Date: 2024-08-12
Days since epoch: 19,606 days
```

## Flow: Issue & Verify mDoc

```
1. POST /api/photo-id
   ├─ Convert form data to mDoc format
   ├─ Send to Walt.id Issuer2 Service
   └─ Get credential offer URL

2. Display QR code
   └─ User scans with wallet

3. Wallet requests mDoc credential
   ├─ Sends pre-auth code
   ├─ Receives mDoc Photo ID
   └─ Stores in wallet

4. User presents for authentication
   ├─ Wallet signs mDoc
   ├─ Sends to verifier
   └─ Dashboard shows status
```

## Configuration

### Enabled Credential Types

```typescript
export const JPMorganCredentialTypes = {
  IDENTITY: 'jpmorgan_identity_credential',      // W3C VC
  PHOTO_ID: 'jpmorgan_photo_id',                 // mDoc
};
```

### Format Mapping

```typescript
jpmorgan_identity_credential → jwt_vc_json (W3C VC)
jpmorgan_photo_id           → mso_mdoc (mDoc Photo ID)
```

## API Endpoints

### Existing Endpoints (Unchanged)

```
POST /api/idv              → W3C VC credential
GET /api/authenticate      → Verify W3C VC
GET /api/authenticate/status → Check verification
```

### New Endpoints

```
POST /api/photo-id         → mDoc Photo ID credential
```

### Verification Works for Both

```
POST /api/authenticate     → Works for W3C VC or mDoc
GET /api/authenticate/status → Status for any format
```

## Testing Steps

### Test 1: Issue mDoc with Full Verification

```bash
# 1. Issue credential
curl -X POST http://localhost:3000/api/photo-id \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "dateOfBirth": "1990-01-01",
    "idvComplete": true
  }'

# 2. Copy offerUrl
# 3. Scan QR code with wallet
# 4. Wallet presents credential
# 5. Dashboard shows ✅ Complete status
```

### Test 2: Issue mDoc with Limited Verification

```bash
# Same as above but idvComplete: false
# Dashboard shows ⏳ Pending status
```

## Console Logs

When issuing mDoc credential, look for:

```
[API] Issuing mDoc Photo ID credential with data: {
  firstName: "John",
  lastName: "Doe",
  ...
}

mDoc credential data: {
  given_name: "John",
  family_name: "Doe",
  date_of_birth: 10957,
  ...
}
```

## Dashboard Display

### Both Formats Show Same Status

- **mDoc idvComplete: true** → ✅ GREEN "Verification Complete"
- **mDoc idvComplete: false** → ⏳ AMBER "Verification Pending"
- **W3C VC idvComplete: true** → ✅ GREEN "Verification Complete"
- **W3C VC idvComplete: false** → ⏳ AMBER "Verification Pending"

## Wallet Compatibility

mDoc Photo ID can be used with wallets supporting:
- iOS: Apple Wallet (iOS 18+)
- Android: Google Wallet
- Cross-platform: Any OpenID4VP compatible wallet

## Advantages Summary

| Aspect | Benefit |
|--------|---------|
| **Standard** | ISO/IEC 18013-5 international |
| **Mobile** | Native support on phones |
| **Privacy** | Selective disclosure |
| **Size** | Smaller binary format |
| **Offline** | Works without internet |
| **Security** | Cryptographic binding |

## File Structure

```
lib/schemas/jpmorgan-photo-id.ts   → mDoc schema & conversion
app/api/photo-id/route.ts          → Issuance endpoint
lib/credentials/registry.ts        → mDoc registration
lib/config.ts                       → Credential type config
```

## Next Steps

1. ✅ Configuration complete
2. ⏳ Deploy to Walt.id
3. ⏳ Test mDoc issuance
4. ⏳ Test wallet integration
5. ⏳ Test presentation flow

## Documentation

- `MDOC_IMPLEMENTATION.md` - Full technical details
- `MDOC_QUICKSTART.md` - This quick reference
- ISO/IEC 18013-5 - Official standard reference

## Questions?

See `MDOC_IMPLEMENTATION.md` for:
- Detailed API specifications
- Data model documentation
- Walt.id configuration
- Complete testing guide
