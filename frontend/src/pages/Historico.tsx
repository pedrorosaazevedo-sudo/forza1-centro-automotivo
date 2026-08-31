import React, { useEffect, useState } from 'react';
import { Atendimento, Mecanico, FormaPagamento } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Search, Download, Edit2, Trash2, Calendar, FileText } from 'lucide-react';

export const Historico: React.FC = () => {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busca, setBusca] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Estado para Edição Retroativa
  const [editingAtendimento, setEditingAtendimento] = useState<Atendimento | null>(null);
  const [editForm, setEditForm] = useState<Partial<Atendimento>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.append('busca', busca);
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);

      const [resAtend, resMec] = await Promise.all([
        api.get(`/atendimentos?${params.toString()}`),
        api.get('/mecanicos')
      ]);

      setAtendimentos(resAtend.data);
      setMecanicos(resMec.data);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [busca, dataInicio, dataFim]);

  const handleDownloadPDF = (id: string) => {
    window.open(`/api/atendimentos/${id}/pdf`, '_blank');
  };

  const handleOpenEdit = (at: Atendimento) => {
    setEditingAtendimento(at);
    setEditForm({
      nomeCliente: at.nomeCliente,
      telefoneCliente: at.telefoneCliente || '',
      veiculo: at.veiculo || '',
      mecanicoId: at.mecanicoId,
      descricaoServico: at.descricaoServico,
      valorPecas: at.valorPecas,
      valorServico: at.valorServico,
      percentualComissao: at.percentualComissao,
      formaPagamento: at.formaPagamento,
      data: new Date(at.data).toISOString().slice(0, 10)
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAtendimento) return;

    try {
      await api.put(`/atendimentos/${editingAtendimento.id}`, editForm);
      setEditingAtendimento(null);
      loadData();
    } catch (err) {
      console.error('Erro ao editar atendimento:', err);
      alert('Erro ao atualizar registro.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este atendimento?')) return;
    try {
      await api.delete(`/atendimentos/${id}`);
      loadData();
    } catch (err) {
      alert('Erro ao excluir atendimento.');
    }
  };

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getFormaBadgeClass = (forma: string) => {
    if (forma === 'PIX') return 'badge-pix';
    if (forma === 'CREDITO') return 'badge-credito';
    if (forma === 'DEBITO') return 'badge-debito';
    return 'badge-dinheiro';
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Histórico de Atendimentos</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Consulte, baixe notas em PDF e realize edições retroativas.
          </p>
        </div>
      </div>

      {/* Painel de Filtros */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar cliente, veículo, serviço..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ paddingLeft: '2.2rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="date"
              className="form-input"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
            <span style={{ color: 'var(--text-muted)' }}>até</span>
            <input
              type="date"
              className="form-input"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>

          {(busca || dataInicio || dataFim) && (
            <button
              onClick={() => { setBusca(''); setDataInicio(''); setDataFim(''); }}
              className="btn btn-secondary btn-sm"
              style={{ height: '38px' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela / Cards de Histórico */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Carregando histórico...</div>
      ) : atendimentos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={40} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum atendimento encontrado para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente / Veículo</th>
                <th>Mecânico</th>
                <th>Serviço</th>
                <th>Valor Total</th>
                <th>Comissão</th>
                <th>Pagamento</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {atendimentos.map((at) => (
                <tr key={at.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(at.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{at.nomeCliente}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {at.veiculo || 'Veículo não inf.'} {at.telefoneCliente ? `• ${at.telefoneCliente}` : ''}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '0.85rem' }}>{at.mecanico?.nome || '-'}</span>
                  </td>
                  <td>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {at.descricaoServico}
                    </p>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--gold)' }}>
                    {formatCurrency(at.valorTotal)}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--green)', fontSize: '0.85rem' }}>
                    {formatCurrency(at.valorComissao)} ({at.percentualComissao}%)
                  </td>
                  <td>
                    <span className={`badge ${getFormaBadgeClass(at.formaPagamento)}`}>
                      {at.formaPagamento}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleDownloadPDF(at.id)}
                        className="btn btn-secondary btn-sm"
                        title="Baixar Nota PDF"
                      >
                        <Download size={14} color="var(--gold)" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(at)}
                        className="btn btn-secondary btn-sm"
                        title="Editar Atendimento"
                      >
                        <Edit2 size={14} color="var(--blue)" />
                      </button>
                      <button
                        onClick={() => handleDelete(at.id)}
                        className="btn btn-danger btn-sm"
                        title="Excluir Atendimento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Edição Retroativa */}
      <Modal
        isOpen={!!editingAtendimento}
        onClose={() => setEditingAtendimento(null)}
        title="Editar Atendimento (Retroativo)"
      >
        <form onSubmit={handleSaveEdit}>
          <div className="form-group">
            <label className="form-label">Data do Atendimento</label>
            <input
              type="date"
              className="form-input"
              value={editForm.data || ''}
              onChange={(e) => setEditForm({ ...editForm, data: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nome do Cliente</label>
            <input
              type="text"
              className="form-input"
              value={editForm.nomeCliente || ''}
              onChange={(e) => setEditForm({ ...editForm, nomeCliente: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                type="text"
                className="form-input"
                value={editForm.telefoneCliente || ''}
                onChange={(e) => setEditForm({ ...editForm, telefoneCliente: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Veículo</label>
              <input
                type="text"
                className="form-input"
                value={editForm.veiculo || ''}
                onChange={(e) => setEditForm({ ...editForm, veiculo: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mecânico Responsável</label>
            <select
              className="form-select"
              value={editForm.mecanicoId || ''}
              onChange={(e) => setEditForm({ ...editForm, mecanicoId: e.target.value })}
            >
              {mecanicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Descrição do Serviço</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={editForm.descricaoServico || ''}
              onChange={(e) => setEditForm({ ...editForm, descricaoServico: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <div className="form-group">
              <label className="form-label">Valor Peças</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={editForm.valorPecas ?? 0}
                onChange={(e) => setEditForm({ ...editForm, valorPecas: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Valor Serviço</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={editForm.valorServico ?? 0}
                onChange={(e) => setEditForm({ ...editForm, valorServico: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">% Comissão</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={editForm.percentualComissao ?? 25}
                onChange={(e) => setEditForm({ ...editForm, percentualComissao: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: '1rem' }}>
            Salvar Alterações
          </button>
        </form>
      </Modal>
    </div>
  );
};
