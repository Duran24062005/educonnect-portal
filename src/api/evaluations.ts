import api from './axios';

export const evaluationsApi = {
  // Grade Items
  getGradeItems: (params?: { period_id?: string; area_id?: string }) =>
    api.get('/api/evaluations/grade-items', { params }),
  createGradeItem: (data: any) => api.post('/api/evaluations/grade-items', data),
  updateGradeItem: (id: string, data: any) => api.put(`/api/evaluations/grade-items/${id}`, data),
  deleteGradeItem: (id: string) => api.delete(`/api/evaluations/grade-items/${id}`),

  // Scores
  createScore: (data: { student_id: string; grade_item_id: string; score: number }) =>
    api.post('/api/evaluations/scores', data),
  getStudentScores: (studentId: string) => api.get(`/api/evaluations/scores/student/${studentId}`),
  getGradeItemScores: (gradeItemId: string) => api.get(`/api/evaluations/scores/grade-item/${gradeItemId}`),

  // Period Results
  calculatePeriodResults: (data: any) => api.post('/api/evaluations/period-results/calculate', data),
  getStudentPeriodResults: (studentId: string) => api.get(`/api/evaluations/period-results/student/${studentId}`),

  // Final Results
  calculateFinalResults: (data: any) => api.post('/api/evaluations/final-results/calculate', data),
  getFinalResultsByYear: (yearId: string) => api.get(`/api/evaluations/final-results/school-year/${yearId}`),
  getStudentFinalResult: (studentId: string, yearId: string) =>
    api.get(`/api/evaluations/final-results/student/${studentId}/year/${yearId}`),
  getYearStats: (yearId: string) => api.get(`/api/evaluations/stats/school-year/${yearId}`),
};
