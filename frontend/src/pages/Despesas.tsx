import React, { useEffect, useState } from 'react';
import { DespesaFixa } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Plus, Edit2, Trash2, Tag, Building2 } from 'lucide-react';

export const Despesas: React.FC = () => {
  const { isAdmin } = useAuth();
  const [despesas, setDespesas] = useState<DespesaFixa[]>([]);
  const [totalValor, setTotalValor] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Geral');
  const [valor, setValor] = useState('');

  const loadDespesas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/despesas');
      setDespesas(res.data.despesas);
      setTotalValor(res.data.totalValor);
    } catch (err) {
      console.error('Erro ao carregar despesas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDespesas();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setNome('');
    setCategoria('Imóvel');
    setValor('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: DespesaFixa) => {
    setEditingId(d.id);
    setNome(d.nome);
    setCategoria(d.categoria);
    setValor(d.valor.toString());
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const valNum = parseFloat(valor) || 0;
      if (editingId) {
        await api.put(`/despesas/${editingId}`, { nome, categoria, valor: valNum });
      } else {
        await api.post('/despesas', { nome, categoria, valor: valNum });
      }
      setIsModalOpen(false);
      loadDespesas();
    } catch (err) {
      alert('Erro ao salvar despesa.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir esta despesa fixa?')) return;
    try {
      await api.delete(`/despesas/${id}`);
      loadDespesas();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir despesa.');
    }
  };

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Despesas Fixas da Oficina</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Custos recorrentes (Aluguel, Luz, Água, Internet, Softwares, etc.)
          </p>
        </div>

        <button onClick={handleOpenNew} className="btn btn-gold">
          <Plus size={18} /> Cadastrar Despesa
        </button>
      </div>

      {/* Card de Resumo de Custos Fixos */}
      <div className="card card-gold" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1a1d27 0%, #252938 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Custo Fix Mensal Estimado
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--red)', marginTop: '0.2rem' }}>
              {formatCurrency(totalValor)}
            </div>
          </div>
          <Building2 size={36} color="var(--gold)" />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Carregando despesas...</div>
      ) : despesas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Nenhuma despesa fixa cadastrada.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nome da Despesa</th>
                <th>Categoria</th>
                <th>Valor Mensal</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {despesas.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong style={{ color: 'var(--text-primary)' }}>{d.nome}</strong>
                  </td>
                  <td>
                    <span className="badge badge-credito">
                      <Tag size={10} /> {d.categoria}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--red)' }}>
                    {formatCurrency(d.valor)}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenEdit(d)} className="btn btn-secondary btn-sm" title="Editar">
                        <Edit2 size={14} color="var(--blue)" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(d.id)} className="btn btn-danger btn-sm" title="Excluir (Admin)">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal CRUD */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Despesa Fixa' : 'Cadastrar Nova Despesa'}
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Nome da Despesa</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Aluguel do Galpão, Luz, Internet"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select
              className="form-select"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="Imóvel">Imóvel (Aluguel, IPTU)</option>
              <option value="Utilidades">Utilidades (Luz, Água, Gás)</option>
              <option value="Telecom">Telecom (Internet, Celular)</option>
              <option value="Serviços">Serviços (Contabilidade, Softwares)</option>
              <option value="Manutenção">Manutenção da Oficina</option>
              <option value="Geral">Outras Despesas</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              placeholder="0.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: '1rem' }}>
            Salvar Despesa
          </button>
        </form>
      </Modal>
    </div>
  );
};
