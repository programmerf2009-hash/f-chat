import { useState, type FormEvent } from 'react';

interface LoginScreenProps {
  busy: boolean;
  error: string | null;
  onSubmit: (username: string) => void;
}

export function LoginScreen({ busy, error, onSubmit }: LoginScreenProps) {
  const [username, setUsername] = useState(() => localStorage.getItem('suhbat.username') ?? '');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!busy) onSubmit(username);
  };

  return (
    <div className="login">
      <div className="login-glow" aria-hidden="true" />
      <div className="login-card">
        <div className="brand brand-lg">
          <span className="brand-mark">S</span>
          <span className="brand-name">Suhbat</span>
        </div>

        <h1 className="login-title">Suhbatga xush kelibsiz</h1>
        <p className="login-subtitle">
          Ismingizni kiriting va do'stlaringiz bilan real vaqtda yozishingizni boshlang.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span className="field-label">Ismingiz</span>
            <input
              className="input"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Masalan: Aziz"
              maxLength={20}
              autoFocus
              autoComplete="nickname"
            />
          </label>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy || username.trim().length < 2}>
            {busy ? 'Ulanmoqda...' : 'Kirish'}
          </button>
        </form>

        <p className="login-hint">
          Sinov versiyasi: parol talab qilinmaydi. Ismingizni boshqalar ham ishlatishi mumkin.
        </p>
      </div>
    </div>
  );
}
