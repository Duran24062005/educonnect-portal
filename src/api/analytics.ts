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
  area_name: string;
  student_count: number;
  average: number;
  passed: number;
  failed: number;
  periods: Array<{ period_name: string; average: number; passed: number; failed: number }>;
  students: Array<{ student_name: string; average: number; status: 'passed' | 'failed' }>;
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

const institutionOverview = {
  student_count: 924,
  general_average: 7.1,
  passed: 734,
  failed: 190,
  repeating: 36,
};

const institutionPeriods = [
  { period_name: 'Periodo 1', average: 6.7, passed: 690, failed: 234 },
  { period_name: 'Periodo 2', average: 7.0, passed: 716, failed: 208 },
  { period_name: 'Periodo 3', average: 7.2, passed: 742, failed: 182 },
  { period_name: 'Periodo 4', average: 7.1, passed: 734, failed: 190 },
];

const institutionGrades = [
  { grade_name: '6', average: 6.6, passed: 120, failed: 38 },
  { grade_name: '7', average: 6.9, passed: 138, failed: 32 },
  { grade_name: '8', average: 7.2, passed: 160, failed: 28 },
  { grade_name: '9', average: 7.0, passed: 154, failed: 41 },
  { grade_name: '10', average: 7.4, passed: 162, failed: 26 },
];

const institutionAreas = [
  { area_name: 'Matemáticas', average: 7.1 },
  { area_name: 'Lenguaje', average: 7.4 },
  { area_name: 'Ciencias', average: 7.0 },
  { area_name: 'Sociales', average: 6.5 },
  { area_name: 'Inglés', average: 7.6 },
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
    return institutionPeriods.map((period, index) => ({
      period_id: `period-${index + 1}`,
      period_name: period.period_name,
      general_average: [7.1, 7.5, 8.0, 7.8][index],
      passed_areas: [6, 7, 8, 8][index],
      failed_areas: [3, 2, 1, 1][index],
      status: index < 1 ? 'passed' : 'passed',
    }));
  },
  getTeacherGroupsAnalytics: async () => {
    await wait();
    return teacherGroups;
  },
  getTeacherGroupAnalytics: async (groupId: string) => {
    await wait();
    return teacherGroups.find((group) => group.group_id === groupId) ?? teacherGroups[0];
  },
  getInstitutionOverview: async () => {
    await wait();
    return institutionOverview;
  },
  getInstitutionPeriodTrend: async () => {
    await wait();
    return institutionPeriods;
  },
  getInstitutionGradeComparison: async () => {
    await wait();
    return institutionGrades;
  },
  getInstitutionAreaComparison: async () => {
    await wait();
    return institutionAreas;
  },
};
