import api from './axios';
import { calendarDemoSource } from './calendarDemo';

export type CalendarRole = 'admin' | 'teacher' | 'student';
export type CalendarSessionStatus = 'scheduled' | 'cancelled';
export type CalendarActivityStatus = 'pending' | 'overdue' | 'submitted';

export interface CalendarEntity {
  id: string;
  name: string;
}

export interface CalendarSchoolYear extends CalendarEntity {
  year: number;
}

export interface CalendarPendingActivity {
  id: string;
  title: string;
  dueAt: string | null;
  status: CalendarActivityStatus;
}

export interface CalendarSession {
  id: string;
  type: 'class_session';
  startAt: string;
  endAt: string;
  status: CalendarSessionStatus;
  schoolYear: CalendarSchoolYear;
  grade: CalendarEntity;
  group: CalendarEntity;
  area: CalendarEntity;
  teacher: CalendarEntity;
  aula: CalendarEntity;
  topic: string;
  pendingActivities: CalendarPendingActivity[];
}

export interface CalendarSessionInput {
  schoolYearId: string;
  groupId: string;
  areaId: string;
  teacherId: string;
  aulaId: string;
  startAt: string;
  endAt: string;
  topic: string;
}

export interface CalendarCatalog {
  years: CalendarSchoolYear[];
  grades: CalendarEntity[];
  groups: CalendarEntity[];
  areas: CalendarEntity[];
  teachers: CalendarEntity[];
  aulas: CalendarEntity[];
}

export interface CalendarQuery {
  role: CalendarRole;
  userId?: string;
  from: string;
  to: string;
  schoolYearId?: string;
  gradeId?: string;
  groupId?: string;
  areaId?: string;
  teacherId?: string;
  aulaId?: string;
}

export interface CalendarResponse {
  sessions: CalendarSession[];
  pendingActivities: CalendarPendingActivity[];
  range: { from: string; to: string };
}

export const CALENDAR_DATA_SOURCE = import.meta.env.VITE_CALENDAR_DATA_SOURCE === 'api' ? 'api' : 'demo';

const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;

const getId = (value: any) => String(value?.id ?? value?._id ?? value ?? '');

const normalizeEntity = (value: any, fallbackName = 'Sin asignar'): CalendarEntity => ({
  id: getId(value),
  name: typeof value === 'object' ? String(value?.name ?? value?.full_name ?? fallbackName) : fallbackName,
});

const normalizeSession = (session: any): CalendarSession => ({
  id: getId(session),
  type: 'class_session',
  startAt: session.startAt ?? session.start_at,
  endAt: session.endAt ?? session.end_at,
  status: session.status === 'cancelled' ? 'cancelled' : 'scheduled',
  schoolYear: {
    ...normalizeEntity(session.schoolYear ?? session.school_year, 'Año escolar'),
    year: Number(session.schoolYear?.year ?? session.school_year?.year ?? 0),
  },
  grade: normalizeEntity(session.grade ?? session.grade_id, 'Grado'),
  group: normalizeEntity(session.group ?? session.group_id, 'Grupo'),
  area: normalizeEntity(session.area ?? session.area_id, 'Materia'),
  teacher: normalizeEntity(session.teacher ?? session.teacher_id, 'Docente'),
  aula: normalizeEntity(session.aula ?? session.aula_id, 'Aula'),
  topic: String(session.topic ?? ''),
  pendingActivities: (session.pendingActivities ?? session.pending_activities ?? []).map((activity: any) => ({
    id: getId(activity),
    title: String(activity.title ?? 'Actividad'),
    dueAt: activity.dueAt ?? activity.due_at ?? null,
    status: activity.status === 'overdue' || activity.status === 'submitted' ? activity.status : 'pending',
  })),
});

const normalizeResponse = (payload: any, query: CalendarQuery): CalendarResponse => {
  const value = unwrap(payload);
  const sessions = Array.isArray(value?.sessions) ? value.sessions.map(normalizeSession) : [];
  const pendingActivities = Array.isArray(value?.pendingActivities)
    ? value.pendingActivities.map((activity: any) => ({
      id: getId(activity),
      title: String(activity.title ?? 'Actividad'),
      dueAt: activity.dueAt ?? activity.due_at ?? null,
      status: activity.status === 'overdue' || activity.status === 'submitted' ? activity.status : 'pending',
    }))
    : sessions.flatMap((session) => session.pendingActivities);

  return {
    sessions,
    pendingActivities,
    range: value?.range ?? { from: query.from, to: query.to },
  };
};

const toParams = (query: CalendarQuery) => ({
  from: query.from,
  to: query.to,
  school_year_id: query.schoolYearId,
  grade_id: query.gradeId,
  group_id: query.groupId,
  area_id: query.areaId,
  teacher_id: query.teacherId,
  aula_id: query.aulaId,
});

const toPayload = (input: CalendarSessionInput) => ({
  school_year_id: input.schoolYearId,
  group_id: input.groupId,
  area_id: input.areaId,
  teacher_id: input.teacherId,
  aula_id: input.aulaId,
  start_at: input.startAt,
  end_at: input.endAt,
  topic: input.topic,
});

const apiSource = {
  async list(query: CalendarQuery) {
    const endpoint = query.role === 'admin' ? '/api/calendar' : '/api/calendar/me';
    const response = await api.get(endpoint, { params: toParams(query) });
    return normalizeResponse(response, query);
  },
  async create(input: CalendarSessionInput) {
    const response = await api.post('/api/calendar/sessions', toPayload(input));
    return normalizeSession(unwrap(response)?.session ?? unwrap(response));
  },
  async update(id: string, input: CalendarSessionInput) {
    const response = await api.patch(`/api/calendar/sessions/${id}`, toPayload(input));
    return normalizeSession(unwrap(response)?.session ?? unwrap(response));
  },
  async cancel(id: string) {
    const response = await api.patch(`/api/calendar/sessions/${id}`, { status: 'cancelled' });
    return normalizeSession(unwrap(response)?.session ?? unwrap(response));
  },
  async activate(id: string) {
    const response = await api.patch(`/api/calendar/sessions/${id}`, { status: 'scheduled' });
    return normalizeSession(unwrap(response)?.session ?? unwrap(response));
  },
};

export const calendarApi = CALENDAR_DATA_SOURCE === 'api' ? apiSource : calendarDemoSource;
