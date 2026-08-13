# Troubleshooting Guide - JPMorgan Demo

## Issue: QR Code Not Displaying After IDV

### Symptoms
- Form submits successfully (no error message)
- Network tab shows successful API response with credential offer
- But QR code doesn't display
- Copy button might copy `undefined`

### Solution

#### Step 1: Check Browser Console
1. Open DevTools: F12 or Right-click → Inspect
2. Go to Console tab
3. Look for these logs after submitting IDV form:
   - `"Walt.id credential offer response:"` followed by JSON object
   - `"IDV Issuance result:"` followed by the result

#### Step 2: Verify Response Format
Look at the logged response. You should see one of these patterns:

**Good - has offerUrl**:
```json
{
  "offerUrl": "openid-credential-offer://...",
  "offerId": "abc123",
  "txCodeValue": null
}
```

**Issue - credential_offer (snake_case)**:
```json
{
  "credential_offer": "openid-credential-offer://...",
  "offer_id": "abc123"
}
```

#### Step 3: Check API Response in Network Tab
1. DevTools → Network tab
2. Reload page and submit form again
3. Find `POST` request to `/api/idv`
4. Click Response tab
5. Check the exact JSON structure returned

#### Step 4: Update Field Mappings if Needed

If the response has different field names:

**Edit**: `/lib/api/client.ts` (around line 122-128)

Find this section:
```typescript
return {
  offerUrl: data.credentialOffer || data.credential_offer,
  offerId: data.offerId || data.issuanceSessionId || data.offer_id || '',
  txCodeValue: data.txCodeValue || data.tx_code_value,
};
```

Add any missing field names you found. For example:
```typescript
return {
  offerUrl: data.credentialOffer || data.credential_offer || data.offer_url,
  offerId: data.offerId || data.issuanceSessionId || data.offer_id || data.issuance_session_id || '',
  txCodeValue: data.txCodeValue || data.tx_code_value || data.tx_code,
};
```

---

## Issue: "Error: No QR code data provided"

### Solution
This error displays when `value` prop is `undefined`. Causes:

1. **API returned but without credential offer**:
   - Check Walt.id API response structure
   - Verify field names match those in `/lib/api/client.ts`

2. **API call failed silently**:
   - Check browser console for errors
   - Check `/api/idv` endpoint logs
   - Verify Walt.id credentials in `.env.local`

3. **Network error**:
   - Open Network tab
   - Check if `/api/idv` request completed
   - Look for 4xx or 5xx errors

---

## Issue: Copy URL Button Copies "undefined"

### Symptoms
- Click "Copy URL" button
- Paste shows "undefined" text

### Solution

This is fixed in the latest version. The component now:
1. Checks if `value` exists before copying
2. Logs a warning if no value to copy
3. Doesn't attempt copy if value is missing

If you still see this:
1. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Restart dev server: `npm run dev`

---

## Issue: API Authentication Failed

### Symptoms
```
Error: Authentication failed: 401 Unauthorized
```

### Solution

1. **Check credentials in `.env.local`**:
   ```bash
   WALTID_API_URL=https://your-instance.enterprise.waltid.cloud
   WALTID_USERNAME=superadmin@walt.id
   WALTID_PASSWORD=your-password
   ```

2. **Verify Walt.id is running**:
   ```bash
   curl -X POST https://your-instance.enterprise.waltid.cloud/auth/account/emailpass \
     -H "Content-Type: application/json" \
     -d '{"email":"superadmin@walt.id","password":"your-password"}'
   ```

3. **Check token generation**:
   - Open DevTools Console
   - Look for auth errors
   - Verify credentials are correct

---

## Issue: "No Issuer2 profile ID configured"

### Symptoms
```
Error: No Issuer2 profile ID configured for credential type "jpmorgan_identity"
```

### Solution

This means the credential type isn't properly registered.

1. **Check config in `/lib/config.ts`**:
   ```typescript
   export const credentialTypes: Record<string, CredentialTypeConfig> = {
     [JPMorganCredentialTypes.IDENTITY]: {
       id: JPMorganCredentialTypes.IDENTITY,
       name: 'JPMorgan Identity Credential',
       format: 'jwt_vc_json',
       credentialConfigurationId: JPMorganCredentialTypes.IDENTITY,
       get profileId() { return buildProfileId('identity'); },
     },
   };
   ```

