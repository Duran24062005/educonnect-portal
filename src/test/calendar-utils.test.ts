import { describe, expect, it } from 'vitest';
import { createDemoCalendarSeed } from '@/api/calendarDemo';
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

  it('represents planning separately from the scheduled session', () => {
    const sessions = createDemoCalendarSeed(referenceDate);
    expect(sessions[0].lessonPlan?.topic).toBe('Ecuaciones lineales');
    expect(sessions[0].planningStatus).toBe('completed');
    expect(sessions[1].lessonPlan).toBeNull();
    expect(sessions[1].planningStatus).toBe('pending');
  });
});
