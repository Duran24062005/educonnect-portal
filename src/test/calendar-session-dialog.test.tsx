import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CalendarSessionDialog from '@/components/calendar/CalendarSessionDialog';
import type { CalendarSession } from '@/api/calendar';

const mocks = vi.hoisted(() => ({
  getBySession: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  getTeacherMaterials: vi.fn(),
  getStudentMaterials: vi.fn(),
}));

vi.mock('@/api/lessonPlans', () => ({ lessonPlansApi: mocks }));
vi.mock('@/api/materials', () => ({ materialsApi: mocks }));

const session: CalendarSession = {
  id: 'session-507f1f77bcf86cd799439011',
  type: 'class_session',
  startAt: '2026-08-28T12:00:00.000Z',
  endAt: '2026-08-28T13:00:00.000Z',
  status: 'scheduled',
  scheduleEntryId: 'entry-507f1f77bcf86cd799439012',
  source: 'schedule',
  schoolYear: { id: 'year-1', name: 'Año escolar 2026', year: 2026 },
  grade: { id: 'grade-1', name: '7°' },
  group: { id: 'group-1', name: '7A' },
  area: { id: 'area-1', name: 'Matemáticas' },
  teacher: { id: 'teacher-1', name: 'Docente Uno' },
  aula: { id: 'aula-1', name: 'Aula 201' },
  topic: '',
  lessonPlan: null,
  planningStatus: 'pending',
  permissions: { canEditSchedule: false, canEditLessonPlan: true, scheduleEditReason: 'Solo administración' },
  pendingActivities: [],
};

const renderDialog = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      <CalendarSessionDialog open onOpenChange={vi.fn()} session={session} role="teacher" />
    </MemoryRouter>
  </QueryClientProvider>,
);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getBySession.mockResolvedValue(null);
  mocks.getTeacherMaterials.mockResolvedValue({ materials: [] });
  mocks.create.mockResolvedValue({ id: 'plan-1', sessionId: session.id, topic: 'Fracciones', learningObjective: 'Resolver operaciones', description: '', teacherNotes: '', homework: '', status: 'completed' });
});

describe('CalendarSessionDialog', () => {
  it('locks administrative fields and saves only the teacher lesson plan', async () => {
    renderDialog();

    expect(await screen.findByText('Administrado por la institución')).toBeInTheDocument();
    expect(screen.getByText('Aula 201')).toBeInTheDocument();
    expect(screen.getByLabelText('Tema')).toBeInTheDocument();
    expect(screen.queryByLabelText('Fecha')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Grupo')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Docente')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Tema'), { target: { value: 'Fracciones' } });
    fireEvent.change(screen.getByLabelText('Objetivo de aprendizaje'), { target: { value: 'Resolver operaciones' } });
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como completa' }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      session_id: session.id,
      topic: 'Fracciones',
      learning_objective: 'Resolver operaciones',
      status: 'completed',
    })));
  });
});
