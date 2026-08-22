import { addDays, endOfDay, startOfDay } from 'date-fns';
import type {
  CalendarActivityStatus,
  CalendarCatalog,
  CalendarEntity,
  CalendarPendingActivity,
  CalendarQuery,
  CalendarResponse,
  CalendarSchoolYear,
  CalendarSession,
  CalendarSessionInput,
} from './calendar';

const DEMO_YEAR: CalendarSchoolYear = { id: 'year-2026', name: 'Año escolar 2026', year: 2026 };
const DEMO_STUDENT_GROUP_ID = 'group-7a';
const DEMO_TEACHER_ID = 'teacher-001';

const areas: CalendarEntity[] = [
  { id: 'area-math', name: 'Matemáticas' },
  { id: 'area-language', name: 'Lenguaje' },
  { id: 'area-science', name: 'Ciencias' },
  { id: 'area-english', name: 'Inglés' },
];

const grades: CalendarEntity[] = [
  { id: 'grade-6', name: '6°' },
  { id: 'grade-7', name: '7°' },
  { id: 'grade-8', name: '8°' },
];

const groups: CalendarEntity[] = [
  { id: 'group-6b', name: '6B' },
  { id: 'group-7a', name: '7A' },
  { id: 'group-8a', name: '8A' },
];

const teachers: CalendarEntity[] = [
  { id: 'teacher-001', name: 'Daniel Vargas' },
  { id: 'teacher-002', name: 'Paula Ortega' },
  { id: 'teacher-003', name: 'Mauricio Santos' },
];

const aulas: CalendarEntity[] = [
  { id: 'aula-201', name: 'Aula 201' },
  { id: 'aula-204', name: 'Aula 204' },
  { id: 'aula-lab', name: 'Laboratorio' },
];

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const makeDate = (referenceDate: Date, dayOffset: number, hour: number, minute = 0) => {
  const value = startOfDay(addDays(referenceDate, dayOffset));
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
};

const activity = (
  id: string,
  title: string,
  dueAt: string,
  status: CalendarActivityStatus = 'pending',
): CalendarPendingActivity => ({ id, title, dueAt, status });

export const createDemoCalendarSeed = (referenceDate = new Date()): CalendarSession[] => [
  {
    id: 'demo-session-001',
    type: 'class_session',
    startAt: makeDate(referenceDate, 0, 7, 30),
    endAt: makeDate(referenceDate, 0, 8, 30),
    status: 'scheduled',
    schoolYear: DEMO_YEAR,
    grade: grades[1],
    group: groups[1],
    area: areas[0],
    teacher: teachers[0],
    aula: aulas[0],
    topic: 'Ecuaciones lineales',
    pendingActivities: [activity('activity-001', 'Taller de ecuaciones', makeDate(referenceDate, 2, 23, 59))],
  },
  {
    id: 'demo-session-002',
    type: 'class_session',
    startAt: makeDate(referenceDate, 0, 9, 0),
    endAt: makeDate(referenceDate, 0, 10, 0),
    status: 'scheduled',
    schoolYear: DEMO_YEAR,
    grade: grades[0],
    group: groups[0],
    area: areas[1],
    teacher: teachers[1],
    aula: aulas[1],
    topic: 'Lectura crítica: identificar argumentos',
    pendingActivities: [],
  },
  {
    id: 'demo-session-003',
    type: 'class_session',
    startAt: makeDate(referenceDate, 1, 8, 0),
    endAt: makeDate(referenceDate, 1, 9, 30),
    status: 'scheduled',
    schoolYear: DEMO_YEAR,
    grade: grades[1],
    group: groups[1],
    area: areas[2],
    teacher: teachers[2],
    aula: aulas[2],
    topic: 'Cambios de estado y transferencia de calor',
    pendingActivities: [activity('activity-002', 'Informe de laboratorio', makeDate(referenceDate, 4, 23, 59), 'overdue')],
  },
  {
    id: 'demo-session-004',
    type: 'class_session',
    startAt: makeDate(referenceDate, 1, 10, 0),
    endAt: makeDate(referenceDate, 1, 11, 0),
    status: 'scheduled',
    schoolYear: DEMO_YEAR,
    grade: grades[2],
    group: groups[2],
    area: areas[0],
    teacher: teachers[0],
    aula: aulas[0],
    topic: 'Sistemas de ecuaciones',
    pendingActivities: [],
  },
  {
    id: 'demo-session-005',
    type: 'class_session',
    startAt: makeDate(referenceDate, 2, 7, 30),
    endAt: makeDate(referenceDate, 2, 8, 30),
    status: 'scheduled',
    schoolYear: DEMO_YEAR,
    grade: grades[1],
    group: groups[1],
    area: areas[3],
    teacher: teachers[1],
    aula: aulas[1],
    topic: 'Daily routines and present simple',
    pendingActivities: [activity('activity-003', 'Audio: My morning routine', makeDate(referenceDate, 3, 23, 59), 'submitted')],
  },
  {
    id: 'demo-session-006',
    type: 'class_session',
    startAt: makeDate(referenceDate, 3, 11, 0),
    endAt: makeDate(referenceDate, 3, 12, 0),
    status: 'cancelled',
    schoolYear: DEMO_YEAR,
    grade: grades[1],
    group: groups[1],
    area: areas[0],
    teacher: teachers[0],
    aula: aulas[0],
    topic: 'Repaso de proporcionalidad',
    pendingActivities: [],
  },
  {
    id: 'demo-session-007',
    type: 'class_session',
    startAt: makeDate(referenceDate, 4, 8, 0),
    endAt: makeDate(referenceDate, 4, 9, 0),
    status: 'scheduled',
    schoolYear: DEMO_YEAR,
    grade: grades[1],
    group: groups[1],
    area: areas[0],
    teacher: teachers[0],
    aula: aulas[0],
    topic: 'Aplicaciones de porcentajes',
    pendingActivities: [],
  },
  {
    id: 'demo-session-008',
    type: 'class_session',
    startAt: makeDate(referenceDate, 5, 9, 30),
    endAt: makeDate(referenceDate, 5, 10, 30),
    status: 'scheduled',
    schoolYear: DEMO_YEAR,
    grade: grades[2],
    group: groups[2],
    area: areas[2],
    teacher: teachers[2],
    aula: aulas[2],
    topic: 'Ecosistemas y relaciones tróficas',
    pendingActivities: [],
  },
];

