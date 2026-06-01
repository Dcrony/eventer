# QUICK REFERENCE: Onboarding, Auth & Discovery

## 🎯 ONE-PAGE SUMMARY

### Authentication Paths (All trigger role selection if `!roleConfirmed`)

```
EMAIL/PASSWORD PATH:
  register() → OTP → verify-otp() → [roleConfirmed: false] → RoleSelectionModal

LOGIN PATH:
  login() → [isVerified=false?] → OTP → verify-otp() → [roleConfirmed: false] → RoleSelectionModal
            → [isVerified=true & roleConfirmed=false] → RoleSelectionModal

GOOGLE PATH:
  firebase-sync() → [NEW: roleConfirmed: false, isVerified: true] → RoleSelectionModal
                  → [EXISTING: return as-is]
```

---

## 🔑 CRITICAL FIELDS

| Field | Default | Type | Purpose |
|-------|---------|------|---------|
| `role` | "user" | Enum | User type: organizer or attendee |
| **`roleConfirmed`** | **false** | **Boolean** | **⚠️ Onboarding gatekeeper** |
| `isVerified` | false | Boolean | Email verified? |
| `plan` | "free" | Enum | Trial/Pro tier |

---

## 📌 KEY LOCATIONS

### Role Selection Modal Triggers
- [VerifyEmailOtp.jsx](client/src/pages/VerifyEmailOtp.jsx#L108) - Line 108
- [Login.jsx](client/src/pages/Login.jsx#L94) - Lines 94, 144, 172
- [Register.jsx](client/src/pages/Register.jsx#L126) - Lines 126, 144

### User Schema
- [User.js](server/models/User.js) - Line 66-68: `roleConfirmed`, `isVerified`, `verificationCode`
- [User.js](server/models/User.js) - Line 74-81: `role` enum

### Role Setting Endpoints
- [setMyRole()](server/controllers/userController.js#L735) - PATCH `/users/me/role` (Line 735)
- [updateAccount()](server/controllers/settingsController.js#L249) - PUT `/settings/account` (Line 249)

### Discovery
- [Home.jsx](client/src/pages/Home.jsx#L23) - Categories (Line 23-29)
- [getAllEvents()](server/controllers/eventController.js#L404) - GET `/events` (Line 404)

---

## 🚨 MISSING INFRASTRUCTURE

| Feature | Status | Location |
|---------|--------|----------|
| User interests storage | ❌ Missing | Should be in User schema |
| Interest selection modal | ❌ Missing | Post-role selection |
| Category API | ❌ Missing | Should be in eventRoutes |
| Interest-based discovery | ❌ Missing | Home.jsx filtering |
| Onboarding step tracking | ❌ Missing | Should track 1-5 steps |
| Profile completion % | ❌ Missing | Should be calculated |

---

## 🔄 PAYLOAD FLOW EXAMPLE

### Registration Success Response

```javascript
// Backend returns from /auth/register:
{
  message: "Account created. Check your email for your verification code.",
  email: "user@example.com",
  verificationCode: "123456"  // Only in dev
}

// After OTP verification from /auth/verify-otp:
{
  message: "Email verified successfully! ✅",
  token: "eyJhbGci...",
  user: {
    _id: "...",
    id: "...",
    name: "John Doe",
    username: "johndoe",
    email: "user@example.com",
    role: "user",
    roleConfirmed: false,        // ⚠️ TRIGGERS MODAL
    isAdmin: false,
    isOrganizer: false,
    profilePic: "...",
    plan: "free",
    trialEndsAt: "2026-06-29T...",
    subscriptionStatus: "trialing",
    hasProAccess: false,
    trialDaysRemaining: 30,
    eventCount: 0,
    isVerified: true
  }
}

// Frontend detects !roleConfirmed → renders RoleSelectionModal
```

### After Role Selection

```javascript
// PATCH /users/me/role { role: "organizer" }

// Backend returns:
{
  message: "Role updated",
  user: {
    ...,
    role: "organizer",
    roleConfirmed: true  // ✅ Modal can close
  }
}

// Frontend:
// 1. login(updatedUser, token)
// 2. localStorage.setItem("token", token)
// 3. localStorage.setItem("user", JSON.stringify(updatedUser))
// 4. Navigate to /dashboard (organizer) or /events (user)
```

---

## 🎨 STATE MACHINE

```
[NEW_USER]
    ↓
[VERIFY_EMAIL] ← if email/password
    ↓
[ROLE_SELECTION] ← roleConfirmed: false
    ↓
[ONBOARDED] ← roleConfirmed: true
    ├─→ [ORGANIZER] → /dashboard
    └─→ [USER] → /events
```

---

## 📊 DISCOVERY SYSTEM

### Current Implementation (NO PERSONALIZATION)

```
User visits /events (Home.jsx)
  ↓
GET /events
  ↓
Return ALL public events (no user-based filtering)
  ↓
Frontend applies:
  • Category filter (hardcoded: music, tech, business, food, sports, online)
  • Search filter (title, location, category string match)
  • Sort (newest, popular, soonest)
  ↓
Display events (same for all users)
```

### Event Categories (Hardcoded)

```javascript
// client/src/pages/Home.jsx (Lines 23-29)
CHIPS = [
  { id: "all", label: "All" },
  { id: "music", label: "Music" },
  { id: "tech", label: "Tech" },
  { id: "business", label: "Business" },
  { id: "food", label: "Food" },
  { id: "sports", label: "Sports" },
  { id: "online", label: "Online" }
]
```

---

## 🔌 API ENDPOINT CHEAT SHEET

### Auth Endpoints
```
POST   /auth/register              Public    → OTP flow starts
POST   /auth/login                 Public    → Email/password login
POST   /auth/verify-otp            Public    → Verify 6-digit code
POST   /auth/firebase-sync         Public    → Google sign-in
POST   /auth/resend-otp            Public    → Resend OTP
```

### User/Settings Endpoints
```
GET    /users/me                   Auth      → Get current user
PATCH  /users/me/role              Auth      → SET ROLE (ONBOARDING)
PUT    /users/edit                 Auth      → Update profile
PUT    /settings/account           Auth      → Update account (incl. role)
PUT    /settings/privacy           Auth      → Privacy settings
PUT    /settings/notifications     Auth      → Notification prefs
```

### Event Endpoints
```
GET    /events                     Public    → ALL public events (no filter)
GET    /events/:id                 Public    → Event details
POST   /events/create              Auth      → Create event
```

---

## 💾 PERSISTENT DATA

### LocalStorage

```javascript
localStorage.getItem("token")                    // JWT token
localStorage.getItem("user")                     // User object (stringified)
localStorage.getItem("verifyEmail")              // Email for OTP verify
sessionStorage.getItem("pendingVerificationCode") // OTP code (dev only)
```

### AuthContext (In-Memory)

```javascript
{
  token: String,
  user: { _id, name, email, role, roleConfirmed, ... },
  isAuthenticated: Boolean,
  isBootstrapping: Boolean
}
```

---

## ❓ TROUBLESHOOTING

### Q: Role modal not showing after login?
**A:** Check if `userData.roleConfirmed` is `true`. Modal only shows if `false`.

**Files to check:**
- [Login.jsx](client/src/pages/Login.jsx#L94) - Line 94
- [loginResponse.user.roleConfirmed](server/controllers/authControllers.js#L37)

### Q: User getting stuck at role selection?
**A:** Role selection endpoint may have failed. Check:
- [RoleSelectionModal.jsx](client/src/components/RoleSelectionModal.jsx#L17) - Line 17 API call
- [setMyRole() backend](server/controllers/userController.js#L735) - Line 735

### Q: Why can't I change role in Settings?
**A:** Role change is implemented but may not trigger modal (already `roleConfirmed: true`).
- [Settings.jsx](client/src/components/Settings.jsx#L179) - Line 179 RoleSwitcher
- [updateAccount() backend](server/controllers/settingsController.js#L249) - Line 249

### Q: Discovery not showing my preferred categories?
**A:** Categories are hardcoded in frontend, no backend personalization.
- [Home.jsx](client/src/pages/Home.jsx#L23) - Line 23
- NO interest fields exist in User schema yet

---

## 🚀 IMPLEMENTATION PRIORITY

### High Priority (Blocks features)
1. Add `interests: [String]` to User schema
2. Add interest selection modal after role selection
3. Create GET `/categories` endpoint
4. Create PUT `/users/me/interests` endpoint

### Medium Priority (Improves UX)
5. Implement interest-based event filtering
6. Add profile completion tracking
7. Create personalizedEvent feed
8. Add onboarding step tracking

### Low Priority (Polish)
9. Interest recommendations
10. Follow-based discovery
11. Trending algorithms
12. Category management UI

---

## 📖 DETAILED REFERENCE DOCS

For comprehensive details, see: [ONBOARDING_FLOW_ANALYSIS.md](ONBOARDING_FLOW_ANALYSIS.md)

**Includes:**
- Full flow diagrams
- Complete schema documentation
- All API endpoints with descriptions
- Frontend component details
- Architecture overview
- Recommendations for enhancement

