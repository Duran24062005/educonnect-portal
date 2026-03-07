import api from './axios';
import { createClientError } from '@/lib/http';
import { assertObjectId } from '@/lib/object-id';

export const evaluationsApi = {
  // Grade Items
  getGradeItems: (params: { period_id: string; area_id: string }) =>
    api.get('/api/evaluations/grade-items', {
      params: {
        period_id: assertObjectId(params.period_id, 'period_id'),
        area_id: assertObjectId(params.area_id, 'area_id'),
      },
    }),
  createGradeItem: (data: any) => api.post('/api/evaluations/grade-items', data),
  updateGradeItem: (id: string, data: any) => api.put(`/api/evaluations/grade-items/${assertObjectId(id, 'id')}`, data),
  deleteGradeItem: (id: string) => api.delete(`/api/evaluations/grade-items/${assertObjectId(id, 'id')}`),

  // Scores
  createScore: (data: { student_id: string; grade_item_id: string; score: number }) => {
    if (data.score < 0 || data.score > 10) {
      throw createClientError('Invalid request input', [
        { location: 'body', path: ['score'], message: 'score must be between 0 and 10' },
      ]);
    }
    return api.post('/api/evaluations/scores', data);
  },
  getStudentScores: (studentId: string) => api.get(`/api/evaluations/scores/student/${assertObjectId(studentId, 'student_id')}`),
  getGradeItemScores: (gradeItemId: string) => api.get(`/api/evaluations/scores/grade-item/${assertObjectId(gradeItemId, 'grade_item_id')}`),

  // Period Results
  calculatePeriodResults: (data: any) => api.post('/api/evaluations/period-results/calculate', data),
  getStudentPeriodResults: (studentId: string) => api.get(`/api/evaluations/period-results/student/${assertObjectId(studentId, 'student_id')}`),

  // Final Results
  calculateFinalResults: (data: any) => api.post('/api/evaluations/final-results/calculate', data),
  getFinalResultsByYear: (yearId: string, status?: 'passed' | 'failed' | 'repeating') =>
    api.get(`/api/evaluations/final-results/school-year/${assertObjectId(yearId, 'school_year_id')}`, {
      params: status ? { status } : undefined,
    }),
  getStudentFinalResult: (studentId: string, yearId: string) =>
    api.get(`/api/evaluations/final-results/student/${assertObjectId(studentId, 'student_id')}/year/${assertObjectId(yearId, 'school_year_id')}`),
  getYearStats: (yearId: string) => api.get(`/api/evaluations/stats/school-year/${assertObjectId(yearId, 'school_year_id')}`),
};
