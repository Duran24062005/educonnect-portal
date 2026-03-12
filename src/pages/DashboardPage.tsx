import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, GraduationCap, Calendar, Clock, AlertCircle, BookOpen, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { normalizeRole } from '@/lib/auth';
import LightweightCategoryChart from '@/components/charts/LightweightCategoryChart';
import { useSchoolYears } from '@/hooks/useSchoolYears';
import { useAdminDashboardSummary, useTeacherDashboardSummary } from '@/hooks/useDashboardSummary';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tu carga docente activa</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Asignaciones" value={summary?.summary?.assignment_count || 0} icon={BookOpen} loading={loading} />
        <StatCard title="Grupos" value={summary?.summary?.group_count || 0} icon={Users} loading={loading} />
        <StatCard title="Estudiantes" value={summary?.summary?.student_count || 0} icon={GraduationCap} loading={loading} />
        <StatCard title="Promedio" value={summary?.summary?.average?.toFixed?.(1) || '0.0'} icon={BarChart3} loading={loading} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Año escolar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-6 w-40" />
          ) : activeYear ? (
            <div className="flex items-center gap-2">
              <span className="font-medium">{activeYear.name || activeYear.year}</span>
              <Badge variant="secondary">Activo</Badge>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No hay año escolar activo</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StudentDashboard = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-display font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Bienvenido a tu panel de estudiante</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis Calificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Consulta tus notas en "Mis Calificaciones".</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

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
