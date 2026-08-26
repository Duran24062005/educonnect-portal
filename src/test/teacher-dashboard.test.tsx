import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '@/pages/DashboardPage';
import { useAuthStore } from '@/store/auth';

const mockUseSchoolYears = vi.fn();
const mockUseTeacherDashboardSummary = vi.fn();

vi.mock('@/hooks/useSchoolYears', () => ({
  useSchoolYears: () => mockUseSchoolYears(),
}));

vi.mock('@/hooks/useDashboardSummary', () => ({
  useAdminDashboardSummary: () => ({ data: null, isLoading: false }),
  useTeacherDashboardSummary: () => mockUseTeacherDashboardSummary(),
}));

vi.mock('@/layouts/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/calendar/StudentNextClassCard', () => ({
  default: () => <div data-testid="student-next-class-card" />,
}));

vi.mock('@/components/parent/GuardianDashboard', () => ({
  default: () => <div data-testid="guardian-dashboard" />,
}));

vi.mock('@/components/charts/LightweightCategoryChart', () => ({
  default: ({ categories }: { categories: string[] }) => <div data-testid="teacher-chart">{categories.join('|')}</div>,
}));

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

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSchoolYears.mockReturnValue({
    data: [{ _id: 'year-2026', year: 2026, name: '2026', is_active: true }],
    isLoading: false,
  });
  mockUseTeacherDashboardSummary.mockReturnValue({
    data: {
      summary: {
        approval_rate: 82.5,
        average: 8.1,
        assignment_count: 4,
        group_count: 2,
        student_count: 40,
        passed: 33,
        failed: 7,
        performance_levels: { SUPERIOR: 10, ALTO: 15, BÁSICO: 10, BAJO: 5 },
      },
      period_trend: [
        { period_name: 'Periodo 1', average: 8.2, failed: 3 },
        { period_name: 'Periodo 2', average: 8.0, failed: 4 },
      ],
      top_groups: [
        {
          group_id: 'group-1',
          group_name: '6A',
          area_id: 'area-1',
          area_name: 'Matemáticas',
          grade_name: '6',
          average: 8.3,
          student_count: 20,
          failed: 2,
          position: 1,
        },
      ],
      attention_students: [],
      highlight_students: [],
    },
    isLoading: false,
  });
  useAuthStore.setState({
    token: 'token',
    user: { _id: 'teacher-1', email: 'teacher@test.com', role: 'teacher', status: 'active', profile_complete: true },
    person: null,
    isLoading: false,
  });
});

describe('teacher dashboard chart layout', () => {
  it('keeps every teacher chart card shrinkable and clipped to its grid column', async () => {
    renderDashboard();

    expect(await screen.findAllByTestId('teacher-chart')).toHaveLength(3);

    const chartCards = screen.getAllByTestId('teacher-dashboard-chart-card');
    expect(chartCards).toHaveLength(3);
    chartCards.forEach((card) => {
      expect(card).toHaveClass('min-w-0', 'overflow-hidden');
    });
  });
});
