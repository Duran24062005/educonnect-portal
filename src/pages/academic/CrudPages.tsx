import { useEffect, useState } from 'react';
import { academicApi } from '@/api/academic';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Pencil } from 'lucide-react';

interface CrudPageProps {
  title: string;
  subtitle: string;
  fetchFn: () => Promise<any>;
  createFn: (data: any) => Promise<any>;
  updateFn?: (id: string, data: any) => Promise<any>;
  deleteFn: (id: string) => Promise<any>;
  dataKey?: string;
  fields: { key: string; label: string; type?: string }[];
}

const CrudPage = ({ title, subtitle, fetchFn, createFn, updateFn, deleteFn, dataKey, fields }: CrudPageProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetchFn();
      const data = dataKey ? res.data?.[dataKey] || res.data : res.data;
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error(`Error al cargar ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      if (editingId && updateFn) {
        await updateFn(editingId, formData);
        toast.success(`${title.slice(0, -1)} actualizado`);
      } else {
        await createFn(formData);
        toast.success(`${title.slice(0, -1)} creado`);
      }
      setDialogOpen(false);
      setFormData({});
      setEditingId(null);
      fetchItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFn(id);
      toast.success('Eliminado exitosamente');
      fetchItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null);
                  setFormData({});
                }}
              >
                <Plus className="w-4 h-4 mr-2" />Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? `Editar ${title.slice(0, -1)}` : `Crear ${title.slice(0, -1)}`}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {fields.map((f) => (
                  <div key={f.key} className="space-y-2">
                    <Label>{f.label}</Label>
                    <Input
                      type={f.type || 'text'}
                      value={formData[f.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    />
                  </div>
                ))}
                <Button onClick={handleCreate} className="w-full" disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? 'Actualizar' : 'Crear'}
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
                    {fields.map((f) => (
                      <TableHead key={f.key}>{f.label}</TableHead>
                    ))}
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {fields.map((f) => (
                          <TableCell key={f.key}><Skeleton className="h-4 w-24" /></TableCell>
                        ))}
                        <TableCell><Skeleton className="h-8 w-10 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={fields.length + 1} className="text-center text-muted-foreground py-8">
                        No hay registros
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item._id}>
                        {fields.map((f) => (
                          <TableCell key={f.key}>{item[f.key]}</TableCell>
                        ))}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {updateFn && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const nextData: Record<string, string> = {};
                                  fields.forEach((field) => {
                                    nextData[field.key] = String(item[field.key] ?? '');
                                  });
                                  setFormData(nextData);
                                  setEditingId(item._id);
                                  setDialogOpen(true);
                                }}
                              >
                                <Pencil className="w-4 h-4" />
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
                                  <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(item._id)}>Eliminar</AlertDialogAction>
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

export const GradesPage = () => (
  <CrudPage
    title="Grados"
    subtitle="Gestión de grados académicos"
    fetchFn={academicApi.getGrades}
    createFn={academicApi.createGrade}
    updateFn={academicApi.updateGrade}
    deleteFn={academicApi.deleteGrade}
    fields={[
      { key: 'name', label: 'Nombre' },
      { key: 'description', label: 'Descripción' },
    ]}
  />
);

export const AreasPage = () => (
  <CrudPage
    title="Áreas"
    subtitle="Áreas de conocimiento"
    fetchFn={academicApi.getAreas}
    createFn={academicApi.createArea}
    updateFn={academicApi.updateArea}
    deleteFn={academicApi.deleteArea}
    fields={[
      { key: 'name', label: 'Nombre' },
      { key: 'description', label: 'Descripción' },
    ]}
  />
);

export const AulasPage = () => (
  <CrudPage
    title="Aulas"
    subtitle="Aulas físicas de la institución"
    fetchFn={academicApi.getAulas}
    createFn={academicApi.createAula}
    updateFn={academicApi.updateAula}
    deleteFn={academicApi.deleteAula}
    fields={[
      { key: 'name', label: 'Nombre' },
      { key: 'capacity', label: 'Capacidad', type: 'number' },
      { key: 'location', label: 'Ubicación' },
    ]}
  />
);
