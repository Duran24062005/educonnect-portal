import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, MapPin, Users } from 'lucide-react';
import type { CalendarSession } from '@/api/calendar';
import { getDaySessions, getSessionTone, getWeekDays } from '@/lib/calendar-utils';

interface CalendarAgendaProps {
  referenceDate: Date;
  sessions: CalendarSession[];
  onSelectSession: (session: CalendarSession) => void;
}

const CalendarAgenda = ({ referenceDate, sessions, onSelectSession }: CalendarAgendaProps) => {
  const days = getWeekDays(referenceDate);

  return (
    <div className="divide-y divide-border/70">
      {days.map((day) => {
        const daySessions = getDaySessions(sessions, day);
        return (
          <section key={day.toISOString()} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {format(day, 'EEEE', { locale: es })}
                </p>
                <p className="mt-1 font-display text-lg font-bold">{format(day, "d 'de' MMMM", { locale: es })}</p>
              </div>
              <span className="text-xs text-muted-foreground">{daySessions.length} {daySessions.length === 1 ? 'clase' : 'clases'}</span>
            </div>

            {daySessions.length > 0 ? (
              <div className="mt-4 space-y-3">
                {daySessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onSelectSession(session)}
                    className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${getSessionTone(session)}`}
                  >
                    <div className="w-20 shrink-0 text-xs font-semibold tabular-nums">
                      <p>{format(new Date(session.startAt), 'HH:mm')}</p>
                      <p className="mt-1 opacity-70">{format(new Date(session.endAt), 'HH:mm')}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{session.area.name}</p>
                          <p className="mt-1 line-clamp-2 text-sm font-medium">{session.topic}</p>
                        </div>
                        {session.pendingActivities.length > 0 && <CalendarClock className="h-4 w-4 shrink-0" />}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-80">
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{session.group.name}</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{session.aula.name}</span>
                        <span>{session.teacher.name}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Sin clases programadas.</p>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default CalendarAgenda;
