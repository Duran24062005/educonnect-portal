import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/auth';

const renderSidebar = (role: string) => {
  useAuthStore.setState({
    user: {
      _id: 'user-1',
      email: `${role.toLowerCase()}@educonnect.test`,
      role,
      profile_complete: true,
    },
  });

  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
};

afterEach(() => {
  cleanup();
  useAuthStore.setState({ user: null });
});

describe('AppSidebar', () => {
  it.each(['Teacher', 'Student'])('shows the calendar for %s accounts', (role) => {
    renderSidebar(role);

    expect(screen.getByText('Calendario')).toBeInTheDocument();
    if (role === 'Teacher') expect(screen.getByText('Asistencia')).toBeInTheDocument();
  });

  it.each(['Teacher', 'Student'])('shows materials for %s accounts', (role) => {
    renderSidebar(role);
    expect(screen.getByText('Materiales')).toBeInTheDocument();
  });
});
