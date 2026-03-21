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

const bulletinAreaSeed = [
  {
    area_id: 'math',
    area_name: 'Matemáticas',
    evaluations: [
      { id: 'math-1', name: 'Taller de problemas', score: 8.7, weight: 25 },
      { id: 'math-2', name: 'Quiz de fracciones', score: 9.1, weight: 20 },
      { id: 'math-3', name: 'Proyecto geométrico', score: 8.9, weight: 25 },
      { id: 'math-4', name: 'Prueba final', score: 8.6, weight: 30 },
    ],
  },
  {
    area_id: 'lang',
    area_name: 'Lengua Castellana',
    evaluations: [
      { id: 'lang-1', name: 'Comprensión lectora', score: 8.1, weight: 30 },
      { id: 'lang-2', name: 'Ensayo argumentativo', score: 7.6, weight: 30 },
      { id: 'lang-3', name: 'Exposición oral', score: 8.0, weight: 20 },
      { id: 'lang-4', name: 'Prueba escrita', score: 7.8, weight: 20 },
    ],
  },
  {
    area_id: 'english',
    area_name: 'Inglés',
    evaluations: [
      { id: 'eng-1', name: 'Vocabulary check', score: 8.9, weight: 20 },
      { id: 'eng-2', name: 'Speaking task', score: 8.4, weight: 25 },
      { id: 'eng-3', name: 'Reading workshop', score: 8.6, weight: 25 },
      { id: 'eng-4', name: 'Final exam', score: 8.8, weight: 30 },
    ],
  },
  {
    area_id: 'science',
    area_name: 'Ciencias Naturales',
    evaluations: [
      { id: 'sci-1', name: 'Laboratorio', score: 8.4, weight: 30 },
      { id: 'sci-2', name: 'Informe experimental', score: 7.9, weight: 25 },
      { id: 'sci-3', name: 'Trabajo colaborativo', score: 8.2, weight: 20 },
      { id: 'sci-4', name: 'Prueba del periodo', score: 8.1, weight: 25 },
    ],
  },
  {
    area_id: 'social',
    area_name: 'Ciencias Sociales',
    evaluations: [
      { id: 'soc-1', name: 'Línea del tiempo', score: 6.8, weight: 20 },
      { id: 'soc-2', name: 'Debate histórico', score: 6.2, weight: 30 },
      { id: 'soc-3', name: 'Mapa conceptual', score: 6.5, weight: 20 },
      { id: 'soc-4', name: 'Evaluación final', score: 6.0, weight: 30 },
    ],
  },
  {
    area_id: 'ethics',
    area_name: 'Ética y Valores',
    evaluations: [
      { id: 'eth-1', name: 'Bitácora reflexiva', score: 9.3, weight: 35 },
      { id: 'eth-2', name: 'Proyecto de convivencia', score: 9.0, weight: 35 },
      { id: 'eth-3', name: 'Participación', score: 9.4, weight: 30 },
    ],
  },
  {
    area_id: 'arts',
    area_name: 'Educación Artística',
    evaluations: [
      { id: 'art-1', name: 'Portafolio visual', score: 8.7, weight: 40 },
      { id: 'art-2', name: 'Presentación creativa', score: 8.9, weight: 35 },
      { id: 'art-3', name: 'Autoevaluación', score: 9.1, weight: 25 },
    ],
  },
];

const performanceLabel = (score: number) => {
  if (score >= 9) return 'Superior';
  if (score >= 8) return 'Alto';
  if (score >= 6) return 'Básico';
  return 'Bajo';
};

const weightedAverage = (evaluations: StudentBulletinEvaluation[]) => {
  const totalWeight = evaluations.reduce((sum, evaluation) => sum + (evaluation.weight || 0), 0);
  if (!totalWeight) {
    const average = evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / Math.max(evaluations.length, 1);
    return Number(average.toFixed(1));
  }

  const average = evaluations.reduce(
    (sum, evaluation) => sum + ((evaluation.score * (evaluation.weight || 0)) / totalWeight),
    0
  );
  return Number(average.toFixed(1));
};

const buildBulletinAreas = (periodName: string): StudentBulletinArea[] => {
  const periodShift = periodName.endsWith('2')
    ? 0.2
    : periodName.endsWith('3')
      ? 0.35
      : periodName.endsWith('4')
        ? 0.1
        : 0;

  return bulletinAreaSeed.map((area, index) => {
    const evaluations = area.evaluations.map((evaluation, evaluationIndex) => {
      const delta = ((index + evaluationIndex) % 3 === 0 ? periodShift : periodShift / 2);
      return {
        ...evaluation,
        score: Number(Math.min(10, evaluation.score + delta).toFixed(1)),
      };
    });

    const periodAverage = weightedAverage(evaluations);
    return {
      area_id: area.area_id,
      area_name: area.area_name,
      period_average: periodAverage,
      final_result_label: performanceLabel(periodAverage),
      status: periodAverage >= 6 ? 'passed' : 'failed',
      evaluations,
    };
  });
};

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
  getStudentBulletin: async ({
    schoolYearId,
    periodId,
    periodName,
    startDate,
    endDate,
    schoolYearLabel,
  }: {
    schoolYearId?: string;
    periodId: string;
    periodName: string;
    startDate?: string | null;
    endDate?: string | null;
    schoolYearLabel?: string | null;
  }): Promise<StudentBulletinDocument> => {
    await wait(220);

    if (schoolYearId) {
      assertObjectId(schoolYearId, 'school_year_id');
    }

    const areas = buildBulletinAreas(periodName);

    return {
      institution: {
        logo_url: 'https://edu-connect-beta.vercel.app/img/EduConectLogo.png',
        official_name: 'Institución Educativa Municipal Nuevo Horizonte',
        municipality: 'Bucaramanga',
        department: 'Santander',
        dane_code: '168001008847',
        header_text: 'Educación pública con enfoque integral, ciudadanía y excelencia académica',
        legal_note: 'Documento generado por la plataforma EduConnect. Su validez depende de la verificación institucional.',
      },
      student: {
        full_name: 'Mariana Torres Suárez',
        document_label: 'TI',
        document_number: '1098765432',
        code: 'EC-2026-0842',
      },
      enrollment: {
        grade_name: '8°',
        group_name: 'A',
        school_year_label: schoolYearLabel || '2026',
        school_shift: 'Mañana',
      },
      period: {
        id: periodId,
        name: periodName,
        start_date: startDate || null,
        end_date: endDate || null,
        issued_at: new Date().toISOString(),
      },
      director_name: 'Lic. Andrea Milena Rojas',
      teacher_comment: 'La estudiante mantiene un desempeño consistente y una participación respetuosa en clase. Se recomienda reforzar la argumentación en Sociales y sostener el buen ritmo de trabajo autónomo en las demás áreas.',
      signatures: [
        { label: 'Director(a) de grupo', name: 'Lic. Andrea Milena Rojas' },
        { label: 'Coordinación académica', name: 'Mg. Carlos Eduardo Niño' },
        { label: 'Acudiente', name: '____________________________' },
      ],
      areas,
    };
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
