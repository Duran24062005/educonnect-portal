import api from './axios';
import { assertObjectId } from '@/lib/object-id';
import type { CalendarEntity, CalendarSchoolYear } from './calendar';

export interface TeachingAssignment {
  id: string;
  schoolYearId: string;
  schoolYear: CalendarSchoolYear | null;
  teacher: CalendarEntity;
  group: CalendarEntity;
  area: CalendarEntity;
  status: 'active' | 'inactive';
}

export interface TeachingAssignmentInput {
  school_year_id: string;
  teacher_id: string;
  group_id: string;
  area_id: string;
}

const unwrap = <T>(response: any): T => (response?.data?.data ?? response?.data) as T;
const entity = (value: any, fallback: string): CalendarEntity => ({
  id: String(value?.id ?? value?._id ?? ''),
  name: String(value?.name ?? fallback),
});

const normalize = (value: any): TeachingAssignment => ({
  id: String(value?.id ?? value?._id ?? ''),
  schoolYearId: String(value?.school_year_id ?? value?.schoolYearId ?? ''),
  schoolYear: value?.school_year ? { ...entity(value.school_year, 'Año escolar'), year: Number(value.school_year.year ?? 0) } : null,
  teacher: entity(value?.teacher, 'Docente'),
  group: entity(value?.group, 'Grupo'),
  area: entity(value?.area, 'Materia'),
  status: value?.status === 'inactive' ? 'inactive' : 'active',
});

export const teachingAssignmentsApi = {
  async list(params: { school_year_id?: string; teacher_id?: string; group_id?: string; area_id?: string; status?: 'active' | 'inactive' } = {}) {
    const response = await api.get('/api/teaching-assignments', {
      params: {
        ...params,
        school_year_id: params.school_year_id ? assertObjectId(params.school_year_id, 'school_year_id') : undefined,
      },
    });
    const value = unwrap<{ assignments: any[] }>(response);
    return { assignments: (value?.assignments ?? []).map(normalize) };
  },
  async create(input: TeachingAssignmentInput) {
    const response = await api.post('/api/teaching-assignments', input);
    return normalize(unwrap(response));
  },
  async update(id: string, status: 'active' | 'inactive') {
    const response = await api.patch(`/api/teaching-assignments/${assertObjectId(id, 'assignment_id')}`, { status });
    return normalize(unwrap(response));
  },
};
