import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock } from 'lucide-react';
import type { CalendarSession } from '@/api/calendar';
import {
  CALENDAR_TIME_END,
  CALENDAR_TIME_START,
  getDaySessions,
  getSessionPosition,
  getSessionTone,
  getWeekDays,
} from '@/lib/calendar-utils';

interface CalendarWeekGridProps {
  referenceDate: Date;
  sessions: CalendarSession[];
  onSelectSession: (session: CalendarSession) => void;
}

const hours = Array.from(
  { length: (CALENDAR_TIME_END - CALENDAR_TIME_START) / 60 },
  (_, index) => CALENDAR_TIME_START + (index * 60),
);

const gridHeight = `${hours.length * 56}px`;

const CalendarWeekGrid = ({ referenceDate, sessions, onSelectSession }: CalendarWeekGridProps) => {
  const days = getWeekDays(referenceDate);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-[58px_repeat(7,minmax(126px,1fr))] border-b border-border/70 bg-muted/20">
          <div aria-hidden="true" />
          {days.map((day) => (
            <div key={day.toISOString()} className="border-l border-border/70 px-3 py-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {format(day, 'EEE', { locale: es })}
              </p>
              <p className={`mt-1 text-lg font-display font-bold ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'text-primary' : ''}`}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[58px_repeat(7,minmax(126px,1fr))]">
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((minute) => (
              <div
                key={minute}
                className="absolute right-2 -translate-y-1/2 text-[10px] font-medium tabular-nums text-muted-foreground"
                style={{ top: `${((minute - CALENDAR_TIME_START) / 60) * 56}px` }}
              >
                {format(new Date(2020, 0, 1, minute / 60), 'HH:mm')}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const daySessions = getDaySessions(sessions, day);
            return (
              <div key={day.toISOString()} className="relative border-l border-border/70" style={{ height: gridHeight }}>
                {hours.map((minute) => (
                  <div
                    key={minute}
                    className="absolute inset-x-0 border-t border-border/50"
                    style={{ top: `${((minute - CALENDAR_TIME_START) / 60) * 56}px` }}
                  />
                ))}

                {daySessions.map((session) => {
                  const position = getSessionPosition(session);
                  const tone = getSessionTone(session);
                  return (
                    <button
                      key={session.id}
                      type="button"
                      className={`absolute inset-x-1 z-10 overflow-hidden rounded-md border px-2 py-1.5 text-left text-xs shadow-sm transition hover:z-20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tone}`}
                      style={position}
                      onClick={() => onSelectSession(session)}
                      aria-label={`${session.area.name}, ${session.topic}, ${session.group.name}, ${format(new Date(session.startAt), 'HH:mm')}`}
                    >
                      <span className="flex items-center justify-between gap-1 font-semibold">
                        <span className="truncate">{session.area.name}</span>
                        {session.pendingActivities.length > 0 && <CalendarClock className="h-3.5 w-3.5 shrink-0" />}
                      </span>
                      <span className="mt-0.5 block truncate font-medium">{session.topic}</span>
                      <span className="mt-1 block truncate text-[10px] opacity-75">
                        {format(new Date(session.startAt), 'HH:mm')} - {format(new Date(session.endAt), 'HH:mm')} · {session.group.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarWeekGrid;
