import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { isFirebaseConfigured, auth, db, googleProvider } from '../firebase';

// Create AuthContext
const AuthContext = createContext(null);

/**
 * Normalizes a Firebase User object into the app's user shape.
 * Both Google and Email/Password users produce the same shape.
 */
function normalizeUser(firebaseUser) {
  if (!firebaseUser) return null;

  const displayName = firebaseUser.displayName
    || firebaseUser.email?.split('@')[0]
    || 'User';

  return {
    uid: firebaseUser.uid,
    name: displayName,
    email: firebaseUser.email,
    avatar: firebaseUser.photoURL || null,
  };
}

/**
 * Creates or updates the Firestore user profile document.
 * Uses merge: true so createdAt is never overwritten for existing users.
 */
async function upsertUserProfile(firebaseUser) {
  if (!firebaseUser || !db) return;

  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userRef, {
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL || null,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to upsert Firestore user profile:', err);
  }
}

/**
 * Maps Firebase Auth error codes to user-friendly messages.
 */
function getAuthErrorMessage(error) {
  switch (error.code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account with this email already exists using a different sign-in method.';
    default:
      return error.message || 'An authentication error occurred. Please try again.';
  }
}

/**
 * AuthProvider Component
 *
 * Manages Firebase Authentication state via onAuthStateChanged.
 * Supports Google Sign-In and Email/Password authentication.
 * Creates/updates Firestore user profiles on successful auth.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(normalizeUser(firebaseUser));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Google Sign-In via popup.
   * Handles both new and returning Google users.
   */
  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error('Firebase Authentication is not configured.');
    const result = await signInWithPopup(auth, googleProvider);
    await upsertUserProfile(result.user);
    return normalizeUser(result.user);
  };

  /**
   * Email/Password Sign-In for returning users.
   */
  const signInWithEmail = async (email, password) => {
    if (!auth) throw new Error('Firebase Authentication is not configured.');
    const result = await signInWithEmailAndPassword(auth, email, password);
    await upsertUserProfile(result.user);
    return normalizeUser(result.user);
  };

  /**
   * Email/Password Registration for new users.
   * Sets displayName via updateProfile after account creation.
   */
  const signUpWithEmail = async (name, email, password) => {
    if (!auth) throw new Error('Firebase Authentication is not configured.');
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Set the displayName on the Firebase user profile
    await updateProfile(result.user, { displayName: name.trim() });

    // Reload user to get updated profile
    await result.user.reload();

    // Create Firestore user profile
    await upsertUserProfile({ ...result.user, displayName: name.trim() });

    // Update local state with the name
    setUser(normalizeUser({ ...result.user, displayName: name.trim() }));

    return normalizeUser({ ...result.user, displayName: name.trim() });
  };

  /**
   * Password Reset Email.
   */
  const resetPassword = async (email) => {
    if (!auth) throw new Error('Firebase Authentication is not configured.');
    await sendPasswordResetEmail(auth, email);
  };

  /**
   * Sign Out — ends Firebase session.
   */
  const signOut = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
  };

  const value = {
    user,
    loading,
    isFirebaseConfigured,
    isAuthenticated: Boolean(user),
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    getAuthErrorMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access AuthContext
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
