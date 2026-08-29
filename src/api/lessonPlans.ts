import api from './axios';
import { assertObjectId } from '@/lib/object-id';
import type { LessonPlan, LessonPlanStatus } from './calendar';

export interface LessonPlanInput {
  session_id: string;
  topic?: string;
  learning_objective?: string;
  description?: string;
  teacher_notes?: string;
  homework?: string;
  status?: LessonPlanStatus;
}

const unwrap = <T>(response: any): T => (response?.data?.data ?? response?.data) as T;

const normalize = (value: any): LessonPlan => ({
  id: String(value?.id ?? value?._id ?? ''),
  sessionId: String(value?.session_id ?? value?.sessionId ?? ''),
  topic: String(value?.topic ?? ''),
  learningObjective: String(value?.learning_objective ?? value?.learningObjective ?? ''),
  description: String(value?.description ?? ''),
  teacherNotes: String(value?.teacher_notes ?? value?.teacherNotes ?? ''),
  homework: String(value?.homework ?? ''),
  status: value?.status === 'completed' ? 'completed' : 'draft',
});

export const lessonPlansApi = {
  async getBySession(sessionId: string) {
    const response = await api.get(`/api/lesson-plans/session/${assertObjectId(sessionId, 'session_id')}`);
    const value = unwrap<any>(response);
    return value ? normalize(value) : null;
  },
  async create(input: LessonPlanInput) {
    const response = await api.post('/api/lesson-plans', {
      ...input,
      session_id: assertObjectId(input.session_id, 'session_id'),
    });
    return normalize(unwrap(response));
  },
  async update(id: string, input: Omit<LessonPlanInput, 'session_id'>) {
    const response = await api.patch(`/api/lesson-plans/${assertObjectId(id, 'lesson_plan_id')}`, input);
    return normalize(unwrap(response));
  },
};
