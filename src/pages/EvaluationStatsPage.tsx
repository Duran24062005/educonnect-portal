import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { academicApi } from '@/api/academic';
import { evaluationsApi } from '@/api/evaluations';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
    setLoading(true);

    evaluationsApi
      .getYearStats(yearId)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setStats(data || null);
      })
      .catch(() => {
        setStats(null);
        toast.error('No se pudieron cargar las estadísticas');
      })
      .finally(() => setLoading(false));
  }, [school_year_id, selectedYear]);

  const onYearChange = (yearId: string) => {
    setSelectedYear(yearId);
    navigate(`/evaluations/stats/${yearId}`);
  };

  const summaryCards = [
    { label: 'Total estudiantes', value: stats?.total_students ?? stats?.students ?? 0 },
    { label: 'Promedio general', value: stats?.general_average ?? stats?.average ?? 0 },
    { label: 'Aprobados', value: stats?.approved_students ?? stats?.approved ?? 0 },
    { label: 'Reprobados', value: stats?.failed_students ?? stats?.failed ?? 0 },
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            ) : Array.isArray(stats?.by_area) && stats.by_area.length > 0 ? (
              <div className="space-y-2">
                {stats.by_area.map((area: any, index: number) => (
                  <div key={`${area.name}-${index}`} className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <p className="font-medium">{area.name || area.area?.name || 'Área'}</p>
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
