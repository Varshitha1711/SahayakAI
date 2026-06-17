import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Persist the onboarding profile to Firestore under users/{uid}.
 * @param {string} uid
 * @param {object} profileData
 */
export async function saveOnboardingProfile(uid, profileData) {
  await setDoc(doc(db, 'users', uid), profileData, { merge: true });
}