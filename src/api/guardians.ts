import api from './axios';
import { assertObjectId } from '@/lib/object-id';
import {
  normalizeStudentAreas,
  normalizeStudentOverview,
  normalizeStudentPeriodSummary,
  type StudentBulletinDocument,
  type StudentAreaMetric,
  type StudentOverview,
  type StudentPeriodSummary,
} from './analytics';

export interface GuardianStudent {
  _id: string;
  full_name: string;
  email: string | null;
  profile_photo_url: string | null;
  relationship: 'mother' | 'father' | 'guardian' | 'other';
  group: {
    _id: string;
    name: string | null;
    grade_name: string | null;
  } | null;
  aula: {
    _id: string;
    name: string | null;
  } | null;
}

export interface GuardianStudentDashboard {
  student: GuardianStudent;
  overview: StudentOverview;
  areas: StudentAreaMetric[];
  periods: StudentPeriodSummary[];
}

export interface GuardianDashboard {
  school_year: {
    _id: string;
    year: number;
    name: string;
  };
  students: GuardianStudentDashboard[];
}

export interface GuardianAttendanceSummary {
  student: Pick<GuardianStudent, '_id' | 'full_name' | 'relationship'>;
  attendance: {
    attendance_rate: number | null;
    totals: {
      sessions: number;
      marked: number;
      pending: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
    };
  };
}

interface GuardianDashboardPayload {
  school_year: GuardianDashboard['school_year'];
  students?: Array<{
    student: GuardianStudent;
    overview: Parameters<typeof normalizeStudentOverview>[0];
    areas?: StudentAreaMetric[];
    periods?: StudentPeriodSummary[];
  }>;
}

const unwrap = <T>(response: { data?: unknown }): T => {
  const payload = response?.data;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data as T;
  }
  return payload as T;
};

const normalizeGuardianStudent = (student: GuardianStudent): GuardianStudent => ({
  ...student,
  full_name: student.full_name || 'Estudiante sin nombre',
  relationship: student.relationship || 'guardian',
  group: student.group || null,
  aula: student.aula || null,
});

const normalizeDashboard = (payload: GuardianDashboardPayload): GuardianDashboard => ({
  school_year: payload?.school_year,
  students: Array.isArray(payload?.students)
    ? payload.students
      .filter((item) => item?.student?._id)
      .map((item) => ({
        student: normalizeGuardianStudent(item.student),
        overview: normalizeStudentOverview(item.overview),
        areas: normalizeStudentAreas({ areas: item.areas || [] }),
        periods: normalizeStudentPeriodSummary({ periods: item.periods || [] }),
      }))
    : [],
});

export const guardiansApi = {
  getMyStudents: async (): Promise<{ students: GuardianStudent[] }> => {
    const response = await api.get('/api/guardians/me/students');
    const payload = unwrap<{ students: GuardianStudent[] }>(response);
    return {
      students: Array.isArray(payload?.students) ? payload.students.map(normalizeGuardianStudent) : [],
    };
  },
  getDashboard: async (schoolYearId: string): Promise<GuardianDashboard> => {
    const response = await api.get('/api/guardians/me/dashboard', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
      },
    });
    return normalizeDashboard(unwrap<GuardianDashboardPayload>(response));
  },
  getAttendance: async (schoolYearId: string): Promise<{ school_year_id: string; students: GuardianAttendanceSummary[] }> => {
    const response = await api.get('/api/guardians/me/attendance', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
      },
    });
    const payload = unwrap<{ school_year_id: string; students?: GuardianAttendanceSummary[] }>(response);
    return {
      school_year_id: payload?.school_year_id || schoolYearId,
      students: Array.isArray(payload?.students) ? payload.students : [],
    };
  },
  getBulletin: async ({ schoolYearId, periodId, studentId }: { schoolYearId: string; periodId: string; studentId: string }): Promise<StudentBulletinDocument> => {
    const response = await api.get('/api/guardians/me/bulletin', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
        period_id: assertObjectId(periodId, 'period_id'),
        student_id: assertObjectId(studentId, 'student_id'),
      },
    });
    return unwrap<StudentBulletinDocument>(response);
  },
};
