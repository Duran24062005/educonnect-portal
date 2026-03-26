import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  UserCheck,
  GraduationCap,
  Calendar,
  Clock,
  AlertCircle,
  BookOpen,
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { normalizeRole } from '@/lib/auth';
import LightweightCategoryChart from '@/components/charts/LightweightCategoryChart';
import { useSchoolYears } from '@/hooks/useSchoolYears';
import { useAdminDashboardSummary, useTeacherDashboardSummary } from '@/hooks/useDashboardSummary';
import { analyticsApi, type StudentAreaMetric, type StudentOverview, type StudentPeriodSummary, type TeacherPerformanceLevel } from '@/api/analytics';
import { activitiesApi, type Activity } from '@/api/activities';
import { notificationsApi, type NotificationItem } from '@/api/notifications';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  loading,
}: {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  loading: boolean;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="w-4 h-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <>
          <p className="text-2xl font-display font-bold">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </>
      )}
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const { data: years = [], isLoading: yearsLoading } = useSchoolYears();
  const activeYear = useMemo(
    () => years.find((year: any) => year?.is_active) || years[0] || null,
    [years]
  );
  const activeYearId = activeYear?._id;
  const { data: summary, isLoading: summaryLoading } = useAdminDashboardSummary(activeYearId);
  const loading = yearsLoading || (Boolean(activeYearId) && summaryLoading);

  const stats = summary?.stats || {};
  const pending = summary?.pending?.users || [];
  const institutionOverview = summary?.institution_overview || null;
  const institutionTrend = Array.isArray(summary?.institution_trend) ? summary.institution_trend : [];
  const institutionGrades = Array.isArray(summary?.institution_grades) ? summary.institution_grades : [];
  const institutionAreas = Array.isArray(summary?.institution_areas) ? summary.institution_areas : [];
  const roleStats = stats?.by_role || {};
  const statusStats = stats?.by_status || {};

  const roleCategories = ['Students', 'Teachers', 'Admins', 'Parents'];
  const roleSeries = [
    {
      id: 'roles',
      label: 'Usuarios por rol',
      type: 'area' as const,
      color: '#0f766e',
      values: [
        Number(roleStats?.student || 0),
        Number(roleStats?.teacher || 0),
        Number(roleStats?.admin || 0),
        Number(roleStats?.parent || roleStats?.guardian || 0),
      ],
    },
  ];

  const statusCategories = ['Pending', 'Active', 'Inactive', 'Blocked', 'Egresado'];
  const statusSeries = [
    {
      id: 'status',
      label: 'Usuarios por estado',
      type: 'histogram' as const,
      color: '#2563eb',
      values: [
        Number(statusStats?.pending || pending.length || 0),
        Number(statusStats?.active || 0),
        Number(statusStats?.inactive || 0),
        Number(statusStats?.blocked || 0),
        Number(statusStats?.egresado || 0),
      ],
    },
  ];

  const institutionalPeriodCategories = institutionTrend.map((period: any) => period.period_name);
  const institutionalPeriodSeries = [
    {
      id: 'institution-average',
      label: 'Promedio institucional',
      type: 'area' as const,
      color: '#0f766e',
      values: institutionTrend.map((period: any) => Number(period.average)),
    },
    {
      id: 'institution-failed',
      label: 'Reprobados',
      type: 'line' as const,
      color: '#dc2626',
      values: institutionTrend.map((period: any) => Number(period.failed)),
    },
  ];

  const gradeCategories = institutionGrades.map((grade: any) => `Grado ${grade.grade_name}`);
  const gradeSeries = [
    {
      id: 'grade-average',
      label: 'Promedio por grado',
      type: 'histogram' as const,
      color: '#2563eb',
      values: institutionGrades.map((grade: any) => Number(grade.average)),
    },
  ];

  const areaCategories = institutionAreas.map((area: any) => area.area_name);
  const areaSeries = [
    {
      id: 'area-average',
      label: 'Promedio por área',
      type: 'line' as const,
      color: '#7c3aed',
      values: institutionAreas.map((area: any) => Number(area.average)),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de la plataforma</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Usuarios" value={stats?.total || 0} icon={Users} loading={loading} />
        <StatCard title="Estudiantes" value={roleStats?.student || 0} icon={GraduationCap} loading={loading} />
        <StatCard title="Docentes" value={roleStats?.teacher || 0} icon={UserCheck} loading={loading} />
        <StatCard title="Pendientes" value={statusStats?.pending || pending.length || 0} icon={Clock} loading={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4" />
              Año Escolar Activo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-40" />
            ) : activeYear ? (
              <div className="space-y-2">
                <p className="text-lg font-semibold">{activeYear.name || activeYear.year}</p>
                <Badge variant="default">Activo</Badge>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No hay año escolar activo</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por Rol</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <LightweightCategoryChart categories={roleCategories} series={roleSeries} height={260} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estados de Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <LightweightCategoryChart categories={statusCategories} series={statusSeries} height={260} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="w-4 h-4" />
              Usuarios Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : pending.length > 0 ? (
              <div className="space-y-2">
                {pending.map((user: any) => (
                  <div key={user._id} className="flex items-center justify-between text-sm">
                    <span>{user.email}</span>
                    <Badge variant="secondary">Pendiente</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No hay usuarios pendientes</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)
          : (
            [
              { label: 'Estudiantes institución', value: institutionOverview?.student_count ?? 0 },
              { label: 'Promedio institucional', value: institutionOverview?.general_average ?? 0 },
              { label: 'Repitencia estimada', value: institutionOverview?.repeating ?? 0 },
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
            <CardTitle className="text-base">Tendencia Institucional</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <LightweightCategoryChart categories={institutionalPeriodCategories} series={institutionalPeriodSeries} height={300} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparativo por Grado</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <LightweightCategoryChart categories={gradeCategories} series={gradeSeries} height={300} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Promedio General por Área</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <LightweightCategoryChart categories={areaCategories} series={areaSeries} height={280} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const TeacherDashboard = () => {
  const { data: years = [], isLoading: yearsLoading } = useSchoolYears();
  const activeYear = useMemo(
    () => years.find((year: any) => year?.is_active) || years[0] || null,
    [years]
  );
  const { data: summary, isLoading: summaryLoading } = useTeacherDashboardSummary(activeYear?._id);
  const loading = yearsLoading || (Boolean(activeYear?._id) && summaryLoading);
  const performanceLevels = summary?.summary?.performance_levels ?? {
    SUPERIOR: 0,
    ALTO: 0,
    BÁSICO: 0,
    BAJO: 0,
  };
  const periodTrend = summary?.period_trend ?? [];
  const topGroups = summary?.top_groups ?? [];
  const attentionStudents = summary?.attention_students ?? [];
  const highlightStudents = summary?.highlight_students ?? [];

  const levelCategories = ['Superior', 'Alto', 'Básico', 'Bajo'];
  const levelSeries = [
    {
      id: 'teacher-performance-levels',
      label: 'Estudiantes por nivel',
      type: 'histogram' as const,
      color: '#2563eb',
      values: [
        performanceLevels.SUPERIOR,
        performanceLevels.ALTO,
        performanceLevels.BÁSICO,
        performanceLevels.BAJO,
      ],
    },
  ];

  const trendCategories = periodTrend.map((period) => period.period_name);
  const trendSeries = [
    {
      id: 'teacher-period-average',
      label: 'Promedio docente',
      type: 'area' as const,
      color: '#0f766e',
      values: periodTrend.map((period) => Number(period.average)),
    },
    {
      id: 'teacher-period-risk',
      label: 'En riesgo',
      type: 'line' as const,
      color: '#dc2626',
      values: periodTrend.map((period) => Number(period.failed)),
    },
  ];

  const groupCategories = topGroups.map((group) => `${group.group_name} · ${group.area_name}`);
  const groupSeries = [
    {
      id: 'teacher-groups-average',
      label: 'Promedio por grupo',
      type: 'histogram' as const,
      color: '#7c3aed',
      values: topGroups.map((group) => Number(group.average)),
    },
  ];

  const getLevelBadge = (level?: TeacherPerformanceLevel) => {
    if (level === 'SUPERIOR') return 'default' as const;
    if (level === 'ALTO') return 'secondary' as const;
    if (level === 'BÁSICO') return 'outline' as const;
    return 'destructive' as const;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(8,145,178,0.16),rgba(255,255,255,0.94)_46%,rgba(59,130,246,0.14))] p-6 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(6,182,212,0.18),rgba(15,23,42,0.2)_42%,rgba(37,99,235,0.18))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Panel docente</p>
            <h1 className="mt-3 text-3xl font-display font-extrabold tracking-tight">Panorama de desempeño de tus estudiantes</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Visualiza niveles de desempeño, evolución por periodo y grupos que requieren atención sin salir de tu portada.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-2xl" />)
            ) : (
              [
                { label: 'Tasa de aprobación', value: `${summary?.summary?.approval_rate?.toFixed?.(1) || '0.0'}%` },
                { label: 'Nivel superior', value: performanceLevels.SUPERIOR },
                { label: 'En riesgo', value: summary?.summary?.failed ?? 0 },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 bg-background/75 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/35">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-display font-bold text-foreground dark:text-white">{item.value}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Asignaciones" value={summary?.summary?.assignment_count || 0} icon={BookOpen} loading={loading} />
        <StatCard title="Grupos" value={summary?.summary?.group_count || 0} icon={Users} loading={loading} />
        <StatCard title="Estudiantes" value={summary?.summary?.student_count || 0} icon={GraduationCap} loading={loading} />
        <StatCard title="Promedio" value={summary?.summary?.average?.toFixed?.(1) || '0.0'} icon={BarChart3} loading={loading} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Distribución por nivel de desempeño</CardTitle>
            <p className="text-sm text-muted-foreground">Conteo consolidado de estudiantes del docente por nivel académico.</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <LightweightCategoryChart categories={levelCategories} series={levelSeries} height={300} />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Año escolar y estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="h-36 w-full" />
            ) : activeYear ? (
              <>
                <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Año escolar</p>
                  <p className="mt-2 text-2xl font-display font-bold">{activeYear.name || activeYear.year}</p>
                  <Badge variant="secondary" className="mt-3">Activo</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Aprobados</p>
                    <p className="mt-1 text-xl font-display font-bold">{summary?.summary?.passed ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">En riesgo</p>
                    <p className="mt-1 text-xl font-display font-bold">{summary?.summary?.failed ?? 0}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No hay año escolar activo</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Tendencia agregada por periodo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : trendCategories.length > 0 ? (
              <LightweightCategoryChart categories={trendCategories} series={trendSeries} height={300} />
            ) : (
              <p className="py-8 text-center text-muted-foreground">No hay periodos con resultados consolidados todavía.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4" />
              Comparativo por grupo y área
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : groupCategories.length > 0 ? (
              <LightweightCategoryChart categories={groupCategories} series={groupSeries} height={300} />
            ) : (
              <p className="py-8 text-center text-muted-foreground">Todavía no hay grupos con métricas consolidadas.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Ranking de grupos</CardTitle>
            <p className="text-sm text-muted-foreground">Ordenados por promedio general dentro de tu carga docente.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20 w-full rounded-2xl" />)
            ) : topGroups.length > 0 ? (
              topGroups.map((group) => (
                <div key={`${group.group_id}-${group.area_id}`} className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{group.position}. {group.group_name} · {group.area_name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Grado {group.grade_name} · {group.student_count} estudiantes · {group.failed} en riesgo
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Promedio</p>
                    <p className="text-2xl font-display font-bold">{group.average.toFixed(1)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-muted-foreground">No hay grupos para comparar en este momento.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Estudiantes que requieren atención</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 w-full rounded-xl" />)
              ) : attentionStudents.length > 0 ? (
                attentionStudents.map((student) => (
                  <div key={student.student_id} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{student.student_name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {student.assignments[0]?.group_name} · {student.assignments[0]?.area_name}
                        </p>
                      </div>
                      <Badge variant={getLevelBadge(student.performance_level)}>{student.performance_level}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Promedio: {student.average.toFixed(1)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay estudiantes en riesgo dentro del corte actual.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Mejor desempeño</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 w-full rounded-xl" />)
              ) : highlightStudents.length > 0 ? (
                highlightStudents.map((student) => (
                  <div key={student.student_id} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{student.student_name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {student.assignments[0]?.group_name} · {student.assignments[0]?.area_name}
                        </p>
                      </div>
                      <Badge variant={getLevelBadge(student.performance_level)}>{student.performance_level}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Promedio: {student.average.toFixed(1)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Todavía no hay estudiantes destacados para mostrar.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const formatShortDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const getStudentActivityTone = (status?: string) => {
  if (status === 'graded') return { label: 'Calificada', variant: 'default' as const, icon: CheckCircle2 };
  if (status === 'submitted') return { label: 'Entregada', variant: 'secondary' as const, icon: CheckCircle2 };
  if (status === 'late') return { label: 'Vencida', variant: 'destructive' as const, icon: AlertTriangle };
  if (status === 'upcoming') return { label: 'Programada', variant: 'outline' as const, icon: Clock };
  return { label: 'Pendiente', variant: 'outline' as const, icon: AlertCircle };
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { data: years = [], isLoading: yearsLoading } = useSchoolYears();
  const activeYear = useMemo(
    () => years.find((year: any) => year?.is_active) || years[0] || null,
    [years]
  );
  const [selectedYearId, setSelectedYearId] = useState('');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [areas, setAreas] = useState<StudentAreaMetric[]>([]);
  const [periods, setPeriods] = useState<StudentPeriodSummary[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

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
        const [overviewData, areaData, periodData, activityData, notificationData] = await Promise.all([
          analyticsApi.getStudentOverview(selectedYearId),
          analyticsApi.getStudentAreas(selectedYearId),
          analyticsApi.getStudentPeriodSummary(selectedYearId),
          activitiesApi.getStudentActivities(),
          notificationsApi.list({ limit: 5 }),
        ]);

        setOverview(overviewData);
        setAreas(areaData);
        setPeriods(periodData);
        setActivities(activityData.activities);
        setNotifications(notificationData.notifications);
      } catch {
        setOverview(null);
        setAreas([]);
        setPeriods([]);
        setActivities([]);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [selectedYearId]);

  const isBusy = yearsLoading || loading;

  const pendingActivities = activities.filter((activity) => activity.student_state === 'pending' || activity.student_state === 'late');
  const gradedActivities = activities.filter((activity) => activity.student_state === 'graded');
  const nextActivities = [...activities]
    .filter((activity) => activity.due_at)
    .sort((a, b) => new Date(a.due_at || 0).getTime() - new Date(b.due_at || 0).getTime())
    .slice(0, 4);
  const highlightedAreas = [...areas]
    .sort((a, b) => a.final_average - b.final_average)
    .slice(0, 3);
  const bestAreas = [...areas]
    .sort((a, b) => b.final_average - a.final_average)
    .slice(0, 3);
  const latestPeriod = periods[periods.length - 1] || null;

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

  const topAreaCategories = bestAreas.map((area) => area.area_name);
  const topAreaSeries = [
    {
      id: 'top-areas',
      label: 'Promedio final',
      type: 'histogram' as const,
      color: '#2563eb',
      values: bestAreas.map((area) => Number(area.final_average)),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(255,255,255,0.92)_44%,rgba(16,185,129,0.12))] p-6 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(14,165,233,0.22),rgba(15,23,42,0.15)_40%,rgba(16,185,129,0.15))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300">Panel del estudiante</p>
            <h1 className="mt-3 text-3xl font-display font-extrabold tracking-tight">Tu jornada académica en un solo lugar</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Revisa alertas, actividades próximas, evolución por periodo y accesos rápidos sin tener que navegar por varias pantallas.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {isBusy ? (
              Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-2xl" />)
            ) : (
              [
                { label: 'Promedio general', value: overview?.general_average?.toFixed?.(1) || '0.0' },
                { label: 'Actividades pendientes', value: pendingActivities.length },
                { label: 'Notificaciones nuevas', value: notifications.filter((item) => !item.is_read).length },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 bg-background/75 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/35">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-display font-bold text-foreground dark:text-white">{item.value}</p>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Select value={selectedYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger className="w-full max-w-xs bg-background/85">
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Áreas aprobadas" value={overview?.passed_areas ?? 0} icon={GraduationCap} loading={isBusy} />
        <StatCard title="Áreas en riesgo" value={overview?.failed_areas ?? 0} icon={AlertCircle} loading={isBusy} />
        <StatCard title="Actividades por entregar" value={pendingActivities.length} icon={ClipboardList} loading={isBusy} />
        <StatCard title="Actividades calificadas" value={gradedActivities.length} icon={CheckCircle2} loading={isBusy} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Próximas actividades</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Tareas y entregas que vale la pena vigilar hoy.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/my-activities')}>
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isBusy ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-2xl" />)
            ) : nextActivities.length > 0 ? (
              nextActivities.map((activity) => {
                const tone = getStudentActivityTone(activity.student_state);
                const ToneIcon = tone.icon;
                return (
                  <button
                    key={activity._id}
                    type="button"
                    onClick={() => navigate(`/my-activities/${activity._id}`)}
                    className="flex w-full items-start justify-between gap-4 rounded-2xl border border-border/60 bg-muted/25 p-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <ToneIcon className="h-4 w-4 text-primary" />
                        <p className="font-semibold">{activity.title}</p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activity.area?.name || 'Materia'} · {activity.period?.name || 'Sin periodo'}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Vence: {formatShortDate(activity.due_at)}
                      </p>
                    </div>
                    <Badge variant={tone.variant}>{tone.label}</Badge>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No hay actividades próximas por mostrar.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                Notificaciones recientes
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Avisos de actividades y mensajes importantes.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
              Abrir centro
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isBusy ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20 w-full rounded-2xl" />)
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => navigate('/notifications')}
                  className="block w-full rounded-2xl border border-border/60 bg-card/70 p-4 text-left transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{notification.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                    {!notification.is_read && <Badge variant="secondary">Nueva</Badge>}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{formatShortDate(notification.created_at)}</p>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No tienes notificaciones recientes.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Evolución por periodo</CardTitle>
            <p className="text-sm text-muted-foreground">Seguimiento rápido de promedio general y áreas en riesgo.</p>
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

        <div className="grid gap-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Áreas destacadas</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Tus mejores promedios finales.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/my-grades')}>
                Ver calificaciones
              </Button>
            </CardHeader>
            <CardContent>
              {isBusy ? (
                <Skeleton className="h-52 w-full" />
              ) : bestAreas.length > 0 ? (
                <LightweightCategoryChart categories={topAreaCategories} series={topAreaSeries} height={200} />
              ) : (
                <p className="text-sm text-muted-foreground">Todavía no hay áreas consolidadas.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Tu foco esta semana</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isBusy ? (
                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-14 w-full rounded-xl" />)
              ) : highlightedAreas.length > 0 ? (
                highlightedAreas.map((area) => (
                  <div key={area.area_id} className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                    <div>
                      <p className="font-medium">{area.area_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {area.status === 'failed' ? 'Conviene reforzar esta área pronto.' : 'Mantén este rendimiento estable.'}
                      </p>
                    </div>
                    <Badge variant={area.status === 'passed' ? 'default' : 'destructive'}>
                      {area.final_average.toFixed(1)}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay áreas por destacar en este momento.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Accesos rápidos</CardTitle>
            <p className="text-sm text-muted-foreground">Atajos para lo que más suele necesitar un estudiante.</p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {[
              {
                title: 'Mis actividades',
                description: 'Entrega tareas y revisa fechas límite.',
                icon: FileText,
                action: () => navigate('/my-activities'),
              },
              {
                title: 'Mis calificaciones',
                description: 'Consulta notas por materia y tendencia.',
                icon: ClipboardList,
                action: () => navigate('/my-grades'),
              },
              {
                title: 'Mis boletines',
                description: 'Abre y descarga el boletín del periodo.',
                icon: BookOpen,
                action: () => navigate('/my-bulletins'),
              },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.action}
                className="rounded-2xl border border-border/60 bg-[linear-gradient(180deg,rgba(37,99,235,0.1),rgba(255,255,255,0.5))] p-4 text-left transition-colors hover:bg-accent/40 dark:bg-[linear-gradient(180deg,rgba(37,99,235,0.08),transparent)]"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <p className="mt-4 font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Resumen del último periodo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isBusy ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full rounded-xl" />)
            ) : latestPeriod ? (
              <>
                <div className="rounded-xl bg-muted/35 px-4 py-3 dark:bg-muted/25">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Periodo</p>
                  <p className="mt-1 font-semibold">{latestPeriod.period_name}</p>
                </div>
                <div className="rounded-xl bg-muted/35 px-4 py-3 dark:bg-muted/25">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Promedio general</p>
                  <p className="mt-1 font-semibold">{Number(latestPeriod.general_average).toFixed(1)}</p>
                </div>
                <div className="rounded-xl bg-muted/35 px-4 py-3 dark:bg-muted/25">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Áreas aprobadas</p>
                  <p className="mt-1 font-semibold">{latestPeriod.passed_areas}</p>
                </div>
                <div className="rounded-xl bg-muted/35 px-4 py-3 dark:bg-muted/25">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Áreas en riesgo</p>
                  <p className="mt-1 font-semibold">{latestPeriod.failed_areas}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aún no hay periodos consolidados para mostrar.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const PendingDashboard = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Card className="max-w-md w-full text-center">
      <CardContent className="pt-8 pb-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-warning" />
        </div>
        <h2 className="text-xl font-display font-bold">Cuenta pendiente de aprobación</h2>
        <p className="text-muted-foreground">
          Tu cuenta ha sido registrada correctamente. Un administrador revisará y aprobará tu solicitud pronto.
        </p>
      </CardContent>
    </Card>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuthStore();

  const renderDashboard = () => {
    if (user?.status === 'pending') return <PendingDashboard />;
    switch (normalizeRole(user?.role)) {
      case 'admin':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return <PendingDashboard />;
    }
  };

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>;
};

export default DashboardPage;