const getDateBounds = (query: CalendarQuery) => ({
  from: startOfDay(new Date(query.from)).getTime(),
  to: endOfDay(new Date(query.to)).getTime(),
});

const matchesQuery = (session: CalendarSession, query: CalendarQuery) => {
  const bounds = getDateBounds(query);
  const start = new Date(session.startAt).getTime();
  if (start < bounds.from || start > bounds.to) return false;
  if (query.role === 'student' && session.group.id !== DEMO_STUDENT_GROUP_ID) return false;
  if (query.role === 'teacher' && session.teacher.id !== DEMO_TEACHER_ID) return false;
  if (query.schoolYearId && session.schoolYear.id !== query.schoolYearId) return false;
  if (query.gradeId && session.grade.id !== query.gradeId) return false;
  if (query.groupId && session.group.id !== query.groupId) return false;
  if (query.areaId && session.area.id !== query.areaId) return false;
  if (query.teacherId && session.teacher.id !== query.teacherId) return false;
  if (query.aulaId && session.aula.id !== query.aulaId) return false;
  return true;
};

const uniqueActivities = (sessions: CalendarSession[]) => {
  const activityMap = new Map<string, CalendarPendingActivity>();
  sessions.forEach((session) => session.pendingActivities.forEach((item) => activityMap.set(item.id, item)));
  return Array.from(activityMap.values());
};

let demoSessions = createDemoCalendarSeed();
let nextDemoId = 100;

export const calendarDemoSource = {
  async list(query: CalendarQuery): Promise<CalendarResponse> {
    const sessions = demoSessions
      .filter((session) => matchesQuery(session, query))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    return clone({
      sessions,
      pendingActivities: uniqueActivities(sessions),
      range: { from: query.from, to: query.to },
    });
  },

  async create(input: CalendarSessionInput) {
    if (input.teacherId === DEMO_TEACHER_ID && (!['group-7a', 'group-8a'].includes(input.groupId) || input.areaId !== 'area-math')) {
      throw new Error('El docente demo solo está asignado a Matemáticas en los grupos 7A y 8A.');
    }

    const source = demoSessions.find((session) => session.group.id === input.groupId && session.area.id === input.areaId) || demoSessions[0];
    const selectedGroup = groups.find((item) => item.id === input.groupId) || source.group;
    const selectedArea = areas.find((item) => item.id === input.areaId) || source.area;
    const selectedTeacher = teachers.find((item) => item.id === input.teacherId) || source.teacher;
    const selectedAula = aulas.find((item) => item.id === input.aulaId) || source.aula;
    const selectedGrade = grades.find((item) => item.id === ({ 'group-6b': 'grade-6', 'group-7a': 'grade-7', 'group-8a': 'grade-8' } as Record<string, string>)[selectedGroup.id]) || source.grade;

    const session: CalendarSession = {
      ...clone(source),
      id: `demo-session-${nextDemoId++}`,
      startAt: input.startAt,
      endAt: input.endAt,
      status: 'scheduled',
      topic: input.topic,
      schoolYear: DEMO_YEAR,
      grade: selectedGrade,
      group: selectedGroup,
      area: selectedArea,
      teacher: selectedTeacher,
      aula: selectedAula,
      pendingActivities: [],
    };

    demoSessions = [...demoSessions, session];
    return clone(session);
  },

  async update(id: string, input: CalendarSessionInput) {
    const current = demoSessions.find((session) => session.id === id);
    if (!current) throw new Error('La sesión demo no existe.');
    if (input.teacherId === DEMO_TEACHER_ID && (!['group-7a', 'group-8a'].includes(input.groupId) || input.areaId !== 'area-math')) {
      throw new Error('El docente demo solo está asignado a Matemáticas en los grupos 7A y 8A.');
    }

    const updated: CalendarSession = {
      ...current,
      startAt: input.startAt,
      endAt: input.endAt,
      topic: input.topic,
      group: groups.find((item) => item.id === input.groupId) || current.group,
      area: areas.find((item) => item.id === input.areaId) || current.area,
      teacher: teachers.find((item) => item.id === input.teacherId) || current.teacher,
      aula: aulas.find((item) => item.id === input.aulaId) || current.aula,
    };

    demoSessions = demoSessions.map((session) => session.id === id ? updated : session);
    return clone(updated);
  },

  async cancel(id: string) {
    const current = demoSessions.find((session) => session.id === id);
    if (!current) throw new Error('La sesión demo no existe.');
    const updated = { ...current, status: 'cancelled' as const };
    demoSessions = demoSessions.map((session) => session.id === id ? updated : session);
    return clone(updated);
  },

  async activate(id: string) {
    const current = demoSessions.find((session) => session.id === id);
    if (!current) throw new Error('La sesión demo no existe.');
    const updated = { ...current, status: 'scheduled' as const };
    demoSessions = demoSessions.map((session) => session.id === id ? updated : session);
    return clone(updated);
  },
};

export const calendarDemoCatalog: CalendarCatalog = {
  years: [DEMO_YEAR],
  grades,
  groups,
  areas,
  teachers,
  aulas,
};
