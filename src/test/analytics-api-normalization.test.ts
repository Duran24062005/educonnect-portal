import { describe, expect, it } from 'vitest';
import {
  normalizeStudentAreas,
  normalizeStudentOverview,
  normalizeStudentPeriodSummary,
} from '@/api/analytics';

describe('student analytics normalization', () => {
  it('flattens overview summary fields from backend payload', () => {
    const overview = normalizeStudentOverview({
      student_id: 'student-1',
      school_year: {
        _id: 'year-1',
        year: 2026,
        name: '2026',
      },
      summary: {
        general_average: 7.25,
        final_status: 'passed',
        passed_areas: 4,
        failed_areas: 1,
      },
      best_area: 'Matemáticas',
      attention_area: 'Lenguaje',
    });

    expect(overview).toEqual({
      student_id: 'student-1',
      school_year: {
        _id: 'year-1',
        year: 2026,
        name: '2026',
      },
      general_average: 7.25,
      final_status: 'passed',
      passed_areas: 4,
      failed_areas: 1,
      best_area: 'Matemáticas',
      attention_area: 'Lenguaje',
    });
  });

  it('keeps area and period collections from backend payloads', () => {
    expect(normalizeStudentAreas({
      areas: [
        {
          area_id: 'math',
          area_name: 'Matemáticas',
          final_average: 8.5,
          status: 'passed',
          periods: [{ period_id: 'p1', period_name: 'Periodo 1', average: 9, status: 'passed' }],
          year_averages: [{ school_year_id: 'y1', year: '2026', average: 8.5 }],
        },
      ],
    })).toHaveLength(1);

    expect(normalizeStudentPeriodSummary({
      periods: [
        {
          period_id: 'p1',
          period_name: 'Periodo 1',
          general_average: 8,
          passed_areas: 2,
          failed_areas: 0,
          status: 'passed',
        },
      ],
    })).toEqual([
      {
        period_id: 'p1',
        period_name: 'Periodo 1',
        general_average: 8,
        passed_areas: 2,
        failed_areas: 0,
        status: 'passed',
      },
    ]);
  });
});
