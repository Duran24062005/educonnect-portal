import { useEffect, useMemo, useState } from 'react';
import { academicApi } from '@/api/academic';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const unwrap = (payload: any, key?: string) => {
  const data = payload?.data ?? payload;
  if (key && Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.periods)) return data.periods;
  if (Array.isArray(data?.schoolYears)) return data.schoolYears;
  return [];
};

const PeriodsPage = () => {
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [periods, setPeriods] = useState<any[]>([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPeriod, setNewPeriod] = useState({ name: '', weight: '', start_date: '', end_date: '' });

  useEffect(() => {
    const loadYears = async () => {
      setLoadingYears(true);
      try {
        const res = await academicApi.getSchoolYears();
        const schoolYears = unwrap(res.data, 'schoolYears');
        setYears(schoolYears);
        const active = schoolYears.find((year: any) => year?.is_active);
        if (active?._id) setSelectedYear(active._id);
        else if (schoolYears[0]?._id) setSelectedYear(schoolYears[0]._id);
      } catch {
        toast.error('No se pudieron cargar los años escolares');
      } finally {
        setLoadingYears(false);
      }
    };

    loadYears();
  }, []);

  const loadPeriods = async (yearId: string) => {
    if (!yearId) return;
    setLoadingPeriods(true);
    try {
      const res = await academicApi.getPeriods(yearId);
      setPeriods(unwrap(res.data, 'periods'));
    } catch {
      setPeriods([]);
      toast.error('No se pudieron cargar los periodos');
    } finally {
      setLoadingPeriods(false);
    }
  };

  useEffect(() => {
    if (!selectedYear) return;
    loadPeriods(selectedYear);
  }, [selectedYear]);

  const selectedYearName = useMemo(() => {
    const year = years.find((item) => item._id === selectedYear);
    return year?.name || year?.year || 'Año escolar';
  }, [years, selectedYear]);

  const handleCreate = async () => {
    if (!selectedYear) {
      toast.error('Selecciona un año escolar');
      return;
    }

    const name = newPeriod.name.trim();
    const weight = Number(newPeriod.weight);
    const startDate = newPeriod.start_date;
    const endDate = newPeriod.end_date;

    if (!name || !newPeriod.weight || !startDate || !endDate) {
      toast.error('Completa todos los campos');
      return;
    }

    if (Number.isNaN(weight) || weight < 0 || weight > 1) {
      toast.error('El peso debe estar entre 0 y 1');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('La fecha inicial debe ser menor a la final');
      return;
    }

    setCreating(true);
    try {
      await academicApi.createPeriod({
        name,
        weight,
        start_date: startDate,
        end_date: endDate,
        school_year_id: selectedYear,
      });
      toast.success('Periodo creado');
      setDialogOpen(false);
      setNewPeriod({ name: '', weight: '', start_date: '', end_date: '' });
      await loadPeriods(selectedYear);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'No se pudo crear el periodo';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await academicApi.deletePeriod(id);
      toast.success('Periodo eliminado');
      await loadPeriods(selectedYear);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo eliminar el periodo');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold">Periodos Académicos</h1>
            <p className="text-muted-foreground">Gestiona periodos por año escolar</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Selecciona un año" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year._id} value={year._id}>
                    {year.name || year.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!selectedYear}>
                  <Plus className="w-4 h-4 mr-2" /> Nuevo Periodo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear periodo para {selectedYearName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={newPeriod.name}
                      onChange={(e) => setNewPeriod((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Periodo 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso (0 - 1)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={newPeriod.weight}
                      onChange={(e) => setNewPeriod((prev) => ({ ...prev, weight: e.target.value }))}
                      placeholder="0.25"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha inicio</Label>
                      <Input
                        type="date"
                        value={newPeriod.start_date}
                        onChange={(e) => setNewPeriod((prev) => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha fin</Label>
                      <Input
                        type="date"
                        value={newPeriod.end_date}
                        onChange={(e) => setNewPeriod((prev) => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleCreate} disabled={creating}>
                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Crear periodo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{selectedYearName}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingYears || loadingPeriods ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
            ) : periods.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">No hay periodos creados para este año</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {periods.map((period) => (
                  <Card key={period._id} className="border-muted">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold">{period.name || period.title}</h3>
                        <Badge variant="outline">
                          Peso: {typeof period.weight === 'number' ? period.weight : Number(period.weight || 0)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {period.start_date ? new Date(period.start_date).toLocaleDateString() : 'Sin fecha'} - {period.end_date ? new Date(period.end_date).toLocaleDateString() : 'Sin fecha'}
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive px-0">
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar periodo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará el periodo de forma permanente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(period._id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PeriodsPage;
