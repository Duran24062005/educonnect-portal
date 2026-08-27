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
}));

vi.mock('@/api/calendar', () => ({ calendarApi: { catalog: mocks.catalog } }));
vi.mock('@/api/schedule', () => ({ scheduleApi: mocks }));
vi.mock('@/layouts/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const catalog = {
  years: [{ id: 'year-2026', name: 'Año escolar 2026', year: 2026 }],
  grades: [],
  groups: [{ id: 'group-7a', name: '7A' }],
  areas: [],
  teachers: [],
  aulas: [],
};

const draft = {
  id: 'schedule-1',
  version: 1,
  status: 'draft' as const,
  school_year: catalog.years[0],
  school_days: [1, 2, 3, 4, 5],
  published_at: null,
  availability_windows: [{ window_id: 'window-1', group_id: 'group-7a', start_time: '06:15', end_time: '12:15', group: catalog.groups[0] }],
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
});

describe('ScheduleManagementPage', () => {
  it('creates and displays a group availability draft', async () => {
    renderPage();

    const createButton = await screen.findByRole('button', { name: /crear borrador/i });
    await waitFor(() => expect(createButton).not.toBeDisabled());
    fireEvent.click(createButton);

    await waitFor(() => expect(mocks.createDraft).toHaveBeenCalledWith('year-2026'));
    expect(await screen.findByText('Ventanas por grupo')).toBeInTheDocument();
    expect(screen.getByText(/06:15 - 12:15/)).toBeInTheDocument();
    expect(screen.getByText('7A')).toBeInTheDocument();
    expect(mocks.createDraft).toHaveBeenCalledWith('year-2026');
  });
});
