import { useEffect, useState } from 'react';
import { academicApi } from '@/api/academic';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { Plus, Trash2, Check, Loader2 } from 'lucide-react';

const SchoolYearsPage = () => {
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newYear, setNewYear] = useState({ name: '', start_date: '', end_date: '' });

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await academicApi.getSchoolYears();
      const payload = res.data?.data ?? res.data;
      const schoolYears = Array.isArray(payload?.schoolYears)
        ? payload.schoolYears
        : Array.isArray(payload)
          ? payload
          : [];
      setYears(schoolYears);
    } catch {
      toast.error('Error al cargar años escolares');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchYears(); }, []);

  const handleCreate = async () => {
    if (!newYear.name) {
      toast.error('Nombre requerido');
      return;
    }
    if (!newYear.start_date || !newYear.end_date) {
      toast.error('Fecha de inicio y fin son requeridas');
      return;
    }
    if (new Date(newYear.start_date) >= new Date(newYear.end_date)) {
      toast.error('La fecha de inicio debe ser antes que la fecha de fin');
      return;
    }

    const parsedYear = Number((newYear.name.match(/\d{4}/) || [])[0]);
    if (!Number.isInteger(parsedYear)) {
      toast.error('El nombre debe incluir un año válido, por ejemplo: 2026-2027');
      return;
    }

    setCreating(true);
    try {
      await academicApi.createSchoolYear({
        year: parsedYear,
        start_date: newYear.start_date,
        end_date: newYear.end_date,
      });
      toast.success('Año escolar creado');
      setDialogOpen(false);
      setNewYear({ name: '', start_date: '', end_date: '' });
      fetchYears();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear');
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await academicApi.activateSchoolYear(id);
      toast.success('Año escolar activado');
      fetchYears();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await academicApi.deleteSchoolYear(id);
      toast.success('Año escolar eliminado');
      fetchYears();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Años Escolares</h1>
            <p className="text-muted-foreground">Gestión de periodos académicos</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Nuevo Año</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Año Escolar</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={newYear.name}
                    onChange={(e) => setNewYear({ ...newYear, name: e.target.value })}
                    placeholder="2025-2026"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha inicio</Label>
                    <Input
                      type="date"
                      value={newYear.start_date}
                      onChange={(e) => setNewYear({ ...newYear, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha fin</Label>
                    <Input
                      type="date"
                      value={newYear.end_date}
                      onChange={(e) => setNewYear({ ...newYear, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Crear
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : years.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No hay años escolares registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    years.map((y) => (
                      <TableRow key={y._id}>
                        <TableCell className="font-medium">{y.name || y.year}</TableCell>
                        <TableCell>
                          <Badge variant={y.is_active ? 'default' : 'secondary'}>
                            {y.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!y.is_active && (
                              <Button variant="ghost" size="sm" onClick={() => handleActivate(y._id)}>
                                <Check className="w-4 h-4 mr-1" />Activar
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
                                  <AlertDialogTitle>¿Eliminar año escolar?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(y._id)}>Eliminar</AlertDialogAction>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SchoolYearsPage;
