// Utilidades de Data no Fuso Horário America/Sao_Paulo (Horário de Brasília)

export function getBrasiliaDate(date = new Date()): Date {
  const brasiliaStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }).format(date);

  return new Date(brasiliaStr);
}

export function formatYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseYMD(ymdStr: string): Date {
  const [year, month, day] = ymdStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function formatDisplayBR(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseYMD(date.slice(0, 10)) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export interface DatePreset {
  id: string;
  label: string;
  getRange: () => { start: Date; end: Date };
}

export const DATE_PRESETS: DatePreset[] = [
  {
    id: 'hoje',
    label: 'Hoje',
    getRange: () => {
      const now = getBrasiliaDate();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start: today, end: today };
    }
  },
  {
    id: 'ontem',
    label: 'Ontem',
    getRange: () => {
      const now = getBrasiliaDate();
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return { start: yesterday, end: yesterday };
    }
  },
  {
    id: 'hoje_ontem',
    label: 'Hoje e ontem',
    getRange: () => {
      const now = getBrasiliaDate();
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start: yesterday, end: today };
    }
  },
  {
    id: 'ultimos_7',
    label: 'Últimos 7 dias',
    getRange: () => {
      const now = getBrasiliaDate();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { start, end: today };
    }
  },
  {
    id: 'ultimos_14',
    label: 'Últimos 14 dias',
    getRange: () => {
      const now = getBrasiliaDate();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const start = new Date(today);
      start.setDate(today.getDate() - 13);
      return { start, end: today };
    }
  },
  {
    id: 'ultimos_28',
    label: 'Últimos 28 dias',
    getRange: () => {
      const now = getBrasiliaDate();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const start = new Date(today);
      start.setDate(today.getDate() - 27);
      return { start, end: today };
    }
  },
  {
    id: 'ultimos_30',
    label: 'Últimos 30 dias',
    getRange: () => {
      const now = getBrasiliaDate();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      return { start, end: today };
    }
  },
  {
    id: 'esta_semana',
    label: 'Esta semana',
    getRange: () => {
      const now = getBrasiliaDate();
      const dayOfWeek = now.getDay();
      const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start, end };
    }
  },
  {
    id: 'semana_passada',
    label: 'Semana passada',
    getRange: () => {
      const now = getBrasiliaDate();
      const dayOfWeek = now.getDay();
      const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);
      
      const start = new Date(thisMonday);
      start.setDate(thisMonday.getDate() - 7);
      
      const end = new Date(thisMonday);
      end.setDate(thisMonday.getDate() - 1);
      
      return { start, end };
    }
  },
  {
    id: 'este_mes',
    label: 'Este mês',
    getRange: () => {
      const now = getBrasiliaDate();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start, end };
    }
  },
  {
    id: 'mes_passado',
    label: 'Mês passado',
    getRange: () => {
      const now = getBrasiliaDate();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start, end };
    }
  }
];
