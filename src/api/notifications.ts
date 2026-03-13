import api from './axios';
import { assertObjectId } from '@/lib/object-id';

export type NotificationType =
  | 'activity_created'
  | 'activity_submitted'
  | 'admin_announcement'
  | 'teacher_announcement';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  audience_role: 'admin' | 'teacher' | 'student';
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  source_type: 'activity' | 'announcement' | null;
  source_id: string | null;
  metadata: Record<string, any>;
  created_by: {
    user_id: string | null;
    role: string | null;
    full_name: string | null;
    email: string | null;
  };
}

const unwrap = <T>(response: any): T => (response?.data?.data ?? response?.data) as T;

export const notificationsApi = {
  list: async (options?: { read?: boolean; limit?: number }) => {
    const response = await api.get('/api/notifications/me', {
      params: {
        read: typeof options?.read === 'boolean' ? String(options.read) : undefined,
        limit: options?.limit,
      },
    });
    return unwrap<{ notifications: NotificationItem[] }>(response);
  },
  unreadCount: async () => {
    const response = await api.get('/api/notifications/me/unread-count');
    return unwrap<{ unread_count: number }>(response);
  },
  markAsRead: async (id: string) => {
    const response = await api.patch(`/api/notifications/${assertObjectId(id, 'id')}/read`);
    return unwrap<{ notification: NotificationItem }>(response);
  },
  markAllAsRead: async () => {
    const response = await api.patch('/api/notifications/me/read-all');
    return unwrap<{ updated_count: number }>(response);
  },
  createAdminAnnouncement: async (payload: { title: string; message: string; target_role: 'admin' | 'teacher' | 'student' | 'teacher_student' | 'teacher_admin' | 'all' }) => {
    const response = await api.post('/api/notifications/admin/announcements', payload);
    return unwrap<{ created_count: number }>(response);
  },
  createTeacherAnnouncement: async (payload: { title: string; message: string; scope: 'all_my_students' | 'group'; group_id?: string | null }) => {
    const response = await api.post('/api/notifications/teacher/announcements', payload);
    return unwrap<{ created_count: number }>(response);
  },
};
