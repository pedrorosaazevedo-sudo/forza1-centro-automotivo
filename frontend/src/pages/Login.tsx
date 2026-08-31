import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Shield, UserCheck } from 'lucide-react';
import { api } from '../services/api';

const APP_VERSION = 'v3.4';

export const Login: React.FC = () => {
  const { login, usuario } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Se o usuário já estiver autenticado, redireciona direto para o Dashboard (/)
  if (usuario) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugInfo('');
    setLoading(true);

    try {
      await login(email, senha);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (!err.response) {
        setError('Não foi possível conectar ao servidor da API.');
        setDebugInfo(`Sem resposta do servidor. URL da API: ${api.defaults.baseURL}. Erro: ${err.message}`);
      } else {
        const status = err.response?.status;
        const data = err.response?.data;
        const errorMsg = typeof data === 'object' ? data?.error : String(data).substring(0, 100);
        
        setError(errorMsg || `Erro do servidor (HTTP ${status})`);
        setDebugInfo(`Status: ${status} | URL: ${api.defaults.baseURL} | Resposta: ${JSON.stringify(data).substring(0, 200)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (type: 'operacional' | 'admin') => {
    if (type === 'operacional') {
      setEmail('operacional@lemoka.com.br');
      setSenha('lemoka123');
    } else {
      setEmail('admin@lemoka.com.br');
      setSenha('admin123');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--bg-main)' }}>
      <div className="card card-gold" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img 
            src="/logo.png" 
            alt="Lemoka Centro Automotivo Logo Oficial" 
            style={{ width: '100%', maxWidth: '280px', height: 'auto', margin: '0 auto', display: 'block', objectFit: 'contain' }}
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Nova Iguaçu - RJ • Gestão Completa
          </p>
        </div>

        {error && (
          <div className="alert alert-critico">
            {error}
          </div>
        )}

        {debugInfo && (
          <div style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '1rem', fontSize: '0.65rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
            🔍 Debug: {debugInfo}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-mail de Acesso</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="seu-email@lemoka.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Atalhos para acesso rápido:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
              onClick={() => setDemoUser('operacional')}
            >
              <UserCheck size={14} color="var(--green)" /> Operacional
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
              onClick={() => setDemoUser('admin')}
            >
              <Shield size={14} color="var(--gold)" /> Suporte Admin
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', opacity: 0.5 }}>
          {APP_VERSION} • API: {api.defaults.baseURL}
        </div>
      </div>
    </div>
  );
};
