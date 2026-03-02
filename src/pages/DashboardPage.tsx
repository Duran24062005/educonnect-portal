import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { usersApi } from '@/api/users';
import { academicApi } from '@/api/academic';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, GraduationCap, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, yearRes, pendingRes] = await Promise.allSettled([
          usersApi.getStats(),
          academicApi.getActiveSchoolYear(),
          usersApi.getPending(),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (yearRes.status === 'fulfilled') setActiveYear(yearRes.value.data);
        if (pendingRes.status === 'fulfilled') setPending(pendingRes.value.data?.users || pendingRes.value.data || []);
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
        <StatCard title="Estudiantes" value={stats?.students || 0} icon={GraduationCap} loading={loading} />
        <StatCard title="Docentes" value={stats?.teachers || 0} icon={UserCheck} loading={loading} />
        <StatCard title="Pendientes" value={stats?.pending || pending.length || 0} icon={Clock} loading={loading} />
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
    switch (user?.role) {
      case 'Admin':
        return <AdminDashboard />;
      case 'Teacher':
        return <TeacherDashboard />;
      case 'Student':
        return <StudentDashboard />;
      default:
        return <PendingDashboard />;
    }
  };

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>;
};

export default DashboardPage;
