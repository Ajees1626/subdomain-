import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { FaFacebookF, FaGithub, FaGoogle, FaLinkedinIn, FaLock, FaUser } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import { loginUser, registerUser, setStoredToken } from '../utils/authApi.js'

const slideEase = [0.22, 1, 0.36, 1]

/**
 * Login ↔ Register: horizontal slide (slow, smooth). Register = track moves left; Login = moves right.
 */
const LOGIN_KINDS = [
  { id: 'client', label: 'Client' },
  { id: 'admin', label: 'Admin' },
  { id: 'employee', label: 'Staff' },
]

export function AuthPage({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [loginKind, setLoginKind] = useState('client')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const reduceMotion = useReducedMotion()

  const slideTransition = {
    duration: reduceMotion ? 0.01 : 0.88,
    ease: slideEase,
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'register') {
        const data = await registerUser({ username, email, password, accountType: 'client' })
        setStoredToken(data.token)
        onAuthed(data.user)
      } else {
        const data = await loginUser({ email, password, expectedRole: loginKind })
        setStoredToken(data.token)
        onAuthed(data.user)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  function goRegister() {
    setMode('register')
    setError('')
  }

  function goLogin() {
    setMode('login')
    setError('')
  }

  return (
    <motion.div
      className="auth-shell"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: slideEase }}
    >
      <div className="auth-card">
        <div className="auth-card-viewport">
          <motion.div
            className="auth-slide-track"
            role="presentation"
            animate={{ x: mode === 'login' ? '0%' : '-50%' }}
            transition={slideTransition}
          >
            {/* Pane A — Login (brand | form) */}
            <div
              className="auth-slide-pane auth-slide-pane--login"
              aria-hidden={mode !== 'login'}
              {...(mode !== 'login' ? { inert: true } : {})}
            >
              <aside className="auth-brand">
                <div className="auth-brand__curve" aria-hidden />
                <div className="auth-brand__inner">
                  <h2 className="auth-brand__title">Hello, welcome!</h2>
                  <p className="auth-brand__lead">Don&apos;t have an account?</p>
                  <button type="button" className="auth-brand__outline-btn" onClick={goRegister}>
                    Register
                  </button>
                </div>
              </aside>
              <div className="auth-form-panel">
                <h1 className="auth-form-title">Login</h1>
                <p className="auth-account-kind-label">I am signing in as</p>
                <div className="auth-account-kind" role="group" aria-label="Account type">
                  {LOGIN_KINDS.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      className={`auth-account-kind-btn ${loginKind === k.id ? 'is-active' : ''}`}
                      onClick={() => setLoginKind(k.id)}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
                <p className="auth-account-kind-hint">
                  Megna / company accounts: select <strong>Client</strong> (not Admin) or you will be blocked or
                  routed wrong. Pixdot internal: <strong>Admin</strong>.
                </p>
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                  <label className="auth-field">
                    <span className="auth-field__label">Email</span>
                    <span className="auth-input-wrap">
                      <input
                        type="email"
                        className="auth-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        placeholder="you@company.com"
                      />
                      <HiOutlineMail className="auth-input-icon" aria-hidden />
                    </span>
                  </label>
                  <label className="auth-field">
                    <span className="auth-field__label">Password</span>
                    <span className="auth-input-wrap">
                      <input
                        type="password"
                        className="auth-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                      />
                      <FaLock className="auth-input-icon" aria-hidden />
                    </span>
                  </label>
                  <button type="button" className="auth-link-btn" tabIndex={-1}>
                    Forgot password?
                  </button>
                  {mode === 'login' && error && <p className="auth-error">{error}</p>}
                  <button type="submit" className="auth-submit" disabled={busy}>
                    {busy ? 'Please wait…' : 'Login'}
                  </button>
                </form>
                <p className="auth-social-label">Or sign in with</p>
                <AuthSocialRow />
              </div>
            </div>

            {/* Pane B — Register (form | brand) */}
            <div
              className="auth-slide-pane auth-slide-pane--register"
              aria-hidden={mode !== 'register'}
              {...(mode !== 'register' ? { inert: true } : {})}
            >
              <div className="auth-form-panel">
                <h1 className="auth-form-title">Create account</h1>
                <p className="auth-register-hint">
                  Client registration only. After you sign up, Pixdot confirms by email and attaches your company
                  workspace from the admin side. Admins and staff get access directly from Pixdot.
                </p>
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                  <label className="auth-field">
                    <span className="auth-field__label">Username</span>
                    <span className="auth-input-wrap">
                      <input
                        type="text"
                        className="auth-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        required
                        minLength={2}
                        placeholder="Your name"
                      />
                      <FaUser className="auth-input-icon" aria-hidden />
                    </span>
                  </label>
                  <label className="auth-field">
                    <span className="auth-field__label">Email</span>
                    <span className="auth-input-wrap">
                      <input
                        type="email"
                        className="auth-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        placeholder="you@company.com"
                      />
                      <HiOutlineMail className="auth-input-icon" aria-hidden />
                    </span>
                  </label>
                  <label className="auth-field">
                    <span className="auth-field__label">Password</span>
                    <span className="auth-input-wrap">
                      <input
                        type="password"
                        className="auth-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                      />
                      <FaLock className="auth-input-icon" aria-hidden />
                    </span>
                  </label>
                  {mode === 'register' && error && <p className="auth-error">{error}</p>}
                  <button type="submit" className="auth-submit" disabled={busy}>
                    {busy ? 'Please wait…' : 'Register'}
                  </button>
                </form>
                <p className="auth-social-label">Or sign up with</p>
                <AuthSocialRow />
              </div>
              <aside className="auth-brand">
                <div className="auth-brand__curve auth-brand__curve--flip" aria-hidden />
                <div className="auth-brand__inner">
                  <h2 className="auth-brand__title">Welcome back!</h2>
                  <p className="auth-brand__lead">Already have an account?</p>
                  <button type="button" className="auth-brand__outline-btn" onClick={goLogin}>
                    Login
                  </button>
                </div>
              </aside>
            </div>
          </motion.div>
        </div>
      </div>
      <motion.p
        className="auth-foot"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.18, duration: 0.4, ease: slideEase }}
      >
        Pixdot — you stay signed in on this device until you log out.
      </motion.p>
    </motion.div>
  )
}

function AuthSocialRow() {
  return (
    <div className="auth-social-row">
      <button type="button" className="auth-social-btn" disabled title="Coming soon" aria-label="Google">
        <FaGoogle />
      </button>
      <button type="button" className="auth-social-btn" disabled title="Coming soon" aria-label="Facebook">
        <FaFacebookF />
      </button>
      <button type="button" className="auth-social-btn" disabled title="Coming soon" aria-label="GitHub">
        <FaGithub />
      </button>
      <button type="button" className="auth-social-btn" disabled title="Coming soon" aria-label="LinkedIn">
        <FaLinkedinIn />
      </button>
    </div>
  )
}
