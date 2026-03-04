import { useEffect, useState } from 'react';
import { academicApi } from '@/api/academic';
import { groupsApi } from '@/api/groups';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Users, Eye, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
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

const GroupsPage = () => {
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({ name: '', grade_id: '', aula_id: '', school_year_id: '' });
  const [grades, setGrades] = useState<any[]>([]);
  const [aulas, setAulas] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [yearsRes, gradesRes, aulasRes] = await Promise.all([
          academicApi.getSchoolYears(),
          academicApi.getGrades(),
          academicApi.getAulas(),
        ]);
        const y = yearsRes.data?.schoolYears || yearsRes.data || [];
        setYears(y);
        setGrades(gradesRes.data?.grades || gradesRes.data || []);
        setAulas(aulasRes.data?.aulas || aulasRes.data || []);
        const active = y.find((yr: any) => yr.is_active);
        if (active) setSelectedYear(active._id);
        else if (y.length > 0) setSelectedYear(y[0]._id);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    setLoading(true);
    groupsApi.getBySchoolYear(selectedYear)
      .then((res) => setGroups(res.data?.groups || res.data || []))
      .catch(() => toast.error('Error al cargar grupos'))
      .finally(() => setLoading(false));
  }, [selectedYear]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload = { ...newGroup, school_year_id: selectedYear };
      if (editingId) {
        await groupsApi.update(editingId, payload);
        toast.success('Grupo actualizado');
      } else {
        await groupsApi.create(payload);
        toast.success('Grupo creado');
      }
      setDialogOpen(false);
      setEditingId(null);
      setNewGroup({ name: '', grade_id: '', aula_id: '', school_year_id: '' });
      const res = await groupsApi.getBySchoolYear(selectedYear);
      setGroups(res.data?.groups || res.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear grupo');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await groupsApi.delete(id);
      toast.success('Grupo eliminado');
      const res = await groupsApi.getBySchoolYear(selectedYear);
      setGroups(res.data?.groups || res.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo eliminar el grupo');
    }
  };

  const startEdit = (group: any) => {
    setEditingId(group._id);
    setNewGroup({
      name: group.name || '',
      grade_id: group.grade?._id || '',
      aula_id: group.aula?._id || '',
      school_year_id: selectedYear,
    });
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Grupos</h1>
            <p className="text-muted-foreground">Organización de grupos por año escolar</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Año escolar" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y._id} value={y._id}>{y.name || y.year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null);
                    setNewGroup({ name: '', grade_id: '', aula_id: '', school_year_id: '' });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />Nuevo Grupo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Grupo' : 'Crear Grupo'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="Grupo A" />
                  </div>
                  <div className="space-y-2">
                    <Label>Grado</Label>
                    <Select value={newGroup.grade_id} onValueChange={(v) => setNewGroup({ ...newGroup, grade_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {grades.map((g: any) => (
                          <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Aula</Label>
                    <Select value={newGroup.aula_id} onValueChange={(v) => setNewGroup({ ...newGroup, aula_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {aulas.map((a: any) => (
                          <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreate} className="w-full" disabled={creating}>
                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingId ? 'Actualizar Grupo' : 'Crear Grupo'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20" /></CardContent></Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No hay grupos para este año escolar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <Card key={g._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {g.name}
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{g.grade?.name || 'Sin grado'}</span>
                    {g.aula && <Badge variant="secondary">{g.aula.name}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/groups/${g._id}`)}>
                      Ver
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => startEdit(g)}>
                      <Pencil className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar grupo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(g._id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GroupsPage;
