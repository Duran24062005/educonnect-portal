import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UsersPage from '@/pages/users/UsersPage';

const mockUseUsers = vi.fn();

vi.mock('@/hooks/useUsers', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useUsers')>('@/hooks/useUsers');
  return {
    ...actual,
    useUsers: () => mockUseUsers(),
  };
});

vi.mock('@/api/users', () => ({
  usersApi: {
    delete: vi.fn(),
    changeStatus: vi.fn(),
  },
}));

vi.mock('@/layouts/DashboardLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const createUsers = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    _id: `user-${index + 1}`,
    email: `user${index + 1}@example.com`,
    role: 'student',
    status: 'active',
    person: {
      first_name: `User${index + 1}`,
      last_name: 'Test',
      profile_photo_url: '',
      profile_photo: '',
    },
  }));

describe('UsersPage pagination', () => {
  beforeEach(() => {
    mockUseUsers.mockReset();
    mockUseUsers.mockReturnValue({
      users: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('shows pagination controls when there is more than one page of users', () => {
    mockUseUsers.mockReturnValue({
      users: createUsers(11),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<UsersPage />);

    expect(screen.getByText(/1 de 2 \(11 usuarios\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ir a la pagina siguiente/i })).toBeEnabled();
  });

  it('moves to the next page and renders the remaining users', () => {
    mockUseUsers.mockReturnValue({
      users: createUsers(11),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<UsersPage />);

    fireEvent.click(screen.getByRole('button', { name: /ir a la pagina siguiente/i }));

    expect(screen.getByText(/2 de 2 \(11 usuarios\)/i)).toBeInTheDocument();
    expect(screen.getByText('user11@example.com')).toBeInTheDocument();
    expect(screen.queryByText('user1@example.com')).not.toBeInTheDocument();
  });

  it('hides pagination controls when there is only one page', () => {
    mockUseUsers.mockReturnValue({
      users: createUsers(10),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<UsersPage />);

    expect(screen.queryByText(/de \d+ \(\d+ usuarios\)/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ir a la pagina siguiente/i })).not.toBeInTheDocument();
  });
});