2. **Check registry in `/lib/credentials/registry.ts`**:
   ```typescript
   registerCredential(JPMorganCredentialTypes.IDENTITY, {
     format: 'jwt_vc_json',
     schema: { ... },
     w3cVcConfig: { ... },
     claims: jpmorgaranIdentityClaims,
   });
   ```

3. **Verify JPMorganCredentialTypes is exported**:
   ```typescript
   export const JPMorganCredentialTypes = {
     IDENTITY: 'jpmorgan_identity',
   } as const;
   ```

---

## Issue: QR Code Generates But Very Faint/Hard to Scan

### Solution

The QR code size might be too small. In `/components/QRCodeDisplay.tsx`:

```typescript
export function InlineQRCode({
  value,
  size = 280,  // ← Adjust this (280 is default, try 400)
```

Increase the size for larger QR codes that are easier to scan.

---

## Issue: Form Validation Not Working

### Symptoms
- Can submit empty form
- Error doesn't show for missing fields

### Solution

Check the IDV page form inputs. They should have `required` validation:

```typescript
<Input
  id="firstName"
  value={formData.firstName}
  onChange={(e) => handleInputChange('firstName', e.target.value)}
  placeholder="John"
  disabled={isLoading}
/>
```

The button should be disabled if fields are empty:

```typescript
<Button
  onClick={handleSubmit}
  disabled={isLoading || !formData.firstName || !formData.lastName || !formData.dateOfBirth}
>
```

If this isn't working, the form state might not be updating. Check React DevTools.

---

## Issue: Credential Not Appearing in Wallet

### Symptoms
- QR code displays
- User scans with wallet app
- Wallet shows "error" or "invalid credential offer"

### Solution

This is a wallet/Walt.id configuration issue, not the demo:

1. **Verify credential offer format**:
   - Logged URL should start with `openid-credential-offer://`
   - Check if it's a valid OpenID offer

2. **Check wallet compatibility**:
   - Use supported wallet (EUDI, Lissi, etc.)
   - Verify wallet supports JWT VC format

3. **Check Walt.id configuration**:
   - Issuer profile should be properly configured
   - Credential configuration should exist
   - Check Walt.id logs for issuance errors

---

## Quick Debugging Checklist

- [ ] Restart dev server after changes: `npm run dev`
- [ ] Hard refresh browser: Ctrl+Shift+R
- [ ] Clear browser cache and cookies
- [ ] Check browser console for errors
- [ ] Check Network tab for failed requests
- [ ] Verify `.env.local` credentials
- [ ] Check server logs for Walt.id API errors
- [ ] Verify Walt.id instance is running and accessible

---

## Advanced Debugging

### Enable Verbose Logging

Add more `console.log` statements to trace execution:

**In `/app/(jpmorgan)/idv/page.tsx`**:
```typescript
const handleSubmit = async () => {
  console.log('Form submitted with:', formData);
  // ... rest of code
};
```

**In `/app/api/idv/route.ts`**:
```typescript
console.log('IDV request received:', { firstName, lastName, dateOfBirth });
// ... rest of code
```

### Check Network Timing

1. Open DevTools → Network tab
2. Set throttling to see slow requests
3. Check if requests timeout
4. Look for long response times

### Test API Directly

Using curl or Postman to test the API:

```bash
curl -X POST http://localhost:3000/api/idv \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15"
  }'
```

Expected response:
```json
{
  "offerUrl": "openid-credential-offer://...",
  "offerId": "session-id"
}
```

---

## Still Having Issues?

1. **Check the logs**: Server console and browser console
2. **Verify configuration**: `.env.local`, `lib/config.ts`
3. **Review network responses**: Network tab in DevTools
4. **Check Walt.id status**: Are endpoints accessible and responding?
5. **Try a clean restart**: Stop dev server, clear node_modules, reinstall, restart

If none of this resolves the issue, there may be a Walt.id configuration or API compatibility issue specific to your instance.
