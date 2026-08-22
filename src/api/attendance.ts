import api from './axios';
import { assertObjectId } from '@/lib/object-id';

export type AttendanceStatus = 'pending' | 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  _id: string;
  student: { _id: string; full_name: string };
  status: AttendanceStatus;
  note: string | null;
  justification: string | null;
  justified_at: string | null;
}

export interface AttendanceSession {
  _id: string;
  date: string;
  topic: string | null;
  status: 'open' | 'closed';
  school_year: { _id: string; year: number } | null;
  period: { _id: string; name: string } | null;
  group: { _id: string; name: string; grade_name: string | null } | null;
  area: { _id: string; name: string } | null;
  teacher: { _id: string; name: string } | null;
  records: AttendanceRecord[];
}

export interface AttendanceSummary {
  student_id: string;
  school_year_id: string;
  totals: {
    sessions: number;
    marked: number;
    pending: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  attendance_rate: number | null;
  records: Array<AttendanceRecord & {
    date: string | null;
    group: string | null;
    area: string | null;
  }>;
}

export interface GuardianAttendanceItem {
  student: { _id: string; full_name: string; relationship: string };
  attendance: AttendanceSummary;
}

export const attendanceApi = {
  createSession: (payload: {
    school_year_id: string;
    group_id: string;
    period_id?: string;
    area_id?: string;
    teacher_id?: string;
    date: string;
    topic?: string;
  }) => api.post('/api/attendance/sessions', payload),
  listSessions: (query: { school_year_id: string; group_id?: string; from?: string; to?: string }) =>
    api.get<{ data: { sessions: AttendanceSession[] } }>('/api/attendance/sessions', {
      params: {
        school_year_id: assertObjectId(query.school_year_id, 'school_year_id'),
        group_id: query.group_id ? assertObjectId(query.group_id, 'group_id') : undefined,
        from: query.from,
        to: query.to,
      },
    }),
  downloadReport: (query: { school_year_id: string; group_id?: string; from?: string; to?: string }) =>
    api.get('/api/attendance/reports.csv', {
      params: {
        school_year_id: assertObjectId(query.school_year_id, 'school_year_id'),
        group_id: query.group_id ? assertObjectId(query.group_id, 'group_id') : undefined,
        from: query.from,
        to: query.to,
      },
      responseType: 'blob',
    }),
  getSession: (id: string) => api.get<{ data: AttendanceSession }>(`/api/attendance/sessions/${assertObjectId(id, 'id')}`),
  updateRecords: (id: string, records: Array<{
    student_id: string;
    status: AttendanceStatus;
    note?: string | null;
    justification?: string | null;
  }>) => api.patch(`/api/attendance/sessions/${assertObjectId(id, 'id')}/records`, { records }),
  updateStatus: (id: string, status: 'open' | 'closed') =>
    api.patch(`/api/attendance/sessions/${assertObjectId(id, 'id')}/status`, { status }),
  getStudentSummary: (studentId: string, schoolYearId: string) =>
    api.get<{ data: AttendanceSummary }>(`/api/attendance/students/${assertObjectId(studentId, 'student_id')}/summary`, {
      params: { school_year_id: assertObjectId(schoolYearId, 'school_year_id') },
    }),
  getGuardianSummary: (schoolYearId: string) =>
    api.get<{ data: { school_year_id: string; students: GuardianAttendanceItem[] } }>('/api/guardians/me/attendance', {
      params: { school_year_id: assertObjectId(schoolYearId, 'school_year_id') },
    }),
};
