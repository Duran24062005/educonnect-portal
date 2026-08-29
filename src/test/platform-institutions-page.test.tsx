import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PlatformInstitutionsPage from '@/pages/platform/PlatformInstitutionsPage';

const mocks = vi.hoisted(() => ({
  listInstitutions: vi.fn(),
  getInstitution: vi.fn(),
  createInstitution: vi.fn(),
  assignPrimaryAdmin: vi.fn(),
  updateInstitution: vi.fn(),
  changeInstitutionStatus: vi.fn(),
  resendInvitation: vi.fn(),
}));

vi.mock('@/api/platform', () => ({ platformApi: mocks }));
vi.mock('@/layouts/PlatformLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

const institution = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Colegio Público Norte',
  code: 'CP-NORTE',
  type: 'public' as const,
  status: 'sandbox' as const,
  max_students: 800,
  timezone: 'America/Bogota',
  primary_admin_user_id: '507f1f77bcf86cd799439012',
  rector_user_id: '507f1f77bcf86cd799439012',
  primary_admin: {
    user_id: '507f1f77bcf86cd799439012',
    email: 'rectoria@colegio.test',
    person: { _id: '507f1f77bcf86cd799439013', first_name: 'Ana', last_name: 'Gómez', document_type: 'CC' as const, document_number: '123456789', role: 'Admin', status: 'active' },
  },
  rector: null,
  created_at: '2026-08-27T00:00:00.000Z',
  updated_at: '2026-08-27T00:00:00.000Z',
};

const renderPage = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><PlatformInstitutionsPage /></MemoryRouter></QueryClientProvider>);

describe('PlatformInstitutionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listInstitutions.mockResolvedValue({ data: { data: { institutions: [institution], pagination: { current_page: 1, limit: 8, total: 1, total_pages: 1 } } } });
    mocks.getInstitution.mockResolvedValue({ data: { data: institution } });
    mocks.createInstitution.mockResolvedValue({ data: { institution, invitation: { sent: true } } });
    mocks.assignPrimaryAdmin.mockResolvedValue({ data: { institution, invitation: { sent: true } } });
    mocks.resendInvitation.mockResolvedValue({ data: { sent: true } });
  });

  it('lists institutions and shows the selected client ficha', async () => {
    renderPage();

    expect(await screen.findByText('Colegio Público Norte')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Colegio Público Norte'));
    expect(await screen.findByText('Ficha del cliente')).toBeInTheDocument();
    expect(screen.getAllByText(/rectoria@colegio.test/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/rector único/i)).toBeInTheDocument();
  });

  it('opens the creation dialog and submits the onboarding payload', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button', { name: /crear institución/i })[0]);

    expect(await screen.findByRole('heading', { name: 'Crear institución' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Colegio Nuevo' } });
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'NUEVO' } });
    fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Luis' } });
    fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'Pérez' } });
    fireEvent.change(screen.getByLabelText('Correo de acceso'), { target: { value: 'luis@nuevo.test' } });
    fireEvent.change(screen.getByLabelText('Número de documento'), { target: { value: '11223344' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^crear institución$/i }).at(-1)!);

    await waitFor(() => expect(mocks.createInstitution).toHaveBeenCalled());
    const [payload] = mocks.createInstitution.mock.calls[0];
    expect(payload).toEqual(expect.objectContaining({
      institution: expect.objectContaining({ name: 'Colegio Nuevo', code: 'NUEVO' }),
      primary_admin: expect.objectContaining({ email: 'luis@nuevo.test', document_number: '11223344' }),
    }));
  });

  it('assigns an administrator to a legacy institution without one', async () => {
    const legacyInstitution = { ...institution, primary_admin_user_id: null, rector_user_id: null, primary_admin: null, rector: null };
    mocks.listInstitutions.mockResolvedValue({ data: { data: { institutions: [legacyInstitution], pagination: { current_page: 1, limit: 8, total: 1, total_pages: 1 } } } });
    mocks.getInstitution.mockResolvedValue({ data: { data: legacyInstitution } });
    renderPage();

    fireEvent.click(await screen.findByText('Colegio Público Norte'));
    fireEvent.click(await screen.findByRole('button', { name: /asignar administrador/i }));
    expect(await screen.findByRole('heading', { name: 'Asignar administrador principal' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Carlos' } });
    fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'Rector' } });
    fireEvent.change(screen.getByLabelText('Correo de acceso'), { target: { value: 'carlos@colegio.test' } });
    fireEvent.change(screen.getByLabelText('Número de documento'), { target: { value: '99887766' } });
    fireEvent.click(screen.getByRole('button', { name: /^asignar administrador$/i }));

    await waitFor(() => expect(mocks.assignPrimaryAdmin).toHaveBeenCalledWith(legacyInstitution._id, expect.objectContaining({ email: 'carlos@colegio.test', document_number: '99887766' })));
  });
});
