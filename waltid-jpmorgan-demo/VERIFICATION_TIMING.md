# Verification Session Timing

## Current Behavior

When the user clicks "Verify with Wallet", there's approximately a **20-second wait** before the QR code appears.

## Why This Happens

The 20-second delay occurs during the **POST /api/authenticate** call:

```
User clicks "Verify with Wallet"
        ↓
POST /api/authenticate
    ↓ (20 seconds)
Walt.id creates verification session
        ↓
Returns bootstrapAuthorizationRequestUrl + sessionId
        ↓
App displays QR code (data instantly available)
        ↓
After 1 second, starts polling for verification status
```

## Root Cause

This is **normal behavior** for Walt.id verification session creation. The delay occurs because:

1. **Walt.id backend** - The verifier2-service-api takes time to:
   - Initialize a new verification session
   - Generate the authorization request URL
   - Set up the session state on the server

2. **Not a network issue** - The request completes successfully; it just takes ~20 seconds

3. **Not a bug** - This is expected for enterprise systems

## Timeline

| Step | Time | Status |
|------|------|--------|
| Click "Verify with Wallet" | 0s | Loading... |
| POST /api/authenticate | 0-20s | "Setting up verification..." |
| Receive QR code URL | ~20s | QR displays |
| Wait before polling | 20-21s | QR shown, waiting to poll |
| First status check | ~21s | Polling status... |
| Wallet presents credential | varies | "Verifying..." |
| Verification complete | varies | "Success!" or "Failed" |

## User Experience

The app now shows:
```
⏳ Setting up verification...
   This may take up to 30 seconds
```

This sets proper expectations that the initial wait is normal.

## Performance Notes

- ✅ QR code generates instantly (once response received)
- ✅ Copy button works immediately
- ✅ Polling starts 1 second after QR display
- ✅ Typical polling every 500ms
- ✅ Max timeout: 60 polls = 30 seconds

## If It's Taking Longer Than 30 Seconds

If the "Setting up verification..." message stays for longer than 30 seconds:

1. **Check browser console** for error messages
2. **Check Network tab** for failed requests
3. **Verify Walt.id is running** and accessible
4. **Check verifier target configuration** in `.env.local`

The issue would be one of:
- Walt.id backend is down/slow
- Network connectivity issue
- Authentication token failed
- Verifier endpoint misconfigured
