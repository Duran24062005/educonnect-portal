import { useMemo } from 'react';
import { Clock, ShieldAlert, UserX } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { clearStoredAccountState, getStoredAccountState } from '@/lib/account-state';
import { normalizeStatus } from '@/lib/auth';

const AccountStatusPage = () => {
  const { user, logout } = useAuthStore();
  const stored = getStoredAccountState();
  const status = normalizeStatus(user?.status || stored?.status) ?? 'pending';
  const message = stored?.message;

  const config = useMemo(() => {
    switch (status) {
      case 'inactive':
        return {
          title: 'Cuenta inactiva',
          description: message || 'Tu cuenta está inactiva. Contacta a administración para reactivarla.',
          icon: UserX,
        };
      case 'blocked':
        return {
          title: 'Cuenta bloqueada',
          description: message || 'Tu cuenta está bloqueada. Contacta a administración.',
          icon: ShieldAlert,
        };
      default:
        return {
          title: 'Cuenta pendiente',
          description:
            message || 'Tu cuenta fue creada, pero aún no está activa. Un administrador debe revisarla.',
          icon: Clock,
        };
    }
  }, [message, status]);

  const Icon = config.icon;

  return (
    <AuthLayout>
      <Card>
        <CardContent className="pt-8 space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <Icon className="h-8 w-8 text-warning" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold">{config.title}</h1>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              clearStoredAccountState();
              logout();
            }}
          >
            Volver a iniciar sesión
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default AccountStatusPage;
