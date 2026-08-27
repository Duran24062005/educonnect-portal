import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InstitutionStructurePage from '@/pages/admin/InstitutionStructurePage';
import { useAuthStore } from '@/store/auth';

const mocks = vi.hoisted(() => ({
  getCampuses: vi.fn(),
  getShifts: vi.fn(),
  getScheduleConfig: vi.fn(),
}));

vi.mock('@/api/institution', () => ({
  institutionApi: mocks,
}));

vi.mock('@/layouts/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('InstitutionStructurePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { _id: 'admin-1', email: 'admin@test.com', role: 'admin', profile_complete: true },
    });
  });

  it('does not query institution structure before the account is assigned', () => {
    render(<InstitutionStructurePage />);

    expect(screen.getByText(/todavía no está vinculada a una institución/i)).toBeInTheDocument();
    expect(mocks.getCampuses).not.toHaveBeenCalled();
    expect(mocks.getShifts).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /crear sede/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /crear jornada/i })).toBeDisabled();
  });

  it('loads the institutional school-day configuration', async () => {
    useAuthStore.setState({
      user: { _id: 'admin-1', email: 'admin@test.com', role: 'admin', profile_complete: true, institution_id: 'institution-1' },
    });
    mocks.getCampuses.mockResolvedValue({ data: { data: [] } });
    mocks.getShifts.mockResolvedValue({ data: { data: [] } });
    mocks.getScheduleConfig.mockResolvedValue({ data: { data: { school_days: [1, 3, 5], timezone: 'America/Bogota' } } });

    render(<InstitutionStructurePage />);

    await waitFor(() => expect(mocks.getScheduleConfig).toHaveBeenCalled());
    expect(screen.getByText('Días lectivos institucionales')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lunes/i })).toHaveTextContent('Lunes');
    expect(screen.getByRole('button', { name: /martes/i })).toHaveTextContent('Martes');
  });
});
