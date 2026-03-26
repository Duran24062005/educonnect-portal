import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '@/pages/DashboardPage';
import MyGradesPage from '@/pages/student/MyGradesPage';
import MyResultsPage from '@/pages/student/MyResultsPage';
import { useAuthStore } from '@/store/auth';

const mockUseSchoolYears = vi.fn();
const mockGetStudentOverview = vi.fn();
const mockGetStudentAreas = vi.fn();
const mockGetStudentPeriodSummary = vi.fn();
const mockGetStudentActivities = vi.fn();
const mockListNotifications = vi.fn();

vi.mock('@/hooks/useSchoolYears', () => ({
  useSchoolYears: () => mockUseSchoolYears(),
}));

vi.mock('@/api/analytics', async () => {
  const actual = await vi.importActual<typeof import('@/api/analytics')>('@/api/analytics');
  return {
    ...actual,
    analyticsApi: {
      ...actual.analyticsApi,
      getStudentOverview: (...args: any[]) => mockGetStudentOverview(...args),
      getStudentAreas: (...args: any[]) => mockGetStudentAreas(...args),
      getStudentPeriodSummary: (...args: any[]) => mockGetStudentPeriodSummary(...args),
    },
  };
});

vi.mock('@/api/activities', () => ({
  activitiesApi: {
    getStudentActivities: (...args: any[]) => mockGetStudentActivities(...args),
  },
}));

vi.mock('@/api/notifications', () => ({
  notificationsApi: {
    list: (...args: any[]) => mockListNotifications(...args),
  },
}));

vi.mock('@/layouts/DashboardLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/charts/LightweightCategoryChart', () => ({
  default: ({ categories, series }: { categories: string[]; series: Array<{ label: string }> }) => (
    <div data-testid="chart">
      {categories.join('|')}::{series.map((item) => item.label).join('|')}
    </div>
  ),
}));

vi.mock('@/components/ui/select', () => {
  const SelectItem = ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  );

  const collectOptions = (children: ReactNode): ReactElement[] =>
    Children.toArray(children).flatMap((child) => {
      if (!isValidElement(child)) return [];
      if (child.type === SelectItem) return [child as ReactElement];
      return collectOptions(child.props.children);
    });

  return {
    Select: ({ value, onValueChange, children }: { value: string; onValueChange?: (value: string) => void; children: ReactNode }) => (
      <select role="combobox" value={value} onChange={(event) => onValueChange?.(event.target.value)}>
        {collectOptions(children)}
      </select>
    ),
    SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <>{placeholder}</>,
    SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
    SelectItem,
  };
});

const schoolYears = [
  { _id: '65a000000000000000000001', year: 2026, name: '2026', is_active: true },
  { _id: '65a000000000000000000002', year: 2025, name: '2025', is_active: false },
];

const overviewByYear = {
  [schoolYears[0]._id]: {
    student_id: 'student-1',
    school_year: { _id: schoolYears[0]._id, year: 2026, name: '2026' },
    general_average: 8.4,
    final_status: 'passed' as const,
    passed_areas: 3,
    failed_areas: 1,
    best_area: 'Matemáticas',
    attention_area: 'Lenguaje',
  },
  [schoolYears[1]._id]: {
    student_id: 'student-1',
    school_year: { _id: schoolYears[1]._id, year: 2025, name: '2025' },
    general_average: 7.1,
    final_status: 'failed' as const,
    passed_areas: 2,
    failed_areas: 2,
    best_area: 'Ciencias',
    attention_area: 'Sociales',
  },
};

const areasByYear = {
  [schoolYears[0]._id]: [
    {
      area_id: 'math',
      area_name: 'Matemáticas',
      final_average: 9,
      status: 'passed' as const,
      periods: [
        { period_id: 'p1', period_name: 'Periodo 1', average: 9, status: 'passed' as const },
        { period_id: 'p2', period_name: 'Periodo 2', average: 9, status: 'passed' as const },
      ],
      year_averages: [
        { school_year_id: schoolYears[1]._id, year: '2025', average: 8.2 },
        { school_year_id: schoolYears[0]._id, year: '2026', average: 9 },
      ],
    },
    {
      area_id: 'lang',
      area_name: 'Lenguaje',
      final_average: 6.5,
      status: 'passed' as const,
      periods: [
        { period_id: 'p1', period_name: 'Periodo 1', average: 7, status: 'passed' as const },
        { period_id: 'p2', period_name: 'Periodo 2', average: 6, status: 'passed' as const },
      ],
      year_averages: [
        { school_year_id: schoolYears[1]._id, year: '2025', average: 6.3 },
        { school_year_id: schoolYears[0]._id, year: '2026', average: 6.5 },
      ],
    },
  ],
  [schoolYears[1]._id]: [
    {
      area_id: 'science',
      area_name: 'Ciencias',
      final_average: 8.1,
      status: 'passed' as const,
      periods: [
        { period_id: 'p3', period_name: 'Periodo 1', average: 8.1, status: 'passed' as const },
      ],
      year_averages: [
        { school_year_id: schoolYears[1]._id, year: '2025', average: 8.1 },
      ],
    },
  ],
};

