import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { analyticsApi, type StudentAreaMetric, type StudentOverview } from '@/api/analytics';
import { useSchoolYears } from '@/hooks/useSchoolYears';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LightweightCategoryChart from '@/components/charts/LightweightCategoryChart';
import { toast } from 'sonner';

const MyGradesPage = () => {
  const { data: years = [], isLoading: yearsLoading } = useSchoolYears();
  const activeYear = useMemo(
    () => years.find((year: any) => year?.is_active) || years[0] || null,
    [years]
  );
  const [selectedYearId, setSelectedYearId] = useState('');
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [areas, setAreas] = useState<StudentAreaMetric[]>([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeYear?._id && !selectedYearId) {
      setSelectedYearId(activeYear._id);
    }
  }, [activeYear?._id, selectedYearId]);

  useEffect(() => {
    const load = async () => {
      if (!selectedYearId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [overviewData, areaData] = await Promise.all([
          analyticsApi.getStudentOverview(selectedYearId),
          analyticsApi.getStudentAreas(selectedYearId),
        ]);
        setOverview(overviewData);
        setAreas(areaData);
        if (areaData[0]?.area_id) setSelectedArea(areaData[0].area_id);
      } catch {
        toast.error('No se pudieron cargar las métricas del estudiante');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [selectedYearId]);

  const isBusy = yearsLoading || loading;

  const activeArea = useMemo(
    () => areas.find((area) => area.area_id === selectedArea) ?? areas[0] ?? null,
    [areas, selectedArea]
  );

  const areaCategories = areas.map((area) => area.area_name);
  const areaSeries = [
    {
      id: 'final-areas',
      label: 'Promedio final',
      type: 'area' as const,
      color: '#0f766e',
      values: areas.map((area) => area.final_average),
    },
  ];

  const periodCategories = activeArea?.periods.map((period) => period.period_name) ?? [];
  const periodSeries = activeArea
    ? [
        {
          id: 'period-trend',
          label: `${activeArea.area_name} por periodo`,
          type: 'line' as const,
          color: '#2563eb',
          values: activeArea.periods.map((period) => period.average),
        },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Mis Métricas Académicas</h1>
          <p className="text-muted-foreground">Seguimiento por materia, periodo y año escolar con resultados reales.</p>
        </div>

        <div className="flex justify-end">
          <Select value={selectedYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Selecciona año escolar" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year: any) => (
                <SelectItem key={year._id} value={year._id}>
                  {year.name || year.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isBusy
            ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 w-full" />)
            : (
              [
                { label: 'Promedio general', value: overview?.general_average ?? 0 },
                { label: 'Áreas aprobadas', value: overview?.passed_areas ?? 0 },
                { label: 'Áreas en riesgo', value: overview?.failed_areas ?? 0 },
                { label: 'Estado final', value: overview?.final_status === 'passed' ? 'Aprobado' : 'En riesgo' },
              ].map((item) => (
                <Card key={item.label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-display font-bold">{item.value}</p>
                  </CardContent>
                </Card>
              ))
            )}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Promedio Final por Materia</CardTitle>
            </CardHeader>
            <CardContent>
              {isBusy ? (
                <Skeleton className="h-80 w-full" />
              ) : areas.length > 0 ? (
                <LightweightCategoryChart categories={areaCategories} series={areaSeries} height={300} />
              ) : (
                <p className="py-8 text-center text-muted-foreground">No hay áreas consolidadas para este año escolar.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Evolución por Periodo</CardTitle>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Selecciona materia" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.area_id} value={area.area_id}>
                      {area.area_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {isBusy || !activeArea ? (
                <Skeleton className="h-80 w-full" />
              ) : periodCategories.length > 0 ? (
                <LightweightCategoryChart categories={periodCategories} series={periodSeries} height={300} />
              ) : (
                <p className="py-8 text-center text-muted-foreground">No hay periodos consolidados para esta área.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalle por Materia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Materia</TableHead>
                    <TableHead>Promedio final</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Mejor año</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isBusy ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    areas.map((area) => {
                      const bestYear = [...area.year_averages].sort((a, b) => b.average - a.average)[0];
                      return (
                        <TableRow key={area.area_id}>
                          <TableCell className="font-medium">{area.area_name}</TableCell>
                          <TableCell>{area.final_average.toFixed(1)}</TableCell>
                          <TableCell>
                            <Badge variant={area.status === 'passed' ? 'default' : 'destructive'}>
                              {area.status === 'passed' ? 'Aprobado' : 'En riesgo'}
                            </Badge>
                          </TableCell>
                          <TableCell>{bestYear?.year || 'N/A'}</TableCell>
                        </TableRow>
                      );
                    })
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

export default MyGradesPage;
