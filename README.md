# Firebase Privacy Consent Cloud Functions

This change adds Cloud Functions and Firestore security rules to record privacy consent server-side when clients register using Firebase Auth.

## What was added

- functions/src/index.js: Callable function `recordPrivacyConsent` (for clients to call after signing up), an `onUserCreate` auth trigger that creates a minimal users document and sets a consent grace expiry, and a scheduled cleanup `scheduledConsentCleanup` that removes accounts that do not record consent within the grace period.
- functions/package.json: function dependencies
- firestore.rules: Firestore rules preventing clients from setting server-only consent fields.

## Deployment

1. Set config vars if desired (optional):

```bash
# set privacy version and grace period (hours)
firebase functions:config:set privacy.version="v1.0" privacy.grace_hours="24"
```

2. Deploy functions and rules:

```bash
cd functions && npm install
firebase deploy --only functions,firestore:rules
```

## Usage

- Client flow (recommended):
  1. Client creates an Auth user (createUserWithEmailAndPassword).
  2. Client immediately calls the callable function `recordPrivacyConsent` with `{ privacy_agree: true }`.
  3. Callable function writes `privacy_accepted`, `privacy_accepted_at` (serverTimestamp), and `privacy_version` to `users/{uid}`.

- The scheduled cleanup will remove Auth users who haven't recorded consent within the grace period.