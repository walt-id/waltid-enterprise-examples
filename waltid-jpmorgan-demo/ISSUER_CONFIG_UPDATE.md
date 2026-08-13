# Issuer Configuration Update - ISO/IEC 23220-4

## Summary

Updated the JPMorgan Photo ID (mDoc) credential configuration to align with the actual Walt.id Issuer2 Service configuration using **ISO/IEC 23220-4** standard instead of ISO/IEC 18013-5.

## Changes Made

### 1. Configuration (`lib/config.ts`)
- Updated `MDOC_NAMESPACE` to `'org.iso.23220.photoid.1'`
- Added `MDOC_DOCTYPE` constant with value `'org.iso.23220.photoid.1'`
- Updated `JPMorganCredentialTypes.PHOTO_ID` to use the correct type identifier

```typescript
export const MDOC_NAMESPACE = 'org.iso.23220.photoid.1';
export const MDOC_DOCTYPE = 'org.iso.23220.photoid.1';

export const JPMorganCredentialTypes = {
  IDENTITY: 'jpmorgan_identity_credential',
  PHOTO_ID: 'org.iso.23220.photoid.1',  // Updated to match issuer config
};
```

### 2. Registry (`lib/credentials/registry.ts`)
- Added import for `MDOC_DOCTYPE`
- Updated `buildVerificationCredentialEntry` to use `MDOC_DOCTYPE` constant
- Ensures DCQL queries use the correct doctype

```typescript
case 'mso_mdoc': {
  return {
    id: type,
    format: 'mso_mdoc',
    doctype: MDOC_DOCTYPE,  // Now uses constant
    nameSpaces: {
      [MDOC_NAMESPACE]: claims.map(claim => ({
        name: claim.path[0],
        intentToRetain: claim.intent_to_retain ?? false,
      })),
    },
  };
}
```

### 3. API Endpoints
- **`app/api/idv/route.ts`**: Returns `credentialType: 'org.iso.23220.photoid.1'`
- **`app/api/photo-id/route.ts`**: Returns `credentialType: 'org.iso.23220.photoid.1'`
- **`app/api/authenticate/status/route.ts`**: Returns matching credentialType

### 4. Schema (`lib/schemas/jpmorgan-photo-id.ts`)
- Updated header comment to reference ISO/IEC 23220-4
- All element definitions use the new namespace

### 5. Documentation
- Updated `MDOC_IMPLEMENTATION.md` to reference ISO/IEC 23220-4
- Updated `MDOC_QUICKSTART.md` with correct standard references
- Updated UI text in `app/(jpmorgan)/idv/page.tsx` to show ISO/IEC 23220-4

## Issuer Configuration Mapping

### Walt.id Issuer2 Service Config
```json
"org.iso.23220.photoid.1": {
  "format": "mso_mdoc",
  "scope": "org.iso.23220.photoid.1",
  "doctype": "org.iso.23220.photoid.1",
  "credential_signing_alg_values_supported": [-7, -9],
  "cryptographic_binding_methods_supported": ["cose_key"],
  "proof_types_supported": {
    "jwt": {
      "proof_signing_alg_values_supported": ["ES256", "EdDSA"]
    }
  }
}
```

### Credential Type Mapping
| Component | Value |
|-----------|-------|
| Credential Type ID | `org.iso.23220.photoid.1` |
| Format | `mso_mdoc` |
| Doctype | `org.iso.23220.photoid.1` |
| Namespace | `org.iso.23220.photoid.1` |
| Profile ID | `waltid.jpmorgan-demo.issuer.photo-id` |

## Standard References

- **ISO/IEC 23220-4**: Mobile Driver's License (mDL) specification
- **mso_mdoc**: Mobile Driving Licence Object Document format
- **CBOR**: Concise Binary Object Representation

## Verification

All endpoints now return the correct credential type and doctype:
- ✅ `/api/idv` - Returns mDoc Photo ID with org.iso.23220.photoid.1
- ✅ `/api/photo-id` - Returns mDoc Photo ID with org.iso.23220.photoid.1
- ✅ `/api/authenticate` - Requests with correct doctype
- ✅ `/api/authenticate/status` - Extracts from correct credential structure

## Testing

After these changes, test:
1. Issue a credential via `/api/idv` or `/api/photo-id`
2. Verify the credential offer is returned with correct format
3. Scan QR code with wallet and request credential
4. Verify wallet receives org.iso.23220.photoid.1 mDoc
5. Present credential for verification
6. Verify status endpoint extracts idv_complete correctly

## Note

The credentials are now aligned with the actual Walt.id Issuer2 Service configuration. Ensure the issuer service has the `org.iso.23220.photoid.1` credential configuration registered and that the `waltid.jpmorgan-demo.issuer.photo-id` profile is properly configured.
