import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLockup from '../components/BrandLockup';
import AuthField from '../components/AuthField';
import { authApi } from '../api';
import { loginLockIconSrc, loginMailIconSrc } from '../utils/images';
import { isNonEmpty, isStrongEnoughPassword, isValidEmail } from '../utils/validators';
import '../styles/auth.css';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(() => Array(OTP_LENGTH).fill(''));
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  useEffect(() => {
    if (resendSecondsLeft <= 0) return undefined;
    const id = window.setInterval(() => {
      setResendSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendSecondsLeft]);

  function resetMessages() {
    setError('');
    setInfo('');
  }

  async function handleEmailSubmit(event) {
    event.preventDefault();
    resetMessages();
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await authApi.forgotPassword(email.trim().toLowerCase());
      setInfo(result?.message || 'A code has been sent.');
      if (result?.devOtp) setDevOtp(result.devOtp);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Could not send the code. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleOtpChange(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtpDigits((current) => {
      const next = current.slice();
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, event) {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(event) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i];
    setOtpDigits(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
  }

  async function handleOtpSubmit(event) {
    event.preventDefault();
    resetMessages();
    const code = otpDigits.join('');
    if (code.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    setSubmitting(true);
    try {
      const { resetToken: token } = await authApi.verifyOtp(email.trim().toLowerCase(), code);
      setResetToken(token);
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetSubmit(event) {
    event.preventDefault();
    resetMessages();
    if (!isStrongEnoughPassword(newPassword, 6)) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(email.trim().toLowerCase(), resetToken, newPassword);
      setStep('done');
    } catch (err) {
      setError(err.message || 'Could not reset password. Start over.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (resendSecondsLeft > 0 || submitting) return;
    resetMessages();
    setSubmitting(true);
    try {
      const result = await authApi.forgotPassword(email.trim().toLowerCase());
      setInfo(result?.message || 'A new code has been sent.');
      if (result?.devOtp) setDevOtp(result.devOtp);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Could not resend the code.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero" aria-label="Reset password">
        <BrandLockup />
        <p className="brand-tagline">Reset your password securely</p>

        {step === 'email' && (
          <form className="login-card" onSubmit={handleEmailSubmit}>
            <h1>Forgot Password</h1>
            <p className="auth-help">
              Enter your account email and we&apos;ll send you a verification code.
            </p>

            <AuthField
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              iconSrc={loginMailIconSrc}
            />

            {error ? <p className="auth-error">{error}</p> : null}

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send Code'}
            </button>

            <p className="signup-copy">
              Remember your password? <Link to="/login">Back to sign in</Link>
            </p>
          </form>
        )}

        {step === 'otp' && (
          <form className="login-card" onSubmit={handleOtpSubmit}>
            <h1>Enter Verification Code</h1>
            <p className="auth-help">
              We sent a {OTP_LENGTH}-digit code to <strong>{email}</strong>. It expires in 10 minutes.
            </p>

            {info ? <p className="auth-success">{info}</p> : null}
            {devOtp ? (
              <p className="auth-help">
                Dev mode code: <strong>{devOtp}</strong>
              </p>
            ) : null}

            <div className="otp-inputs" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleOtpChange(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Verifying…' : 'Verify Code'}
            </button>

            <p className="signup-copy">
              Didn&apos;t get a code?{' '}
              <button
                type="button"
                className="auth-back"
                onClick={handleResendOtp}
                disabled={submitting || resendSecondsLeft > 0}
              >
                {resendSecondsLeft > 0 ? `Resend in ${resendSecondsLeft}s` : 'Resend'}
              </button>
              {' · '}
              <button
                type="button"
                className="auth-back"
                onClick={() => {
                  resetMessages();
                  setStep('email');
                }}
              >
                Change email
              </button>
            </p>
          </form>
        )}

        {step === 'reset' && (
          <form className="login-card" onSubmit={handleResetSubmit}>
            <h1>Set a New Password</h1>
            <p className="auth-help">Choose a new password for {email}.</p>

            <AuthField
              label="New password"
              type="password"
              name="newPassword"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              iconSrc={loginLockIconSrc}
            />

            <AuthField
              label="Confirm new password"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              iconSrc={loginLockIconSrc}
            />

            {error ? <p className="auth-error">{error}</p> : null}

            <button
              className="primary-button"
              type="submit"
              disabled={submitting || !isNonEmpty(newPassword)}
            >
              {submitting ? 'Updating…' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="login-card">
            <h1>Password Updated</h1>
            <p className="auth-help">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => navigate('/login', { replace: true })}
            >
              Go to Sign In
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
