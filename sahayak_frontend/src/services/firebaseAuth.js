import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Register a new user with email & password,
 * then immediately fire a verification email.
 * @returns {firebase.User} the newly created (unverified) user
 */
export async function registerWithEmail(email, password) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(user);
  return user;
}

/**
 * Sign in an existing user with email & password.
 * @returns {firebase.User}
 */
export async function signInWithEmail(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

/**
 * Re-send the verification email to the currently signed-in user.
 */
export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) throw new Error('No signed-in user found.');
  await sendEmailVerification(user);
}

/**
 * Reload the current user from Firebase and return the fresh instance.
 * Use this to check whether emailVerified has become true.
 * @returns {firebase.User|null}
 */
export async function reloadCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;
  await user.reload();
  return auth.currentUser; // fresh reference after reload
}

/**
 * Sign out the current user.
 */
export async function signOutUser() {
  await signOut(auth);
}
