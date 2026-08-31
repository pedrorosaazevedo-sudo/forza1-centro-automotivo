import React, { useEffect, useState } from 'react';
import { TrafegoSemanal } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { TrendingUp, Plus, DollarSign, MessageSquare, Car, Target, Calculator } from 'lucide-react';

export const Trafego: React.FC = () => {
  const [registros, setRegistros] = useState<TrafegoSemanal[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [semanaReferencia, setSemanaReferencia] = useState(new Date().toISOString().slice(0, 10));
  const [mensagensRecebidas, setMensagensRecebidas] = useState('');
  const [valorInvestido, setValorInvestido] = useState('');

  const loadTrafego = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trafego');
      setRegistros(res.data);
    } catch (err) {
      console.error('Erro ao carregar tráfego:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrafego();
  }, []);

  const handleOpenModal = () => {
    setSemanaReferencia(new Date().toISOString().slice(0, 10));
    setMensagensRecebidas('');
    setValorInvestido('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/trafego', {
        semanaReferencia,
        mensagensRecebidas: parseInt(mensagensRecebidas) || 0,
        valorInvestido: parseFloat(valorInvestido) || 0
      });
      setIsModalOpen(false);
      loadTrafego();
    } catch (err) {
      alert('Erro ao registrar investimento da semana.');
    }
  };

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Tráfego Pago & Meta Ads</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Acompanhe o retorno sobre o investimento (ROI) dos anúncios pagos da oficina.
          </p>
        </div>

        <button onClick={handleOpenModal} className="btn btn-gold">
          <Plus size={18} /> Lançar Semana
        </button>
      </div>

      <div className="card alert-info" style={{ marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.1)' }}>
        <Target size={24} color="var(--blue)" />
        <span style={{ fontSize: '0.85rem' }}>
          <strong>Cálculo Automático:</strong> O número de carros atendidos é cruzado automaticamente com o banco de dados de atendimentos cadastrados na mesma semana!
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Carregando dados de tráfego...</div>
      ) : registros.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <TrendingUp size={40} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum lançamento semanal registrado ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {registros.map((reg) => (
            <div key={reg.id} className="card card-gold">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gold)' }}>
                    Semana de {new Date(reg.semanaInicio).toLocaleDateString('pt-BR')} até {new Date(reg.semanaFim).toLocaleDateString('pt-BR')}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {reg.id.slice(0, 8)}</span>
                </div>
                <div className="badge badge-pix" style={{ fontSize: '0.85rem' }}>
                  ROI: {reg.roi.toFixed(2)}x
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <DollarSign size={14} color="var(--gold)" /> Investido
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem' }}>
                    {formatCurrency(reg.valorInvestido)}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MessageSquare size={14} color="var(--blue)" /> Msgs Recebidas
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem' }}>
                    {reg.mensagensRecebidas} msgs
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {formatCurrency(reg.custoPorMensagem)} / msg
                  </div>
                </div>

                <div style={{ background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Car size={14} color="var(--purple)" /> Carros (Auto BD)
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--purple)' }}>
                    {reg.carrosAtendidos} veículos
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    CPA: {formatCurrency(reg.custoPorCarro)}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calculator size={14} color="var(--green)" /> Faturamento Gerado
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--green)' }}>
                    {formatCurrency(reg.faturamentoSemana)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Lançamento Semanal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Lançar Resultados Semanais de Anúncios"
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Data de Referência (Qualquer dia da semana)</label>
            <input
              type="date"
              className="form-input"
              value={semanaReferencia}
              onChange={(e) => setSemanaReferencia(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mensagens Recebidas (WhatsApp/Direct)</label>
            <input
              type="number"
              className="form-input"
              placeholder="Ex: 45"
              value={mensagensRecebidas}
              onChange={(e) => setMensagensRecebidas(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Valor Investido na Semana (R$)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              placeholder="Ex: 300.00"
              value={valorInvestido}
              onChange={(e) => setValorInvestido(e.target.value)}
              required
            />
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            * O número de carros atendidos na semana será lido automaticamente dos atendimentos da oficina.
          </p>

          <button type="submit" className="btn btn-gold" style={{ width: '100%' }}>
            Salvar Registro Semanal
          </button>
        </form>
      </Modal>
    </div>
  );
};
