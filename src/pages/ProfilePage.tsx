import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import { usersApi } from '@/api/users';
import { authApi } from '@/api/auth';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Camera } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';

const passwordSchema = z
  .object({
    current_password: z.string().min(6),
    new_password: z.string().min(6),
    new_password_confirm: z.string().min(6),
  })
  .refine((d) => d.new_password === d.new_password_confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['new_password_confirm'],
  });

const ProfilePage = () => {
  const { user, person, fetchMe } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const initials = person
    ? `${person.first_name[0]}${person.last_name[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';
  const profilePhotoUrl = getMediaUrl(person?.profile_photo_url || person?.profile_photo);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?._id) return;
    setUploading(true);
    try {
      await usersApi.uploadPhoto(user._id, file);
      toast.success('Foto actualizada');
      await fetchMe();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al subir foto');
    } finally {
      setUploading(false);
    }
  };

  const onPasswordSubmit = async (data: any) => {
    setChangingPw(true);
    try {
      await authApi.changePassword(data);
      toast.success('Contraseña actualizada');
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-display font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profilePhotoUrl || undefined} alt={person ? `${person.first_name} ${person.last_name}` : user?.email} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              </div>
              <div>
                <p className="text-lg font-semibold">{person ? `${person.first_name} ${person.last_name}` : user?.email}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">{user?.role}</p>
              </div>
            </div>

            {person && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Documento</Label>
                  <p className="text-sm font-medium">{person.document_type} {person.document_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Teléfono</Label>
                  <p className="text-sm font-medium">{person.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Fecha de nacimiento</Label>
                  <p className="text-sm font-medium">{new Date(person.born_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cambiar Contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Contraseña actual</Label>
                <Input type="password" {...register('current_password')} className="max-w-sm" />
                {errors.current_password && <p className="text-sm text-destructive">{String(errors.current_password.message)}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nueva contraseña</Label>
                <Input type="password" {...register('new_password')} className="max-w-sm" />
                {errors.new_password && <p className="text-sm text-destructive">{String(errors.new_password.message)}</p>}
              </div>
              <div className="space-y-2">
                <Label>Confirmar nueva contraseña</Label>
                <Input type="password" {...register('new_password_confirm')} className="max-w-sm" />
                {errors.new_password_confirm && <p className="text-sm text-destructive">{String(errors.new_password_confirm.message)}</p>}
              </div>
              <Button type="submit" disabled={changingPw}>
                {changingPw && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cambiar contraseña
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
