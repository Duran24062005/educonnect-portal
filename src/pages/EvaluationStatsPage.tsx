import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { academicApi } from '@/api/academic';
import { analyticsApi } from '@/api/analytics';
import { evaluationsApi } from '@/api/evaluations';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { isValidObjectId } from '@/lib/object-id';
import LightweightCategoryChart from '@/components/charts/LightweightCategoryChart';

const toArray = (res: any, key?: string) => {
  const data = res?.data?.data ?? res?.data;
  if (key && Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.schoolYears)) return data.schoolYears;
  return [];
};

const EvaluationStatsPage = () => {
  const { school_year_id } = useParams<{ school_year_id: string }>();
  const navigate = useNavigate();
  const [years, setYears] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);
  const [areaStats, setAreaStats] = useState<any[]>([]);
  const [gradeStats, setGradeStats] = useState<any[]>([]);
  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(school_year_id || '');

  useEffect(() => {
    const loadYears = async () => {
      try {
        const res = await academicApi.getSchoolYears();
        const loadedYears = toArray(res, 'schoolYears');
        setYears(loadedYears);

        const active = loadedYears.find((year: any) => year?.is_active);
        if (!selectedYear && active?._id) setSelectedYear(active._id);
        if (!selectedYear && loadedYears[0]?._id) setSelectedYear(loadedYears[0]._id);
      } catch {
        toast.error('No se pudieron cargar los años escolares');
      }
    };

    loadYears();
  }, []);

  useEffect(() => {
    const yearId = school_year_id || selectedYear;
    if (!yearId) return;
    if (!isValidObjectId(yearId)) {
      setStats(null);
      setLoading(false);
      toast.error('ID de año escolar inválido');
      return;
    }
    setLoading(true);

    Promise.allSettled([
      evaluationsApi.getYearStats(yearId),
      analyticsApi.getAdminInstitutionOverview(yearId),
      analyticsApi.getAdminInstitutionTrend(yearId),
      analyticsApi.getAdminByArea(yearId),
      analyticsApi.getAdminByGrade(yearId),
    ])
      .then(([statsRes, overviewRes, trendRes, areaRes, gradeRes]) => {
        if (statsRes.status === 'fulfilled') {
          const data = statsRes.value.data?.data ?? statsRes.value.data;
          setStats(data || null);
        } else {
          setStats(null);
        }

        if (overviewRes.status === 'fulfilled') {
          const data = overviewRes.value.data?.data ?? overviewRes.value.data;
          setAnalyticsSummary(data?.summary || null);
        } else {
          setAnalyticsSummary(null);
        }

        if (trendRes.status === 'fulfilled') {
          const data = trendRes.value.data?.data ?? trendRes.value.data;
          setTrendStats(Array.isArray(data?.periods) ? data.periods : []);
        } else {
          setTrendStats([]);
        }

        if (areaRes.status === 'fulfilled') {
          const data = areaRes.value.data?.data ?? areaRes.value.data;
          setAreaStats(Array.isArray(data?.areas) ? data.areas : []);
        } else {
          setAreaStats([]);
        }

        if (gradeRes.status === 'fulfilled') {
          const data = gradeRes.value.data?.data ?? gradeRes.value.data;
          setGradeStats(Array.isArray(data?.grades) ? data.grades : []);
        } else {
          setGradeStats([]);
        }
      })
      .catch(() => {
        setStats(null);
        setAnalyticsSummary(null);
        setTrendStats([]);
        setAreaStats([]);
        setGradeStats([]);
        toast.error('No se pudieron cargar las estadísticas');
      })
      .finally(() => setLoading(false));
  }, [school_year_id, selectedYear]);

  const onYearChange = (yearId: string) => {
    setSelectedYear(yearId);
    navigate(`/evaluations/stats/${yearId}`);
  };

  const summaryCards = [
    { label: 'Total estudiantes', value: analyticsSummary?.student_count ?? stats?.total ?? 0 },
    { label: 'Promedio general', value: analyticsSummary?.general_average ?? 0 },
    { label: 'Aprobados', value: analyticsSummary?.passed ?? stats?.passed ?? 0 },
    { label: 'Reprobados', value: analyticsSummary?.failed ?? stats?.failed ?? 0 },
    { label: 'Repitentes', value: analyticsSummary?.repeating ?? stats?.repeating ?? 0 },
  ];

  const areaCategories = areaStats.map((area: any, index: number) => area.area_name || area.name || `Área ${index + 1}`);
  const trendCategories = trendStats.map((period: any, index: number) => period.period_name || `Periodo ${index + 1}`);
  const gradeCategories = gradeStats.map((grade: any, index: number) => grade.grade_name || `Grado ${index + 1}`);

  const averageSeries = [
    {
      id: 'average',
      label: 'Promedio por área',
      type: 'area' as const,
      color: '#0f766e',
      values: areaStats.map((area: any) => Number(area.average ?? area.avg ?? 0)),
    },
  ];

  const outcomeSeries = [
    {
      id: 'approved',
      label: 'Aprobados',
      type: 'histogram' as const,
      color: '#2563eb',
      values: areaStats.map((area: any) => Number(area.passed ?? area.approved ?? 0)),
    },
    {
      id: 'failed',
      label: 'Reprobados',
      type: 'line' as const,
      color: '#dc2626',
      values: areaStats.map((area: any) => Number(area.failed ?? 0)),
    },
  ];

  const trendSeries = [
    {
      id: 'institution-average',
      label: 'Promedio institucional',
      type: 'line' as const,
      color: '#7c3aed',
      values: trendStats.map((period: any) => Number(period.average ?? 0)),
    },
  ];

  const gradeSeries = [
    {
      id: 'grade-average',
      label: 'Promedio por grado',
      type: 'histogram' as const,
      color: '#ea580c',
      values: gradeStats.map((grade: any) => Number(grade.average ?? 0)),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold">Estadísticas Anuales</h1>
            <p className="text-muted-foreground">Resumen académico por año escolar</p>
          </div>
          <Select value={school_year_id || selectedYear} onValueChange={onYearChange}>
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-2xl font-display font-bold">{card.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia Institucional por Periodo</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : trendCategories.length > 0 ? (
                <LightweightCategoryChart categories={trendCategories} series={trendSeries} height={300} />
              ) : (
                <p className="text-muted-foreground py-8 text-center">No hay datos por periodo para este año</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparativo por Grado</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : gradeCategories.length > 0 ? (
                <LightweightCategoryChart categories={gradeCategories} series={gradeSeries} height={300} />
              ) : (
                <p className="text-muted-foreground py-8 text-center">No hay datos por grado para este año</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Promedios</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : areaCategories.length > 0 ? (
                <LightweightCategoryChart categories={areaCategories} series={averageSeries} height={300} />
              ) : (
                <p className="text-muted-foreground py-8 text-center">No hay datos para graficar promedios</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Desempeño por Área</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : areaCategories.length > 0 ? (
                <LightweightCategoryChart categories={areaCategories} series={outcomeSeries} height={300} />
              ) : (
                <p className="text-muted-foreground py-8 text-center">No hay datos para graficar aprobados y reprobados</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalle por área</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : areaStats.length > 0 ? (
              <div className="space-y-2">
                {areaStats.map((area: any, index: number) => (
                  <div key={`${area.area_name || area.name}-${index}`} className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <p className="font-medium">{area.area_name || area.name || 'Área'}</p>
                      <p className="text-sm text-muted-foreground">Promedio: {area.average ?? area.avg ?? 0}</p>
                    </div>
                    <Badge variant="outline">{area.passed ?? area.approved ?? 0} aprobados</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">No hay estadísticas detalladas para este año</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EvaluationStatsPage;
