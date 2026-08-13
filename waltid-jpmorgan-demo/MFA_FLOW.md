# MFA Authentication Flow

## Overview

The JPMorgan demo now implements a complete MFA (Multi-Factor Authentication) flow using credentials as a second factor. Users log in with email/password, then select their MFA method (wallet or SMS).

## User Flow

### 1. Home Page (`/`)
- Shows two main options:
  - **Complete Identity Verification** - For getting a credential (IDV flow with biometric scanning)
  - **Secure Login** - For logging in with credentials

### 2. Login Page (`/login`)
- User enters email and password
- For demo: accepts any email/password combination
- Email is stored in `sessionStorage` for later use
- On submit → redirects to MFA selection page

### 3. MFA Selection Page (`/mfa`)
- Shows two MFA method options:
  - **Verify with Wallet** (Recommended) - Uses credential verification
  - **Verify with SMS** - Uses SMS code verification (placeholder)
- User selects their preferred method
- Clicking either method stores choice and proceeds

### 4a. Wallet Verification (`/authenticate`)
- Shows QR code for wallet scanning
- Backend creates verification session requesting credential
- User scans with wallet and presents credential
- App polls for verification status
- On success:
  - Sets `mfaVerified=true` and `idvComplete=true` in sessionStorage
  - Redirects to dashboard after 1.5 seconds
- On failure:
  - Shows error and allows retry
  - Can return to login

### 4b. SMS Verification (Placeholder)
- Currently redirects directly to dashboard with MFA flag
- Can be implemented later

### 5. Dashboard (`/dashboard`)
- Protected page - requires login email in sessionStorage
- Shows employee portal with:
  - **Identity Verification Status**
    - `completed` - Shows green success banner if `idvComplete=true`
    - `pending` - Shows amber warning if `idvComplete=false` or missing
  - **Account Status** - Shows MFA is active
  - **Employee Information** - Department, role, email, hire date
  - **Security Actions** - Update password, manage credentials
- Logout clears sessionStorage and returns to login

## Data Flow

### Session Storage Keys
```
loginEmail          - User's email (set at login, used throughout)
mfaMethod          - Selected MFA method ('wallet' or 'sms')
mfaVerified        - Boolean flag indicating successful MFA
idvComplete        - Boolean flag indicating IDV credential claim
```

### Pages & Protection

| Page | Public | Requires Session | Storage Used |
|------|--------|-----------------|--------------|
| `/login` | ✓ | - | Sets `loginEmail` |
| `/mfa` | - | `loginEmail` | Sets `mfaMethod` |
| `/authenticate` | - | `loginEmail` | Sets `mfaVerified`, `idvComplete` |
| `/dashboard` | - | `loginEmail` + `mfaVerified` | Reads `idvComplete` for status |

## Identity Verification Status

The dashboard shows two possible states for Identity Verification:

### Completed ✓
- Credential has `idvComplete: true` claim
- Shows green banner: "Verification Complete"
- States: "Your identity has been successfully verified through wallet verification"
- Badge: "Verified via: Wallet Credential"

### Pending ⏳
- `idvComplete` is false or not set
- Shows amber banner: "Verification Pending"
- States: "Your identity verification is pending. Complete the verification process to unlock all features."
- Button: "Complete Verification" → redirects to `/mfa` to restart flow

## Key Features

✅ **Email/Password First Factor** - Traditional login credentials  
✅ **Credential-Based MFA** - Second factor using verified credentials  
✅ **Two MFA Options** - Wallet (primary) or SMS (placeholder)  
✅ **Biometric Scanning** - Nice UX for credential issuance  
✅ **Employee Portal** - Professional dashboard after auth  
✅ **Status Indicators** - Clear visual feedback for IDV status  
✅ **Session Management** - Clean logout and state management  

## Testing Flow

1. **Get a Credential:**
   - Go to `/` → "Complete Identity Verification"
   - Fill in identity form (any values OK)
   - See biometric scanning animation (2 seconds)
   - Scan QR code with wallet to issue credential with `idvComplete: true`

2. **Use Credential for Login:**
   - Go to `/login`
   - Enter any email and password
   - Select "Verify with Wallet"
   - Scan QR code with wallet
   - Verify credential
   - Redirected to dashboard showing "Verification Complete"

3. **Logout and Try SMS:**
   - Logout from dashboard
   - Login again
   - Select "Verify with SMS"
   - Immediately sees dashboard (SMS is placeholder)

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/authenticate` | POST | Create verification session for MFA |
| `/api/authenticate/status` | GET | Check verification session status |
| `/api/idv` | POST | Issue credential during IDV process |

## Future Enhancements

- Implement actual SMS verification backend
- Add password reset flow
- Add credential expiration handling
- Add device/location tracking
- Add audit logging for authentication events
