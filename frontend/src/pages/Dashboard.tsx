import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/StatCard';
import { DashboardData } from '../types';
import { api } from '../services/api';
import {
  DollarSign,
  Users,
  Car,
  TrendingUp,
  Percent,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const Dashboard: React.FC = () => {
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes'>('mes');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async (p: 'dia' | 'semana' | 'mes') => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard?periodo=${p}`);
      setData(res.data);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(periodo);
  }, [periodo]);

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
        Carregando indicadores do Lemoka...
      </div>
    );
  }

  // Configuração do Gráfico de Evolução (Linha)
  const lineChartData = {
    labels: data.graficoEvolucao.map((item) => item.data),
    datasets: [
      {
        label: 'Faturamento (R$)',
        data: data.graficoEvolucao.map((item) => item.faturamento),
        borderColor: '#f5a623',
        backgroundColor: 'rgba(245, 166, 35, 0.1)',
        tension: 0.3,
        yAxisID: 'y'
      },
      {
        label: 'Carros Atendidos',
        data: data.graficoEvolucao.map((item) => item.carros),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { color: '#3b82f6', precision: 0 }
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      }
    },
    plugins: {
      legend: { labels: { color: '#f8fafc' } }
    }
  };

  // Configuração do Gráfico de Formas de Pagamento (Doughnut)
  const doughnutData = {
    labels: data.graficoFormasPagamento.map((item) => item.forma),
    datasets: [
      {
        data: data.graficoFormasPagamento.map((item) => item.valor),
        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f5a623'],
        borderColor: '#1a1d27',
        borderWidth: 2
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#f8fafc' } }
    }
  };

  const getAlertClass = (tipo: string) => {
    if (tipo === 'critico') return 'alert-critico';
    if (tipo === 'atencao') return 'alert-atencao';
    if (tipo === 'sucesso') return 'alert-sucesso';
    return 'alert-info';
  };

  return (
    <div>
      {/* Top Controls: Period Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Visão Geral da Oficina</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Período: {new Date(data.datas.inicio).toLocaleDateString('pt-BR')} até {new Date(data.datas.fim).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-card)', padding: '0.3rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          {(['dia', 'semana', 'mes'] as const).map((p) => (
            <button
              key={p}
              className={`btn btn-sm ${periodo === p ? 'btn-gold' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
              onClick={() => setPeriodo(p)}
            >
              <Calendar size={14} /> {p === 'mes' ? 'Mês' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Margem Alert Box */}
      <div className={`alert ${getAlertClass(data.alertaMargem.tipo)}`}>
        {data.alertaMargem.tipo === 'critico' && <AlertTriangle size={20} />}
        {data.alertaMargem.tipo === 'atencao' && <AlertTriangle size={20} />}
        {data.alertaMargem.tipo === 'sucesso' && <CheckCircle size={20} />}
        {data.alertaMargem.tipo === 'info' && <Info size={20} />}
        <span>{data.alertaMargem.mensagem}</span>
      </div>

      {/* KPI Cards Grid */}
      <div className="stat-grid">
        <StatCard
          title="Faturamento Bruto"
          value={formatCurrency(data.kpis.faturamentoBruto)}
          variant="gold"
          icon={<DollarSign size={20} color="var(--gold)" />}
        />
        <StatCard
          title="Comissões Totais"
          value={formatCurrency(data.kpis.comissoesTotais)}
          subtext="Pagas aos mecânicos"
          icon={<Users size={20} color="var(--blue)" />}
        />
        <StatCard
          title="Despesas do Período"
          value={formatCurrency(data.kpis.despesasTotais)}
          variant="red"
          icon={<DollarSign size={20} color="var(--red)" />}
        />
        <StatCard
          title="Lucro Líquido"
          value={formatCurrency(data.kpis.lucroLiquido)}
          variant={data.kpis.lucroLiquido >= 0 ? 'green' : 'red'}
          subtext={`Margem de ${data.kpis.margemLucroPercent.toFixed(1)}%`}
          icon={<TrendingUp size={20} color={data.kpis.lucroLiquido >= 0 ? 'var(--green)' : 'var(--red)'} />}
        />
        <StatCard
          title="Carros Atendidos"
          value={data.kpis.carrosAtendidos}
          subtext="Total de veículos"
          icon={<Car size={20} color="var(--purple)" />}
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(data.kpis.ticketMedio)}
          subtext="Faturamento / Carro"
          icon={<Percent size={20} color="var(--gold)" />}
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BarChart3 size={20} color="var(--gold)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Evolução de Faturamento vs Carros Atendidos</h3>
          </div>
          {data.graficoEvolucao.length > 0 ? (
            <Line data={lineChartData} options={lineChartOptions} height={90} />
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              Nenhum dado registrado para o gráfico no período.
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <PieIcon size={20} color="var(--green)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Distribuição por Forma de Pagamento</h3>
            </div>
            {data.kpis.faturamentoBruto > 0 ? (
              <div style={{ maxWidth: '320px', margin: '0 auto' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                Sem faturamento no período.
              </p>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--gold)' }}>
              Resumo Operacional Lemoka
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ticket Médio por Atendimento:</span>
                <strong>{formatCurrency(data.kpis.ticketMedio)}</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Comissão Média por Carro:</span>
                <strong>{formatCurrency(data.kpis.carrosAtendidos > 0 ? data.kpis.comissoesTotais / data.kpis.carrosAtendidos : 0)}</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status da Oficina:</span>
                <span className="badge badge-pix">Ativa & Operacional</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
