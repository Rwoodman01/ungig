# Ungig

**Escape the 9 to 5.**

A trust-based, membership service-barter marketplace. Members trade talents for services — no money between members, just fair exchange inside a vetted community.

Built as a mobile-first PWA: **React (Vite) + Firebase (Auth, Firestore, Storage) + Tailwind**, deployed to **Vercel**. Installable on iOS and Android.

---

## Quick start

```bash
# 1. Install deps
npm install

# 2. Create your env file and fill it in
cp .env.example .env.local
# edit .env.local with values from Firebase Console → Project Settings → Web app

# 3. Run the app
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> Icons are auto-generated as placeholder navy/gold PNGs on every `npm run dev` and `npm run build`. Replace `public/icons/*.png` with real brand assets before launch. The source script lives at `scripts/gen-icons.mjs`.

---

## Firebase setup

1. Create a new Firebase project at <https://console.firebase.google.com>.
2. Add a **Web app** to the project; copy the config into `.env.local`.
3. Enable:
   - **Authentication** → Sign-in method → Email/Password **and** Google.
   - **Firestore Database** (start in production mode).
   - **Storage**.
4. Deploy rules and indexes:

```bash
# If you haven't already:
npm i -g firebase-tools
firebase login
firebase use --add   # select your project

firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

5. (Optional) Seed an admin: add your email to the `ADMIN_EMAILS` list in both:
   - `src/lib/constants.js`
   - `firestore.rules` (the `isAdmin()` helper — the list is commented in)
   Redeploy rules after editing.

---

## Data model (Firestore)

```
users/{uid}
  displayName, email, photoURL, bio, location
  talentsOffered[], servicesNeeded[], proofPhotos[]
  status: 'unpaid' | 'pending' | 'approved' | 'rejected'
  subscriptionActive, bgCheckConfirmed, bgCheckDate
  profileComplete, memberSince, badges[], tradeCount
  connections[], referredBy, role: 'member' | 'admin'

deals/{dealId}
  initiatorId, receiverId
  participantIds[]  // denormalized for array-contains
  initiatorService, receiverService
  scheduledDate, scheduledTime
  status: 'requested' | 'accepted' | 'scheduled' | 'completed' | 'reviewed' | 'declined'
  completedBy{uid: true}, reviewedBy{uid: true}
  └ messages/{msgId}   { senderId, text, createdAt }
  └ reviews/{uid}      { rating, comment, createdAt }

reviews/{reviewId}     // top-level mirror for aggregation by revieweeId
```

Indexes are defined in `firestore.indexes.json`.

---

## Onboarding flow

```
Sign up / sign in
  └─ Payment ($9.99/mo — UI-only stub for MVP)
      └─ Culture Call Pending  → admin approves/rejects
          ├─ Rejected (terminal)
          └─ Approved
              └─ Background Check confirm (checkbox + timestamp)
                  └─ Profile Setup (photo, bio, talents, needs, proof photos)
                      └─ Full app access
```

The state machine is enforced by `src/components/auth/StatusGate.jsx`.

---

## Stripe integration (phase 2)

Today the "Pay $9.99/mo" button just flips Firestore fields directly — no charge. To wire real Stripe later:

1. Add a Vercel serverless function at `api/stripe/checkout.js` that creates a Checkout Session.
2. Add a webhook handler at `api/stripe/webhook.js` that sets `subscriptionActive=true` and `status='pending'` on `checkout.session.completed`.
3. Replace the `fakePay()` call in `src/pages/onboarding/Payment.jsx` with a redirect to `session.url`.

The Firestore rules already keep `status` and `subscriptionActive` server-controlled through admin access, so only an authenticated webhook (via Firebase Admin SDK) should write them in phase 2.

---

## PWA

Configured via `vite-plugin-pwa` in `vite.config.js`:

- **Manifest**: `name: "Ungig"`, navy theme, standalone display, 192/512/maskable icons.
- **Service worker**: auto-update, precaches built assets, navigation fallback to `/offline.html` when offline.
- **iOS**: `apple-mobile-web-app-capable` meta tags + `apple-touch-icon.png` in `index.html` so "Add to Home Screen" produces a proper standalone app.

Install instructions:

- **Android**: Chrome will prompt to install after first visit; or use menu → Install app.
- **iOS**: Safari → Share → Add to Home Screen.

---

## Deploy to Vercel

```bash
# One-time
npm i -g vercel
vercel login

# Deploy
vercel            # preview
vercel --prod     # production
```

Set the `VITE_FIREBASE_*` environment variables in the Vercel project settings before the first deploy.

The included `vercel.json` rewrites all non-`/api/` paths to `index.html` (SPA routing) and sets safe cache headers for the service worker and manifest.

---

## What's out of scope for MVP (phase 2 / later)

- Real Stripe Checkout + webhooks.
- Checkr API integration (today: confirmation checkbox + timestamp only).
- Cloud Functions for server-side badge awarding and transactional emails.
- Web-push notifications.
- Advanced search (Algolia) — MVP uses client-side filtering over the `status=='approved'` query.
- Firebase Auth custom claims for admins (today: email allowlist in code + rules).

---

## Project layout

```
src/
  main.jsx, App.jsx, firebase.js, index.css
  contexts/AuthContext.jsx
  components/
    auth/  (ProtectedRoute, StatusGate, AdminRoute)
    layout/  (AppShell, TopBar, BottomNav)
    ui/  (Avatar, Badge, EmptyState, PhotoUploader, Spinner, TagInput)
    deals/  (MessageThread, review flow at `/deals/:dealId/review`)
  lib/  (constants, format, badges, deals, storage)
  pages/
    Landing, SignIn, SignUp
    onboarding/  (Payment, CultureCallPending, Rejected, BackgroundCheck, ProfileSetup)
    Home, Directory, MemberProfile, Deals, DealDetail, MyProfile
    admin/  (AdminHome, PendingMembers, AllDeals, AllMembers)
public/
  offline.html, icons/
scripts/
  gen-icons.mjs
firestore.rules, firestore.indexes.json, storage.rules, firebase.json
vercel.json, vite.config.js, tailwind.config.js, postcss.config.js
```
