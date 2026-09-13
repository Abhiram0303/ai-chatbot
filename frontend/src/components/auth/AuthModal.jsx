import React, { useState, useEffect } from 'react';
import NovaLogo from '../branding/NovaLogo';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * AuthModal Component
 *
 * Action-based premium NOVA authentication modal.
 * Appears overlaying the main NOVA UI when an unauthenticated user attempts
 * an AI action (e.g. sending a message or selecting a suggestion card).
 *
 * Supports:
 * 1. Google Sign-In / Sign-Up via popup (signInWithPopup)
 * 2. Email/Password Sign-In (signInWithEmailAndPassword)
 * 3. Email/Password Sign-Up (createUserWithEmailAndPassword + Firestore profile)
 * 4. Password Reset email (sendPasswordResetEmail)
 * 5. Keyboard accessibility (Escape key to close)
 * 6. Smooth overlay backdrop blur
 */
export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }) {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    getAuthErrorMessage,
  } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Sync initial mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setResetSent(false);
    }
  }, [isOpen, initialMode]);

  // Handle Escape key to close modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !loading && !googleLoading) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading, googleLoading]);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(name.trim(), email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setResetSent(false);
    setResetLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setResetLoading(false);
    }
  };

  const isAnyLoading = loading || googleLoading || resetLoading;

  return (
    <div
      className="nova-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isAnyLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="nova-modal-card">
        {/* Close Button */}
        <button
          className="nova-modal-close-btn"
          onClick={onClose}
          disabled={isAnyLoading}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* NOVA Branding Header */}
        <div className="auth-header">
          <div className="auth-brand">
            <NovaLogo size={38} showText={false} />
            <div className="auth-brand-text">
              <span className="auth-brand-name">NOVA</span>
              <span className="auth-brand-sub">AI ASSISTANT</span>
            </div>
          </div>
          <h2 id="auth-modal-title" className="auth-title">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Sign in to continue using your AI assistant'
              : 'Join NOVA AI Assistant to start creating'}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="auth-error-banner">
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {resetSent && (
          <div className="auth-success-banner">
            <span>Password reset email sent! Check your inbox.</span>
          </div>
        )}

        {/* Google Auth Button */}
        <button
          type="button"
          className="btn-auth-google-primary"
          onClick={handleGoogleAuth}
          disabled={isAnyLoading}
        >
          {googleLoading ? (
            <Loader2 size={18} className="auth-spinner" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" className="google-icon">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>
            {googleLoading
              ? 'Connecting...'
              : 'Continue with Google'}
          </span>
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <div className="auth-divider-line"></div>
          <span className="auth-divider-text">OR</span>
          <div className="auth-divider-line"></div>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="modal-login-email" className="form-label">
                Email address
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon-left" />
                <input
                  id="modal-login-email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isAnyLoading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="modal-login-password" className="form-label">
                  Password
                </label>
                <button
                  type="button"
                  className="forgot-password-btn"
                  onClick={handleForgotPassword}
                  disabled={isAnyLoading}
                >
                  {resetLoading ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon-left" />
                <input
                  id="modal-login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input form-input-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isAnyLoading}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-auth-primary" disabled={isAnyLoading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="auth-spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="modal-signup-name" className="form-label">
                Name
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon-left" />
                <input
                  id="modal-signup-name"
                  type="text"
                  className="form-input"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isAnyLoading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="modal-signup-email" className="form-label">
                Email address
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon-left" />
                <input
                  id="modal-signup-email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isAnyLoading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="modal-signup-password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon-left" />
                <input
                  id="modal-signup-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input form-input-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isAnyLoading}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="modal-signup-confirm" className="form-label">
                Confirm Password
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon-left" />
                <input
                  id="modal-signup-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input form-input-password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isAnyLoading}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-auth-primary" disabled={isAnyLoading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="auth-spinner" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <p className="auth-terms">
          By continuing, you agree to NOVA's{' '}
          <span className="auth-terms-link">Terms of Service</span> and{' '}
          <span className="auth-terms-link">Privacy Policy</span>.
        </p>

        {/* Footer Switcher */}
        <div className="auth-footer">
          {mode === 'login' ? (
            <>
              <span>Don't have an account?</span>
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                disabled={isAnyLoading}
              >
                Create account
              </button>
            </>
          ) : (
            <>
              <span>Already have an account?</span>
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                disabled={isAnyLoading}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
