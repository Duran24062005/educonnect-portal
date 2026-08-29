import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MaterialsPage from '@/pages/MaterialsPage';
import { useAuthStore } from '@/store/auth';

const mocks = vi.hoisted(() => ({
  getTeacherMaterials: vi.fn(),
  getTeacherSessions: vi.fn(),
  createTeacherMaterial: vi.fn(),
  updateTeacherMaterial: vi.fn(),
  deleteTeacherMaterial: vi.fn(),
  getStudentMaterials: vi.fn(),
  getStudentMaterial: vi.fn(),
}));

vi.mock('@/api/materials', () => ({ materialsApi: mocks }));
vi.mock('@/layouts/DashboardLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

const session = {
  _id: 'session-1', start_at: '2026-08-28T12:00:00Z', end_at: '2026-08-28T13:00:00Z', status: 'scheduled' as const, topic: 'Ecuaciones lineales',
  school_year: { _id: 'year-1', year: 2026 }, grade: { _id: 'grade-1', name: '7°' }, group: { _id: 'group-1', name: '7A' }, area: { _id: 'area-1', name: 'Matemáticas' }, teacher: { _id: 'teacher-1', name: 'Docente' }, aula: { _id: 'aula-1', name: 'Aula 1' },
};
const material = { _id: 'material-1', title: 'Guía de ecuaciones', description: 'Repaso', material_type: 'link' as const, link_url: 'https://example.com/guide', file_url: null, original_name: null, mime_type: null, size_bytes: 0, session, teacher: { _id: 'teacher-1', name: 'Docente' }, created_at: '2026-08-28T10:00:00Z', updated_at: '2026-08-28T10:00:00Z' };

const renderPage = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><MaterialsPage /></MemoryRouter></QueryClientProvider>);

const LocationProbe = () => <span data-testid="location">{useLocation().pathname}</span>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getTeacherMaterials.mockResolvedValue({ materials: [material] });
  mocks.getTeacherSessions.mockResolvedValue({ sessions: [session] });
  mocks.getStudentMaterials.mockResolvedValue({ materials: [material] });
});

afterEach(() => useAuthStore.setState({ user: null }));

describe('MaterialsPage', () => {
  it('shows resources for students and opens links safely', async () => {
    useAuthStore.setState({ user: { _id: 'student-1', email: 'student@test.com', role: 'student', status: 'active', profile_complete: true } });
    renderPage();

    expect(await screen.findByText('Guía de ecuaciones')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir enlace' })).toHaveAttribute('href', 'https://example.com/guide');
    expect(screen.getByText('Clase programada')).toBeInTheDocument();
  });

  it('shows the teacher publishing flow with an existing session and no session creator', async () => {
    useAuthStore.setState({ user: { _id: 'teacher-1', email: 'teacher@test.com', role: 'teacher', status: 'active', profile_complete: true } });
    renderPage();

    const createButton = await screen.findByRole('button', { name: 'Nuevo material' });
    await waitFor(() => expect(createButton).not.toBeDisabled());
    fireEvent.click(createButton);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByText(/7A · Matemáticas/)).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Nueva sesión' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('opens the material detail screen when selecting a material card', async () => {
    useAuthStore.setState({ user: { _id: 'student-1', email: 'student@test.com', role: 'student', status: 'active', profile_complete: true } });
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><LocationProbe /><MaterialsPage /></MemoryRouter></QueryClientProvider>);

    const card = await screen.findByRole('link', { name: 'Ver detalles de Guía de ecuaciones' });
    fireEvent.click(card);

    expect(screen.getByTestId('location')).toHaveTextContent('/materials/material-1');
  });
});
