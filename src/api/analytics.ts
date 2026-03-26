import api from './axios';
import { assertObjectId } from '@/lib/object-id';

export interface StudentOverview {
  student_id: string;
  school_year: {
    _id: string;
    year: number;
    name: string;
  };
  general_average: number;
  final_status: 'passed' | 'failed' | 'repeating';
  passed_areas: number;
  failed_areas: number;
  best_area: string | null;
  attention_area: string | null;
}

export interface StudentAreaMetric {
  area_id: string;
  area_name: string;
  final_average: number;
  status: 'passed' | 'failed';
  year_averages: Array<{ school_year_id?: string; year: string; average: number }>;
  periods: Array<{ period_id?: string; period_name: string; average: number; status?: 'passed' | 'failed' }>;
}

export interface StudentPeriodSummary {
  period_id: string;
  period_name: string;
  general_average: number;
  passed_areas: number;
  failed_areas: number;
  status: 'passed' | 'failed';
}

export interface StudentBulletinEvaluation {
  id: string;
  name: string;
  score: number;
  weight?: number;
}

export interface StudentBulletinArea {
  area_id: string;
  area_name: string;
  period_average: number;
  final_result_label: string;
  status: 'passed' | 'failed';
  evaluations: StudentBulletinEvaluation[];
}

export interface StudentBulletinDocument {
  institution: {
    logo_url?: string | null;
    official_name: string;
    municipality: string;
    department: string;
    dane_code?: string | null;
    header_text: string;
    legal_note?: string | null;
  };
  student: {
    full_name: string;
    document_label: string;
    document_number: string;
    code?: string | null;
  };
  enrollment: {
    grade_name: string;
    group_name: string;
    school_year_label: string;
    school_shift?: string | null;
  };
  period: {
    id: string;
    name: string;
    start_date?: string | null;
    end_date?: string | null;
    issued_at: string;
  };
  teacher_comment?: string | null;
  director_name?: string | null;
  signatures: Array<{
    label: string;
    name: string;
  }>;
  areas: StudentBulletinArea[];
}

export interface TeacherGroupAnalytics {
  group_id: string;
  group_name: string;
  grade_name: string;
  area_id?: string;
  area_name: string;
  student_count: number;
  average: number;
  passed: number;
  failed: number;
  approval_rate?: number;
  performance_levels?: TeacherPerformanceLevels;
  periods: Array<{ period_name: string; average: number; passed: number; failed: number }>;
  students: Array<{
    student_id?: string;
    student_name: string;
    student_email?: string | null;
    average: number;
    status: 'passed' | 'failed';
    performance_level?: TeacherPerformanceLevel;
  }>;
}

export type TeacherPerformanceLevel = 'SUPERIOR' | 'ALTO' | 'BÁSICO' | 'BAJO';

export interface TeacherPerformanceLevels {
  SUPERIOR: number;
  ALTO: number;
  BÁSICO: number;
  BAJO: number;
}

export interface TeacherDashboardStudentHighlight {
  student_id: string;
  student_name: string;
  student_email?: string | null;
  average: number;
  status: 'passed' | 'failed';
  performance_level: TeacherPerformanceLevel;
  assignments: Array<{
    group_id: string;
    group_name: string;
    area_id?: string;
    area_name: string;
    average: number;
    performance_level: TeacherPerformanceLevel;
  }>;
}

export interface TeacherDashboardGroupRanking {
  group_id: string;
  group_name: string;
  grade_name: string;
  area_id?: string;
  area_name: string;
  average: number;
  student_count: number;
  passed: number;
  failed: number;
  performance_levels: TeacherPerformanceLevels;
  position: number;
}

export interface TeacherStudentDetail {
  student: {
    _id: string;
    full_name: string;
    email?: string | null;
  };
  area: {
    _id: string;
    name: string;
  };
  final_average: number;
  periods: Array<{
    period_name: string;
    average: number;
  }>;
}

export interface AdminDashboardSummary {
  school_year_id: string;
  stats: any;
  pending: {
    count: number;
    users: any[];
  };
  institution_overview: any;
  institution_trend: any[];
  institution_grades: any[];
  institution_areas: any[];
}

export interface TeacherDashboardSummary {
  school_year_id: string;
  summary: {
    assignment_count: number;
    group_count: number;
    student_count: number;
    average: number;
    passed: number;
    failed: number;
    approval_rate: number;
    performance_levels: TeacherPerformanceLevels;
  };
  groups: TeacherGroupAnalytics[];
  period_trend: Array<{
    period_name: string;
    average: number;
    passed: number;
    failed: number;
  }>;
  top_groups: TeacherDashboardGroupRanking[];
  attention_students: TeacherDashboardStudentHighlight[];
  highlight_students: TeacherDashboardStudentHighlight[];
}

interface StudentOverviewResponse {
  student_id: string;
  school_year: StudentOverview['school_year'];
  summary: {
    general_average: number;
    final_status: StudentOverview['final_status'];
    passed_areas: number;
    failed_areas: number;
  };
  best_area: string | null;
  attention_area: string | null;
}

interface StudentAreasResponse {
  areas: StudentAreaMetric[];
}

