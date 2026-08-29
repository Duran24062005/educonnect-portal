import api from './axios';
import { assertObjectId } from '@/lib/object-id';

export interface AvailabilityWindowInput {
  window_id?: string;
  group_id: string;
  start_time: string;
  end_time: string;
}

export interface AvailabilityWindow extends AvailabilityWindowInput {
  window_id: string;
  group: { _id: string; name: string };
}

export interface ScheduleSlotInput {
  slot_id?: string;
  group_id: string;
  area_id: string;
  teacher_id: string;
  aula_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface ScheduleSlot extends ScheduleSlotInput {
  slot_id: string;
  group: { _id: string; name: string };
  area: { _id: string; name: string };
  teacher: { _id: string; name: string };
  aula: { _id: string; name: string };
}

export interface ScheduleEntryInput {
  teaching_assignment_id: string;
  aula_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  entry_key?: string;
}

export interface ScheduleEntry extends ScheduleEntryInput {
  id: string;
  schedule_id: string;
  teaching_assignment_id: string;
  status: 'active' | 'archived';
  group: { id: string; name: string };
  area: { id: string; name: string };
  teacher: { id: string; name: string };
  aula: { id: string; name: string };
  campus: { id: string; name: string } | null;
}

export interface WeeklySchedule {
  id: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  school_year: { _id: string; name: string };
  school_days: number[];
  published_at: string | null;
  availability_windows: AvailabilityWindow[];
  slots: ScheduleSlot[];
}

const unwrap = <T>(response: any): T => (response?.data?.data ?? response?.data) as T;

const normalizeEntity = (value: any, fallbackName = 'Sin asignar') => ({
  _id: String(value?._id ?? value?.id ?? ''),
  name: String(value?.name ?? fallbackName),
});

const normalizeSchedule = (value: any): WeeklySchedule => ({
  id: String(value?.id ?? value?._id ?? ''),
  version: Number(value?.version ?? 0),
  status: value?.status ?? 'draft',
  school_year: normalizeEntity(value?.school_year),
  school_days: Array.isArray(value?.school_days) ? value.school_days.map(Number) : [1, 2, 3, 4, 5],
  published_at: value?.published_at ?? null,
  availability_windows: Array.isArray(value?.availability_windows) ? value.availability_windows.map((window: any) => ({
    window_id: String(window.window_id),
    group_id: String(window.group?._id ?? window.group_id ?? ''),
    start_time: window.start_time,
    end_time: window.end_time,
    group: normalizeEntity(window.group),
  })) : [],
  slots: Array.isArray(value?.slots) ? value.slots.map((slot: any) => ({
    slot_id: String(slot.slot_id),
    group_id: String(slot.group?._id ?? slot.group_id ?? ''),
    area_id: String(slot.area?._id ?? slot.area_id ?? ''),
    teacher_id: String(slot.teacher?._id ?? slot.teacher_id ?? ''),
    aula_id: String(slot.aula?._id ?? slot.aula_id ?? ''),
    weekday: Number(slot.weekday),
    start_time: String(slot.start_time ?? ''),
    end_time: String(slot.end_time ?? ''),
    group: normalizeEntity(slot.group),
    area: normalizeEntity(slot.area, 'Materia'),
    teacher: normalizeEntity(slot.teacher, 'Docente'),
    aula: normalizeEntity(slot.aula, 'Aula'),
  })) : [],
});

const normalizeEntry = (value: any): ScheduleEntry => ({
  id: String(value?.id ?? value?._id ?? ''),
  schedule_id: String(value?.schedule_id ?? ''),
  teaching_assignment_id: String(value?.teaching_assignment_id ?? ''),
  aula_id: String(value?.aula?.id ?? value?.aula?._id ?? value?.aula_id ?? ''),
  weekday: Number(value?.weekday ?? 1),
  start_time: String(value?.start_time ?? ''),
  end_time: String(value?.end_time ?? ''),
  entry_key: value?.entry_key,
  status: value?.status === 'archived' ? 'archived' : 'active',
  group: { id: String(value?.group?.id ?? value?.group?._id ?? ''), name: String(value?.group?.name ?? 'Grupo') },
  area: { id: String(value?.area?.id ?? value?.area?._id ?? ''), name: String(value?.area?.name ?? 'Materia') },
  teacher: { id: String(value?.teacher?.id ?? value?.teacher?._id ?? ''), name: String(value?.teacher?.name ?? 'Docente') },
  aula: { id: String(value?.aula?.id ?? value?.aula?._id ?? ''), name: String(value?.aula?.name ?? 'Aula') },
  campus: value?.campus ? { id: String(value.campus.id ?? value.campus._id ?? ''), name: String(value.campus.name ?? 'Sede') } : null,
});

export const scheduleApi = {
  list: async (schoolYearId?: string) => {
    const response = await api.get('/api/calendar/schedules', { params: { school_year_id: schoolYearId } });
    const payload = unwrap<{ schedules: any[] }>(response);
    return { schedules: (payload?.schedules ?? []).map(normalizeSchedule) };
  },
  createDraft: async (schoolYearId: string) => {
    const response = await api.post('/api/calendar/schedules/drafts', { school_year_id: assertObjectId(schoolYearId, 'school_year_id') });
    return normalizeSchedule(unwrap(response));
  },
  update: async (id: string, data: { school_days: number[]; availability_windows: AvailabilityWindowInput[]; slots?: ScheduleSlotInput[] }) => {
    const response = await api.patch(`/api/calendar/schedules/${assertObjectId(id, 'id')}`, data);
    return normalizeSchedule(unwrap(response));
  },
  entries: async (scheduleId: string) => {
    const response = await api.get(`/api/calendar/schedules/${assertObjectId(scheduleId, 'schedule_id')}/entries`);
    const payload = unwrap<{ entries: any[] }>(response);
    return { entries: (payload?.entries ?? []).map(normalizeEntry) };
  },
  createEntry: async (scheduleId: string, data: ScheduleEntryInput) => {
    const response = await api.post(`/api/calendar/schedules/${assertObjectId(scheduleId, 'schedule_id')}/entries`, data);
    return normalizeEntry(unwrap(response));
  },
  updateEntry: async (scheduleId: string, entryId: string, data: Partial<ScheduleEntryInput>) => {
    const response = await api.patch(`/api/calendar/schedules/${assertObjectId(scheduleId, 'schedule_id')}/entries/${assertObjectId(entryId, 'entry_id')}`, data);
    return normalizeEntry(unwrap(response));
  },
  archiveEntry: async (scheduleId: string, entryId: string) => {
    const response = await api.delete(`/api/calendar/schedules/${assertObjectId(scheduleId, 'schedule_id')}/entries/${assertObjectId(entryId, 'entry_id')}`);
    return normalizeEntry(unwrap(response));
  },
  publish: async (id: string) => {
    const response = await api.post(`/api/calendar/schedules/${assertObjectId(id, 'id')}/publish`);
    return normalizeSchedule(unwrap(response));
  },
  createException: async (data: any) => {
    const response = await api.post('/api/calendar/exceptions', data);
    return unwrap(response);
  },
};
