import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CalendarPage from '@/pages/CalendarPage';
import { useAuthStore } from '@/store/auth';

const mocks = vi.hoisted(() => ({
  catalog: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  cancel: vi.fn(),
  activate: vi.fn(),
}));

vi.mock('@/api/calendar', () => ({
  calendarApi: mocks,
}));

vi.mock('@/layouts/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}));

const catalog = {
  years: [{ id: 'year-2026', name: 'Año escolar 2026', year: 2026 }],
  grades: [{ id: 'grade-7', name: '7°' }],
  groups: [{ id: 'group-7a', name: '7A' }],
  areas: [{ id: 'area-math', name: 'Matemáticas' }],
  teachers: [{ id: 'teacher-1', name: 'Daniel Vargas' }],
  aulas: [{ id: 'aula-1', name: 'Aula 201' }],
};

const session = {
  id: 'session-1',
  type: 'class_session' as const,
  startAt: new Date().toISOString(),
  endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  status: 'scheduled' as const,
  schoolYear: catalog.years[0],
  grade: catalog.grades[0],
  group: catalog.groups[0],
  area: catalog.areas[0],
  teacher: catalog.teachers[0],
  aula: catalog.aulas[0],
  topic: 'Ecuaciones lineales',
  pendingActivities: [],
};

const renderCalendar = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    token: 'token',
    user: { _id: 'admin-1', email: 'admin@test.com', role: 'admin', status: 'active', profile_complete: true },
    person: null,
    isLoading: false,
  });
  mocks.catalog.mockResolvedValue(catalog);
  mocks.list.mockImplementation(async (query: { from: string; to: string }) => ({
    sessions: [session],
    pendingActivities: [],
    range: { from: query.from, to: query.to },
  }));
});

describe('CalendarPage', () => {
  it('mounts the page and renders sessions returned by the data source', async () => {
    renderCalendar();

    expect(await screen.findByRole('heading', { name: 'Calendario' })).toBeInTheDocument();
    expect((await screen.findAllByText('Ecuaciones lineales')).length).toBeGreaterThan(0);
    expect(screen.getByText('Vista semanal')).toBeInTheDocument();
    expect(screen.getByText('Próxima clase')).toBeInTheDocument();
    expect(mocks.catalog).toHaveBeenCalled();
    expect(mocks.list).toHaveBeenCalled();
  });

  it('switches from the week grid to the agenda without unmounting the screen', async () => {
    renderCalendar();
    await screen.findAllByText('Ecuaciones lineales');

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Agenda' }), { button: 0 });

    await waitFor(() => {
      expect(screen.getByText('Agenda de la semana')).toBeInTheDocument();
      expect(screen.getAllByText('Ecuaciones lineales').length).toBeGreaterThan(0);
    });
  });

  it('shows a recoverable error state when the calendar source fails', async () => {
    mocks.catalog.mockRejectedValue(new Error('API unavailable'));
    mocks.list.mockRejectedValue(new Error('API unavailable'));
    renderCalendar();

    expect(await screen.findByText('No se pudo cargar el calendario')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
