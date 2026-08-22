import {
  addDays,
  addWeeks,
  differenceInMinutes,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { CalendarSession } from '@/api/calendar';

export const CALENDAR_TIME_START = 7 * 60;
export const CALENDAR_TIME_END = 19 * 60;
export const CALENDAR_SLOT_MINUTES = 60;

export const getWeekDays = (referenceDate: Date) => {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
};

export const getWeekRangeLabel = (referenceDate: Date) => {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
  return `${format(weekStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM yyyy', { locale: es })}`;
};

export const getWeekQueryRange = (referenceDate: Date) => ({
  from: format(startOfWeek(referenceDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  to: format(endOfWeek(referenceDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
});

export const shiftWeek = (referenceDate: Date, direction: 'previous' | 'next' | 'current') => {
  if (direction === 'current') return new Date();
  return direction === 'next' ? addWeeks(referenceDate, 1) : subWeeks(referenceDate, 1);
};

export const formatSessionTime = (value: string) => format(parseISO(value), 'HH:mm');

export const formatSessionDate = (value: string) => format(parseISO(value), "EEEE d 'de' MMMM", { locale: es });

export const getNextSession = (sessions: CalendarSession[], referenceDate = new Date()) => {
  const now = referenceDate.getTime();
  return sessions
    .filter((session) => session.status !== 'cancelled' && new Date(session.endAt).getTime() >= now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0] || null;
};

export const getSessionPosition = (session: CalendarSession) => {
  const start = parseISO(session.startAt);
  const end = parseISO(session.endAt);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const top = Math.max(startMinutes - CALENDAR_TIME_START, 0);
  const duration = Math.max(differenceInMinutes(end, start), 30);
  return {
    top: `${(top / CALENDAR_SLOT_MINUTES) * 56}px`,
    height: `${Math.max((duration / CALENDAR_SLOT_MINUTES) * 56, 34)}px`,
  };
};

export const getDaySessions = (sessions: CalendarSession[], day: Date) =>
  sessions.filter((session) => isSameDay(parseISO(session.startAt), day));

export const getSessionTone = (session: CalendarSession) => {
  if (session.status === 'cancelled') {
    return 'border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400';
  }

  const tones: Record<string, string> = {
    'area-math': 'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/45 dark:text-blue-100',
    'area-language': 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/45 dark:text-rose-100',
    'area-science': 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-100',
    'area-english': 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/45 dark:text-amber-100',
  };
  return tones[session.area.id] || 'border-primary/25 bg-primary/10 text-foreground';
};

export const isSessionToday = (session: CalendarSession) => isToday(parseISO(session.startAt));
