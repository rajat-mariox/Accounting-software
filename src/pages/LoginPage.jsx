import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandLockup from '../components/BrandLockup';
import AuthField from '../components/AuthField';
import { authApi } from '../api';
import { setStoredAuth } from '../utils/auth';
import { loginLockIconSrc, loginMailIconSrc } from '../utils/images';
import { isNonEmpty, isValidEmail } from '../utils/validators';
import '../styles/auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@accountech.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from ?? '/dashboard';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!isNonEmpty(email)) {
      setError('Email is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!isNonEmpty(password)) {
      setError('Password is required.');
      return;
    }

    setSubmitting(true);
    try {
      const { user, token } = await authApi.login(email.trim().toLowerCase(), password);
      setStoredAuth({ user, token });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero" aria-label="InvoiceHub login">
        <BrandLockup />

        <p className="brand-tagline">Manage your business with ease</p>

        <form className="login-card" onSubmit={handleSubmit}>
          <h1>Welcome Back</h1>

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

          <AuthField
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            iconSrc={loginLockIconSrc}
          />

          {error ? <p className="auth-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Log In'}
          </button>

          <p className="signup-copy">
            Don&apos;t have an account? <Link to="/login">Sign up</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
