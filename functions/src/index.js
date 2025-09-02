// Cloud Functions: callable recordPrivacyConsent, auth onCreate handler, and scheduled cleanup
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const PRIVACY_VERSION = process.env.PRIVACY_VERSION || 'v1.0';
const CONSENT_GRACE_HOURS = Number(process.env.CONSENT_GRACE_HOURS) || 24; // grace period to allow client to call consent

// Callable function: client calls (authenticated) to record consent. Uses admin SDK so it can write serverTimestamp.
exports.recordPrivacyConsent = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const uid = context.auth.uid;
  const { privacy_agree } = data || {};
  if (!privacy_agree) {
    throw new functions.https.HttpsError('invalid-argument', 'privacy_agree must be true.');
  }

  const userDocRef = admin.firestore().collection('users').doc(uid);
  await userDocRef.set({
    privacy_accepted: true,
    privacy_accepted_at: admin.firestore.FieldValue.serverTimestamp(),
    privacy_version: PRIVACY_VERSION,
    privacy_recorded_by: 'callable.recordPrivacyConsent'
  }, { merge: true });

  // Optionally record an immutable audit entry
  const auditRef = admin.firestore().collection('user_privacy_consents').doc();
  await auditRef.set({
    userId: uid,
    privacy_version: PRIVACY_VERSION,
    accepted_at: admin.firestore.FieldValue.serverTimestamp(),
    recordedBy: 'callable.recordPrivacyConsent'
  });

  return { success: true };
});

// Auth onCreate: create a users/{uid} doc with privacy_accepted: false and a grace expiry timestamp (server-side computed) so scheduled cleanup can run.
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const nowMillis = Date.now();
  const graceMs = CONSENT_GRACE_HOURS * 60 * 60 * 1000;
  const graceExpires = admin.firestore.Timestamp.fromMillis(nowMillis + graceMs);

  const userDocRef = admin.firestore().collection('users').doc(uid);
  await userDocRef.set({
    email: user.email || null,
    displayName: user.displayName || null,
    privacy_accepted: false,
    consent_grace_expires: graceExpires,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    authProvider: user.providerData && user.providerData[0] ? user.providerData[0].providerId : 'password'
  }, { merge: true });

  // Create a lightweight audit record for creation
  const auditRef = admin.firestore().collection('user_creation_audit').doc();
  await auditRef.set({
    userId: uid,
    email: user.email || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
});

// Scheduled cleanup: runs daily and deletes Auth users (and flags their docs) if they haven't recorded consent before their grace expiry.
exports.scheduledConsentCleanup = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();

  const usersRef = admin.firestore().collection('users');
  const q = usersRef.where('privacy_accepted', '==', false).where('consent_grace_expires', '<', now);

  const snapshot = await q.get();
  if (snapshot.empty) {
    console.log('No users found requiring cleanup.');
    return null;
  }

  console.log(`Found ${snapshot.size} user(s) to clean up.`);

  const promises = [];
  snapshot.forEach((doc) => {
    const uid = doc.id;
    const userData = doc.data();

    // Mark the doc as deleted due to missing consent (before actually deleting auth user)
    const p = doc.ref.update({
      deleted_due_to_missing_consent: true,
      deleted_at: admin.firestore.FieldValue.serverTimestamp()
    }).then(async () => {
      try {
        await admin.auth().deleteUser(uid);
        console.log(`Successfully deleted auth user ${uid}`);
      } catch (err) {
        console.error(`Failed to delete auth user ${uid}:`, err.message || err);
        // Mark doc with cleanup_failure for manual inspection
        await doc.ref.update({ cleanup_failure: true, cleanupFailureMessage: err.message || String(err) });
      }
    }).catch(async (err) => {
      console.error(`Failed to delete auth user ${uid}:`, err.message || err);
      // Mark doc with cleanup_failure for manual inspection
      await doc.ref.update({ cleanup_failure: true, cleanupFailureMessage: err.message || String(err) });
    });

    promises.push(p);
  });

  await Promise.all(promises);
  return null;
});


// Exported for tests or manual invocation if needed
exports._config = { PRIVACY_VERSION, CONSENT_GRACE_HOURS };