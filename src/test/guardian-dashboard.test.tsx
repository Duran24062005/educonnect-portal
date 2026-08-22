import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '@/pages/DashboardPage';
import { useAuthStore } from '@/store/auth';

const mockUseSchoolYears = vi.fn();
const mockGetGuardianDashboard = vi.fn();
const mockGetGuardianAttendance = vi.fn();

vi.mock('@/hooks/useSchoolYears', () => ({
  useSchoolYears: () => mockUseSchoolYears(),
}));

vi.mock('@/api/guardians', () => ({
  guardiansApi: {
    getDashboard: (...args: unknown[]) => mockGetGuardianDashboard(...args),
    getAttendance: (...args: unknown[]) => mockGetGuardianAttendance(...args),
  },
}));

vi.mock('@/layouts/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/charts/LightweightCategoryChart', () => ({
  default: ({ categories }: { categories: string[] }) => <div data-testid="chart">{categories.join('|')}</div>,
}));

vi.mock('@/components/ui/select', () => {
  const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  );

  return {
    Select: ({ value, onValueChange, children }: { value: string; onValueChange?: (value: string) => void; children: React.ReactNode }) => (
      <select role="combobox" value={value} onChange={(event) => onValueChange?.(event.target.value)}>
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <>{placeholder}</>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectItem,
  };
});

const dashboard = {
  school_year: { _id: 'year-2026', year: 2026, name: '2026' },
  students: [
    {
      student: {
        _id: 'student-1',
        full_name: 'Laura López',
        email: null,
        profile_photo_url: null,
        relationship: 'mother' as const,
        group: { _id: 'group-1', name: '6A', grade_name: '6' },
        aula: null,
      },
      overview: {
        student_id: 'student-1',
        school_year: { _id: 'year-2026', year: 2026, name: '2026' },
        general_average: 8,
        final_status: 'passed' as const,
        passed_areas: 2,
        failed_areas: 0,
        best_area: 'Matemáticas',
        attention_area: null,
      },
      areas: [{ area_id: 'math', area_name: 'Matemáticas', final_average: 8, status: 'passed' as const, year_averages: [], periods: [] }],
      periods: [{ period_id: 'period-1', period_name: 'Periodo 1', general_average: 8, passed_areas: 2, failed_areas: 0, status: 'passed' as const }],
    },
    {
      student: {
        _id: 'student-2',
        full_name: 'Mateo Ruiz',
        email: null,
        profile_photo_url: null,
        relationship: 'mother' as const,
        group: { _id: 'group-2', name: '8B', grade_name: '8' },
        aula: null,
      },
      overview: {
        student_id: 'student-2',
        school_year: { _id: 'year-2026', year: 2026, name: '2026' },
        general_average: 5,
        final_status: 'failed' as const,
        passed_areas: 0,
        failed_areas: 1,
        best_area: 'Ciencias',
        attention_area: 'Ciencias',
      },
      areas: [{ area_id: 'science', area_name: 'Ciencias', final_average: 5, status: 'failed' as const, year_averages: [], periods: [] }],
      periods: [{ period_id: 'period-1', period_name: 'Periodo 1', general_average: 5, passed_areas: 0, failed_areas: 1, status: 'failed' as const }],
    },
  ],
};

const attendance = {
  school_year_id: 'year-2026',
  students: [
    {
      student: { _id: 'student-1', full_name: 'Laura López', relationship: 'mother' },
      attendance: { attendance_rate: 100, totals: { sessions: 2, marked: 2, pending: 0, present: 2, absent: 0, late: 0, excused: 0 } },
    },
    {
      student: { _id: 'student-2', full_name: 'Mateo Ruiz', relationship: 'mother' },
      attendance: { attendance_rate: 50, totals: { sessions: 2, marked: 2, pending: 0, present: 1, absent: 1, late: 0, excused: 0 } },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSchoolYears.mockReturnValue({
    data: [{ _id: 'year-2026', year: 2026, name: '2026', is_active: true }],
    isLoading: false,
  });
  mockGetGuardianDashboard.mockResolvedValue(dashboard);
  mockGetGuardianAttendance.mockResolvedValue(attendance);
  useAuthStore.setState({
    token: 'token',
    user: { _id: 'parent-1', email: 'parent@test.com', role: 'parent', status: 'active', profile_complete: true },
    person: null,
    isLoading: false,
  });
});

const renderDashboard = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('guardian dashboard', () => {
  it('shows all linked students and their individual summaries', async () => {
    renderDashboard();

    expect(await screen.findByText('Mis estudiantes')).toBeInTheDocument();
    expect(screen.getAllByText('Laura López').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mateo Ruiz').length).toBeGreaterThan(0);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getAllByText('Promedio').length).toBeGreaterThan(0);
    expect(screen.getByText('Detalle de Laura López')).toBeInTheDocument();
  });

  it('changes the detailed view without removing the other student card', async () => {
    renderDashboard();

    await screen.findByText('Mis estudiantes');
    fireEvent.click(screen.getByRole('button', { name: /Mateo Ruiz/i }));

    expect(screen.getByText('Detalle de Mateo Ruiz')).toBeInTheDocument();
    expect(screen.getAllByText('Laura López').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5.0').length).toBeGreaterThan(0);
  });
});
