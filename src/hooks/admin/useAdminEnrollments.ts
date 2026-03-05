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

const getPaginationMeta = (raw: any) => {
  const payload = raw?.data?.data ?? raw?.data ?? {};
  const total = payload?.pagination?.total ?? payload?.total ?? payload?.count;
  const pages = payload?.pagination?.pages ?? payload?.pages;
  return {
    total: typeof total === 'number' ? total : undefined,
    pages: typeof pages === 'number' ? pages : undefined,
  };
};

const fetchStudentsPaged = async () => {
  const pageSize = 50;
  let page = 1;
  let hasMore = true;
  const acc: any[] = [];

  while (hasMore) {
    const res = await usersApi.listByRole('student', { page, limit: pageSize });
    const payload = unwrapPayload(res.data);
    const chunk = asArray(payload, ['users']);
    acc.push(...chunk);

    const meta = getPaginationMeta(res);
    if (meta.pages) hasMore = page < meta.pages;
    else if (meta.total !== undefined) hasMore = acc.length < meta.total;
    else hasMore = chunk.length === pageSize;

    page += 1;
    if (page > 100) hasMore = false;
  }

  return acc;
};

const fetchAllUsersPaged = async () => {
  const pageSize = 50;
  let page = 1;
  let hasMore = true;
  const acc: any[] = [];

  while (hasMore) {
    const res = await usersApi.list({ page, limit: pageSize });
    const payload = unwrapPayload(res.data);
    const chunk = asArray(payload, ['users']);
    acc.push(...chunk);

    const meta = getPaginationMeta(res);
    if (meta.pages) hasMore = page < meta.pages;
    else if (meta.total !== undefined) hasMore = acc.length < meta.total;
    else hasMore = chunk.length === pageSize;

    page += 1;
    if (page > 100) hasMore = false;
  }

  return acc;
};

export const useAdminStudents = () => {
  return useQuery({
    queryKey: ['admin', 'students'],
    queryFn: async () => {
      try {
        const students = await fetchStudentsPaged();
        if (students.length > 0) return students;
        return [];
      } catch {
        // Fallback para ambientes donde aún no esté desplegada la nueva ruta.
        // Evitamos `role=student` porque algunos backends locales lo validan distinto y devuelven 400.
        const users = await fetchAllUsersPaged();
        return users.filter((user: any) => {
          const role = String(user?.role || user?.person?.role || user?.person_id?.role || '').toLowerCase();
          return role === 'student';
        });
      }
    },
    staleTime: 60_000,
    retry: 1,
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