interface StudentPeriodSummaryResponse {
  periods: StudentPeriodSummary[];
}

const unwrapPayload = <T>(payload: any): T => payload?.data ?? payload;

export const normalizeStudentOverview = (payload: StudentOverviewResponse): StudentOverview => ({
  student_id: payload.student_id,
  school_year: payload.school_year,
  general_average: Number(payload.summary?.general_average ?? 0),
  final_status: payload.summary?.final_status ?? 'failed',
  passed_areas: Number(payload.summary?.passed_areas ?? 0),
  failed_areas: Number(payload.summary?.failed_areas ?? 0),
  best_area: payload.best_area ?? null,
  attention_area: payload.attention_area ?? null,
});

export const normalizeStudentAreas = (payload: StudentAreasResponse): StudentAreaMetric[] =>
  Array.isArray(payload?.areas) ? payload.areas : [];

export const normalizeStudentPeriodSummary = (payload: StudentPeriodSummaryResponse): StudentPeriodSummary[] =>
  Array.isArray(payload?.periods) ? payload.periods : [];

export const analyticsApi = {
  getStudentOverview: async (schoolYearId: string): Promise<StudentOverview> => {
    const response = await api.get('/api/analytics/student/me/overview', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
      },
    });
    return normalizeStudentOverview(unwrapPayload<StudentOverviewResponse>(response.data));
  },
  getStudentAreas: async (schoolYearId: string): Promise<StudentAreaMetric[]> => {
    const response = await api.get('/api/analytics/student/me/areas', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
      },
    });
    return normalizeStudentAreas(unwrapPayload<StudentAreasResponse>(response.data));
  },
  getStudentPeriodSummary: async (schoolYearId: string): Promise<StudentPeriodSummary[]> => {
    const response = await api.get('/api/analytics/student/me/period-summary', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
      },
    });
    return normalizeStudentPeriodSummary(unwrapPayload<StudentPeriodSummaryResponse>(response.data));
  },
  getStudentBulletin: async ({
    schoolYearId,
    periodId,
  }: {
    schoolYearId: string;
    periodId: string;
  }): Promise<StudentBulletinDocument> => {
    const response = await api.get('/api/analytics/student/me/bulletin', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
        period_id: assertObjectId(periodId, 'period_id'),
      },
    });
    return response.data?.data ?? response.data;
  },
  getTeacherGroups: (schoolYearId: string) =>
    api.get('/api/analytics/teacher/me/groups', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
      },
    }),
  getTeacherDashboardSummary: (schoolYearId: string) =>
    api.get('/api/analytics/teacher/me/dashboard-summary', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
      },
    }),
  getTeacherGroupPerformance: (schoolYearId: string, groupId: string, areaId: string, periodId?: string) =>
    api.get('/api/analytics/teacher/me/group-performance', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
        group_id: assertObjectId(groupId, 'group_id'),
        area_id: assertObjectId(areaId, 'area_id'),
        period_id: periodId ? assertObjectId(periodId, 'period_id') : undefined,
      },
    }),
  getTeacherGroupTrend: (schoolYearId: string, groupId: string, areaId: string) =>
    api.get('/api/analytics/teacher/me/group-trend', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
        group_id: assertObjectId(groupId, 'group_id'),
        area_id: assertObjectId(areaId, 'area_id'),
      },
    }),
  getTeacherStudentDetail: (schoolYearId: string, studentId: string, areaId: string) =>
    api.get('/api/analytics/teacher/me/student-detail', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
        student_id: assertObjectId(studentId, 'student_id'),
        area_id: assertObjectId(areaId, 'area_id'),
      },
    }),

  // Admin analytics backed by the real API, aligned with PRD 008.
  getAdminDashboardSummary: (schoolYearId: string) =>
    api.get('/api/analytics/admin/dashboard-summary', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
      },
    }),
  getAdminInstitutionOverview: (schoolYearId: string, periodId?: string) =>
    api.get('/api/analytics/admin/institution-overview', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
        period_id: periodId ? assertObjectId(periodId, 'period_id') : undefined,
      },
    }),
  getAdminInstitutionTrend: (schoolYearId: string) =>
    api.get('/api/analytics/admin/institution-trend', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
      },
    }),
  getAdminByGrade: (schoolYearId: string, periodId?: string) =>
    api.get('/api/analytics/admin/by-grade', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
        period_id: periodId ? assertObjectId(periodId, 'period_id') : undefined,
      },
    }),
  getAdminByArea: (schoolYearId: string, gradeId?: string, periodId?: string) =>
    api.get('/api/analytics/admin/by-area', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
        grade_id: gradeId ? assertObjectId(gradeId, 'grade_id') : undefined,
        period_id: periodId ? assertObjectId(periodId, 'period_id') : undefined,
      },
    }),
  getAdminGradeDetail: (schoolYearId: string, gradeId: string, periodId?: string) =>
    api.get('/api/analytics/admin/grade-detail', {
      params: {
        school_year_id: assertObjectId(schoolYearId, 'school_year_id'),
        grade_id: assertObjectId(gradeId, 'grade_id'),
        period_id: periodId ? assertObjectId(periodId, 'period_id') : undefined,
      },
    }),
};
