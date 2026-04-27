import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLockup from '../components/BrandLockup';
import AuthField from '../components/AuthField';
import { userRoles } from '../data/settings';
import { DEFAULT_PASSWORD, setStoredUser } from '../utils/auth';
import { loginLockIconSrc, loginMailIconSrc } from '../utils/images';
import '../styles/auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const users = useMemo(() => userRoles, []);
  const [email, setEmail] = useState(users[0]?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((entry) => entry.email.toLowerCase() === normalizedEmail);
    if (!user) {
      setError('Unknown user email.');
      return;
    }

    if (password !== DEFAULT_PASSWORD) {
      setError('Incorrect password.');
      return;
    }

    setStoredUser(user);
    navigate('/dashboard');
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

          <button className="primary-button" type="submit">
            Log In
          </button>

          <p className="signup-copy">
            Don&apos;t have an account? <Link to="/login">Sign up</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
