import api from './axios';

export const academicApi = {
  // School Years
  getSchoolYears: () => api.get('/api/academic/school-years'),
  createSchoolYear: (data: any) => api.post('/api/academic/school-years', data),
  getActiveSchoolYear: () => api.get('/api/academic/school-years/active'),
  activateSchoolYear: (id: string) => api.patch(`/api/academic/school-years/${id}/activate`),
  deleteSchoolYear: (id: string) => api.delete(`/api/academic/school-years/${id}`),

  // Periods
  getPeriods: (yearId: string) => api.get(`/api/academic/school-years/${yearId}/periods`),
  createPeriod: (data: any) => api.post('/api/academic/periods', data),
  deletePeriod: (id: string) => api.delete(`/api/academic/periods/${id}`),

  // Grades
  getGrades: () => api.get('/api/academic/grades'),
  createGrade: (data: any) => api.post('/api/academic/grades', data),
  updateGrade: (id: string, data: any) => api.put(`/api/academic/grades/${id}`, data),
  deleteGrade: (id: string) => api.delete(`/api/academic/grades/${id}`),

  // Areas
  getAreas: () => api.get('/api/academic/areas'),
  createArea: (data: any) => api.post('/api/academic/areas', data),
  updateArea: (id: string, data: any) => api.put(`/api/academic/areas/${id}`, data),
  deleteArea: (id: string) => api.delete(`/api/academic/areas/${id}`),

  // Aulas
  getAulas: () => api.get('/api/academic/aulas'),
  createAula: (data: any) => api.post('/api/academic/aulas', data),
  updateAula: (id: string, data: any) => api.put(`/api/academic/aulas/${id}`, data),
  deleteAula: (id: string) => api.delete(`/api/academic/aulas/${id}`),
};
