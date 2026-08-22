import api from './axios';
import { assertObjectId } from '@/lib/object-id';

export type StructureStatus = 'active' | 'inactive';

export interface Campus {
  _id: string;
  name: string;
  code: string;
  address?: string | null;
  status: StructureStatus;
}

export interface SchoolShift {
  _id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  status: StructureStatus;
}

export interface CampusPayload {
  name: string;
  code: string;
  address?: string;
  status?: StructureStatus;
}

export interface SchoolShiftPayload {
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  status?: StructureStatus;
}

export const institutionApi = {
  getCampuses: () => api.get<{ data: Campus[] }>('/api/institutions/current/campuses'),
  createCampus: (data: CampusPayload) => api.post<{ data: Campus }>('/api/institutions/current/campuses', data),
  updateCampus: (id: string, data: Partial<CampusPayload>) => api.patch('/api/institutions/current/campuses/' + assertObjectId(id, 'id'), data),
  deleteCampus: (id: string) => api.delete('/api/institutions/current/campuses/' + assertObjectId(id, 'id')),
  getShifts: () => api.get<{ data: SchoolShift[] }>('/api/institutions/current/shifts'),
  createShift: (data: SchoolShiftPayload) => api.post<{ data: SchoolShift }>('/api/institutions/current/shifts', data),
  updateShift: (id: string, data: Partial<SchoolShiftPayload>) => api.patch('/api/institutions/current/shifts/' + assertObjectId(id, 'id'), data),
  deleteShift: (id: string) => api.delete('/api/institutions/current/shifts/' + assertObjectId(id, 'id')),
};
