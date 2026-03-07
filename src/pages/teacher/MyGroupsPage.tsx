import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { analyticsApi, type TeacherGroupAnalytics } from '@/api/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Eye, Users } from 'lucide-react';
import LightweightCategoryChart from '@/components/charts/LightweightCategoryChart';

const MyGroupsPage = () => {
  const [groups, setGroups] = useState<TeacherGroupAnalytics[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await analyticsApi.getTeacherGroupsAnalytics();
        setGroups(data);
        if (data[0]?.group_id) setSelectedGroupId(data[0].group_id);
      } catch {
        toast.error('No se pudieron cargar las métricas del docente');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const activeGroup = useMemo(
    () => groups.find((group) => group.group_id === selectedGroupId) ?? groups[0] ?? null,
    [groups, selectedGroupId]
  );

  const periodCategories = activeGroup?.periods.map((period) => period.period_name) ?? [];
  const periodSeries = activeGroup
    ? [
        {
          id: 'teacher-average',
          label: `${activeGroup.area_name} promedio`,
          type: 'area' as const,
          color: '#0f766e',
          values: activeGroup.periods.map((period) => period.average),
        },
        {
          id: 'teacher-failed',
          label: 'Estudiantes en riesgo',
          type: 'line' as const,
          color: '#dc2626',
          values: activeGroup.periods.map((period) => period.failed),
        },
      ]
    : [];

  const studentCategories = activeGroup?.students.map((student) => student.student_name) ?? [];
  const studentSeries = activeGroup
    ? [
        {
          id: 'teacher-students',
          label: 'Promedio estudiante',
          type: 'histogram' as const,
          color: '#2563eb',
          values: activeGroup.students.map((student) => student.average),
        },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Mis Grupos y Métricas</h1>
          <p className="text-muted-foreground">Seguimiento por grupo y área del docente con datos de prueba.</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}><CardContent className="pt-6"><Skeleton className="h-20" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.group_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {group.group_name}
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Grado {group.grade_name}</span>
                    <Badge variant="secondary">{group.area_name}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">Promedio</p>
                      <p className="font-semibold">{group.average.toFixed(1)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">Aprobados</p>
                      <p className="font-semibold">{group.passed}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">Riesgo</p>
                      <p className="font-semibold">{group.failed}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedGroupId(group.group_id)}>
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Ver métricas
                    </Button>
                    <Button size="sm" onClick={() => navigate(`/groups/${group.group_id}/scores`)}>
                      Notas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Analítica del Grupo</CardTitle>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Selecciona grupo" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.group_id} value={group.group_id}>
                    {group.group_name} · {group.area_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading || !activeGroup ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: 'Área', value: activeGroup.area_name },
                    { label: 'Estudiantes', value: activeGroup.student_count },
                    { label: 'Promedio', value: activeGroup.average.toFixed(1) },
                    { label: 'Aprobación', value: `${Math.round((activeGroup.passed / activeGroup.student_count) * 100)}%` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-2xl font-display font-bold">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Evolución del Grupo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LightweightCategoryChart categories={periodCategories} series={periodSeries} height={300} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Promedio por Estudiante</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LightweightCategoryChart categories={studentCategories} series={studentSeries} height={300} />
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estudiante</TableHead>
                        <TableHead>Promedio</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeGroup.students.map((student) => (
                        <TableRow key={student.student_name}>
                          <TableCell className="font-medium">{student.student_name}</TableCell>
                          <TableCell>{student.average.toFixed(1)}</TableCell>
                          <TableCell>
                            <Badge variant={student.status === 'passed' ? 'default' : 'destructive'}>
                              {student.status === 'passed' ? 'Aprobado' : 'En riesgo'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MyGroupsPage;
