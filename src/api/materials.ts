import api from './axios';
import { assertObjectId } from '@/lib/object-id';

export type MaterialType = 'file' | 'link';

export interface MaterialSession {
  _id: string;
  start_at: string;
  end_at: string;
  status: 'scheduled' | 'cancelled';
  topic: string;
  school_year: { _id: string; year: number | null };
  grade: { _id: string; name: string };
  group: { _id: string; name: string };
  area: { _id: string; name: string };
  teacher: { _id: string; name: string };
  aula: { _id: string; name: string };
}

export interface Material {
  _id: string;
  title: string;
  description: string | null;
  material_type: MaterialType;
  link_url: string | null;
  file_url: string | null;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number;
  session: MaterialSession;
  teacher: { _id: string; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialFilters {
  group_id?: string;
  area_id?: string;
  session_id?: string;
}

export interface MaterialMutationPayload {
  title?: string;
  description?: string | null;
  session_id?: string;
  topic?: string;
  link_url?: string | null;
  file?: File | null;
}

export interface MaterialSessionFilters {
  school_year_id?: string;
  group_id?: string;
  area_id?: string;
}

const unwrap = <T>(response: any): T => (response?.data?.data ?? response?.data) as T;

const append = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null) return;
  formData.append(key, String(value));
};

const toFormData = (payload: MaterialMutationPayload) => {
  const formData = new FormData();
  append(formData, 'title', payload.title);
  append(formData, 'description', payload.description);
  append(formData, 'session_id', payload.session_id ? assertObjectId(payload.session_id, 'session_id') : undefined);
  append(formData, 'topic', payload.topic);
  append(formData, 'link_url', payload.link_url);
  if (payload.file) formData.append('material_file', payload.file);
  return formData;
};

const toFilterParams = (filters: MaterialFilters) => ({
  group_id: filters.group_id ? assertObjectId(filters.group_id, 'group_id') : undefined,
  area_id: filters.area_id ? assertObjectId(filters.area_id, 'area_id') : undefined,
  session_id: filters.session_id ? assertObjectId(filters.session_id, 'session_id') : undefined,
});

const toSessionParams = (filters: MaterialSessionFilters) => ({
  school_year_id: filters.school_year_id ? assertObjectId(filters.school_year_id, 'school_year_id') : undefined,
  group_id: filters.group_id ? assertObjectId(filters.group_id, 'group_id') : undefined,
  area_id: filters.area_id ? assertObjectId(filters.area_id, 'area_id') : undefined,
});

export const materialsApi = {
  async getTeacherMaterials(filters: MaterialFilters = {}) {
    const response = await api.get('/api/materials/teacher/me', { params: toFilterParams(filters) });
    return unwrap<{ materials: Material[] }>(response);
  },
  async getTeacherSessions(filters: MaterialSessionFilters = {}) {
    const response = await api.get('/api/materials/teacher/me/sessions', { params: toSessionParams(filters) });
    return unwrap<{ sessions: MaterialSession[] }>(response);
  },
  async createTeacherMaterial(payload: MaterialMutationPayload) {
    const response = await api.post('/api/materials/teacher/me', toFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<{ material: Material }>(response);
  },
  async updateTeacherMaterial(materialId: string, payload: MaterialMutationPayload) {
    const response = await api.put(
      `/api/materials/teacher/me/${assertObjectId(materialId, 'material_id')}`,
      toFormData(payload),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return unwrap<{ material: Material }>(response);
  },
  async deleteTeacherMaterial(materialId: string) {
    const response = await api.delete(`/api/materials/teacher/me/${assertObjectId(materialId, 'material_id')}`);
    return unwrap<{ message: string }>(response);
  },
  async getStudentMaterials(filters: MaterialFilters = {}) {
    const response = await api.get('/api/materials/student/me', { params: toFilterParams(filters) });
    return unwrap<{ materials: Material[] }>(response);
  },
  async getStudentMaterial(materialId: string) {
    const response = await api.get(`/api/materials/student/me/${assertObjectId(materialId, 'material_id')}`);
    return unwrap<{ material: Material }>(response);
  },
};
