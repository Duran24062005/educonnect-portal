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

const schema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Required<FormData>) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const { token, user, person, profile_complete } = res.data.data;
      const normalizedUser = {
        ...user,
        profile_complete: user?.profile_complete ?? profile_complete ?? false,
      };

      setAuth(token, normalizedUser, person);

      if (!normalizedUser.profile_complete) {
        navigate('/complete-profile');
      } else {
        toast.success('¡Bienvenido de vuelta!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold text-foreground">Iniciar sesión</h1>
          <p className="text-muted-foreground">Ingresa tus credenciales para acceder</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              {...register('email')}
              className="h-11"
            />
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

          <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Iniciar sesión
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
