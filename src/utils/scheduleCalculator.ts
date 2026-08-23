// /src/utils/scheduleCalculator.ts
import type { BackupFrequency } from '../types/backup';

export interface ScheduleCalculationParams {
  frequency: BackupFrequency;
  time: string; // 'HH:MM', ex: '02:00'
  timezone?: string; // ex: 'America/Sao_Paulo'
  dayOfWeek?: number; // 0 = Domingo, 1 = Segunda, ... 6 = Sábado
  dayOfMonth?: number; // 1 a 28/31
  fromDate?: Date;
}

export interface NextScheduleResult {
  nextDate: Date;
  nextIso: string;
  formattedText: string;
  formattedDateOnly: string;
  formattedTimeOnly: string;
  timezone: string;
}

/**
 * Utilitário de Cálculo Preciso de Próxima Execução Agendada com suporte a Timezone IANA
 */
export function calculateNextScheduledBackup(params: ScheduleCalculationParams): NextScheduleResult {
  const {
    frequency,
    time = '02:00',
    timezone = 'America/Sao_Paulo',
    dayOfWeek = 0,
    dayOfMonth = 1,
    fromDate = new Date(),
  } = params;

  // Parse time "HH:MM"
  const [hourStr, minStr] = (time || '02:00').split(':');
  const targetHour = parseInt(hourStr || '2', 10);
  const targetMinute = parseInt(minStr || '0', 10);

  // Timezone formatter helper
  const getTimeInTz = (d: Date, tz: string) => {
    try {
      const invDate = new Date(d.toLocaleString('en-US', { timeZone: tz }));
      const diff = d.getTime() - invDate.getTime();
      return new Date(d.getTime() + diff);
    } catch {
      return d;
    }
  };

  // Safe timezone verification
  let safeTz = timezone;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: safeTz });
  } catch {
    safeTz = 'America/Sao_Paulo';
  }

  // Current components in target timezone
  const now = fromDate;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '0';

  const tzYear = parseInt(getPart('year'), 10);
  const tzMonth = parseInt(getPart('month'), 10) - 1; // 0-indexed
  const tzDay = parseInt(getPart('day'), 10);
  const tzHour = parseInt(getPart('hour'), 10);
  const tzMinute = parseInt(getPart('minute'), 10);

  // Determine weekday in target timezone (0 = Sunday, 6 = Saturday)
  const tzCurrentDate = new Date(Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMinute));
  const tzDayOfWeek = tzCurrentDate.getUTCDay();

  let targetYear = tzYear;
  let targetMonth = tzMonth;
  let targetDay = tzDay;

  if (frequency === 'daily') {
    // Se o horário de hoje já passou, agenda para amanhã
    if (tzHour > targetHour || (tzHour === targetHour && tzMinute >= targetMinute)) {
      targetDay += 1;
    }
  } else if (frequency === 'weekly') {
    // Calcula quantos dias até o próximo dia da semana configurado
    let diffDays = (dayOfWeek - tzDayOfWeek + 7) % 7;
    if (diffDays === 0) {
      // É hoje: se o horário já passou, vai para a próxima semana
      if (tzHour > targetHour || (tzHour === targetHour && tzMinute >= targetMinute)) {
        diffDays = 7;
      }
    }
    targetDay += diffDays;
  } else if (frequency === 'monthly') {
    // Clampa o dia configurado para dias seguros (máx 28 ou fim do mês)
    const safeDayOfMonth = Math.max(1, Math.min(28, dayOfMonth));
    targetDay = safeDayOfMonth;

    // Se no mês atual esse dia já passou ou é hoje após o horário, vai para o próximo mês
    if (
      tzDay > safeDayOfMonth ||
      (tzDay === safeDayOfMonth && (tzHour > targetHour || (tzHour === targetHour && tzMinute >= targetMinute)))
    ) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }
  }

  // Cria a data estimada em UTC baseada no calendário do fuso horário
  // Ajuste para o offset do fuso especificado
  const candidateUtc = new Date(Date.UTC(targetYear, targetMonth, targetDay, targetHour, targetMinute, 0, 0));

  // Converte a data candidata local no fuso horário para a data UTC real
  // Testando iterativamente
  let nextDate = candidateUtc;
  try {
    // Obter offset real do timezone na data candidata
    const tzString = candidateUtc.toLocaleString('en-US', { timeZone: safeTz });
    const localInTz = new Date(tzString);
    const tzOffsetMs = candidateUtc.getTime() - localInTz.getTime();
    nextDate = new Date(candidateUtc.getTime() + tzOffsetMs);
  } catch {
    nextDate = candidateUtc;
  }

  // Garante que a data seja estritamente no futuro
  if (nextDate.getTime() <= now.getTime()) {
    if (frequency === 'daily') {
      nextDate = new Date(nextDate.getTime() + 24 * 60 * 60 * 1000);
    } else if (frequency === 'weekly') {
      nextDate = new Date(nextDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (frequency === 'monthly') {
      const d = new Date(nextDate);
      d.setMonth(d.getMonth() + 1);
      nextDate = d;
    }
  }

  // Formatações em Português (Brasil)
  const displayFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: safeTz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const dateOnlyFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: safeTz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timeOnlyFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: safeTz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formattedText = `${displayFormatter.format(nextDate)} (${safeTz})`;
  const formattedDateOnly = dateOnlyFormatter.format(nextDate);
  const formattedTimeOnly = timeOnlyFormatter.format(nextDate);

  return {
    nextDate,
    nextIso: nextDate.toISOString(),
    formattedText,
    formattedDateOnly,
    formattedTimeOnly,
    timezone: safeTz,
  };
}

/**
 * Retorna os nomes amigáveis para os dias da semana
 */
export const WEEKDAYS = [
  { value: 0, label: 'Domingo', shortLabel: 'Dom' },
  { value: 1, label: 'Segunda-feira', shortLabel: 'Seg' },
  { value: 2, label: 'Terça-feira', shortLabel: 'Ter' },
  { value: 3, label: 'Quarta-feira', shortLabel: 'Qua' },
  { value: 4, label: 'Quinta-feira', shortLabel: 'Qui' },
  { value: 5, label: 'Sexta-feira', shortLabel: 'Sex' },
  { value: 6, label: 'Sábado', shortLabel: 'Sáb' },
];

/**
 * Lista de Fusos Horários suportados e comuns no Brasil
 */
export const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3) — America/Sao_Paulo' },
  { value: 'America/Bahia', label: 'Bahia (GMT-3) — America/Bahia' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4) — America/Manaus' },
  { value: 'America/Belem', label: 'Belém (GMT-3) — America/Belem' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3) — America/Fortaleza' },
  { value: 'America/Recife', label: 'Recife (GMT-3) — America/Recife' },
  { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4) — America/Cuiaba' },
  { value: 'America/Campo_Grande', label: 'Campo Grande (GMT-4) — America/Campo_Grande' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (GMT-4) — America/Porto_Velho' },
  { value: 'America/Boa_Vista', label: 'Boa Vista (GMT-4) — America/Boa_Vista' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5) — America/Rio_Branco' },
  { value: 'UTC', label: 'UTC Universal (GMT+0)' },
];
