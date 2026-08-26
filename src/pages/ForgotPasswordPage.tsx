import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, ShieldCheck } from 'lucide-react';

import { authApi } from '@/api/auth';
import AuthLayout from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractApiError } from '@/lib/http';

const emailSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
});

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Ingresa el código de 6 dígitos'),
});

const passwordSchema = z
  .object({
    new_password: z.string().min(8, 'Mínimo 8 caracteres'),
    new_password_confirm: z.string().min(8, 'Mínimo 8 caracteres'),
  })
  .refine((data) => data.new_password === data.new_password_confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['new_password_confirm'],
  });

type EmailForm = z.infer<typeof emailSchema>;
type CodeForm = z.infer<typeof codeSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type RecoveryStep = 'email' | 'code' | 'password';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<RecoveryStep>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const runAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
    } catch (error) {
      toast.error(extractApiError(error).message || 'No pudimos completar la operación');
    } finally {
      setLoading(false);
    }
  };

  const onRequestCode = async ({ email: submittedEmail }: EmailForm) => {
    await runAction(async () => {
      const normalizedEmail = submittedEmail.trim().toLowerCase();
      await authApi.requestPasswordReset({ email: normalizedEmail });
      setEmail(normalizedEmail);
      setStep('code');
      toast.success('Revisa tu correo para encontrar el código de recuperación');
    });
  };

  const onVerifyCode = async ({ code }: CodeForm) => {
    await runAction(async () => {
      const response = await authApi.verifyPasswordResetCode({ email, code });
      const payload = response.data?.data ?? response.data;
      setResetToken(payload.reset_token);
      setStep('password');
      toast.success('Código validado. Define tu nueva contraseña');
    });
  };

  const onResetPassword = async ({ new_password, new_password_confirm }: PasswordForm) => {
    if (!resetToken) {
      setStep('code');
      toast.error('Tu validación expiró. Solicita un nuevo código');
      return;
    }

    await runAction(async () => {
      await authApi.resetPassword({
        reset_token: resetToken,
        new_password,
        new_password_confirm,
      });
      setResetToken(null);
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión');
      navigate('/login', { replace: true });
    });
  };

  const resendCode = async () => {
    if (!email) return;

    await runAction(async () => {
      await authApi.requestPasswordReset({ email });
      codeForm.reset();
      toast.success('Te enviamos un nuevo código');
    });
  };

  const goBack = () => {
    if (step === 'password') {
      setResetToken(null);
      setStep('code');
      return;
    }
    if (step === 'code') {
      setStep('email');
      return;
    }
    navigate('/login');
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        {step === 'email' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">Recupera tu contraseña</h1>
              <p className="text-muted-foreground">
                Ingresa tu correo y te enviaremos un código para recuperar el acceso.
              </p>
            </div>

            <form onSubmit={emailForm.handleSubmit(onRequestCode)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recovery-email">Correo electrónico</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  {...emailForm.register('email')}
                  className="h-11"
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="h-11 w-full font-semibold" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar código
              </Button>
            </form>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">Verifica tu correo</h1>
              <p className="text-muted-foreground">
                Ingresa el código de 6 dígitos que enviamos a <strong>{email}</strong>.
              </p>
            </div>

            <form onSubmit={codeForm.handleSubmit(onVerifyCode)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recovery-code">Código de recuperación</Label>
                <Input
                  id="recovery-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  {...codeForm.register('code')}
                  className="h-11 text-center text-lg tracking-[0.35em]"
                />
                {codeForm.formState.errors.code && (
                  <p className="text-sm text-destructive">{codeForm.formState.errors.code.message}</p>
                )}
              </div>
              <Button type="submit" className="h-11 w-full font-semibold" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Validar código
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              ¿No recibiste el código?{' '}
              <button type="button" onClick={resendCode} disabled={loading} className="font-medium text-primary hover:underline">
                Reenviar código
              </button>
            </p>
          </div>
        )}

        {step === 'password' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold text-foreground">Crea una nueva contraseña</h1>
              <p className="text-muted-foreground">Usa una contraseña segura de al menos 8 caracteres.</p>
            </div>

            <form onSubmit={passwordForm.handleSubmit(onResetPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...passwordForm.register('new_password')}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.new_password && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.new_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password-confirm">Confirmar contraseña</Label>
                <Input
                  id="new-password-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...passwordForm.register('new_password_confirm')}
                  className="h-11"
                />
                {passwordForm.formState.errors.new_password_confirm && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.new_password_confirm.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="h-11 w-full font-semibold" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar contraseña
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya recuerdas tu contraseña?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
