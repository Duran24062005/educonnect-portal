import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { analyticsApi, type StudentAreaMetric, type StudentPeriodSummary } from '@/api/analytics';
import { useSchoolYears } from '@/hooks/useSchoolYears';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import LightweightCategoryChart from '@/components/charts/LightweightCategoryChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const MyResultsPage = () => {
  const navigate = useNavigate();
  const { data: years = [], isLoading: yearsLoading } = useSchoolYears();
  const activeYear = useMemo(
    () => years.find((year: any) => year?.is_active) || years[0] || null,
    [years]
  );
  const [selectedYearId, setSelectedYearId] = useState('');
  const [periods, setPeriods] = useState<StudentPeriodSummary[]>([]);
  const [areas, setAreas] = useState<StudentAreaMetric[]>([]);
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
        const [periodData, areaData] = await Promise.all([
          analyticsApi.getStudentPeriodSummary(selectedYearId),
          analyticsApi.getStudentAreas(selectedYearId),
        ]);
        setPeriods(periodData);
        setAreas(areaData);
      } catch {
        toast.error('No se pudieron cargar los resultados del estudiante');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [selectedYearId]);

  const isBusy = yearsLoading || loading;

  const periodCategories = periods.map((period) => period.period_name);
  const periodSeries = [
    {
      id: 'student-general-average',
      label: 'Promedio general',
      type: 'area' as const,
      color: '#0f766e',
      values: periods.map((period) => Number(period.general_average)),
    },
    {
      id: 'student-risk-areas',
      label: 'Áreas en riesgo',
      type: 'line' as const,
      color: '#dc2626',
      values: periods.map((period) => Number(period.failed_areas)),
    },
  ];

  const yearCategories = areas[0]?.year_averages.map((item) => item.year) ?? [];
  const yearSeries = areas.slice(0, 3).map((area, index: number) => ({
    id: area.area_id,
    label: area.area_name,
    type: index === 0 ? ('area' as const) : ('line' as const),
    color: ['#2563eb', '#ea580c', '#7c3aed'][index] || '#2563eb',
    values: area.year_averages.map((item) => Number(item.average)),
  }));

  const bestPeriod = useMemo(
    () => [...periods].sort((a, b) => Number(b.general_average) - Number(a.general_average))[0],
    [periods]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Mis Resultados</h1>
            <p className="text-muted-foreground">Evolución por periodo y comparativo anual con datos reales.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={selectedYearId} onValueChange={setSelectedYearId}>
              <SelectTrigger className="w-full sm:w-60">
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
            <Button variant="outline" onClick={() => navigate('/my-bulletins')}>
              Ver boletín del periodo
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {isBusy
            ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)
            : (
              [
                { label: 'Mejor periodo', value: bestPeriod?.period_name || 'N/A' },
                { label: 'Promedio más alto', value: bestPeriod?.general_average?.toFixed?.(1) || 'N/A' },
                { label: 'Último estado', value: periods[periods.length - 1]?.status === 'passed' ? 'Aprobado' : 'En riesgo' },
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
              <CardTitle>Evolución por Periodo</CardTitle>
            </CardHeader>
            <CardContent>
              {isBusy ? (
                <Skeleton className="h-80 w-full" />
              ) : periodCategories.length > 0 ? (
                <LightweightCategoryChart categories={periodCategories} series={periodSeries} height={300} />
              ) : (
                <p className="py-8 text-center text-muted-foreground">No hay periodos consolidados para este año escolar.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparativo por Año</CardTitle>
            </CardHeader>
            <CardContent>
              {isBusy ? (
                <Skeleton className="h-80 w-full" />
              ) : yearCategories.length > 0 ? (
                <LightweightCategoryChart categories={yearCategories} series={yearSeries} height={300} />
              ) : (
                <p className="py-8 text-center text-muted-foreground">Aún no hay histórico anual suficiente para comparar.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resultados por Periodo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Promedio general</TableHead>
                    <TableHead>Áreas aprobadas</TableHead>
                    <TableHead>Áreas en riesgo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isBusy ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    periods.map((period) => (
                      <TableRow key={period.period_id}>
                        <TableCell className="font-medium">{period.period_name}</TableCell>
                        <TableCell>{Number(period.general_average).toFixed(1)}</TableCell>
                        <TableCell>{period.passed_areas}</TableCell>
                        <TableCell>{period.failed_areas}</TableCell>
                        <TableCell>
                          <Badge variant={period.status === 'passed' ? 'default' : 'destructive'}>
                            {period.status === 'passed' ? 'Aprobado' : 'En riesgo'}
                          </Badge>
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

export default MyResultsPage;
