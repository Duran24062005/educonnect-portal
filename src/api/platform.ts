import api from './axios';
import { assertObjectId } from '@/lib/object-id';

export type InstitutionType = 'private' | 'public';
export type PlatformInstitutionStatus = 'sandbox' | 'active' | 'suspended' | 'archived';

export interface PlatformPerson {
  _id: string;
  first_name: string;
  last_name: string;
  document_type: 'CC' | 'RC' | 'CE';
  document_number: string;
  phone?: string | null;
  role: string;
  status: string;
}

export interface PlatformAdmin {
  user_id: string;
  email: string;
  person: PlatformPerson | null;
}

export interface PlatformInstitution {
  _id: string;
  name: string;
  code: string;
  type: InstitutionType;
  status: PlatformInstitutionStatus;
  max_students: number;
  timezone: string;
  primary_admin_user_id?: string | null;
  rector_user_id?: string | null;
  primary_admin: PlatformAdmin | null;
  rector: PlatformAdmin | null;
  created_at: string;
  updated_at: string;
}

export interface InstitutionCreatePayload {
  institution: {
    name: string;
    code: string;
    type: InstitutionType;
    max_students?: number;
    timezone?: string;
  };
  primary_admin: {
    first_name: string;
    last_name: string;
    email: string;
    document_type: 'CC' | 'RC' | 'CE';
    document_number: string;
    phone?: string;
  };
}

export interface InstitutionUpdatePayload {
  name?: string;
  code?: string;
  max_students?: number;
  timezone?: string;
}

export interface InstitutionListResponse {
  institutions: PlatformInstitution[];
  pagination: {
    current_page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export const platformApi = {
  listInstitutions: (params?: { search?: string; type?: InstitutionType; status?: PlatformInstitutionStatus; page?: number; limit?: number }) =>
    api.get<{ data: InstitutionListResponse }>('/api/platform/institutions', { params }),
  getInstitution: (id: string) =>
    api.get<{ data: PlatformInstitution }>(`/api/platform/institutions/${assertObjectId(id, 'id')}`),
  createInstitution: (data: InstitutionCreatePayload) =>
    api.post<{ data: { institution: PlatformInstitution; invitation: { sent: boolean; skipped?: boolean } } }>('/api/platform/institutions', data),
  assignPrimaryAdmin: (id: string, data: InstitutionCreatePayload['primary_admin']) =>
    api.post<{ data: { institution: PlatformInstitution; invitation: { sent: boolean; skipped?: boolean } } }>(`/api/platform/institutions/${assertObjectId(id, 'id')}/primary-admin`, data),
  updateInstitution: (id: string, data: InstitutionUpdatePayload) =>
    api.patch<{ data: PlatformInstitution }>(`/api/platform/institutions/${assertObjectId(id, 'id')}`, data),
  changeInstitutionStatus: (id: string, status: 'active' | 'suspended') =>
    api.patch<{ data: PlatformInstitution }>(`/api/platform/institutions/${assertObjectId(id, 'id')}/status`, { status }),
  resendInvitation: (id: string) =>
    api.post<{ data: { sent: boolean; skipped?: boolean } }>(`/api/platform/institutions/${assertObjectId(id, 'id')}/primary-admin/invitation`),
};
