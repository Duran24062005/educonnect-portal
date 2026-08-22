import { addDays, format } from 'date-fns';
import { describe, expect, it } from 'vitest';
import { calendarDemoSource, createDemoCalendarSeed } from '@/api/calendarDemo';
import { getNextSession, getSessionPosition, getWeekQueryRange } from '@/lib/calendar-utils';

describe('calendar utilities', () => {
  const referenceDate = new Date('2026-08-21T06:00:00.000Z');

  it('creates demo sessions with the required academic context', () => {
    const sessions = createDemoCalendarSeed(referenceDate);
    const first = sessions[0];

    expect(sessions.length).toBeGreaterThan(5);
    expect(first.area.name).toBe('Matemáticas');
    expect(first.group.name).toBe('7A');
    expect(first.teacher.name).toBe('Daniel Vargas');
    expect(first.topic).toBeTruthy();
    expect(first.pendingActivities[0].status).toBe('pending');
  });

  it('ignores cancelled sessions when finding the next class', () => {
    const sessions = createDemoCalendarSeed(referenceDate);
    const next = getNextSession(sessions, referenceDate);

    expect(next?.status).toBe('scheduled');
    expect(next?.id).toBe('demo-session-001');
  });

  it('returns stable week query bounds and event positioning', () => {
    const sessions = createDemoCalendarSeed(referenceDate);
    const range = getWeekQueryRange(referenceDate);
    const position = getSessionPosition(sessions[0]);

    expect(range).toEqual({ from: '2026-08-17', to: '2026-08-23' });
    expect(position).toEqual({ top: '28px', height: '56px' });
  });

  it('reactivates a cancelled demo session without changing its details', async () => {
    const today = new Date();
    const result = await calendarDemoSource.list({
      role: 'admin',
      from: format(today, 'yyyy-MM-dd'),
      to: format(addDays(today, 14), 'yyyy-MM-dd'),
    });
    const cancelled = result.sessions.find((session) => session.status === 'cancelled');

    expect(cancelled).toBeDefined();
    if (!cancelled) return;

    const activated = await calendarDemoSource.activate(cancelled.id);

    expect(activated.status).toBe('scheduled');
    expect(activated.topic).toBe(cancelled.topic);
    expect(activated.startAt).toBe(cancelled.startAt);
    expect(activated.aula.id).toBe(cancelled.aula.id);

    await calendarDemoSource.cancel(cancelled.id);
  });
});
