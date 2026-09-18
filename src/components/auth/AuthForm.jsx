import { useState } from 'react'

export default function AuthForm({ onAuth, error, loading }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pic, setPic] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    onAuth(mode, username, displayName, pic, password)
  }

  return (
    <>
      <div className="auth-tabs">
        <button
          type="button"
          className={`${mode === 'login' ? 'on' : ''}`}
          onClick={() => setMode('login')}
        >
          Log in
        </button>
        <button
          type="button"
          className={`${mode === 'signup' ? 'on' : ''}`}
          onClick={() => setMode('signup')}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input
            type="text"
            maxLength="20"
            placeholder="your_name (a–z, 0–9, _ .)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        {mode === 'signup' && (
          <>
            <div>
              <label>Display name</label>
              <input
                type="text"
                maxLength="30"
                placeholder="What should we call you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label>Profile picture URL <span className="opt">(optional)</span></label>
              <input
                type="text"
                placeholder="https://… .jpg .jpeg .png .gif .webp .webm"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
              />
            </div>
          </>
        )}

        <div>
          <label>Password</label>
          <div className="pass-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="eye"
              onClick={() => setShowPassword(!showPassword)}
              title="Show / hide password"
            >
              👁
            </button>
          </div>
        </div>

        {error && <div className="auth-err show">{error}</div>}

        <button
          className="btn btn-primary btn-block"
          type="submit"
          disabled={loading}
        >
          {mode === 'signup' ? 'Create my grid →' : 'Log in →'}
        </button>
      </form>
    </>
  )
}
