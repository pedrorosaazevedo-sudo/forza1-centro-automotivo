import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bell, CheckCircle, Smartphone, AlertTriangle, Send } from 'lucide-react';

export const PushConfig: React.FC = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setSubscribed(true);
          }
        });
      });
    }
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setMessage('');

    try {
      if (!('Notification' in window)) {
        alert('Este navegador não suporta notificações de Push.');
        return;
      }

      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        alert('Permissão de notificação negada. Ative as notificações nas configurações do navegador.');
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const { data } = await api.get('/push/vapid-key');

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey)
      });

      await api.post('/push/subscribe', subscription);
      setSubscribed(true);
      setMessage('Dispositivo cadastrado com sucesso para notificações!');
    } catch (err: any) {
      console.error('Erro ao assinar Push:', err);
      setMessage('Erro ao ativar notificações. Verifique a instalação do PWA.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSend = async (tipo: 'manha' | 'tarde' | 'fechamento') => {
    try {
      await api.post('/push/send-scheduled', { tipo });
      alert(`Disparado teste de notificação (${tipo})!`);
    } catch (err) {
      alert('Erro ao disparar notificação de teste.');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Notificações Push (PWA)</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Configure lembretes diários no celular da equipe de atendimento.
        </p>
      </div>

      {/* Card Status do PWA */}
      <div className="card card-gold" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: subscribed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 166, 35, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subscribed ? 'var(--green)' : 'var(--gold)' }}>
            <Bell size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Status das Notificações: {subscribed ? 'ATIVAS NESTE DISPOSITIVO' : 'NÃO ATIVADAS'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Permissão do Navegador: <strong style={{ color: permission === 'granted' ? 'var(--green)' : 'var(--gold)' }}>{permission}</strong>
            </p>
          </div>
        </div>

        {message && (
          <div className="alert alert-sucesso" style={{ marginTop: '1rem' }}>
            <CheckCircle size={18} /> {message}
          </div>
        )}

        {!subscribed && (
          <button
            onClick={handleSubscribe}
            className="btn btn-gold"
            style={{ width: '100%', marginTop: '1.25rem' }}
            disabled={loading}
          >
            <Smartphone size={18} /> Activar Notificações no Celular
          </button>
        )}
      </div>

      {/* Horários Programados */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Lembretes Programados Diariamente
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <strong style={{ color: 'var(--gold)', fontSize: '0.95rem' }}>~08:30 (Manhã)</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lembrete para cadastrar o primeiro atendimento do dia na oficina.</p>
            </div>
            <button onClick={() => handleTestSend('manha')} className="btn btn-secondary btn-sm" title="Testar Disparo">
              <Send size={14} /> Testar
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <strong style={{ color: 'var(--blue)', fontSize: '0.95rem' }}>~12:30 (Tarde)</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lembrete para manter os atendimentos da manhã atualizados.</p>
            </div>
            <button onClick={() => handleTestSend('tarde')} className="btn btn-secondary btn-sm" title="Testar Disparo">
              <Send size={14} /> Testar
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <strong style={{ color: 'var(--purple)', fontSize: '0.95rem' }}>~17:30 (Fechamento)</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lembrete para conferência final e fechamento do dia.</p>
            </div>
            <button onClick={() => handleTestSend('fechamento')} className="btn btn-secondary btn-sm" title="Testar Disparo">
              <Send size={14} /> Testar
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', background: 'rgba(245, 166, 35, 0.08)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 166, 35, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
            <AlertTriangle size={16} /> Nota de Compatibilidade iOS (iPhone / iPad)
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            No iOS (a partir do iOS 16.4+), para receber notificações Push é necessário primeiro adicionar o app à Tela de Início (Compartilhar ➔ Adicionar à Tela de Início) e abri-lo pelo ícone na tela inicial antes de aceitar a permissão.
          </p>
        </div>
      </div>
    </div>
  );
};
