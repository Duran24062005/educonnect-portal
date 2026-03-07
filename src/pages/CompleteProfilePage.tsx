import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi, CompleteProfileData } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import AuthLayout from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { extractApiError, mapErrorDetailsByField } from '@/lib/http';

const schema = z.object({
  first_name: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  last_name: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  document_type: z.enum(['CC', 'RC', 'CE']),
  document_number: z.string().min(5, 'Mínimo 5 caracteres').max(20),
  born_date: z.string().optional(),
  phone: z.string().min(7, 'Mínimo 7 caracteres').max(15).optional().or(z.literal('')),
  requested_role: z.enum(['Student', 'Teacher', 'Parent']),
});

type FormData = z.infer<typeof schema>;

const CompleteProfilePage = () => {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const navigate = useNavigate();
  const { setAuth, fetchMe } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      document_type: 'CC',
      requested_role: 'Student',
      born_date: '',
      phone: '',
    },
  });

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const statusRes = await authApi.profileStatus();
        const statusData = statusRes.data?.data ?? statusRes.data;

        if (statusData?.profile_complete) {
          await fetchMe();
          navigate('/dashboard', { replace: true });
        }
      } catch {
        // The guard handles auth redirects; keep the form usable if this check fails.
      } finally {
        setCheckingStatus(false);
      }
    };

    checkProfileStatus();
  }, [fetchMe, navigate]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const statusRes = await authApi.profileStatus();
      const statusData = statusRes.data?.data ?? statusRes.data;

      if (statusData?.profile_complete) {
        await fetchMe();
        toast.success('Tu perfil ya estaba completo. Redirigiendo al panel...');
        navigate('/dashboard');
        return;
      }

      const payloadToSend: CompleteProfileData = {
        first_name: data.first_name,
        last_name: data.last_name,
        document_type: data.document_type,
        document_number: data.document_number,
        ...(data.born_date ? { born_date: data.born_date } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.requested_role ? { requested_role: data.requested_role } : {}),
      };

      const res = await authApi.completeProfile(payloadToSend);
      const payload = res.data?.data ?? res.data;
      const { user, person } = payload;
      const token = localStorage.getItem('token')!;
      setAuth(token, { ...user, profile_complete: true }, person);
      toast.success('Perfil completado.');
      if ((payload?.user?.status || person?.status || 'pending').toLowerCase() === 'active') {
        navigate('/dashboard');
      } else {
        navigate('/account-status');
      }
    } catch (err: any) {
      const { message } = extractApiError(err);
      const fieldErrors = mapErrorDetailsByField(err);

      Object.entries(fieldErrors).forEach(([field, value]) => {
        if (field in data) {
          setError(field as keyof FormData, { type: 'server', message: value });
        }
      });

      if (message.toLowerCase().includes('ya fue completado')) {
        await fetchMe();
        toast.success('Tu perfil ya estaba completo. Redirigiendo al panel...');
        navigate('/dashboard');
        return;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold text-foreground">Completar perfil</h1>
          <p className="text-muted-foreground">Necesitamos algunos datos más para continuar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input {...register('first_name')} placeholder="Juan" className="h-11" />
              {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Apellido</Label>
              <Input {...register('last_name')} placeholder="Pérez" className="h-11" />
              {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fecha de nacimiento</Label>
            <Input type="date" {...register('born_date')} className="h-11" />
            {errors.born_date && <p className="text-sm text-destructive">{errors.born_date.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Select defaultValue="CC" onValueChange={(v) => setValue('document_type', v as any)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                  <SelectItem value="RC">Registro Civil</SelectItem>
                  <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Número de documento</Label>
              <Input {...register('document_number')} placeholder="1234567890" className="h-11" />
              {errors.document_number && <p className="text-sm text-destructive">{errors.document_number.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input {...register('phone')} placeholder="3001234567" className="h-11" />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Rol solicitado</Label>
            <Select defaultValue="Student" onValueChange={(v) => setValue('requested_role', v as any)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Student">Estudiante</SelectItem>
                <SelectItem value="Teacher">Docente</SelectItem>
                <SelectItem value="Parent">Parent/Acudiente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Completar perfil
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default CompleteProfilePage;
