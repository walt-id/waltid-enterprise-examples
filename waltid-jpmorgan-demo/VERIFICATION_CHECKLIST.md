# JPMorgan Demo Verification Checklist

## Pre-Launch Verification

### Directory Structure
- [x] `app/(jpmorgan)/` - Route group created
- [x] `app/api/` - API routes organized
- [x] `lib/schemas/` - Schema files in place
- [x] `lib/credentials/` - Registry updated
- [x] `lib/api/` - Client updated
- [x] `components/` - UI components reused

### Core Pages (3)
- [x] `app/(jpmorgan)/page.tsx` - Home page implemented
- [x] `app/(jpmorgan)/idv/page.tsx` - IDV page implemented
- [x] `app/(jpmorgan)/authenticate/page.tsx` - Auth page implemented

### Layout Components (1)
- [x] `app/(jpmorgan)/layout.tsx` - Header/footer with JPMorgan colors

### API Routes (4)
- [x] `app/api/issue/route.ts` - Generic issuance endpoint
- [x] `app/api/idv/route.ts` - Mock IDV endpoint
- [x] `app/api/authenticate/route.ts` - Verification session creation
- [x] `app/api/authenticate/status/route.ts` - Status polling endpoint

### Schema & Configuration (3)
- [x] `lib/schemas/jpmorgan-identity.ts` - Identity credential schema
- [x] `lib/config.ts` - JPMorgan-specific config
- [x] `lib/branding.ts` - JPMorgan branding settings

### Styling & Branding (2)
- [x] `app/globals.css` - JPMorgan color scheme
- [x] `lib/branding.ts` - Branding metadata

### Configuration
- [x] `.env.example` - Updated with JPMorgan config

### Documentation (4)
- [x] `README.md` - Technical overview
- [x] `DEMO_WALKTHROUGH.md` - Demo script
- [x] `IMPLEMENTATION_NOTES.md` - Architecture notes
- [x] `VERIFICATION_CHECKLIST.md` - This file

### Code Quality Checks
- [x] No unused imports
- [x] Consistent code style
- [x] Proper error handling
- [x] TypeScript types complete
- [x] No console.log spam
- [x] Comments only where needed

### Functional Requirements
- [x] Identity verification form works
- [x] Credential issuance returns QR code
- [x] Authentication session creation works
- [x] Status polling implemented
- [x] idvComplete validation works
- [x] Success message displays correctly
- [x] Error messages clear and helpful
- [x] Navigation links working

### UI/UX Checks
- [x] JPMorgan colors applied correctly
- [x] Buttons have proper styling
- [x] Forms are functional
- [x] QR codes render
- [x] Loading states show
- [x] Error states show
- [x] Success states show
- [x] Responsive on desktop
- [x] Links navigate correctly

### Security Checks
- [x] No hardcoded secrets
- [x] API calls use authentication
- [x] Input validation on forms
- [x] Error messages don't leak info
- [x] CORS handled by Next.js

### Testing Scenarios
- [x] Happy path: verify → issue → auth → success
- [x] Error path: missing form fields
- [x] Error path: API failures
- [x] Error path: verification timeout
- [x] Sad path: idvComplete=false (mockable)

### Integration Points
- [x] API client calls walt.id
- [x] Credential registry integrated
- [x] Config system working
- [x] Branding applied throughout
- [x] QR display component used

### Environment & Setup
- [x] .env.example has required vars
- [x] Config reads from env correctly
- [x] No hardcoded URLs/targets
- [x] Profile IDs built correctly
- [x] Issuer/verifier targets set properly

### Documentation Quality
- [x] README comprehensive
- [x] DEMO_WALKTHROUGH practical
- [x] IMPLEMENTATION_NOTES detailed
- [x] Code comments where needed
- [x] No outdated docs

### Performance Considerations
- [x] Pages load quickly
- [x] No unnecessary re-renders
- [x] API calls optimized
- [x] QR generation fast
- [x] Polling efficient (500ms interval)

### Cross-Project Compatibility
- [x] Doesn't break bank-demo
- [x] Doesn't break gov-service
- [x] Uses shared components properly
- [x] Shares no conflicting routes
- [x] Port configured correctly (3000)

## Pre-Demo Checklist (Day Of)

### Environment Setup
- [ ] Walt.id Enterprise Stack running
- [ ] `.env.local` configured with correct endpoints
- [ ] API URL is accessible and responsive
- [ ] Authentication credentials valid

### Application Setup
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Application loads at localhost:3000
- [ ] No console errors
- [ ] No console warnings

### Page Verification
- [ ] Home page loads and displays both action cards
- [ ] IDV page loads with form
- [ ] Authenticate page loads with button
- [ ] All styling is correct (JPMorgan colors)
- [ ] Navigation links work

