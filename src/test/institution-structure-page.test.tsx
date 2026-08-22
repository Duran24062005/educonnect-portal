import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InstitutionStructurePage from '@/pages/admin/InstitutionStructurePage';
import { useAuthStore } from '@/store/auth';

const mocks = vi.hoisted(() => ({
  getCampuses: vi.fn(),
  getShifts: vi.fn(),
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
});
