import api from './axios';

export interface CreatePeriodPayload {
  school_year_id: string;
  name: string;
  weight: number;
  start_date: string;
  end_date: string;
}

export interface CreateAulaPayload {
  name: string;
  max_capacity: number;
}

export interface RunPromotionPayload {
  from_school_year_id: string;
  to_school_year_id: string;
}

export const academicApi = {
  // School Years
  getSchoolYears: () => api.get('/api/academic/school-years'),
  createSchoolYear: (data: any) => api.post('/api/academic/school-years', data),
  getActiveSchoolYear: async () => {
    const res = await api.get('/api/academic/school-years');
    const payload = res.data?.data ?? res.data;
    const years = Array.isArray(payload?.schoolYears)
      ? payload.schoolYears
      : Array.isArray(payload)
        ? payload
        : [];
    const activeYear = years.find((year: any) => year?.is_active) || null;
    return { ...res, data: activeYear };
  },
  activateSchoolYear: (id: string) => api.patch(`/api/academic/school-years/${id}/activate`),
  deleteSchoolYear: (id: string) => api.delete(`/api/academic/school-years/${id}`),

  // Periods
  getPeriods: (yearId: string) => api.get(`/api/academic/school-years/${yearId}/periods`),
  createPeriod: (data: CreatePeriodPayload) => api.post('/api/academic/periods', data),
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
  createAula: (data: CreateAulaPayload) => api.post('/api/academic/aulas', data),
  updateAula: (id: string, data: any) => api.put(`/api/academic/aulas/${id}`, data),
  deleteAula: (id: string) => api.delete(`/api/academic/aulas/${id}`),

  // Promotions
  runPromotions: (data: RunPromotionPayload) => api.post('/api/academic/promotions', data),
};
