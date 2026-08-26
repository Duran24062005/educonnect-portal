import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import LoginPage from '@/pages/LoginPage';

const mocks = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
  verifyPasswordResetCode: vi.fn(),
  resetPassword: vi.fn(),
  login: vi.fn(),
}));

vi.mock('@/api/auth', () => ({ authApi: mocks }));

describe('Password recovery flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mocks.requestPasswordReset.mockResolvedValue({ data: { status: 'success' } });
    mocks.verifyPasswordResetCode.mockResolvedValue({
      data: { status: 'success', data: { reset_token: 'temporary-reset-token' } },
    });
    mocks.resetPassword.mockResolvedValue({ data: { status: 'success' } });
  });

  it('exposes the forgot-password link from login', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /olvidaste tu contraseña/i })).toHaveAttribute(
      'href',
      '/forgot-password'
    );
  });

  it('moves from email to code to new password and returns to login', async () => {
    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/login" element={<p>login screen</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'USER@EXAMPLE.COM' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar código/i }));

    await waitFor(() => {
      expect(mocks.requestPasswordReset).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(screen.getByLabelText(/código de recuperación/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/código de recuperación/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /validar código/i }));

    await waitFor(() => {
      expect(mocks.verifyPasswordResetCode).toHaveBeenCalledWith({
        email: 'user@example.com',
        code: '123456',
      });
      expect(screen.getByLabelText(/nueva contraseña/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/nueva contraseña$/i), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /actualizar contraseña/i }));

    await waitFor(() => {
      expect(mocks.resetPassword).toHaveBeenCalledWith({
        reset_token: 'temporary-reset-token',
        new_password: 'NewPassword123!',
        new_password_confirm: 'NewPassword123!',
      });
      expect(screen.getByText('login screen')).toBeInTheDocument();
    });
  });
});
