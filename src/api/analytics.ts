import api from './axios';
import { assertObjectId } from '@/lib/object-id';

const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export interface StudentOverview {
  general_average: number;
  final_status: 'passed' | 'failed' | 'repeating';
  passed_areas: number;
  failed_areas: number;
  best_area: string;
  attention_area: string;
}

export interface StudentAreaMetric {
  area_id: string;
  area_name: string;
  final_average: number;
  status: 'passed' | 'failed';
  year_averages: Array<{ year: string; average: number }>;
  periods: Array<{ period_name: string; average: number }>;
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
  periods: Array<{ period_name: string; average: number; passed: number; failed: number }>;
  students: Array<{
    student_id?: string;
    student_name: string;
    student_email?: string | null;
    average: number;
    status: 'passed' | 'failed';
  }>;
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
  };
  groups: TeacherGroupAnalytics[];
}

const studentOverview: StudentOverview = {
  general_average: 8.1,
  final_status: 'passed',
  passed_areas: 8,
  failed_areas: 1,
  best_area: 'Matemáticas',
  attention_area: 'Sociales',
};

const studentAreas: StudentAreaMetric[] = [
  {
    area_id: 'math',
    area_name: 'Matemáticas',
    final_average: 8.7,
    status: 'passed',
    year_averages: [
      { year: '2024', average: 7.9 },
      { year: '2025', average: 8.2 },
      { year: '2026', average: 8.7 },
    ],
    periods: [
      { period_name: 'Periodo 1', average: 8.2 },
      { period_name: 'Periodo 2', average: 8.9 },
      { period_name: 'Periodo 3', average: 8.8 },
      { period_name: 'Periodo 4', average: 8.7 },
    ],
  },
  {
    area_id: 'lang',
    area_name: 'Lenguaje',
    final_average: 7.8,
    status: 'passed',
    year_averages: [
      { year: '2024', average: 7.2 },
      { year: '2025', average: 7.5 },
      { year: '2026', average: 7.8 },
    ],
    periods: [
      { period_name: 'Periodo 1', average: 7.4 },
      { period_name: 'Periodo 2', average: 7.9 },
      { period_name: 'Periodo 3', average: 8.0 },
      { period_name: 'Periodo 4', average: 7.8 },
    ],
  },
  {
    area_id: 'science',
    area_name: 'Ciencias',
    final_average: 8.0,
    status: 'passed',
    year_averages: [
      { year: '2024', average: 7.1 },
      { year: '2025', average: 7.6 },
      { year: '2026', average: 8.0 },
    ],
    periods: [
      { period_name: 'Periodo 1', average: 7.8 },
      { period_name: 'Periodo 2', average: 8.1 },
      { period_name: 'Periodo 3', average: 8.2 },
      { period_name: 'Periodo 4', average: 8.0 },
    ],
  },
  {
    area_id: 'social',
    area_name: 'Sociales',
    final_average: 6.4,
    status: 'failed',
    year_averages: [
      { year: '2024', average: 6.9 },
      { year: '2025', average: 6.8 },
      { year: '2026', average: 6.4 },
    ],
    periods: [
      { period_name: 'Periodo 1', average: 6.8 },
      { period_name: 'Periodo 2', average: 6.5 },
      { period_name: 'Periodo 3', average: 6.2 },
      { period_name: 'Periodo 4', average: 6.4 },
    ],
  },
];

const teacherGroups: TeacherGroupAnalytics[] = [
  {
    group_id: '65a0000000000000000008a1',
    group_name: '8A',
    grade_name: '8',
    area_name: 'Matemáticas',
    student_count: 32,
    average: 7.3,
    passed: 25,
    failed: 7,
    periods: [
      { period_name: 'Periodo 1', average: 6.8, passed: 20, failed: 12 },
      { period_name: 'Periodo 2', average: 7.2, passed: 23, failed: 9 },
      { period_name: 'Periodo 3', average: 7.5, passed: 25, failed: 7 },
      { period_name: 'Periodo 4', average: 7.3, passed: 25, failed: 7 },
    ],
    students: [
      { student_name: 'Ana Lopez', average: 9.1, status: 'passed' },
      { student_name: 'Juan Perez', average: 8.4, status: 'passed' },
      { student_name: 'Sofia Ruiz', average: 7.9, status: 'passed' },
      { student_name: 'Carlos Mora', average: 5.8, status: 'failed' },
    ],
  },
  {
    group_id: '65a0000000000000000009b2',
    group_name: '9B',
    grade_name: '9',
    area_name: 'Matemáticas',
    student_count: 29,
    average: 6.9,
    passed: 19,
    failed: 10,
    periods: [
      { period_name: 'Periodo 1', average: 6.4, passed: 17, failed: 12 },
      { period_name: 'Periodo 2', average: 6.7, passed: 18, failed: 11 },
      { period_name: 'Periodo 3', average: 7.0, passed: 19, failed: 10 },
      { period_name: 'Periodo 4', average: 6.9, passed: 19, failed: 10 },
    ],
    students: [
      { student_name: 'Valeria Gil', average: 8.7, status: 'passed' },
      { student_name: 'Mateo Diaz', average: 7.5, status: 'passed' },
      { student_name: 'Daniel Rios', average: 6.2, status: 'passed' },
      { student_name: 'Laura Soto', average: 5.4, status: 'failed' },
    ],
  },
];

export const analyticsApi = {
  getStudentOverview: async () => {
    await wait();
    return studentOverview;
  },
  getStudentAreas: async () => {
    await wait();
    return studentAreas;
  },
  getStudentPeriodSummary: async () => {
    await wait();
    return [
      { period_id: 'period-1', period_name: 'Periodo 1', general_average: 7.1, passed_areas: 6, failed_areas: 3, status: 'passed' },
      { period_id: 'period-2', period_name: 'Periodo 2', general_average: 7.5, passed_areas: 7, failed_areas: 2, status: 'passed' },
      { period_id: 'period-3', period_name: 'Periodo 3', general_average: 8.0, passed_areas: 8, failed_areas: 1, status: 'passed' },
      { period_id: 'period-4', period_name: 'Periodo 4', general_average: 7.8, passed_areas: 8, failed_areas: 1, status: 'passed' },
    ];
  },
  getTeacherGroupsAnalytics: async () => {
    await wait();
    return teacherGroups;
  },
  getTeacherGroupAnalytics: async (groupId: string) => {
    await wait();
    return teacherGroups.find((group) => group.group_id === groupId) ?? teacherGroups[0];
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
