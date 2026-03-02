import { useEffect, useState } from 'react';
import { usersApi } from '@/api/users';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserCheck, Loader2 } from 'lucide-react';

const PendingUsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getPending();
      setUsers(res.data?.users || res.data || []);
    } catch {
      toast.error('Error al cargar usuarios pendientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id: string) => {
    const role = selectedRoles[id];
    if (!role) {
      toast.error('Selecciona un rol antes de aprobar');
      return;
    }
    setApproving(id);
    try {
      await usersApi.approve(id, role);
      toast.success('Usuario aprobado exitosamente');
      fetchPending();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al aprobar');
    } finally {
      setApproving(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Usuarios Pendientes</h1>
          <p className="text-muted-foreground">Aprueba o rechaza solicitudes de registro</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay usuarios pendientes de aprobación</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
              <Card key={u._id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{u.email}</CardTitle>
                  <Badge variant="outline" className="w-fit bg-warning/10 text-warning border-warning/20">
                    Pendiente
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {u.person && (
                    <p className="text-sm text-muted-foreground">
                      {u.person.first_name} {u.person.last_name}
                    </p>
                  )}
                  <Select
                    value={selectedRoles[u._id] || ''}
                    onValueChange={(v) => setSelectedRoles((prev) => ({ ...prev, [u._id]: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Asignar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Estudiante</SelectItem>
                      <SelectItem value="Teacher">Docente</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full"
                    onClick={() => handleApprove(u._id)}
                    disabled={approving === u._id}
                  >
                    {approving === u._id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Aprobar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PendingUsersPage;
