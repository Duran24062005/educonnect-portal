import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { usersApi } from '@/api/users';
import { academicApi } from '@/api/academic';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, GraduationCap, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { normalizeRole } from '@/lib/auth';
import LightweightCategoryChart from '@/components/charts/LightweightCategoryChart';
import { analyticsApi } from '@/api/analytics';

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
  const [stats, setStats] = useState<any>(null);
  const [activeYear, setActiveYear] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [institutionOverview, setInstitutionOverview] = useState<any>(null);
  const [institutionTrend, setInstitutionTrend] = useState<any[]>([]);
  const [institutionGrades, setInstitutionGrades] = useState<any[]>([]);
  const [institutionAreas, setInstitutionAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
        Number(roleStats?.student || stats?.students || 0),
        Number(roleStats?.teacher || stats?.teachers || 0),
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
        Number(statusStats?.pending || stats?.pending || 0),
        Number(statusStats?.active || 0),
        Number(statusStats?.inactive || 0),
        Number(statusStats?.blocked || 0),
        Number(statusStats?.egresado || 0),
      ],
    },
  ];
  const institutionalPeriodCategories = institutionTrend.map((period) => period.period_name);
  const institutionalPeriodSeries = [
    {
      id: 'institution-average',
      label: 'Promedio institucional',
      type: 'area' as const,
      color: '#0f766e',
      values: institutionTrend.map((period) => Number(period.average)),
    },
    {
      id: 'institution-failed',
      label: 'Reprobados',
      type: 'line' as const,
      color: '#dc2626',
      values: institutionTrend.map((period) => Number(period.failed)),
    },
  ];
  const gradeCategories = institutionGrades.map((grade) => `Grado ${grade.grade_name}`);
  const gradeSeries = [
    {
      id: 'grade-average',
      label: 'Promedio por grado',
      type: 'histogram' as const,
      color: '#2563eb',
      values: institutionGrades.map((grade) => Number(grade.average)),
    },
  ];
  const areaCategories = institutionAreas.map((area) => area.area_name);
  const areaSeries = [
    {
      id: 'area-average',
      label: 'Promedio por área',
      type: 'line' as const,
      color: '#7c3aed',
      values: institutionAreas.map((area) => Number(area.average)),
    },
  ];

  useEffect(() => {
    const load = async () => {
      const getActiveYearWithFallback = async () => {
        try {
          return await academicApi.getActiveSchoolYear();
        } catch {
          const yearsRes = await academicApi.getSchoolYears();
          const yearsPayload = yearsRes.data?.data ?? yearsRes.data;
          const years = Array.isArray(yearsPayload?.schoolYears)
            ? yearsPayload.schoolYears
            : Array.isArray(yearsPayload)
              ? yearsPayload
              : [];
          const active = years.find((year: any) => year?.is_active) || null;
          return { data: active };
        }
      };

      try {
        const [statsRes, yearRes, pendingRes] = await Promise.allSettled([
          usersApi.getStats(),
          getActiveYearWithFallback(),
          usersApi.getPending(),
        ]);
        if (statsRes.status === 'fulfilled') {
          const statsPayload = statsRes.value.data?.data ?? statsRes.value.data;
          setStats(statsPayload && typeof statsPayload === 'object' ? statsPayload : null);
        }
        let resolvedActiveYear: any = null;
        if (yearRes.status === 'fulfilled') {
          const yearPayload = yearRes.value.data?.data ?? yearRes.value.data;
          resolvedActiveYear = yearPayload && typeof yearPayload === 'object' ? yearPayload : null;
          setActiveYear(resolvedActiveYear);
        }
        if (pendingRes.status === 'fulfilled') {
          const pendingPayload = pendingRes.value.data?.data ?? pendingRes.value.data;
          const pendingList = Array.isArray(pendingPayload?.users)
            ? pendingPayload.users
            : Array.isArray(pendingPayload)
              ? pendingPayload
              : [];
          setPending(pendingList);
        }

        const activeYearId = resolvedActiveYear?._id;
        if (activeYearId) {
          const [overviewRes, trendRes, gradesRes, areasRes] = await Promise.allSettled([
            analyticsApi.getAdminInstitutionOverview(activeYearId),
            analyticsApi.getAdminInstitutionTrend(activeYearId),
            analyticsApi.getAdminByGrade(activeYearId),
            analyticsApi.getAdminByArea(activeYearId),
          ]);

          if (overviewRes.status === 'fulfilled') {
            const payload = overviewRes.value.data?.data ?? overviewRes.value.data;
            setInstitutionOverview(payload?.summary || null);
          }
          if (trendRes.status === 'fulfilled') {
            const payload = trendRes.value.data?.data ?? trendRes.value.data;
            setInstitutionTrend(Array.isArray(payload?.periods) ? payload.periods : []);
          }
          if (gradesRes.status === 'fulfilled') {
            const payload = gradesRes.value.data?.data ?? gradesRes.value.data;
            setInstitutionGrades(Array.isArray(payload?.grades) ? payload.grades : []);
          }
          if (areasRes.status === 'fulfilled') {
            const payload = areasRes.value.data?.data ?? areasRes.value.data;
            setInstitutionAreas(Array.isArray(payload?.areas) ? payload.areas : []);
          }
        } else {
          setInstitutionOverview(null);
          setInstitutionTrend([]);
          setInstitutionGrades([]);
          setInstitutionAreas([]);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de la plataforma</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Usuarios" value={stats?.total || 0} icon={Users} loading={loading} />
        <StatCard title="Estudiantes" value={roleStats?.student || stats?.students || 0} icon={GraduationCap} loading={loading} />
        <StatCard title="Docentes" value={roleStats?.teacher || stats?.teachers || 0} icon={UserCheck} loading={loading} />
        <StatCard title="Pendientes" value={statusStats?.pending || stats?.pending || pending.length || 0} icon={Clock} loading={loading} />
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
                {pending.slice(0, 5).map((u: any) => (
                  <div key={u._id} className="flex items-center justify-between text-sm">
                    <span>{u.email}</span>
                    <Badge variant="secondary">Pendiente</Badge>
                  </div>
                ))}
                {pending.length > 5 && (
                  <p className="text-xs text-muted-foreground">y {pending.length - 5} más...</p>
                )}
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

const TeacherDashboard = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-display font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Bienvenido a tu panel de docente</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis Grupos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Navega a "Mis Grupos" para ver tus grupos asignados.</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

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
