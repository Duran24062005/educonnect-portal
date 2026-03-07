import api from './axios';
import { assertObjectId } from '@/lib/object-id';

export interface CreateGroupPayload {
  name: string;
  grade_id: string;
  school_year_id: string;
  max_capacity: number;
}

export interface CreateEnrollmentPayload {
  student_id: string;
  group_id: string;
  school_year_id: string;
}

export interface TransferEnrollmentPayload {
  student_id: string;
  school_year_id: string;
  to_group_id: string;
  reason?: string;
  observations?: string;
}

export type EnrollmentStatus = 'active' | 'transferred' | 'retired';

export const groupsApi = {
  getBySchoolYear: (yearId: string) => api.get(`/api/groups/school-year/${assertObjectId(yearId, 'school_year_id')}`),
  get: (id: string) => api.get(`/api/groups/${assertObjectId(id, 'id')}`),
  create: (data: CreateGroupPayload) => api.post('/api/groups', data),
  update: (id: string, data: any) => api.put(`/api/groups/${assertObjectId(id, 'id')}`, data),
  delete: (id: string) => api.delete(`/api/groups/${assertObjectId(id, 'id')}`),

  // Enrollments
  enroll: (data: CreateEnrollmentPayload) => api.post('/api/groups/enrollments', data),
  transferEnrollment: (data: TransferEnrollmentPayload) => api.post('/api/groups/enrollments/transfer', data),
  updateEnrollmentStatus: (id: string, status: EnrollmentStatus) =>
    api.patch(`/api/groups/enrollments/${assertObjectId(id, 'id')}/status`, { status }),
  getGroupStudents: (groupId: string) => api.get(`/api/groups/${assertObjectId(groupId, 'group_id')}/students`),
  getStudentEnrollments: (studentId: string) => api.get(`/api/groups/enrollments/student/${assertObjectId(studentId, 'student_id')}`),

  // Teachers
  assignTeacher: (data: { teacher_id: string; group_id: string; area_id: string }) =>
    api.post('/api/groups/teachers/assign', data),
  getGroupTeachers: (groupId: string) => api.get(`/api/groups/${assertObjectId(groupId, 'group_id')}/teachers`),
  getTeacherGroups: (teacherId: string) => api.get(`/api/groups/teachers/${assertObjectId(teacherId, 'teacher_id')}/groups`),

  // Grade Areas
  assignGradeArea: (data: any) => api.post('/api/groups/grade-areas', data),
  getGradeAreas: (gradeId: string) => api.get(`/api/groups/grade-areas/${assertObjectId(gradeId, 'grade_id')}`),
};
