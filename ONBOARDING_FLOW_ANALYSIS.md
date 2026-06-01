# COMPLETE MERN CODEBASE: ONBOARDING, AUTH & DISCOVERY FLOW

**Last Updated:** May 2026

---

## 📋 EXECUTIVE SUMMARY

This document maps the **entire user onboarding, authentication, and discovery flow** in the TickiSpot MERN codebase.

### Key Findings:
- ✅ **Role selection modal is fully implemented** and triggered after auth (email/password or Google)
- ✅ **`roleConfirmed` field tracks onboarding state** in User schema
- ❌ **NO interest/preference system** - Discovery is generic, not personalized
- ❌ **NO category management API** - Categories are hardcoded in frontend
- ✅ **Three auth paths all converge** on role selection modal if `!roleConfirmed`
- ✅ **Subscription/trial system** integrated with registration

---

## 🔐 AUTHENTICATION & ONBOARDING

### 1. Registration Flow (Email/Password)

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Register.jsx                                      │
├─────────────────────────────────────────────────────────────┤
│ User enters: fullName, username, email, phone, password     │
│                                                              │
│ Validation:                                                 │
│ ├─ Full name: required, < 50 chars                         │
│ ├─ Username: required, unique, alphanumeric                │
│ ├─ Email: valid format, unique                             │
│ ├─ Phone: optional                                         │
│ └─ Password: >= 6 chars                                    │
│                                                              │
│ handleSubmit():                                             │
│ └─ POST /auth/register (FormData)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: authControllers.js - register()                   │
├─────────────────────────────────────────────────────────────┤
│ 1. Validate request body                                    │
│ 2. Check email/username uniqueness                          │
│ 3. Hash password (bcrypt, 10 rounds)                        │
│ 4. Generate OTP: 6-digit random number                      │
│ 5. Hash OTP with SHA256                                     │
│ 6. Create user:                                             │
│    {                                                        │
│      name, username, email, phone,                          │
│      password: bcrypt(password),                            │
│      role: "user",               ← Default                 │
│      roleConfirmed: false,       ← KEY: Not onboarded yet  │
│      isVerified: false,                                     │
│      verificationCode: sha256(otp),                         │
│      verificationCodeExpires: now + 10min                   │
│    }                                                        │
│ 7. assignTrialToUser(user)  ← Free trial auto-granted     │
│ 8. Save user to DB                                         │
│ 9. sendEmail(email, otpEmail(otp))                         │
│ 10. Return: { email, verificationCode?, message }          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend: VerifyEmailOtp.jsx                               │
├─────────────────────────────────────────────────────────────┤
│ Email: localStorage("verifyEmail")                          │
│ OTP input: 6 digit boxes with autofocus                     │
│                                                              │
│ handleVerifyOtp():                                          │
│ └─ POST /auth/verify-otp { email, otp }                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: authControllers.js - verifyEmailOtp()            │
├─────────────────────────────────────────────────────────────┤
│ 1. Find user by email                                       │
│ 2. Verify OTP not expired (10min window)                    │
│ 3. Hash input OTP, compare with stored hash                 │
│ 4. If valid:                                                │
│    user.isVerified = true                                   │
│    Clear verification fields                                │
│    Save user                                                │
│ 5. sendWelcomeEmail()                                       │
│ 6. token = signAuthToken(user)  ← includes roleConfirmed   │
│ 7. Return: { token, user, message }                         │
│    user: {                                                  │
│      ...,                                                   │
│      roleConfirmed: false  ← ⚠️ CRITICAL                   │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend: VerifyEmailOtp.jsx (cont.)                       │
├─────────────────────────────────────────────────────────────┤
│ Check response.data.user.roleConfirmed                      │
│                                                              │
│ if (!pendingRoleUser.roleConfirmed) {                       │
│   setPendingRoleUser(user);                                 │
│   setPendingRoleToken(token);                               │
│   → Render RoleSelectionModal                               │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
```

### 2. Login Flow (Email/Password)

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Login.jsx                                         │
├─────────────────────────────────────────────────────────────┤
│ User enters: email, password                                │
│                                                              │
│ handleSubmit():                                             │
│ └─ POST /auth/login { email, password }                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: authControllers.js - login()                      │
├─────────────────────────────────────────────────────────────┤
│ 1. Find user by email                                       │
│ 2. Compare password hash                                    │
│ 3. Check if isVerified                                      │
│    └─ If false:                                             │
│       ├─ Generate new OTP                                   │
│       ├─ Save OTP to user                                   │
│       ├─ sendEmail(otp)                                     │
│       └─ Return 403, code: "OTP_SENT", email, otp?         │
│ 4. If verified:                                             │
│    token = signAuthToken(user)                              │
│    Return: { token, user, message }                         │
│           user includes roleConfirmed field                │
└─────────────────────────────────────────────────────────────┘
                            ↓
         ┌──────────────────┴──────────────────┐
         ↓                                     ↓
    BRANCH A:              BRANCH B:
    !isVerified            isVerified
         │                     │
         ↓                     ↓
    Redirect to         Check !roleConfirmed?
    /verify-otp               │
                              ├─ YES → Show RoleSelectionModal
                              └─ NO → Navigate to /dashboard or /events
```

### 3. Google Sign-In Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Login.jsx or Register.jsx                         │
├─────────────────────────────────────────────────────────────┤
│ Click "Sign in with Google"                                 │
│                                                              │
│ handleGoogleLogin/handleGoogleSignup():                     │
│ ├─ signInWithGoogleAndGetIdToken()                         │
│ └─ POST /auth/firebase-sync { idToken }                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: authControllers.js - firebaseSync()              │
├─────────────────────────────────────────────────────────────┤
│ 1. Verify idToken with Firebase Admin SDK                   │
│ 2. Extract: email, name, uid                                │
│ 3. Look up user by firebaseUid or email                     │
│                                                              │
│ ┌─ CASE A: NEW USER ────────────────────────────────────┐  │
│ │ Create user:                                          │  │
│ │ {                                                     │  │
│ │   name: firebaseName || email.split("@")[0],        │  │
│ │   username: ensureUniqueUsername(displayName),       │  │
│ │   email: emailLower,                                 │  │
│ │   firebaseUid: uid,                                  │  │
│ │   role: "user",            ← Default                │  │
│ │   roleConfirmed: false,    ← ⚠️ MUST CONFIRM       │  │
│ │   isVerified: true,        ← Auto-verified (Google) │  │
│ │ }                                                     │  │
│ │ assignTrialToUser(user)                              │  │
│ │ sendWelcomeEmail()                                   │  │
│ │ Return 201: { token, user: { roleConfirmed: false } } │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ CASE B: LEGACY UNVERIFIED USER ──────────────────────┐  │
│ │ Auto-verify, link Firebase UID, grant trial if missing  │  │
│ │ Return: { token, user: { roleConfirmed: ... } }      │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ CASE C: EXISTING VERIFIED USER ─────────────────────┐  │
│ │ Normal login (may have roleConfirmed already)        │  │
│ │ Return: { token, user }                              │  │
│ └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Login.jsx or Register.jsx (cont.)                │
├─────────────────────────────────────────────────────────────┤
│ Check userData.isVerified && !userData.roleConfirmed        │
│                                                              │
│ YES: Show RoleSelectionModal                                │
│ NO:  login(userData, token) → Navigate                      │
└─────────────────────────────────────────────────────────────┘
```

### 4. Role Selection Modal (Critical Onboarding Step)

```
┌─────────────────────────────────────────────────────────────┐
│ Component: RoleSelectionModal.jsx                          │
├─────────────────────────────────────────────────────────────┤
│ Fixed overlay (z-50)                                        │
│                                                              │
│ ┌─ Content ────────────────────────────────────────────┐  │
│ │ Welcome, {firstName}!                                │  │
│ │ "How will you use TickiSpot?                         │  │
│ │  You can change this in Settings anytime."           │  │
│ │                                                       │  │
│ │ [ROLE CARD 1]              [ROLE CARD 2]             │  │
│ │ ┌────────────────┐         ┌────────────────┐        │  │
│ │ │ 🗓️ Organizer   │         │ 🎟️ Attendee    │        │  │
│ │ │ Create events, │         │ Discover       │        │  │
│ │ │ sell tickets,  │         │ events, buy    │        │  │
│ │ │ manage...      │         │ tickets...     │        │  │
│ │ │ [Select] ✓     │         │ [Select]       │        │  │
│ │ └────────────────┘         └────────────────┘        │  │
│ │                                                       │  │
│ │ [CONTINUE BUTTON]                                    │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                              │
│ State: role = "user" (default)                              │
│                                                              │
│ handleContinue():                                           │
│ ├─ PATCH /users/me/role { role } with Auth header         │
│ ├─ (uses token from props)                                │
│ └─ onComplete(role)  ← Callback to parent                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: userController.js - setMyRole()                   │
├─────────────────────────────────────────────────────────────┤
│ 1. Validate role in ["organizer", "user"]                  │
│ 2. Update user:                                             │
│    { role, roleConfirmed: true }  ← Mark as onboarded     │
│ 3. Return: { message, user }                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Parent component (Login/Register/VerifyOtp)      │
├─────────────────────────────────────────────────────────────┤
│ handleRoleSelected(role):                                   │
│ 1. updatedUser = { ...pendingRoleUser, role, roleConfirmed: true }
│ 2. login(updatedUser, pendingRoleToken)  ← AuthContext     │
│    ├─ localStorage.setItem("token", token)                 │
│    ├─ localStorage.setItem("user", JSON.stringify(user))   │
│    └─ Dispatch "userLogin" event                           │
│ 3. Navigate based on role:                                 │
│    ├─ "organizer" → /dashboard                             │
│    └─ "user" → /events or location.state.from             │
└─────────────────────────────────────────────────────────────┘
```

---

## 👤 USER SCHEMA & ONBOARDING FIELDS

### User Model: `server/models/User.js`

```javascript
{
  // ─── IDENTITY ─────────────────────────────────────
  _id: ObjectId,
  name: String (required),
  username: String (required, unique),
  email: String (required, unique, lowercase),
  phone: String (optional),
  bio: String,
  
  // ─── AUTHENTICATION ───────────────────────────────
  password: String (min 6 chars, bcrypted),
  firebaseUid: String (sparse, unique),
  isVerified: Boolean (default: false),
  
  // ─── OTP VERIFICATION FIELDS ──────────────────────
  verificationCode: String (SHA256 hashed),
  verificationCodeExpires: Date,
  
  // ─── ROLE & ONBOARDING ────────────────────────────
  role: String (enum: ["super_admin", "admin", "moderator", 
                       "finance_admin", "support_admin", 
                       "organizer", "user"])
             (default: "user"),
  
  roleConfirmed: Boolean (default: false)  ← ⚠️ ONBOARDING STATE
  
  // ─── SUBSCRIPTION & TRIAL ─────────────────────────
  plan: String (enum: ["free", "trial", "pro"], default: "free"),
  trialEndsAt: Date,
  subscriptionStatus: String (enum: ["inactive", "trialing", 
                                     "active", "cancelled", 
                                     "expired", "past_due"])
  
  // ─── IMAGES ───────────────────────────────────────
  profilePic: String (default: "1754696275588.jpg"),
  coverPic: String (default: "1754696275588.jpg"),
  
  // ─── SOCIAL ────────────────────────────────────────
  following: [ObjectId] (ref: User),
  followers: [ObjectId] (ref: User),
  favorites: [ObjectId] (ref: Event),
  
  // ─── PREFERENCES ──────────────────────────────────
  privacy: {
    showProfile: Boolean (default: true),
    showActivity: Boolean (default: false),
    searchable: Boolean (default: true)
  },
  
  notifications: {
    likes: Boolean (default: true),
    comments: Boolean (default: true),
    follows: Boolean (default: true),
    eventReminders: Boolean (default: true),
    emailAlerts: Boolean (default: true),
    appPush: Boolean (default: true),
    smsAlerts: Boolean (default: false),
    newsletter: Boolean (default: false)
  },
  
  eventPreferences: {
    defaultTicketPrice: Number (default: 0),
    eventVisibility: String (enum: ["public", "private"], 
                            default: "public"),
    autoPublishEvents: Boolean (default: false)
  },
  
  // ─── INTEGRATIONS ─────────────────────────────────
  integrations: {
    stripe: { connected, label, accountId, ... },
    googleCalendar: { connected, label, accessToken, ... },
    zoom: { connected, label, accessToken, ... }
  },
  
  // ─── BILLING ───────────────────────────────────────
  billing: {
    plan: String (default: "Free"),
    cycle: String (enum: ["monthly", "yearly"]),
    nextBillingDate: Date,
    paystackCustomerCode: String,
    billingStatus: String (enum: ["inactive", "active", "pending"])
  },
  
  // ─── METADATA ──────────────────────────────────────
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean (default: false),
  deletedAt: Date
}
```

### ⚠️ MISSING FIELDS (Recommendations)

```javascript
// Should add for complete onboarding:
{
  // Onboarding tracking
  onboardingStep: Number (0-5, track progress),
  onboardingCompleted: Boolean,
  onboardingCompletedAt: Date,
  
  // Interest/Preference system
  interests: [String],  // ["music", "tech", "business", ...]
  preferredCategories: [String],
  eventPreferences.categories: [String],
  
  // Profile completion
  profileCompletion: {
    percentage: Number (0-100),
    fields: {
      bio: Boolean,
      location: Boolean,
      profilePic: Boolean,
      interests: Boolean,
      ...
    }
  }
}
```

---

## 📡 API ENDPOINTS

### Auth Routes: `server/routes/authRoutes.js`

| Method | Endpoint | Public | Purpose |
|--------|----------|--------|---------|
| POST | `/auth/register` | ✅ | Email/password signup + OTP generation |
| POST | `/auth/login` | ✅ | Email/password login |
| POST | `/auth/verify-otp` | ✅ | Verify 6-digit OTP code |
| POST | `/auth/resend-otp` | ✅ | Resend OTP to email |
| POST | `/auth/firebase-sync` | ✅ | Google sign-in/signup |
| POST | `/auth/verify-email` | ✅ | Legacy token-based verification |
| POST | `/auth/forgot-password` | ✅ | Password reset request |
| POST | `/auth/reset-password` | ✅ | Reset password with token |

### User Routes: `server/routes/userRoutes.js`

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/users/me` | ✅ | Get current user profile |
| PATCH | `/users/me/role` | ✅ | **SET ROLE (ONBOARDING)** |
| PUT | `/users/edit` | ✅ | Update profile fields |
| POST | `/users/me/upload` | ✅ | Upload profile picture |
| POST | `/users/me/cover` | ✅ | Upload cover image |
| GET | `/users/:id` | ✅ | Get user profile by ID |
| GET | `/users/public/:identifier` | ✅ | Get public profile |
| GET | `/users/creators` | ✅ | Get creator list |
| POST | `/users/:id/follow` | ✅ | Follow user |

### Settings Routes: `server/routes/settingsRoutes.js`

| Method | Endpoint | Purpose | Fields |
|--------|----------|---------|--------|
| GET | `/settings/me` | Get all settings | All sections |
| PUT | `/settings/account` | Update account | name, username, email, phone, bio, **role** |
| PUT | `/settings/privacy` | Privacy settings | showProfile, showActivity, searchable |
| PUT | `/settings/notifications` | Notification prefs | 8 toggle fields |
| PUT | `/settings/security` | Security settings | 2FA, password changes |
| PUT | `/settings/event-preferences` | Event organizer prefs | defaultTicketPrice, visibility, autoPublish |
| PUT | `/settings/billing` | Billing settings | plan, cycle |

### Event Routes: `server/routes/eventRoutes.js`

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/events` | ✅ | **Get all public events (NO personalization)** |
| GET | `/events/:id` | ✅ | Get event details |
| POST | `/events/create` | ✅ | Create new event |
| POST | `/events/drafts` | ✅ | Save event draft |
| PUT | `/events/update/:eventId` | ✅ | Update event |
| DELETE | `/events/delete/:eventId` | ✅ | Delete event |

---

## 🎨 FRONTEND COMPONENTS & STATE FLOW

### Auth Context: `client/src/context/AuthContext.jsx`

```javascript
const AuthContext = {
  token: String,
  user: {
    _id: ObjectId,
    name: String,
    username: String,
    email: String,
    role: "user" | "organizer" | "admin",
    roleConfirmed: Boolean  ← ⚠️ KEY FIELD
    isAdmin: Boolean,
    isOrganizer: Boolean,
    profilePic: String,
    plan: "free" | "trial" | "pro",
    trialEndsAt: Date | null,
    subscriptionStatus: String,
    hasProAccess: Boolean,
    isVerified: Boolean,
    ...
  },
  isAuthenticated: Boolean,
  isBootstrapping: Boolean,
  
  methods: {
    login(user, token),      // persistAuth()
    logout(),                // clearAuth()
    refreshUser()            // fetch /users/me
  }
}
```

**Persistence:**
```javascript
localStorage.getItem("token")        // JWT token
localStorage.getItem("user")         // User object (JSON)
localStorage.getItem("verifyEmail")  // Email for OTP verification

sessionStorage.getItem("pendingVerificationCode")  // OTP for dev/debug
```

### Role Selection Modal: `client/src/components/RoleSelectionModal.jsx`

**Props:**
```javascript
{
  user: { _id, name, email, ... },      // From auth flow
  token: "jwt-token",                   // For API call
  onComplete: (role) => void            // Callback
}
```

**Role Options:**
```javascript
[
  {
    id: "organizer",
    label: "Event organizer",
    desc: "Create events, sell tickets, manage attendees and track sales.",
    icon: <CalendarDays />,
    iconBg: "bg-pink-100"
  },
  {
    id: "user",
    label: "Event attendee",
    desc: "Discover events, buy tickets, and follow creators you love.",
    icon: <Ticket />,
    iconBg: "bg-blue-100"
  }
]
```

**Flow:**
```
user selects role
    ↓
PATCH /users/me/role { role }
    ↓
Backend: { role, roleConfirmed: true }
    ↓
onComplete(role)
    ↓
login(updatedUser, token)
    ↓
Navigate to /dashboard or /events
```

### Login & Registration Pages

**Login.jsx** (`client/src/pages/Login.jsx`)
- Email/password form
- Google sign-in button
- **Role modal trigger:** Lines 94, 144, 172
- Redirects to dashboard or /events

**Register.jsx** (`client/src/pages/Register.jsx`)
- Full form: fullName, username, email, phone, password
- Google signup button
- **Role modal trigger:** Lines 126, 144
- Redirect to /verify-otp

**VerifyEmailOtp.jsx** (`client/src/pages/VerifyEmailOtp.jsx`)
- 6 digit input boxes with autofocus
- Resend OTP button
- **Role modal trigger:** Line 108
- Timer: 10 minutes (600 seconds)

### Settings Component: `client/src/components/Settings.jsx`

**Tabs:**
1. **Account** - name, username, email, phone, bio, **role** ← Can change role here
2. **Privacy** - showProfile, showActivity, searchable
3. **Notifications** - 8 toggles
4. **Security** - 2FA, password
5. **Event Preferences** - organizer-specific settings
6. **Billing** - Plan, cycle
7. **Connected Apps** - Stripe, Google Calendar, Zoom
8. **Support** - Help links
9. **Danger Zone** - Deactivate, delete account

**Role Switcher:**
```javascript
// Lines 179-200 in Settings.jsx
RoleSwitcher({ currentRole, onChange })
  ├─ "organizer" button
  └─ "user" button
  
// Saves via: PUT /settings/account { role, ... }
```

### Homepage/Discovery: `client/src/pages/Home.jsx`

**Hardcoded Categories:**
```javascript
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

**Filtering Logic:**
```javascript
applyFilters(items, search, filter, sort):
  └─ String match on: title, location, category
  └─ NO user interest-based filtering
  └─ Sort: "newest", "popular" (likes/sales), "soonest"
```

**Data Fetching:**
```javascript
GET /events
  └─ Returns all public events
  └─ No personalization by user role/interests
```

---

## 🔍 DISCOVERY & RECOMMENDATION SYSTEM

### Current State: ❌ NO PERSONALIZATION

**Homepage** (`client/src/pages/Home.jsx`)
- Fetches ALL public events from `/events`
- Filters by hardcoded categories (music, tech, business, food, sports, online)
- No consideration of:
  - User role (organizer vs attendee)
  - User interests/preferences
  - User's event history
  - Followed creators
  - Saved favorites

**Event Categories:**
- Frontend: 7 hardcoded chips
- Backend: Simple `String` field (no enum, no validation)
- **No API endpoint** to list all categories
- **No interest/preference matching**

**Other Discovery Pages:**
- [DiscoverCreators.jsx](DiscoverCreators.jsx) - Browse creators (no personalization)
- [Community.jsx](Community.jsx) - Social feed (posts from all users)

### Current Event Model: `server/models/Event.js`

```javascript
{
  title: String,
  description: String,
  category: String,           ← Simple string, no enum
  startDate: Date,
  startTime: String,
  location: String,
  image: String,
  eventType: String (enum: ["In-person", "Virtual", "Hybrid"]),
  visibility: String (enum: ["public", "private"]),
  
  // ❌ NO USER INTEREST FIELDS
  // ❌ NO METADATA FOR RECOMMENDATIONS
  
  createdBy: ObjectId (ref: User),
  ...
}
```

---

## 📊 COMPLETE FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────────────┐
│                         START: NEW USER                              │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ↓                         ↓
            ┌─────────────────┐      ┌──────────────────┐
            │  Email/Password │      │  Google Sign-In  │
            │   Registration  │      │                  │
            └─────────────────┘      └──────────────────┘
                    │                         │
                    ├─ POST /register    ├─ POST /firebase-sync
                    │                    └─ role="user"
                    ├─ Generate OTP        └─ isVerified=true
                    │
                    ├─ role="user"         ┌──────────────────┐
                    ├─ roleConfirmed=false │  NEW USER STATE  │
                    └─ isVerified=false    ├──────────────────┤
                                           │ role: "user"     │
                                           │ roleConfirmed: F │
                                           │ isVerified: T    │
                                           └──────────────────┘
                    │                         │
                    ├─ POST /verify-otp   ────┤
                    │                         │
                    └─ isVerified=true ───────┘
                                 │
                                 ↓
                    ┌──────────────────────────┐
                    │  roleConfirmed = FALSE?  │
                    └──────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ↓                         ↓
                   YES                       NO
                    │                        │
                    ↓                        ↓
          ┌────────────────────┐   ┌──────────────────┐
          │ RoleSelectionModal │   │   Navigate to    │
          │                    │   │  /dashboard or   │
          │ • Organizer        │   │    /events       │
          │ • Attendee         │   └──────────────────┘
          └────────────────────┘
                    │
                    ├─ PATCH /users/me/role
                    └─ roleConfirmed=true
                                 │
                                 ↓
                    ┌──────────────────────────┐
                    │   login(user, token)     │
                    │   Persist to localStorage│
                    │   Dispatch "userLogin"   │
                    └──────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ↓                         ↓
            ┌──────────────┐         ┌──────────────┐
            │ ORGANIZER    │         │ ATTENDEE     │
            │              │         │              │
            │ /dashboard   │         │ /events      │
            │ • Create     │         │ • Browse     │
            │   events     │         │   events     │
            │ • Manage     │         │ • Buy tickets│
            │   tickets    │         │ • Follow     │
            │ • Analytics  │         │   creators   │
            └──────────────┘         └──────────────┘
                    │                         │
                    │        ┌────────────────┤
                    │        ↓                ↓
                    │    ┌─────────────────────────┐
                    │    │  Home.jsx Discovery     │
                    │    │                         │
                    │    │  Hardcoded categories:  │
                    │    │  • All                  │
                    │    │  • Music                │
                    │    │  • Tech                 │
                    │    │  • Business             │
                    │    │  • Food                 │
                    │    │  • Sports               │
                    │    │  • Online               │
                    │    │                         │
                    │    │  ❌ NO personalization │
                    │    │     by interests        │
                    │    └─────────────────────────┘
```

---

## 🎯 KEY QUESTIONS ANSWERED

### ✅ Q: Is there an onboarding state in the user schema?
**A:** YES - `roleConfirmed: Boolean (default: false)`
- Set to `true` when user completes role selection in modal or settings
- Checked on every auth response to determine if modal should show
- Single source of truth for onboarding completion

### ✅ Q: What fields exist for role selection, interests, onboarding status?
**A:**
- ✅ `role` (user, organizer, admin, etc.)
- ✅ `roleConfirmed` (tracks if role selection complete)
- ❌ **NO interest fields** (missing)
- ❌ **NO onboarding step tracking** (missing)
- ❌ **NO profile completion status** (missing)

### ✅ Q: Where does the modal currently appear?
**A:** In 3 places, all triggered by `!userData.roleConfirmed`:
1. [VerifyEmailOtp.jsx](client/src/pages/VerifyEmailOtp.jsx) - Line 108
2. [Login.jsx](client/src/pages/Login.jsx) - Lines 94, 144, 172
3. [Register.jsx](client/src/pages/Register.jsx) - Lines 126, 144

### ✅ Q: What API endpoints exist for updating user profile/role/interests?
**A:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/users/me/role` | PATCH | Set user role ✅ |
| `/users/edit` | PUT | Update profile |
| `/settings/account` | PUT | Update account (incl. role) |
| **NO interest endpoints** | - | ❌ Missing |

### ✅ Q: How are event categories currently implemented?
**A:**
- **Frontend:** Hardcoded 7 categories in [Home.jsx](Home.jsx) - lines 23-29
- **Backend:** Simple `category: String` field in Event model (no enum, no validation)
- **No API:** No endpoint to list or manage categories
- **Filtering:** String matching on frontend only

### ✅ Q: Is there existing interest/preference logic to reuse?
**A:** PARTIAL
- ✅ **Preference system exists** for:
  - Privacy settings
  - Notification preferences
  - Event organizer preferences
- ❌ **NO interest system** for:
  - User interest categories
  - Event category preferences
  - Personalized discovery

### ✅ Q: How does the homepage discovery work currently?
**A:**
1. **Data:** GET `/events` (returns all public events, no filtering)
2. **Frontend filtering:** applyFilters() - string match on title, location, category
3. **Sorting:** newest, popular (by likes/sales), soonest
4. **Categories:** Hardcoded UI filter (no API, just frontend logic)
5. **Personalization:** NONE - same for all users regardless of role or interests

---

## 🛠️ ARCHITECTURE SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                     │
├─────────────────────────────────────────────────────────────┤
│ Routes:        authRoutes.js                                │
│ Controller:    authControllers.js                           │
│                                                              │
│ Methods:                                                    │
│ ├─ register()          → OTP verification flow             │
│ ├─ login()            → OTP if !isVerified                │
│ ├─ verifyEmailOtp()   → Auto-verify, return token         │
│ ├─ firebaseSync()     → Google auth, create user          │
│ └─ resendOtp()        → Resend OTP to email               │
│                                                              │
│ Key Logic:                                                  │
│ ├─ All NEW users → roleConfirmed: false                   │
│ ├─ Google users → isVerified: true (auto)                 │
│ ├─ Email/password → isVerified: false (OTP required)      │
│ └─ Trial auto-assigned on creation                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  ONBOARDING LAYER                           │
├─────────────────────────────────────────────────────────────┤
│ Frontend:      RoleSelectionModal.jsx                       │
│ Backend Route: /users/me/role (PATCH)                       │
│ Controller:    userController.js - setMyRole()             │
│                                                              │
│ Process:                                                    │
│ 1. Check !userData.roleConfirmed after auth               │
│ 2. Show modal with "Organizer" | "Attendee" options       │
│ 3. User selects, PATCH /users/me/role { role }            │
│ 4. Backend sets roleConfirmed: true                        │
│ 5. Frontend navigates to dashboard (org) or /events (user) │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  DISCOVERY LAYER (CURRENT)                  │
├─────────────────────────────────────────────────────────────┤
│ Frontend:      Home.jsx, DiscoverCreators.jsx             │
│ Backend:       /events (GET)                               │
│ Categories:    Hardcoded (music, tech, business, ...)     │
│                                                              │
│ Limitations:                                                │
│ ├─ NO personalization by user interests                    │
│ ├─ NO user role consideration                              │
│ ├─ NO recommendation logic                                 │
│ ├─ Categories are frontend-only (no API)                   │
│ └─ Same feed for all users                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  SETTINGS LAYER                             │
├─────────────────────────────────────────────────────────────┤
│ Frontend:      Settings.jsx                                 │
│ Routes:        settingsRoutes.js                           │
│ Controller:    settingsController.js                        │
│                                                              │
│ Editable sections:                                          │
│ ├─ Account (name, email, phone, bio, ROLE)               │
│ ├─ Privacy (visibility, activity, searchable)             │
│ ├─ Notifications (8 toggles)                              │
│ ├─ Security (2FA, password)                               │
│ ├─ Event Preferences (for organizers)                     │
│ ├─ Billing & Integrations                                 │
│ └─ Danger Zone (deactivate/delete)                        │
│                                                              │
│ Role change via settings:                                  │
│ └─ PUT /settings/account { role } → roleConfirmed: true   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 IMPLEMENTATION CHECKLIST FOR PERSONALIZATION

### Current Gaps:
- [ ] No user interests/preferences storage
- [ ] No category management API
- [ ] No personalized event feed
- [ ] No recommendation algorithm
- [ ] No interest selection during onboarding
- [ ] No profile completion tracking

### Recommended Additions:
- [ ] Add `interests: [String]` to User schema
- [ ] Create Category model with seed data
- [ ] Add interest selection to onboarding flow
- [ ] Create GET `/categories` endpoint
- [ ] Create PUT `/users/me/interests` endpoint
- [ ] Implement interest-based event filtering
- [ ] Add profile completion percentage
- [ ] Create personalized home feed

---

## 📚 REFERENCE FILES

### Backend Core
- [server/models/User.js](server/models/User.js) - User schema (66-68: roleConfirmed)
- [server/controllers/authControllers.js](server/controllers/authControllers.js) - Auth logic
- [server/controllers/userController.js](server/controllers/userController.js) - User endpoints (L735: setMyRole)
- [server/controllers/settingsController.js](server/controllers/settingsController.js) - Settings (L249: role handling)
- [server/models/Event.js](server/models/Event.js) - Event schema (L64: category)
- [server/controllers/eventController.js](server/controllers/eventController.js) - Event endpoints (L404: getAllEvents)

### Frontend Core
- [client/src/context/AuthContext.jsx](client/src/context/AuthContext.jsx) - Auth state management
- [client/src/components/RoleSelectionModal.jsx](client/src/components/RoleSelectionModal.jsx) - Onboarding modal
- [client/src/pages/Register.jsx](client/src/pages/Register.jsx) - Registration flow (L126: modal trigger)
- [client/src/pages/Login.jsx](client/src/pages/Login.jsx) - Login flow (L94, L144, L172: modal triggers)
- [client/src/pages/VerifyEmailOtp.jsx](client/src/pages/VerifyEmailOtp.jsx) - OTP verification (L108: modal trigger)
- [client/src/components/Settings.jsx](client/src/components/Settings.jsx) - Settings UI (L179: RoleSwitcher)
- [client/src/pages/Home.jsx](client/src/pages/Home.jsx) - Discovery (L23-29: categories, L404: getAllEvents call)
- [client/src/pages/DiscoverCreators.jsx](client/src/pages/DiscoverCreators.jsx) - Creator discovery

---

## 🎬 CONCLUSION

The **role selection onboarding is fully implemented and working** as a critical gatekeeper after authentication. However, the **discovery system is completely generic** with no personalization. 

**Key Insights:**
- ✅ Role selection modal is triggered correctly in all auth flows
- ✅ `roleConfirmed` properly tracks onboarding state
- ✅ Users cannot bypass the modal (checked in 3 places)
- ❌ Discovery has no interest/preference matching
- ❌ No way for users to select interests on signup
- ❌ Categories are hardcoded, not managed via API

**Next steps** should focus on implementing interest selection and personalized discovery.