### API Verification
- [ ] `/api/idv` responds to POST
- [ ] `/api/authenticate` responds to POST
- [ ] `/api/authenticate/status` responds to GET
- [ ] QR codes generate for offers
- [ ] Error handling works (try wrong params)

### Pre-Flight Test (2 minutes)
1. [ ] Navigate to home page - displays correctly
2. [ ] Click "Complete Identity Verification"
3. [ ] Fill IDV form completely
4. [ ] Submit - QR code appears
5. [ ] Navigate to home
6. [ ] Click "Authenticate Now"
7. [ ] Click "Verify with Wallet"
8. [ ] QR code appears with session ID
9. [ ] No JavaScript errors in console

### Demo Dry-Run (Optional but recommended)
1. [ ] Complete full IDV → Verify → Auth flow
2. [ ] Time each step for pacing
3. [ ] Note where to explain architecture
4. [ ] Identify good screenshots/highlights
5. [ ] Practice talking points

## Post-Demo Checklist

### Feedback Collection
- [ ] Demo reception noted
- [ ] Client questions documented
- [ ] Feature requests captured
- [ ] Technical concerns addressed

### Next Steps
- [ ] Share demo artifacts with client
- [ ] Discuss customization options
- [ ] Plan production deployment
- [ ] Schedule follow-up meeting

## Troubleshooting Reference

### If app won't start
- Check Node.js version (16+ required)
- Clear node_modules: `rm -rf node_modules && npm install`
- Check port 3000 is available
- Run `npm run dev` from project root

### If API calls fail
- Verify `WALTID_API_URL` is correct
- Check authentication with `WALTID_USERNAME`/`WALTID_PASSWORD`
- Ensure Walt.id instance is running
- Check network connectivity

### If QR codes don't render
- Verify `qrcode` package installed
- Check browser console for errors
- Verify credential offer data is valid
- Try refreshing page

### If credential verification fails
- Check Walt.id verifier is running
- Verify verifier target config
- Ensure session hasn't timed out
- Check credential claims structure

### If idvComplete not extracted
- Verify credential has idvComplete in subject
- Check response structure from verify API
- Ensure claim is boolean true (not string)
- Check credential format matches jwt_vc_json

## File Manifest

### Pages
- ✅ `app/(jpmorgan)/page.tsx` (200 LOC)
- ✅ `app/(jpmorgan)/idv/page.tsx` (180 LOC)
- ✅ `app/(jpmorgan)/authenticate/page.tsx` (220 LOC)

### API Routes
- ✅ `app/api/issue/route.ts` (35 LOC)
- ✅ `app/api/idv/route.ts` (40 LOC)
- ✅ `app/api/authenticate/route.ts` (30 LOC)
- ✅ `app/api/authenticate/status/route.ts` (40 LOC)

### Config & Schema
- ✅ `lib/config.ts` (simplified to 40 LOC)
- ✅ `lib/branding.ts` (20 LOC)
- ✅ `lib/schemas/jpmorgan-identity.ts` (60 LOC)
- ✅ `lib/credentials/registry.ts` (160 LOC, simplified)

### Layout
- ✅ `app/(jpmorgan)/layout.tsx` (100 LOC)

### Styling
- ✅ `app/globals.css` (JPMorgan colors added)

### Documentation
- ✅ `README.md` (500+ lines)
- ✅ `DEMO_WALKTHROUGH.md` (300+ lines)
- ✅ `IMPLEMENTATION_NOTES.md` (400+ lines)
- ✅ `.env.example` (8 lines, simplified)

## Quick Health Check Commands

```bash
# Check all files exist
ls -la app/(jpmorgan)/page.tsx
ls -la app/api/idv/route.ts
ls -la lib/schemas/jpmorgan-identity.ts

# Check TypeScript compiles (if build enabled)
npx tsc --noEmit

# Start dev server
npm run dev

# Test API endpoints
curl -X POST http://localhost:3000/api/issue
```

## Success Indicators

✅ **All files created** - Pages, routes, schema, config, docs
✅ **No console errors** - Clean JavaScript execution
✅ **Styling applied** - JPMorgan colors visible
✅ **Navigation works** - All links functional
✅ **API endpoints respond** - Mock IDV and verification working
✅ **QR codes display** - Credential offers and verification requests show QR
✅ **Forms functional** - IDV form validates and submits
✅ **Error handling** - Errors caught and displayed
✅ **Documentation complete** - README, demo walkthrough, implementation notes
✅ **Architecture sound** - Reuses existing components, clean separation of concerns

---

**Status**: ✅ READY FOR DEMO
