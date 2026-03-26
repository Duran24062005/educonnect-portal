import { useEffect, useMemo, useState } from 'react';
import { usersApi } from '@/api/users';
import { useUsers, normalizeRoleLabel } from '@/hooks/useUsers';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRoleLabel } from '@/lib/auth';
import { getMediaUrl } from '@/lib/media';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  inactive: 'bg-muted text-muted-foreground',
  blocked: 'bg-destructive/10 text-destructive border-destructive/20',
  egresado: 'bg-info/10 text-info border-info/20',
};

const roleColors: Record<string, string> = {
  admin: 'bg-primary/10 text-primary border-primary/20',
  teacher: 'bg-info/10 text-info border-info/20',
  student: 'bg-accent text-accent-foreground',
  parent: 'bg-warning/10 text-warning border-warning/20',
};

const resolveFullName = (user: any) => {
  const person = user?.person;
  if (!person) return 'Sin nombre';
  return `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Sin nombre';
};

const resolveInitials = (user: any) => {
  const person = user?.person;
  if (person?.first_name || person?.last_name) {
    return `${person?.first_name?.[0] || ''}${person?.last_name?.[0] || ''}`.toUpperCase() || 'U';
  }
  return String(user?.email || 'U').charAt(0).toUpperCase();
};

const resolveAvatarUrl = (user: any) => getMediaUrl(user?.person?.profile_photo_url || user?.person?.profile_photo);

const UsersPage = () => {
  const { users: allUsers, isLoading: loading, isError, refetch } = useUsers();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const limit = 10;

  const filteredUsers = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return allUsers.filter((user: any) => {
      const fullName = `${user?.person?.first_name || ''} ${user?.person?.last_name || ''}`.trim().toLowerCase();
      const email = String(user?.email || '').toLowerCase();
      const role = String(user?.role || '').toLowerCase();
      const status = String(user?.status || '').toLowerCase();

      const matchesSearch = !searchTerm || fullName.includes(searchTerm) || email.includes(searchTerm);
      const matchesRole = roleFilter === 'all' || role === roleFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [allUsers, search, roleFilter, statusFilter]);

  const total = filteredUsers.length;
  const users = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredUsers.slice(start, start + limit);
  }, [filteredUsers, page]);

  useEffect(() => {
    if (isError) toast.error('No se pudieron cargar los usuarios');
  }, [isError]);

  const handleDelete = async (id: string) => {
    try {
      await usersApi.delete(id);
      toast.success('Usuario eliminado');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await usersApi.changeStatus(id, status);
      toast.success('Estado actualizado');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de todos los usuarios del sistema</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Docente</SelectItem>
                  <SelectItem value="student">Estudiante</SelectItem>
                  <SelectItem value="parent">Parent/Acudiente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                  <SelectItem value="egresado">Egresado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Avatar</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow
                        key={u._id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => setSelectedUser(u)}
                      >
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={resolveAvatarUrl(u) || undefined} alt={resolveFullName(u)} />
                            <AvatarFallback>{resolveInitials(u)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{resolveFullName(u)}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={roleColors[String(u.role || '').toLowerCase()] || ''}>
                            {getRoleLabel(u.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[u.status] || ''}>
                            {u.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {u.status === 'active' && (
                              <Button variant="ghost" size="sm" onClick={() => handleStatusChange(u._id, 'blocked')}>
                                Bloquear
                              </Button>
                            )}
                            {u.status === 'blocked' && (
                              <Button variant="ghost" size="sm" onClick={() => handleStatusChange(u._id, 'active')}>
                                Activar
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará permanentemente el usuario.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(u._id)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages} ({total} usuarios)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Ir a la pagina anterior"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Ir a la pagina siguiente"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalle del usuario</DialogTitle>
              <DialogDescription>
                Información general y datos de perfil del usuario seleccionado.
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={resolveAvatarUrl(selectedUser) || undefined} alt={resolveFullName(selectedUser)} />
                    <AvatarFallback className="text-lg">{resolveInitials(selectedUser)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">{resolveFullName(selectedUser)}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={roleColors[String(selectedUser.role || '').toLowerCase()] || ''}>
                        {getRoleLabel(selectedUser.role)}
                      </Badge>
                      <Badge variant="outline" className={statusColors[selectedUser.status] || ''}>
                        {selectedUser.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nombre</p>
                    <p className="text-sm">{selectedUser.person?.first_name || 'No disponible'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Apellido</p>
                    <p className="text-sm">{selectedUser.person?.last_name || 'No disponible'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
                    <p className="text-sm">{selectedUser.email || 'No disponible'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rol</p>
                    <p className="text-sm">{getRoleLabel(selectedUser.role)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</p>
                    <p className="text-sm">{selectedUser.status || 'No disponible'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Teléfono</p>
                    <p className="text-sm">{selectedUser.person?.phone || 'No disponible'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Documento</p>
                    <p className="text-sm">
                      {selectedUser.person?.document_type && selectedUser.person?.document_number
                        ? `${selectedUser.person.document_type} ${selectedUser.person.document_number}`
                        : 'No disponible'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha de nacimiento</p>
                    <p className="text-sm">
                      {selectedUser.person?.born_date ? String(selectedUser.person.born_date).slice(0, 10) : 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
