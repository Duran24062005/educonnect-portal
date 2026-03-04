import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  groupsApi,
  type CreateEnrollmentPayload,
  type EnrollmentStatus,
  type TransferEnrollmentPayload,
} from '@/api/groups';
import { usersApi } from '@/api/users';
import { studentsApi } from '@/api/students';
import { asArray, unwrapPayload } from './utils';

export const useAdminStudents = () => {
  return useQuery({
    queryKey: ['admin', 'students'],
    queryFn: async () => {
      const res = await usersApi.list({ role: 'student', page: 1, limit: 1000 });
      const payload = unwrapPayload(res.data);
      return asArray(payload, ['users']);
    },
    staleTime: 60_000,
  });
};

export const useGroupStudents = (groupId?: string) => {
  return useQuery({
    queryKey: ['admin', 'group', groupId, 'students'],
    queryFn: async () => {
      if (!groupId) return [];
      const res = await groupsApi.getGroupStudents(groupId);
      const payload = unwrapPayload(res.data);
      return asArray(payload, ['students']);
    },
    enabled: Boolean(groupId),
  });
};

export const useStudentEnrollments = (studentId?: string) => {
  return useQuery({
    queryKey: ['admin', 'student', studentId, 'enrollments'],
    queryFn: async () => {
      if (!studentId) return [];
      const res = await groupsApi.getStudentEnrollments(studentId);
      const payload = unwrapPayload(res.data);
      return asArray(payload, ['enrollments']);
    },
    enabled: Boolean(studentId),
  });
};

export const useCreateEnrollment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEnrollmentPayload) => groupsApi.enroll(payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['admin', 'group', variables.group_id, 'students'] });
      qc.invalidateQueries({ queryKey: ['admin', 'student', variables.student_id, 'enrollments'] });
    },
  });
};

export const useTransferEnrollment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransferEnrollmentPayload) => groupsApi.transferEnrollment(payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['admin', 'student', variables.student_id, 'enrollments'] });
      qc.invalidateQueries({ queryKey: ['admin', 'group'] });
    },
  });
};

export const useUpdateEnrollmentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EnrollmentStatus }) => groupsApi.updateEnrollmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'group'] }),
  });
};

export const useAssignStudentAula = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, aulaId }: { studentId: string; aulaId: string }) => studentsApi.assignAula(studentId, aulaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'group'] });
      qc.invalidateQueries({ queryKey: ['admin', 'student'] });
    },
  });
};
