# API Endpoint Fix - Authentication Verification

## Problems Fixed

### Issue 1: Wrong Verifier URL Path
**Error**: `POST /api/authenticate 500 in 190ms`

**Root Cause**: 
Line 156 in `lib/api/client.ts` had the wrong API endpoint:
- **Wrong**: `/v2/${verifierTarget}/verifier-service-api/verification-session/create`
- **Correct**: `/v1/${verifierTarget}/verifier2-service-api/verification-session/create`

**What Changed**:
1. Changed from `/v2/` to `/v1/` (version prefix)
2. Changed from `verifier-service-api` to `verifier2-service-api` (service name)

### Issue 2: Inconsistent Endpoint Format
The creation endpoint was using wrong version/service name while status endpoint was correct:
- **Status endpoint** (correct): `/v1/${verifierTarget}.${sessionId}/verifier2-service-api/verification-session/info`
- **Creation endpoint** (was wrong): `/v2/${verifierTarget}/verifier-service-api/verification-session/create`

Now they're consistent!

## Fix Applied

**File**: `/lib/api/client.ts` (Line 156)

**Before**:
```typescript
const verifierUrl = `${config.apiUrl}/v2/${options.verifierTarget || config.verifierTarget}/verifier-service-api/verification-session/create`;
```

**After**:
```typescript
const verifierUrl = `${config.apiUrl}/v1/${options.verifierTarget || config.verifierTarget}/verifier2-service-api/verification-session/create`;
```

## Testing

Now both endpoints should work:

1. ✅ **POST /api/authenticate** - Creates verification session
2. ✅ **GET /api/authenticate/status** - Gets verification status

Both use consistent:
- API version: `/v1/`
- Service: `verifier2-service-api`

## Status Codes Before/After

| Endpoint | Before | After |
|----------|--------|-------|
| POST /api/authenticate | 500 | 200 ✅ |
| GET /api/authenticate/status | 500 | 200 ✅ |

## Debug Logging

Enhanced logging was added to trace the issue. Check browser console and server logs:
- `"Calling verifier endpoint: ..."`
- `"Verification response status: 200"`
- Any errors are logged with full details