const periodsByYear = {
  [schoolYears[0]._id]: [
    { period_id: 'p1', period_name: 'Periodo 1', general_average: 8.2, passed_areas: 2, failed_areas: 0, status: 'passed' as const },
    { period_id: 'p2', period_name: 'Periodo 2', general_average: 7.8, passed_areas: 1, failed_areas: 1, status: 'passed' as const },
  ],
  [schoolYears[1]._id]: [
    { period_id: 'p3', period_name: 'Periodo 1', general_average: 7.1, passed_areas: 1, failed_areas: 1, status: 'failed' as const },
  ],
};

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

const changeSchoolYear = async (label: string) => {
  const trigger = screen.getByRole('combobox');
  fireEvent.change(trigger, { target: { value: schoolYears.find((year) => String(year.year) === label)?._id } });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSchoolYears.mockReturnValue({
    data: schoolYears,
    isLoading: false,
  });
  mockGetStudentOverview.mockImplementation(async (schoolYearId: string) => overviewByYear[schoolYearId]);
  mockGetStudentAreas.mockImplementation(async (schoolYearId: string) => areasByYear[schoolYearId] ?? []);
  mockGetStudentPeriodSummary.mockImplementation(async (schoolYearId: string) => periodsByYear[schoolYearId] ?? []);
  mockGetStudentActivities.mockResolvedValue({
    activities: [
      {
        _id: 'activity-1',
        title: 'Taller 1',
        due_at: '2026-03-01T10:00:00.000Z',
        student_state: 'pending',
        area: { name: 'Matemáticas' },
        period: { name: 'Periodo 1' },
      },
    ],
  });
  mockListNotifications.mockResolvedValue({
    notifications: [
      {
        id: 'notification-1',
        title: 'Nuevo aviso',
        message: 'Revisa tu actividad',
        is_read: false,
        created_at: '2026-03-01T10:00:00.000Z',
      },
    ],
  });
  useAuthStore.setState({
    token: 'token',
    user: { _id: 'user-1', email: 'student@test.com', role: 'student', status: 'active', profile_complete: true },
    person: null,
    isLoading: false,
  });
});

describe('student analytics pages', () => {
  it('renders MyGradesPage with real yearly data', async () => {
    renderWithRouter(<MyGradesPage />);

    expect(await screen.findByText('Mis Métricas Académicas')).toBeInTheDocument();
    expect(await screen.findByText('Seguimiento por materia, periodo y año escolar con resultados reales.')).toBeInTheDocument();
    expect(screen.getAllByText('Matemáticas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2026').length).toBeGreaterThan(0);
    expect(mockGetStudentOverview).toHaveBeenCalledWith(schoolYears[0]._id);
    expect(mockGetStudentAreas).toHaveBeenCalledWith(schoolYears[0]._id);
  });

  it('renders MyResultsPage with yearly comparison from real payloads', async () => {
    renderWithRouter(<MyResultsPage />);

    expect(await screen.findByText('Mis Resultados')).toBeInTheDocument();
    expect(await screen.findByText('Evolución por periodo y comparativo anual con datos reales.')).toBeInTheDocument();
    expect(await screen.findByText('Mejor periodo')).toBeInTheDocument();
    expect(await screen.findByText('Resultados por Periodo')).toBeInTheDocument();
    expect(mockGetStudentPeriodSummary).toHaveBeenCalledWith(schoolYears[0]._id);
    expect(mockGetStudentAreas).toHaveBeenCalledWith(schoolYears[0]._id);
  });

  it('reloads student dashboard analytics when the school year changes', async () => {
    renderWithRouter(<DashboardPage />);

    expect(await screen.findByText('Tu jornada académica en un solo lugar')).toBeInTheDocument();
    expect(await screen.findByText('8.4')).toBeInTheDocument();

    await changeSchoolYear('2025');

    await waitFor(() => {
      expect(mockGetStudentOverview).toHaveBeenCalledWith(schoolYears[1]._id);
    });
    await waitFor(() => {
      expect(screen.getAllByText('7.1').length).toBeGreaterThan(0);
    });
  });
});
