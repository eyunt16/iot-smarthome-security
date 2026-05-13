/**
 * Login.jsx — Smart Home Access Portal
 *
 * Soft Latte & Beige aesthetic — warm, airy, premium.
 *
 * Light Mode:  #FDFBF7 bg / #FFFFFF card / #3E2723 text / #A67B5B accent
 * Dark Mode:   #4A3C31 bg / #604D3F card / #FDFBF7 text / #EADDCA accent
 *              inputs: #3E3128 bg (avoids glare)
 *
 * Views:
 *   isLoginView = true  → Sign In
 *   isLoginView = false → Create Customer Account
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Lock, Moon, ShieldCheck, Sun, UserCheck, UserPlus, User,
} from 'lucide-react';
import { useTheme } from '../contexts/DarkModeContext';
import { loginUser, registerUser } from '../services/api';
import { saveAuthSession } from '../services/authSession';

// ── Design tokens (Latte palette) ─────────────────────────────
const PALETTE = {
  light: {
    bg:          '#FDFBF7',
    card:        '#FFFFFF',
    text:        '#3E2723',
    textSub:     '#8D6E63',
    accent:      '#A67B5B',
    accentText:  '#FFFFFF',
    inputBg:     '#F5EFE8',
    inputBorder: '#DDD0C4',
    inputFocus:  '#A67B5B',
    tabActive:   '#A67B5B',
    tabActiveTxt:'#FFFFFF',
    tabInact:    'transparent',
    tabInactTxt: '#8D6E63',
    tabBar:      '#F0E8DF',
    shadow:      '0 32px 80px rgba(120,80,50,0.12), 0 8px 24px rgba(120,80,50,0.06)',
    blob1:       'radial-gradient(circle, rgba(166,123,91,0.18), transparent 70%)',
    blob2:       'radial-gradient(circle, rgba(212,195,163,0.22), transparent 70%)',
  },
  dark: {
    bg:          '#4A3C31',
    card:        '#604D3F',
    text:        '#FDFBF7',
    textSub:     '#C4A882',
    accent:      '#EADDCA',
    accentText:  '#3E2723',
    inputBg:     '#3E3128',
    inputBorder: '#5A4535',
    inputFocus:  '#EADDCA',
    tabActive:   '#EADDCA',
    tabActiveTxt:'#3E2723',
    tabInact:    'transparent',
    tabInactTxt: '#A67B5B',
    tabBar:      'rgba(62,49,40,0.6)',
    shadow:      '0 32px 80px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.2)',
    blob1:       'radial-gradient(circle, rgba(234,221,202,0.08), transparent 70%)',
    blob2:       'radial-gradient(circle, rgba(166,123,91,0.07), transparent 70%)',
  },
};

// ── Reusable field components ─────────────────────────────────
function Label({ htmlFor, children, tok }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[10.5px] font-bold uppercase tracking-widest mb-1.5"
      style={{ color: tok.textSub }}
    >
      {children}
    </label>
  );
}

function Field({ id, type = 'text', value, onChange, placeholder, icon: Icon, tok, autoComplete, disabled }) {
  return (
    <div className="relative group">
      {/* Left icon */}
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
        style={{ color: tok.textSub }}
      >
        <Icon size={15} strokeWidth={2} />
      </div>

      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        disabled={disabled}
        className="w-full rounded-2xl border px-10 py-3.5 text-sm transition-all duration-200
                   focus:outline-none placeholder:opacity-50 disabled:opacity-50"
        style={{
          backgroundColor: tok.inputBg,
          borderColor: tok.inputBorder,
          color: tok.text,
        }}
        onFocus={(e) => { e.target.style.borderColor = tok.inputFocus; e.target.style.boxShadow = `0 0 0 3px ${tok.inputFocus}22`; }}
        onBlur={(e)  => { e.target.style.borderColor = tok.inputBorder; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

function PasswordField({ id, value, onChange, placeholder, tok, autoComplete, disabled }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative group">
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
        style={{ color: tok.textSub }}
      >
        <Lock size={15} strokeWidth={2} />
      </div>

      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        disabled={disabled}
        className="w-full rounded-2xl border px-10 py-3.5 pr-12 text-sm transition-all duration-200
                   focus:outline-none placeholder:opacity-50 disabled:opacity-50"
        style={{ backgroundColor: tok.inputBg, borderColor: tok.inputBorder, color: tok.text }}
        onFocus={(e) => { e.target.style.borderColor = tok.inputFocus; e.target.style.boxShadow = `0 0 0 3px ${tok.inputFocus}22`; }}
        onBlur={(e)  => { e.target.style.borderColor = tok.inputBorder; e.target.style.boxShadow = 'none'; }}
      />

      {/* Eye toggle */}
      <button
        type="button"
        aria-label={show ? 'Hide password' : 'Show password'}
        onClick={() => setShow((s) => !s)}
        className="absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110"
        style={{ color: tok.textSub }}
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
      </button>
    </div>
  );
}

// ── Slide animation config ────────────────────────────────────
const slide = {
  initial: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  animate: { opacity: 1, x: 0 },
  exit:    (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
};

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function Login({ onLoginSuccess }) {
  const { isDark, toggleTheme } = useTheme();
  const tok = isDark ? PALETTE.dark : PALETTE.light;
  const LOCKED_ACCOUNT_MESSAGE = '⚠️ Your account has been locked due to too many failed login attempts. Please contact the Administrator to unlock.';
  const INVALID_CREDENTIALS_MESSAGE = 'Invalid credentials. Please try again.';

  // View toggle: true = Sign In, false = Create Customer Account
  const [isLoginView, setIsLoginView] = useState(true);
  const [direction,   setDirection]   = useState(1);

  // Sign In fields — pre-filled with demo credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Customer registration fields
  const [registerUsername, setRegisterUsername] = useState('');
  const [reqPassword, setReqPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLockedError, setIsLockedError] = useState(false);

  const clearAuthFeedback = () => {
    setError('');
    setSuccess('');
    setIsLockedError(false);
  };

  const switchView = (toLogin) => {
    if (toLogin === isLoginView) return;
    setDirection(toLogin ? -1 : 1);
    clearAuthFeedback();
    setIsLoginView(toLogin);
  };

  // ── Sign In submit ─────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    clearAuthFeedback();
    setLoading(true);

    try {
      const response = await loginUser({
        username: username.trim(),
        password,
      });

      if (response?.token) {
        saveAuthSession({
          token: response.token,
          user: response.user,
        });
        onLoginSuccess?.(response.user);
        return;
      }

      setError(response?.message || INVALID_CREDENTIALS_MESSAGE);
    } catch (error) {
      const responseData = error?.response?.data || error?.data || null;
      const responseMessage = String(responseData?.message || error?.message || '');
      const normalizedMessage = responseMessage.toLowerCase();
      const statusCode = error?.response?.status || error?.status;
      const lockedFromPayload =
        responseData?.isLocked === true
        || responseData?.locked === true
        || normalizedMessage.includes('locked');

      if (statusCode === 423 || lockedFromPayload) {
        setIsLockedError(true);
        setError(LOCKED_ACCOUNT_MESSAGE);
        return;
      }

      if (
        statusCode === 401 ||
        statusCode === 403 ||
        normalizedMessage.includes('invalid credentials') ||
        normalizedMessage.includes('wrong password') ||
        normalizedMessage.includes('authentication failed')
      ) {
        setError(INVALID_CREDENTIALS_MESSAGE);
        return;
      }

      if (normalizedMessage.includes('network error')) {
        setError('Cannot connect to the backend. Make sure the API server is running on port 5000.');
        return;
      }

      setError(responseMessage || 'Unable to reach the authentication service.');
    } finally {
      setLoading(false);
    }
  };

  // ── Request Access submit ───────────────────────────────────
  const handleRequestAccess = async (e) => {
    e.preventDefault();
    clearAuthFeedback();
    setLoading(true);

    if (!registerUsername.trim()) {
      setError('Username is required.');
      setLoading(false);
      return;
    }

    if (reqPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await registerUser({
        username: registerUsername.trim(),
        password: reqPassword,
        confirmPassword,
        role: 'customer',
      });

      setSuccess(response?.message || 'Customer account created. You can sign in now.');
      setRegisterUsername('');
      setReqPassword('');
      setConfirmPassword('');
      setDirection(-1);
      setIsLoginView(true);
    } catch (error) {
      const responseData = error?.response?.data || error?.data || null;
      setError(responseData?.message || error?.message || 'Unable to create customer account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: tok.bg }}
    >
      {/* ── Background blobs ──────────────────────────────── */}
      <div
        className="pointer-events-none absolute -top-20 right-[-10%] w-[520px] h-[520px] rounded-full blur-3xl opacity-60"
        style={{ background: tok.blob1 }}
      />
      <div
        className="pointer-events-none absolute bottom-[-5%] left-[-8%] w-[420px] h-[420px] rounded-full blur-3xl opacity-50"
        style={{ background: tok.blob2 }}
      />

      {/* ── Theme toggle ──────────────────────────────────── */}
      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.12, rotate: 15 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-6 right-6 z-50 p-2.5 rounded-xl border transition-colors duration-300"
        style={{ backgroundColor: tok.card, borderColor: tok.inputBorder }}
        title={isDark ? 'Switch to Light' : 'Switch to Dark'}
      >
        {isDark
          ? <Sun  size={17} style={{ color: tok.accent }} strokeWidth={2.2} />
          : <Moon size={17} style={{ color: tok.textSub }} strokeWidth={2.2} />
        }
      </motion.button>

      {/* ── Card ──────────────────────────────────────────── */}
      <motion.div
        className="relative w-full max-w-[420px] z-10 rounded-[32px] p-9 border overflow-hidden"
        style={{
          backgroundColor: tok.card,
          borderColor: tok.inputBorder,
          boxShadow: tok.shadow,
        }}
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1.2] }}
      >
        {/* ── Header ───────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8">
          {/* Shield icon badge */}
          <motion.div
            className="mb-5 grid h-[68px] w-[68px] place-items-center rounded-[22px]"
            style={{
              background: `linear-gradient(135deg, ${tok.accent}, ${isDark ? '#C4A882' : '#C49A6C'})`,
              boxShadow: `0 16px 36px ${tok.accent}40`,
            }}
            whileHover={{ scale: 1.06, rotate: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            <ShieldCheck size={32} style={{ color: tok.accentText }} strokeWidth={1.8} />
          </motion.div>

          <h1
            className="font-display text-[28px] font-bold leading-tight tracking-tight"
            style={{ color: tok.text }}
          >
            Tuyen Home
          </h1>
          <p
            className="text-[12px] mt-1.5 font-medium tracking-widest uppercase"
            style={{ color: tok.textSub }}
          >
            Smart Home Access Portal
          </p>
        </div>

        {/* ── View toggle tabs ──────────────────────────── */}
        <div
          className="flex gap-1.5 mb-7 rounded-2xl p-1 transition-colors duration-300"
          style={{ backgroundColor: tok.tabBar }}
        >
          {[
            { label: 'Sign In',        active: isLoginView,  onClick: () => switchView(true)  },
            { label: 'Create Account', active: !isLoginView, onClick: () => switchView(false) },
          ].map(({ label, active, onClick }) => (
            <motion.button
              key={label}
              onClick={onClick}
              disabled={loading}
              className="flex-1 py-2 px-3 rounded-xl text-[12.5px] font-semibold tracking-wide transition-all duration-300"
              style={{
                backgroundColor: active ? tok.tabActive    : tok.tabInact,
                color:           active ? tok.tabActiveTxt : tok.tabInactTxt,
                boxShadow:       active ? `0 4px 14px ${tok.accent}33` : 'none',
              }}
              whileTap={{ scale: 0.97 }}
            >
              {label}
            </motion.button>
          ))}
        </div>

        {/* ── Forms (animated slide) ─────────────────── */}
        <div className="relative overflow-hidden" style={{ minHeight: isLoginView ? 240 : 340 }}>
          <AnimatePresence mode="wait" custom={direction}>
            {isLoginView ? (
              /* ─── SIGN IN FORM ─── */
              <motion.form
                key="login"
                custom={direction}
                variants={slide}
                initial="initial"
                animate="animate"
                exit="exit"
                onSubmit={handleLogin}
                className="space-y-4"
                noValidate
              >
                {/* Username */}
                <div>
                  <Label htmlFor="si-username" tok={tok}>Username</Label>
                  <Field
                    id="si-username"
                    value={username}
                    onChange={(e) => {
                      clearAuthFeedback();
                      setUsername(e.target.value);
                    }}
                    placeholder="Enter your username"
                    icon={User}
                    tok={tok}
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="si-password" tok={tok}>Password</Label>
                  <PasswordField
                    id="si-password"
                    value={password}
                    onChange={(e) => {
                      clearAuthFeedback();
                      setPassword(e.target.value);
                    }}
                    placeholder="Enter password"
                    tok={tok}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>

                {/* Feedback */}
                <FeedbackBanner error={error} success={success} tok={tok} isLockedError={isLockedError} />

                {/* Submit */}
                <SubmitButton loading={loading} tok={tok} label="Sign In" loadingLabel="Signing in…" icon={UserCheck} />

              </motion.form>

            ) : (
              /* ─── REQUEST ACCESS FORM ─── */
              <motion.form
                key="request"
                custom={direction}
                variants={slide}
                initial="initial"
                animate="animate"
                exit="exit"
                onSubmit={handleRequestAccess}
                className="space-y-4"
                noValidate
              >
                {/* Username */}
                <div>
                  <Label htmlFor="ra-username" tok={tok}>Username</Label>
                  <Field
                    id="ra-username"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    placeholder="Choose a username"
                    icon={User}
                    tok={tok}
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="ra-password" tok={tok}>Password</Label>
                  <PasswordField
                    id="ra-password"
                    value={reqPassword}
                    onChange={(e) => setReqPassword(e.target.value)}
                    placeholder="Create a password"
                    tok={tok}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="ra-confirm-password" tok={tok}>Confirm Password</Label>
                  <PasswordField
                    id="ra-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    tok={tok}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>

                {/* Feedback */}
                <FeedbackBanner error={error} success={success} tok={tok} isLockedError={false} />

                {/* Submit */}
                <SubmitButton loading={loading} tok={tok} label="Create Customer Account" loadingLabel="Creating…" icon={UserPlus} />

                <p
                  className="text-center text-[10.5px] pt-1 tracking-wide"
                  style={{ color: tok.textSub }}
                >
                  Customer accounts can monitor the home. The `admin` account keeps system management access.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Footer accent dot ─────────────────────────────── */}
      <motion.div
        className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <div className="h-1 w-1 rounded-full" style={{ backgroundColor: tok.accent }} />
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: tok.textSub }}
        >
          Tuyen Home · Secure Channel
        </span>
        <div className="h-1 w-1 rounded-full" style={{ backgroundColor: tok.accent }} />
      </motion.div>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────
function FeedbackBanner({ error, success, tok, isLockedError = false }) {
  return (
    <AnimatePresence>
      {(error || success) && (
        <motion.div
          key={error ? 'err' : 'ok'}
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0,  height: 'auto' }}
          exit={{    opacity: 0, y: -4,  height: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden rounded-xl border px-4 py-3 text-[12px] text-center font-medium"
          style={{
            borderColor:      error ? (isLockedError ? '#D14343' : '#D98B8B') : '#88C9A0',
            backgroundColor:  error ? (isLockedError ? 'rgba(209,67,67,0.16)' : 'rgba(220,100,100,0.1)') : 'rgba(100,200,140,0.1)',
            color:            error ? (isLockedError ? '#C62828' : '#B55B5B') : '#3E8E64',
          }}
        >
          {error || success}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SubmitButton({ loading, tok, label, loadingLabel, icon: Icon }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
      whileTap={!loading  ? { scale: 0.98, y: 0  } : {}}
      className="w-full rounded-2xl py-3.5 text-[13.5px] font-bold tracking-wide flex items-center justify-center gap-2
                 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background:  `linear-gradient(135deg, ${tok.accent}, ${tok.accent}CC)`,
        color:       tok.accentText,
        boxShadow:   `0 12px 28px ${tok.accent}40`,
      }}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
          </svg>
          {loadingLabel}
        </>
      ) : (
        <>
          <Icon size={16} strokeWidth={2.2} />
          {label}
        </>
      )}
    </motion.button>
  );
}
