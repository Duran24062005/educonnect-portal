import api from './axios';

export const studentsApi = {
  assignAula: (studentId: string, aula_id: string) => api.patch(`/api/students/${studentId}/aula`, { aula_id }),
};

