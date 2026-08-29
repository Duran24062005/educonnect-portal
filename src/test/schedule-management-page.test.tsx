import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ScheduleManagementPage from '@/pages/academic/ScheduleManagementPage';

const mocks = vi.hoisted(() => ({
  catalog: vi.fn(),
  list: vi.fn(),
  createDraft: vi.fn(),
  update: vi.fn(),
  publish: vi.fn(),
  entries: vi.fn(),
  createEntry: vi.fn(),
  updateEntry: vi.fn(),
  archiveEntry: vi.fn(),
  listAssignments: vi.fn(),
  createAssignment: vi.fn(),
  updateAssignment: vi.fn(),
}));

vi.mock('@/api/calendar', () => ({ calendarApi: { catalog: mocks.catalog } }));
vi.mock('@/api/schedule', () => ({ scheduleApi: mocks }));
vi.mock('@/api/teachingAssignments', () => ({ teachingAssignmentsApi: { list: mocks.listAssignments, create: mocks.createAssignment, update: mocks.updateAssignment } }));
vi.mock('@/layouts/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const catalog = {
  years: [{ id: 'year-2026', name: 'Año escolar 2026', year: 2026 }],
  grades: [],
  groups: [{ id: 'group-7a', name: '7A' }],
  areas: [{ id: 'area-english', name: 'Inglés' }],
  teachers: [{ id: 'teacher-1', name: 'Docente Uno' }],
  aulas: [{ id: 'aula-1', name: 'Aula 1' }],
};

const draft = {
  id: 'schedule-1',
  version: 1,
  status: 'draft' as const,
  school_year: catalog.years[0],
  school_days: [1, 2, 3, 4, 5],
  published_at: null,
  availability_windows: [{ window_id: 'window-1', group_id: 'group-7a', start_time: '06:15', end_time: '12:15', group: catalog.groups[0] }],
  slots: [{ slot_id: 'slot-1', group_id: 'group-7a', area_id: 'area-english', teacher_id: 'teacher-1', aula_id: 'aula-1', weekday: 1, start_time: '06:15', end_time: '08:15' }],
};

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter><ScheduleManagementPage /></MemoryRouter></QueryClientProvider>);
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.catalog.mockResolvedValue(catalog);
  mocks.list.mockResolvedValue({ schedules: [] });
  mocks.createDraft.mockResolvedValue(draft);
  mocks.update.mockResolvedValue(draft);
  mocks.publish.mockResolvedValue({ ...draft, status: 'published' });
  mocks.entries.mockResolvedValue({ entries: [{ id: 'entry-1', schedule_id: 'schedule-1', teaching_assignment_id: 'assignment-1', aula_id: 'aula-1', weekday: 1, start_time: '06:15', end_time: '08:15', status: 'active', group: catalog.groups[0], area: catalog.areas[0], teacher: catalog.teachers[0], aula: catalog.aulas[0], campus: null }] });
  mocks.listAssignments.mockResolvedValue({ assignments: [{ id: 'assignment-1', school_year_id: 'year-2026', status: 'active', group: catalog.groups[0], area: catalog.areas[0], teacher: catalog.teachers[0] }] });
});

describe('ScheduleManagementPage', () => {
  it('creates a draft and displays canonical schedule entries', async () => {
    renderPage();

    const createButton = await screen.findByRole('button', { name: /crear borrador/i });
    await waitFor(() => expect(createButton).not.toBeDisabled());
    fireEvent.click(createButton);

    await waitFor(() => expect(mocks.createDraft).toHaveBeenCalledWith('year-2026'));
    expect(await screen.findByText('Disponibilidad por grupo')).toBeInTheDocument();
    expect(screen.getByText(/06:15 – 12:15/)).toBeInTheDocument();
    expect(screen.getByText('7A')).toBeInTheDocument();
    await waitFor(() => expect(mocks.entries).toHaveBeenCalledWith('schedule-1'));
    expect(await screen.findByText(/Inglés · 7A/)).toBeInTheDocument();
    expect(await screen.findByText(/06:15 – 08:15/)).toBeInTheDocument();
    expect(mocks.createDraft).toHaveBeenCalledWith('year-2026');
  });
});
