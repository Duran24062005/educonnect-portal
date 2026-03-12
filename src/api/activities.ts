import api from './axios';
import { assertObjectId } from '@/lib/object-id';

export const ACTIVITY_ALLOWED_EXTENSIONS = ['link', 'png', 'jpg', 'jpeg', 'pdf', 'docx', 'ppt', 'pptx', 'txt', 'md'] as const;
export type ActivityAllowedExtension = (typeof ACTIVITY_ALLOWED_EXTENSIONS)[number];
export type StudentActivityState = 'upcoming' | 'pending' | 'submitted' | 'graded' | 'late';
export type ActivitySubmissionStatus = 'submitted' | 'graded';

export interface ActivityRubricCriterion {
  _id: string;
  title: string;
  description: string | null;
  max_points: number;
}

export interface ActivitySubmissionRubricScore {
  criterion_id: string;
  title: string;
  max_points: number;
  earned_points: number;
  feedback: string | null;
}

export interface ActivitySubmission {
  _id: string;
  status: ActivitySubmissionStatus;
  submission_type: 'file' | 'link';
  link_url: string | null;
  file_url: string | null;
  file_name: string | null;
  file_extension: string | null;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number;
  submitted_at: string;
  graded_at: string | null;
  earned_points: number;
  max_points: number;
  score_10: number | null;
  teacher_feedback: string | null;
  rubric_scores: ActivitySubmissionRubricScore[];
  student?: {
    _id: string;
    full_name: string;
    email: string | null;
  } | null;
}

export interface ActivitySummary {
  total_students: number;
  submitted_count: number;
  graded_count: number;
  pending_count: number;
  late_count: number;
}

export interface Activity {
  _id: string;
  title: string;
  description: string | null;
  context: string;
  status: 'published';
  open_at: string;
  due_at?: string;
  allowed_extensions: ActivityAllowedExtension[];
  rubric_criteria: ActivityRubricCriterion[];
  rubric_max_points: number;
  rubric_locked: boolean;
  group: {
    _id: string;
    name: string;
    grade_id: string | null;
    grade_name: string | null;
  } | null;
  area: {
    _id: string;
    name: string;
  } | null;
  period: {
    _id: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
  } | null;
  school_year: {
    _id: string;
    year: number | null;
  } | null;
  teacher: {
    _id: string;
    full_name: string;
    email: string | null;
  } | null;
  created_at: string;
  updated_at: string;
  submission_summary?: ActivitySummary;
  student_state?: StudentActivityState;
  submission?: ActivitySubmission | null;
}

export interface TeacherActivitySubmissionSummary {
  student: {
    _id: string;
    full_name: string;
    email: string | null;
  };
  status: StudentActivityState | ActivitySubmissionStatus;
  submission: ActivitySubmission | null;
}

export interface CreateActivityPayload {
  title: string;
  description?: string | null;
  context: string;
  group_id: string;
  area_id: string;
  period_id: string;
  open_at: string;
  due_at?: string;
  allowed_extensions: ActivityAllowedExtension[];
  rubric_criteria: Array<{
    title: string;
    description?: string | null;
    max_points: number;
  }>;
}

export interface UpdateActivityPayload {
  title?: string;
  description?: string | null;
  context?: string;
  open_at?: string;
  due_at?: string;
  allowed_extensions?: ActivityAllowedExtension[];
  rubric_criteria?: Array<{
    title: string;
    description?: string | null;
    max_points: number;
  }>;
}

const unwrap = <T>(response: any): T => (response?.data?.data ?? response?.data) as T;

export const activitiesApi = {
  createTeacherActivity: async (payload: CreateActivityPayload) => {
    const response = await api.post('/api/activities/teacher/me', payload);
    return unwrap<{ activity: Activity }>(response);
  },
  getTeacherActivities: async (params: { group_id?: string; area_id?: string; period_id?: string }) => {
    const response = await api.get('/api/activities/teacher/me', {
      params: {
        group_id: params.group_id ? assertObjectId(params.group_id, 'group_id') : undefined,
        area_id: params.area_id ? assertObjectId(params.area_id, 'area_id') : undefined,
        period_id: params.period_id ? assertObjectId(params.period_id, 'period_id') : undefined,
      },
    });
    return unwrap<{ activities: Activity[] }>(response);
  },
  getTeacherActivity: async (activityId: string) => {
    const response = await api.get(`/api/activities/teacher/me/${assertObjectId(activityId, 'activity_id')}`);
    return unwrap<{ activity: Activity }>(response);
  },
  updateTeacherActivity: async (activityId: string, payload: UpdateActivityPayload) => {
    const response = await api.put(`/api/activities/teacher/me/${assertObjectId(activityId, 'activity_id')}`, payload);
    return unwrap<{ activity: Activity }>(response);
  },
  getTeacherActivitySubmissions: async (activityId: string) => {
    const response = await api.get(`/api/activities/teacher/me/${assertObjectId(activityId, 'activity_id')}/submissions`);
    return unwrap<{ activity: Activity; submissions: TeacherActivitySubmissionSummary[] }>(response);
  },
  reviewTeacherActivitySubmission: async (
    activityId: string,
    studentId: string,
    payload: {
      rubric_scores: Array<{ criterion_id: string; earned_points: number; feedback?: string | null }>;
      teacher_feedback?: string | null;
    }
  ) => {
    const response = await api.post(
      `/api/activities/teacher/me/${assertObjectId(activityId, 'activity_id')}/submissions/${assertObjectId(studentId, 'student_id')}/review`,
      payload
    );
    return unwrap<{ activity: Activity; submission: ActivitySubmission }>(response);
  },
  getStudentActivities: async (params?: { area_id?: string; period_id?: string; status?: StudentActivityState }) => {
    const response = await api.get('/api/activities/student/me', {
      params: {
        area_id: params?.area_id ? assertObjectId(params.area_id, 'area_id') : undefined,
        period_id: params?.period_id ? assertObjectId(params.period_id, 'period_id') : undefined,
        status: params?.status,
      },
    });
    return unwrap<{ activities: Activity[] }>(response);
  },
  getStudentActivity: async (activityId: string) => {
    const response = await api.get(`/api/activities/student/me/${assertObjectId(activityId, 'activity_id')}`);
    return unwrap<{ activity: Activity }>(response);
  },
  submitStudentActivity: async (activityId: string, options: { file?: File | null; link_url?: string | null }) => {
    const formData = new FormData();
    if (options.file) {
      formData.append('submission_file', options.file);
    }
    if (options.link_url?.trim()) {
      formData.append('link_url', options.link_url.trim());
    }
    const response = await api.post(
      `/api/activities/student/me/${assertObjectId(activityId, 'activity_id')}/submission`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return unwrap<{ activity: Activity; submission: ActivitySubmission }>(response);
  },
};
