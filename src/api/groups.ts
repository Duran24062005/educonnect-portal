import api from './axios';

export const groupsApi = {
  getBySchoolYear: (yearId: string) => api.get(`/api/groups/school-year/${yearId}`),
  get: (id: string) => api.get(`/api/groups/${id}`),
  create: (data: any) => api.post('/api/groups', data),
  update: (id: string, data: any) => api.put(`/api/groups/${id}`, data),
  delete: (id: string) => api.delete(`/api/groups/${id}`),

  // Enrollments
  enroll: (data: { student_id: string; group_id: string; school_year_id: string }) =>
    api.post('/api/groups/enrollments', data),
  updateEnrollmentStatus: (id: string, status: string) =>
    api.patch(`/api/groups/enrollments/${id}/status`, { status }),
  getGroupStudents: (groupId: string) => api.get(`/api/groups/${groupId}/students`),
  getStudentEnrollments: (studentId: string) => api.get(`/api/groups/enrollments/student/${studentId}`),

  // Teachers
  assignTeacher: (data: { teacher_id: string; group_id: string; area_id: string }) =>
    api.post('/api/groups/teachers/assign', data),
  getGroupTeachers: (groupId: string) => api.get(`/api/groups/${groupId}/teachers`),
  getTeacherGroups: (teacherId: string) => api.get(`/api/groups/teachers/${teacherId}/groups`),

  // Grade Areas
  assignGradeArea: (data: any) => api.post('/api/groups/grade-areas', data),
  getGradeAreas: (gradeId: string) => api.get(`/api/groups/grade-areas/${gradeId}`),
};
