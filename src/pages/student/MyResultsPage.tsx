import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { analyticsApi } from '@/api/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LightweightCategoryChart from '@/components/charts/LightweightCategoryChart';
import { toast } from 'sonner';

const MyResultsPage = () => {
  const [periods, setPeriods] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [periodData, areaData] = await Promise.all([
          analyticsApi.getStudentPeriodSummary(),
          analyticsApi.getStudentAreas(),
        ]);
        setPeriods(periodData);
        setAreas(areaData);
      } catch {
        toast.error('No se pudieron cargar los resultados del estudiante');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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

  const yearCategories = areas[0]?.year_averages.map((item: any) => item.year) ?? [];
  const yearSeries = areas.slice(0, 3).map((area: any, index: number) => ({
    id: area.area_id,
    label: area.area_name,
    type: index === 0 ? ('area' as const) : ('line' as const),
    color: ['#2563eb', '#ea580c', '#7c3aed'][index] || '#2563eb',
    values: area.year_averages.map((item: any) => Number(item.average)),
  }));

  const bestPeriod = useMemo(
    () => [...periods].sort((a, b) => Number(b.general_average) - Number(a.general_average))[0],
    [periods]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Mis Resultados</h1>
          <p className="text-muted-foreground">Evolución por periodo y comparativo anual con datos de prueba.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {loading
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
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <LightweightCategoryChart categories={periodCategories} series={periodSeries} height={300} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparativo por Año</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <LightweightCategoryChart categories={yearCategories} series={yearSeries} height={300} />
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
                  {loading ? (
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
