import React, { useState } from 'react';
import { Sparkles, Lock, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onEnterDemo: () => void;
  isBackendOnline?: boolean | null;
  onRefreshHealth?: () => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onEnterDemo,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError('Por favor ingresa tu nombre de usuario y contraseña.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onLogin(cleanUsername, password);
    } catch (err: any) {
      setError(
        err.message ||
          'No fue posible iniciar sesión. Verifique sus credenciales y la conexión con el servidor.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-brand-crest">
            <img
              src="/logo-dunamis.webp"
              alt="Dunamis Makeup"
              className="login-brand-logo-img"
            />
          </div>
          <h1 className="login-brand-title">Dunamis Makeup</h1>
          <p className="login-brand-subtitle">
            Gestión y Control de Inventario
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                backgroundColor: 'var(--color-crimson-light)',
                border: '1px solid var(--color-crimson-border)',
                color: 'var(--color-crimson)',
                fontSize: '0.84rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.55rem',
                lineHeight: 1.4,
              }}
              role="alert"
            >
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>{error}</div>
            </div>
          )}

          {/* Neutral Username Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-screen-username">
              Nombre de usuario
            </label>
            <input
              id="login-screen-username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario asignado"
              autoComplete="username"
              required
            />
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-screen-password">
              Contraseña
            </label>
            <input
              id="login-screen-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              required
            />
          </div>

          {/* Submit Action */}
          <div style={{ marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.7rem 1.25rem',
                fontSize: '0.925rem',
                boxShadow: '0 4px 14px rgba(148, 73, 96, 0.25)',
              }}
            >
              <Lock size={15} />
              <span>
                {isSubmitting ? 'Verificando credenciales...' : 'Iniciar Sesión'}
              </span>
            </button>
          </div>
        </form>

        {/* Alternative Action Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.4rem 0 1.15rem 0',
            gap: '0.75rem',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 600,
            }}
          >
            o alternativamente
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
        </div>

        {/* Demo Mode Secondary Action */}
        <div>
          <button
            type="button"
            className="btn-demo-access"
            onClick={onEnterDemo}
            title="Ingresar al inventario en modo demostración con datos ficticios locales"
          >
            <Sparkles size={16} />
            <span>Explorar con datos ficticios</span>
          </button>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              marginTop: '0.5rem',
              lineHeight: 1.4,
            }}
          >
            Demostración local aislada · Funciona sin conexión con el servidor
          </p>
        </div>

        {/* Neutral Footer Note */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border-subtle)',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--color-text-subtle)',
          }}
        >
          Dunamis Makeup · Sistema de Gestión y Ventas
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
