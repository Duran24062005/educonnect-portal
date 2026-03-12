import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activitiesApi, type Activity, type StudentActivityState } from '@/api/activities';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const formatDateTime = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const getStateBadge = (status?: string) => {
  if (status === 'graded') return { label: 'Calificada', variant: 'default' as const };
  if (status === 'submitted') return { label: 'Entregada', variant: 'secondary' as const };
  if (status === 'late') return { label: 'Vencida', variant: 'destructive' as const };
  if (status === 'upcoming') return { label: 'Programada', variant: 'outline' as const };
  return { label: 'Pendiente', variant: 'outline' as const };
};

const STATUS_OPTIONS: Array<{ value: 'all' | StudentActivityState; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'upcoming', label: 'Programadas' },
  { value: 'submitted', label: 'Entregadas' },
  { value: 'graded', label: 'Calificadas' },
  { value: 'late', label: 'Vencidas' },
];

const MyActivitiesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | StudentActivityState>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await activitiesApi.getStudentActivities();
        setActivities(result.activities);
      } catch {
        toast.error('No se pudieron cargar tus actividades');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const areaOptions = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach((activity) => {
      if (activity.area?._id && activity.area.name) {
        map.set(activity.area._id, activity.area.name);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [activities]);

  const periodOptions = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach((activity) => {
      if (activity.period?._id && activity.period.name) {
        map.set(activity.period._id, activity.period.name);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [activities]);

  const filteredActivities = useMemo(
    () => activities.filter((activity) => {
      if (selectedArea !== 'all' && activity.area?._id !== selectedArea) return false;
      if (selectedPeriod !== 'all' && activity.period?._id !== selectedPeriod) return false;
      if (selectedStatus !== 'all' && activity.student_state !== selectedStatus) return false;
      return true;
    }),
    [activities, selectedArea, selectedPeriod, selectedStatus]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Mis Actividades</h1>
          <p className="text-muted-foreground">Consulta actividades por materia, revisa su estado y entra al detalle para entregar tu archivo.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Materia</p>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las materias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {areaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Periodo</p>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los periodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Estado</p>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as 'all' | StudentActivityState)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-56 w-full" />)
          ) : filteredActivities.length === 0 ? (
            <Card className="lg:col-span-2">
              <CardContent className="py-12 text-center text-muted-foreground">
                No hay actividades que coincidan con los filtros seleccionados.
              </CardContent>
            </Card>
          ) : (
            filteredActivities.map((activity) => {
              const badge = getStateBadge(activity.student_state);
              return (
                <Card key={activity._id} className="border-border/60">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{activity.title}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activity.group?.name || 'Grupo'} · {activity.area?.name || 'Materia'} · {activity.period?.name || 'Sin periodo'}
                        </p>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="line-clamp-3 text-sm text-muted-foreground">{activity.description || activity.context}</p>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">Disponible</p>
                        <p className="mt-1 font-semibold">{formatDateTime(activity.open_at)}</p>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">Vence</p>
                        <p className="mt-1 font-semibold">{formatDateTime(activity.due_at)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {activity.allowed_extensions.map((extension) => (
                        <Badge key={extension} variant="outline" className="uppercase">{extension}</Badge>
                      ))}
                    </div>

                    <Button onClick={() => navigate(`/my-activities/${activity._id}`)}>
                      Ver detalle
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyActivitiesPage;
