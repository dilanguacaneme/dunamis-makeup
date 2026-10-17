import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Lock, AlertCircle, RefreshCw } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onEnterDemo: () => void;
  isBackendOnline: boolean | null;
  onRefreshHealth?: () => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onEnterDemo,
  isBackendOnline,
  onRefreshHealth,
}) => {
  const [username, setUsername] = useState('maryuri');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError('Por favor ingresa el nombre de usuario y la contraseña.');
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

  const handleRefreshConnection = async () => {
    if (!onRefreshHealth || isCheckingBackend) return;
    try {
      setIsCheckingBackend(true);
      await onRefreshHealth();
    } finally {
      setIsCheckingBackend(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-brand-crest">
            <Sparkles size={24} />
          </div>
          <h1 className="login-brand-title">Dunamis Makeup</h1>
          <p className="login-brand-subtitle">
            Atelier Privado · Gestión y Control de Inventario
          </p>
        </div>

        {/* Backend Connectivity Status */}
        <div
          className={`login-connection-badge ${
            isBackendOnline ? 'online' : 'offline'
          }`}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
            {isBackendOnline ? '●' : '○'}
          </span>
          <span style={{ flex: 1 }}>
            {isBackendOnline
              ? 'Backend Spring Boot en línea (http://localhost:8080)'
              : 'Servidor Spring Boot no detectado en http://localhost:8080'}
          </span>
          {onRefreshHealth && (
            <button
              type="button"
              className="btn-ghost"
              onClick={handleRefreshConnection}
              disabled={isCheckingBackend}
              title="Comprobar conexión nuevamente"
              style={{ padding: '0.2rem', color: 'inherit' }}
            >
              <RefreshCw
                size={13}
                style={{
                  animation: isCheckingBackend ? 'spin 1s linear infinite' : 'none',
                }}
              />
            </button>
          )}
        </div>

        {/* Offline Demo Recommendation Banner */}
        {isBackendOnline === false && (
          <div
            style={{
              backgroundColor: 'var(--color-rose-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 0.85rem',
              marginBottom: '1.25rem',
              fontSize: '0.78rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.45,
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
            }}
          >
            <Sparkles size={16} color="var(--color-rosewood)" style={{ flexShrink: 0 }} />
            <span>
              Servidor Spring Boot no detectado. Puedes ingresar de inmediato con <strong>Explorar con datos ficticios</strong> para utilizar el catálogo de demostración sin contraseña.
            </span>
          </div>
        )}

        {/* Admin Account Quick Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              display: 'block',
              marginBottom: '0.45rem',
            }}
          >
            Seleccionar administradora registrada:
          </span>
          <div className="login-admin-chip-group">
            <button
              type="button"
              className={`login-admin-chip ${
                username === 'maryuri' ? 'active' : ''
              }`}
              onClick={() => {
                setUsername('maryuri');
                setError(null);
              }}
            >
              <ShieldCheck size={14} />
              <span>maryuri</span>
            </button>
            <button
              type="button"
              className={`login-admin-chip ${
                username === 'caterin' ? 'active' : ''
              }`}
              onClick={() => {
                setUsername('caterin');
                setError(null);
              }}
            >
              <ShieldCheck size={14} />
              <span>caterin</span>
            </button>
          </div>
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

          {/* Username Input */}
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
              placeholder="Ej: maryuri o caterin"
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
              placeholder="Ingresa la clave de administradora"
              autoComplete="current-password"
              required
            />
            <span className="form-hint">
              Autenticación protegida por Spring Security (/api/auth/login).
            </span>
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
                {isSubmitting ? 'Verificando credenciales...' : 'Ingresar al Atelier'}
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
            Entrar a demostración sin contraseña · Funciona con el backend sin conexión
          </p>
        </div>

        {/* Footer Note */}
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
          Acceso exclusivo para administradoras · Dunamis Makeup
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
