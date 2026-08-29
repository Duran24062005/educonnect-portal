import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MaterialDetailPage from '@/pages/MaterialDetailPage';
import { useAuthStore } from '@/store/auth';

const mocks = vi.hoisted(() => ({
  getStudentMaterial: vi.fn(),
  getTeacherMaterial: vi.fn(),
}));

vi.mock('@/api/materials', async () => {
  const actual = await vi.importActual<typeof import('@/api/materials')>('@/api/materials');
  return { ...actual, materialsApi: { ...actual.materialsApi, ...mocks } };
});
vi.mock('@/layouts/DashboardLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

const material = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Guía de ecuaciones',
  description: 'Repaso de ecuaciones lineales.',
  material_type: 'link' as const,
  link_url: 'https://example.com/guide',
  file_url: null,
  original_name: null,
  mime_type: null,
  size_bytes: 0,
  session: {
    _id: '507f1f77bcf86cd799439012',
    start_at: '2026-08-28T12:00:00Z',
    end_at: '2026-08-28T13:00:00Z',
    status: 'scheduled' as const,
    topic: 'Ecuaciones lineales',
    school_year: { _id: '507f1f77bcf86cd799439013', year: 2026 },
    grade: { _id: '507f1f77bcf86cd799439014', name: '7°' },
    group: { _id: '507f1f77bcf86cd799439015', name: '7A' },
    area: { _id: '507f1f77bcf86cd799439016', name: 'Matemáticas' },
    teacher: { _id: '507f1f77bcf86cd799439017', name: 'Docente Uno' },
    aula: { _id: '507f1f77bcf86cd799439018', name: 'Aula 201' },
  },
  teacher: { _id: '507f1f77bcf86cd799439017', name: 'Docente Uno' },
  created_at: '2026-08-28T10:00:00Z',
  updated_at: '2026-08-28T10:00:00Z',
};

const renderPage = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={[`/materials/${material._id}`]}>
      <Routes><Route path="/materials/:materialId" element={<MaterialDetailPage />} /></Routes>
    </MemoryRouter>
  </QueryClientProvider>,
);

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: { _id: 'student-1', email: 'student@test.com', role: 'student', status: 'active', profile_complete: true } });
  mocks.getStudentMaterial.mockResolvedValue({ material });
});

describe('MaterialDetailPage', () => {
  it('shows the complete material information and resource action', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Guía de ecuaciones' })).toBeInTheDocument();
    expect(screen.getByText('Repaso de ecuaciones lineales.')).toBeInTheDocument();
    expect(screen.getByText('28 de agosto de 2026')).toBeInTheDocument();
    expect(screen.getByText('7A · 7°')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir enlace' })).toHaveAttribute('href', material.link_url);
  });
});
