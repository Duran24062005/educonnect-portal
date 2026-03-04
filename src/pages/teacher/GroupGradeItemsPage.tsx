import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { academicApi } from '@/api/academic';
import { evaluationsApi } from '@/api/evaluations';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

const pickArray = (res: any, key?: string) => {
  const data = res?.data?.data ?? res?.data;
  if (key && Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const GroupGradeItemsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [periods, setPeriods] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', percentage: '' });

  const loadBaseData = async () => {
    try {
      const [yearsRes, areasRes] = await Promise.all([academicApi.getSchoolYears(), academicApi.getAreas()]);
      const years = pickArray(yearsRes, 'schoolYears');
      const activeYear = years.find((year: any) => year?.is_active);
      const yearId = activeYear?._id || years[0]?._id;

      if (yearId) {
        const periodsRes = await academicApi.getPeriods(yearId);
        const loadedPeriods = pickArray(periodsRes, 'periods');
        setPeriods(loadedPeriods);
        if (loadedPeriods[0]?._id) setSelectedPeriod(loadedPeriods[0]._id);
      }

      const loadedAreas = pickArray(areasRes, 'areas');
      setAreas(loadedAreas);
      if (loadedAreas[0]?._id) setSelectedArea(loadedAreas[0]._id);
    } catch {
      toast.error('No se pudo cargar configuración académica');
    }
  };

  const loadItems = async (periodId: string, areaId: string) => {
    if (!periodId || !areaId) return;
    setLoading(true);
    try {
      const res = await evaluationsApi.getGradeItems({ period_id: periodId, area_id: areaId });
      setItems(pickArray(res, 'gradeItems'));
    } catch {
      setItems([]);
      toast.error('No se pudieron cargar los ítems de evaluación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPeriod && selectedArea) {
      loadItems(selectedPeriod, selectedArea);
    }
  }, [selectedPeriod, selectedArea]);

  const resetForm = () => {
    setForm({ name: '', percentage: '' });
    setEditingId(null);
  };

  const submit = async () => {
    if (!selectedPeriod || !selectedArea || !form.name || !form.percentage) {
      toast.error('Completa todos los campos');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name,
      percentage: Number(form.percentage),
      period_id: selectedPeriod,
      area_id: selectedArea,
      group_id: id,
    };

    try {
      if (editingId) {
        await evaluationsApi.updateGradeItem(editingId, payload);
        toast.success('Ítem actualizado');
      } else {
        await evaluationsApi.createGradeItem(payload);
        toast.success('Ítem creado');
      }
      resetForm();
      await loadItems(selectedPeriod, selectedArea);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo guardar el ítem');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item: any) => {
    setEditingId(item._id);
    setForm({ name: item.name || '', percentage: String(item.percentage || item.weight || '') });
  };

  const onDelete = async (itemId: string) => {
    try {
      await evaluationsApi.deleteGradeItem(itemId);
      toast.success('Ítem eliminado');
      await loadItems(selectedPeriod, selectedArea);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo eliminar el ítem');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Ítems de Evaluación</h1>
          <p className="text-muted-foreground">Grupo {id}. Crea y administra evaluaciones por periodo y área.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Periodo</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period._id} value={period._id}>
                      {period.name || period.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Área</Label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area._id} value={area._id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar ítem' : 'Nuevo ítem'}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-4 items-end">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Parcial 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Porcentaje</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.percentage}
                onChange={(e) => setForm((prev) => ({ ...prev, percentage: e.target.value }))}
                placeholder="30"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {editingId ? 'Actualizar' : 'Crear'}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ítems registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Porcentaje</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay ítems para el filtro seleccionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.percentage ?? item.weight ?? 0}%</Badge>
                        </TableCell>
                        <TableCell>{item.period?.name || 'N/A'}</TableCell>
                        <TableCell>{item.area?.name || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                              <Pencil className="w-4 h-4 mr-1" /> Editar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(item._id)}>
                              <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                            </Button>
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

export default GroupGradeItemsPage;
