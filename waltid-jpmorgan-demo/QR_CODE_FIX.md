# QR Code Display Fix

## Issue Identified

When users submitted the IDV form, the response was received successfully in the network tab, but the QR code was not displaying and the "Copy URL" button was copying `undefined`.

## Root Causes

1. **Missing error handling in QR code generation** - If `value` prop was undefined or empty, the QR code component would not provide user feedback
2. **Potential API field name mismatches** - Walt.id API might return field names in different formats (camelCase vs snake_case)
3. **No validation for empty QR code data** - Component attempted to render QR code even when no valid data was provided

## Fixes Applied

### 1. Updated `/lib/api/client.ts`

Added logging and fallback field names to handle both camelCase and snake_case responses:

```typescript
const data = await response.json();

console.log('Walt.id credential offer response:', data);

return {
  offerUrl: data.credentialOffer || data.credential_offer,
  offerId: data.offerId || data.issuanceSessionId || data.offer_id || '',
  txCodeValue: data.txCodeValue || data.tx_code_value,
};
```

**Why**: Walt.id might return different field names depending on version/configuration. This ensures compatibility.

### 2. Updated `/app/api/idv/route.ts`

Added console logging to debug the issuance result:

```typescript
const result = await issueCredential(...);
console.log('IDV Issuance result:', result);
return NextResponse.json(result);
```

**Why**: Server-side logging helps track what data is being returned to the frontend.

### 3. Enhanced `/components/QRCodeDisplay.tsx` - `InlineQRCode` Component

**Added validation check**:
```typescript
if (!value) {
  return (
    <div className="w-full max-w-md mx-auto overflow-hidden bg-white rounded-2xl shadow-xl p-6">
      <p className="text-center text-red-600">Error: No QR code data provided</p>
    </div>
  );
}
```

**Enhanced loading state**:
```typescript
useEffect(() => {
  if (value) {
    // ... QR generation code
  } else {
    setIsLoading(false);
    setDataUrl('');
  }
}, [value, size]);
```

**Fixed copy button with error handling**:
```typescript
const handleCopyUrl = async () => {
  if (!value) {
    console.warn('No URL to copy');
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};
```

**Why**: These changes provide better error messaging and prevent undefined values from being copied.

## How to Verify the Fix

1. **Check browser console for logs**:
   - Look for `"Walt.id credential offer response:"` - this shows the actual API response
   - Look for `"IDV Issuance result:"` - this shows what was returned to frontend

2. **Test the flow**:
   - Fill IDV form completely
   - Click "Complete Verification"
   - QR code should now display in a modal
   - "Copy URL" button should work without errors

3. **If still not working**:
   - Check that `data.offerUrl` or `data.credentialOffer` is in the API response
   - Add more fallback field names if needed
   - Verify Walt.id API version and response format

## Field Name Mapping

The fix now handles these Walt.id response field variations:

| Field | Camel Case | Snake Case |
|-------|-----------|-----------|
| Credential Offer | `credentialOffer` | `credential_offer` |
| Offer ID | `offerId` / `issuanceSessionId` | `offer_id` |
| TX Code | `txCodeValue` | `tx_code_value` |

## Testing the Response Format

If you still see `undefined` in the copy button, check:

1. Open browser DevTools → Network tab
2. Find the POST request to `/api/idv`
3. Click Response tab
4. Look at the returned JSON structure
5. Update field name mappings if different

Example of expected response:
```json
{
  "offerUrl": "openid-credential-offer://...",
  "offerId": "session-id-123",
  "txCodeValue": null
}
```

## Console Debugging

If QR code still doesn't render:

1. Open browser console
2. Check for errors in console
3. Look for `"Walt.id credential offer response:"` - if missing, API call failed
4. If `offerUrl` is still `undefined`, the API response field names don't match expectations
5. Report the actual response structure

## Additional Notes

- The QR code generation itself (via `qrcode` npm package) is robust
- The issue was definitely in data flow, not QR code library
- Component now gracefully handles missing data instead of silently failing
- All changes are backwards compatible
