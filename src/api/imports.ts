import api from './axios';
import { assertObjectId } from '@/lib/object-id';

export type ImportEntity = 'students' | 'guardians' | 'teachers' | 'grades' | 'areas' | 'groups' | 'enrollments';

export interface ImportJob {
  _id: string;
  entity: ImportEntity;
  file_name: string;
  status: 'preview' | 'confirmed' | 'failed';
  headers: string[];
  records?: Array<{ row_number: number; data: Record<string, string> }>;
  errors: Array<{ row_number: number; field: string; message: string }>;
  summary: { total: number; valid: number; invalid: number; created: number; updated: number };
  created_at: string;
  confirmed_at?: string | null;
}

const unwrap = (payload: any) => payload?.data?.data ?? payload?.data ?? payload;

export const importsApi = {
  preview: async (entity: ImportEntity, file: File) => {
    const form = new FormData();
    form.append('entity', entity);
    form.append('file', file);
    const response = await api.post('/api/imports/preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(response.data) as ImportJob;
  },
  list: async () => {
    const response = await api.get('/api/imports');
    const data = unwrap(response.data);
    return (Array.isArray(data) ? data : data?.jobs ?? []) as ImportJob[];
  },
  get: async (id: string) => {
    const response = await api.get(`/api/imports/${assertObjectId(id, 'id')}`);
    return unwrap(response.data) as ImportJob;
  },
  confirm: async (id: string) => {
    const response = await api.post(`/api/imports/${assertObjectId(id, 'id')}/confirm`);
    return unwrap(response.data) as ImportJob;
  },
};
