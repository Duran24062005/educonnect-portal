import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import AuthLayout from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { extractApiError, mapErrorDetailsByField } from '@/lib/http';

const schema = z
  .object({
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    password_confirm: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirm'],
  });

type FormData = z.infer<typeof schema>;

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Required<FormData>) => {
    setLoading(true);
    try {
      console.log(data);
      
      const res = await authApi.register(data);
      const payload = res.data?.data ?? res.data;
      const { token, user, profile_complete } = payload;
      setAuth(token, { ...user, profile_complete: profile_complete ?? false });
      toast.success('Cuenta creada. Completa tu perfil.');
      navigate('/complete-profile');
    } catch (err: any) {
      const apiError = extractApiError(err);
      const fieldErrors = mapErrorDetailsByField(err);

      Object.entries(fieldErrors).forEach(([field, message]) => {
        if (field in data) {
          setError(field as keyof FormData, { type: 'server', message });
        }
      });

      toast.error(apiError.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold text-foreground">Crear cuenta</h1>
          <p className="text-muted-foreground">Regístrate para comenzar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" placeholder="tu@correo.com" {...register('email')} className="h-11" />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirm">Confirmar contraseña</Label>
            <Input
              id="password_confirm"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password_confirm')}
              className="h-11"
            />
            {errors.password_confirm && (
              <p className="text-sm text-destructive">{errors.password_confirm.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Crear cuenta
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
