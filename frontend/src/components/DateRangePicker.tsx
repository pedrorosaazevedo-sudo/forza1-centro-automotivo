import React, { useState, useEffect, useRef } from 'react';
import {
  getBrasiliaDate,
  formatYMD,
  parseYMD,
  formatDisplayBR,
  DATE_PRESETS,
  DatePreset
} from '../utils/dateUtils';
import { Calendar, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onApply: (start: string, end: string, label: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onApply
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Seleções temporárias antes de clicar em "Atualizar"
  const [tempStart, setTempStart] = useState<Date>(() => parseYMD(startDate));
  const [tempEnd, setTempEnd] = useState<Date>(() => parseYMD(endDate));
  const [activePresetId, setActivePresetId] = useState<string>('este_mes');
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Mês visível no primeiro calendário
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const d = parseYMD(startDate);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Atualizar quando props externas mudarem
  useEffect(() => {
    setTempStart(parseYMD(startDate));
    setTempEnd(parseYMD(endDate));
  }, [startDate, endDate]);

  // Fechar ao clicar fora no desktop
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const nextMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);

  const handlePrevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const handleSelectPreset = (preset: DatePreset) => {
    const { start, end } = preset.getRange();
    setTempStart(start);
    setTempEnd(end);
    setActivePresetId(preset.id);
    setViewMonth(new Date(start.getFullYear(), start.getMonth(), 1));
  };

  const handleDateClick = (date: Date) => {
    setActivePresetId('custom');
    if (!tempStart || (tempStart && tempEnd)) {
      // Começar nova seleção de intervalo
      setTempStart(date);
      setTempEnd(date);
    } else if (tempStart && !tempEnd) {
      if (date < tempStart) {
        setTempStart(date);
        setTempEnd(tempStart);
      } else {
        setTempEnd(date);
      }
    }
  };

  const isSelectedStart = (date: Date) =>
    tempStart && formatYMD(date) === formatYMD(tempStart);

  const isSelectedEnd = (date: Date) =>
    tempEnd && formatYMD(date) === formatYMD(tempEnd);

  const isInRange = (date: Date) => {
    if (!tempStart) return false;
    const effectiveEnd = tempEnd || hoverDate;
    if (!effectiveEnd) return false;

    const min = tempStart < effectiveEnd ? tempStart : effectiveEnd;
    const max = tempStart < effectiveEnd ? effectiveEnd : tempStart;

    return date >= min && date <= max;
  };

  const handleApply = () => {
    const finalStart = tempStart <= tempEnd ? tempStart : tempEnd;
    const finalEnd = tempStart <= tempEnd ? tempEnd : tempStart;

    const startYMD = formatYMD(finalStart);
    const endYMD = formatYMD(finalEnd);

    // Descobrir o nome do preset ou formatar a string do período
    const presetMatch = DATE_PRESETS.find((p) => {
      const r = p.getRange();
      return formatYMD(r.start) === startYMD && formatYMD(r.end) === endYMD;
    });

    const displayLabel = presetMatch
      ? presetMatch.label
      : `${formatDisplayBR(finalStart)} → ${formatDisplayBR(finalEnd)}`;

    onApply(startYMD, endYMD, displayLabel);
    setIsOpen(false);
  };

  const handleCancel = () => {
    // Reverter para o que estava ativo nas props
    setTempStart(parseYMD(startDate));
    setTempEnd(parseYMD(endDate));
    setIsOpen(false);
  };

  // Renderizador de Mês do Calendário
  const renderCalendarMonth = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Primeiro dia da semana e total de dias do mês
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }

    const weekHeaders = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    return (
      <div style={{ flex: 1, minWidth: '220px' }}>
        <div style={{ textTransform: 'capitalize', fontWeight: 700, textAlign: 'center', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {monthName}
        </div>

        {/* Dias da semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.4rem' }}>
          {weekHeaders.map((w, idx) => (
            <div key={idx}>{w}</div>
          ))}
        </div>

        {/* Grid de Dias */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {days.map((day, idx) => {
            if (!day) return <div key={idx} style={{ height: '32px' }} />;

            const start = isSelectedStart(day);
            const end = isSelectedEnd(day);
            const inRange = isInRange(day);

            let bg = 'transparent';
            let color = 'var(--text-primary)';
            let borderRadius = '4px';

            if (start || end) {
              bg = 'var(--gold)';
              color = '#ffffff';
              borderRadius = '50%';
            } else if (inRange) {
              bg = 'rgba(217, 119, 6, 0.15)';
              color = 'var(--gold)';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDateClick(day)}
                onMouseEnter={() => setHoverDate(day)}
                style={{
                  height: '32px',
                  width: '32px',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: bg,
                  color: color,
                  fontWeight: start || end ? 800 : 500,
                  fontSize: '0.8rem',
                  borderRadius: borderRadius,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Texto amigável do botão ativo
  const currentLabel = () => {
    const startYMD = startDate;
    const endYMD = endDate;
    const presetMatch = DATE_PRESETS.find((p) => {
      const r = p.getRange();
      return formatYMD(r.start) === startYMD && formatYMD(r.end) === endYMD;
    });

    if (presetMatch) return presetMatch.label;
    return `${formatDisplayBR(startDate)} → ${formatDisplayBR(endDate)}`;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Botão de Disparo do Seletor */}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.9rem',
          fontSize: '0.85rem',
          borderColor: 'var(--border-gold)',
          fontWeight: 600
        }}
      >
        <Calendar size={16} color="var(--gold)" />
        <span>{currentLabel()}</span>
      </button>

      {/* Painel Popover Estilo Meta Ads */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 1000,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-main)',
            width: '92vw',
            maxWidth: '780px',
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          {/* Header Superior com Intervalo Selecionado */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Selecione o Período de Análise
            </div>
            <div style={{ background: 'var(--bg-main)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)' }}>
              {tempStart && formatDisplayBR(tempStart)} → {tempEnd ? formatDisplayBR(tempEnd) : '...'}
            </div>
          </div>

          {/* Corpo Principal (Esquerda: Presets | Direita: Calendários Lado a Lado) */}
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* LADO ESQUERDO: Atalhos Rápido (Meta Ads) */}
            <div
              style={{
                width: '180px',
                maxHeight: '280px',
                overflowY: 'auto',
                borderRight: '1px solid var(--border-color)',
                paddingRight: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}
            >
              {DATE_PRESETS.map((p) => {
                const isSelected = activePresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    style={{
                      textAlign: 'left',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: isSelected ? 'rgba(217, 119, 6, 0.15)' : 'transparent',
                      color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* LADO DIREITO: Calendários Duplos com Navegação de Mês */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {renderCalendarMonth(viewMonth)}
                {renderCalendarMonth(nextMonth)}
              </div>
            </div>
          </div>

          {/* Rodapé com Botões Cancelar e Atualizar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={handleCancel} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem 1rem' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleApply} className="btn btn-gold btn-sm" style={{ padding: '0.5rem 1.25rem', fontWeight: 700 }}>
              <Check size={16} /> Atualizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
