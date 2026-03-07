import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserCheck, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ADMIN_ROLES,
  ADMIN_STATUSES,
  useAdminPendingUsers,
  useApproveUser,
  useChangeUserStatus,
} from '@/hooks/admin/useAdminPendingUsers';

const roleLabel: Record<string, string> = {
  student: 'Estudiante',
  teacher: 'Docente',
  admin: 'Admin',
  parent: 'Parent/Acudiente',
  guardian: 'Parent/Acudiente',
};

const statusLabel: Record<string, string> = {
  active: 'Activo',
  pending: 'Pendiente',
  inactive: 'Inactivo',
  blocked: 'Bloqueado',
  egresado: 'Egresado',
};

const PendingUsersPage = () => {
  const { data: users = [], isLoading } = useAdminPendingUsers();
  const approveMutation = useApproveUser();
  const statusMutation = useChangeUserStatus();

  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({});
  const [approveTarget, setApproveTarget] = useState<any | null>(null);

  const normalizedUsers = useMemo(() => {
    return users.map((user: any) => {
      const person = user?.person || user?.person_id;
      return {
        ...user,
        person,
        status: (user?.status ?? person?.status ?? 'pending').toLowerCase(),
      };
    });
  }, [users]);

  const handleApprove = async (id: string) => {
    const role = selectedRoles[id] as any;
    if (!role) {
      toast.error('Selecciona un rol antes de aprobar');
      return;
    }

    try {
      await approveMutation.mutateAsync({ id, role });
      toast.success('Usuario aprobado exitosamente');
      setApproveTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al aprobar usuario');
    }
  };

  const handleStatusUpdate = async (id: string) => {
    const status = selectedStatuses[id] as any;
    if (!status) {
      toast.error('Selecciona un estado');
      return;
    }

    try {
      await statusMutation.mutateAsync({ id, status });
      toast.success('Estado actualizado');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar estado');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Usuarios Pendientes</h1>
          <p className="text-muted-foreground">Aprueba usuarios nuevos y gestiona su estado.</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : normalizedUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay usuarios pendientes de aprobación</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Rol aprobación</TableHead>
                      <TableHead>Cambiar estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {normalizedUsers.map((user: any) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.person ? `${user.person.first_name} ${user.person.last_name}` : 'Sin perfil'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="w-fit bg-warning/10 text-warning border-warning/20">
                            {statusLabel[user.status] || user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-56">
                          <Select
                            value={selectedRoles[user._id] || ''}
                            onValueChange={(value) => setSelectedRoles((prev) => ({ ...prev, [user._id]: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                              {ADMIN_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {roleLabel[role] || role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="w-56">
                          <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                            <Select
                              value={selectedStatuses[user._id] || user.status || ''}
                              onValueChange={(value) => setSelectedStatuses((prev) => ({ ...prev, [user._id]: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Cambiar estado" />
                              </SelectTrigger>
                              <SelectContent>
                                {ADMIN_STATUSES.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {statusLabel[status] || status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStatusUpdate(user._id)}
                              disabled={statusMutation.isPending}
                            >
                              {statusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={approveTarget?._id === user._id} onOpenChange={(open) => setApproveTarget(open ? user : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" onClick={() => setApproveTarget(user)}>
                                Aprobar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirmar aprobación</DialogTitle>
                              </DialogHeader>
                              <p className="text-sm text-muted-foreground">
                                Se aprobará a <strong>{user.email}</strong> con rol <strong>{roleLabel[selectedRoles[user._id] || ''] || 'sin seleccionar'}</strong>.
                              </p>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setApproveTarget(null)}>Cancelar</Button>
                                <Button onClick={() => handleApprove(user._id)} disabled={approveMutation.isPending}>
                                  {approveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                  Confirmar
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PendingUsersPage;
