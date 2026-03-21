import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/layouts/DashboardLayout';
import { analyticsApi, type TeacherStudentDetail } from '@/api/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Eye, FileText, Users } from 'lucide-react';
import LightweightCategoryChart from '@/components/charts/LightweightCategoryChart';
import { useSchoolYears } from '@/hooks/useSchoolYears';
import { useTeacherDashboardSummary } from '@/hooks/useDashboardSummary';

const PASSING_SCORE = 6;
const performanceVariant = (level?: string) => {
  if (level === 'SUPERIOR') return 'default' as const;
  if (level === 'ALTO') return 'secondary' as const;
  if (level === 'BÁSICO') return 'outline' as const;
  return 'destructive' as const;
};

const getPayload = (response: any) => response?.data?.data ?? response?.data;
const assignmentKey = (groupId?: string, areaId?: string) => `${groupId || ''}:${areaId || ''}`;

const normalizeStudentDetail = (
  payload: any,
  fallbackStudent: any,
  fallbackAreaName: string
): TeacherStudentDetail => ({
  student: {
    _id: payload?.student?._id || fallbackStudent?.student_id || '',
    full_name: payload?.student?.full_name || fallbackStudent?.student_name || 'Sin nombre',
    email: payload?.student?.email ?? fallbackStudent?.student_email ?? null,
  },
  area: {
    _id: payload?.area?._id || '',
    name: payload?.area?.name || fallbackAreaName || 'Area',
  },
  final_average: Number(payload?.final_average ?? fallbackStudent?.average ?? 0),
  periods: Array.isArray(payload?.periods)
    ? payload.periods.map((period: any) => ({
        period_name: period?.period_name || 'Periodo',
        average: Number(period?.average ?? 0),
      }))
    : [],
});

const MyGroupsPage = () => {
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const navigate = useNavigate();
  const { data: years = [], isLoading: yearsLoading } = useSchoolYears();

  useEffect(() => {
    if (selectedYearId || years.length === 0) return;
    const activeYear = years.find((year: any) => year?.is_active) || years[0];
    if (activeYear?._id) {
      setSelectedYearId(activeYear._id);
    }
  }, [selectedYearId, years]);

  const {
    data: dashboardSummary,
    isLoading: groupsLoading,
    error: groupsError,
  } = useTeacherDashboardSummary(selectedYearId);

  useEffect(() => {
    if (groupsError) {
      toast.error('No se pudieron cargar las metricas del docente');
    }
  }, [groupsError]);

  const groups = dashboardSummary?.groups || [];
  const loading = yearsLoading || (Boolean(selectedYearId) && groupsLoading);

  useEffect(() => {
    if (!groups.length) {
      setSelectedAssignmentKey('');
      setSelectedStudentId('');
      return;
    }

    setSelectedAssignmentKey((current) => {
      if (current && groups.some((group: any) => assignmentKey(group.group_id, group.area_id) === current)) {
        return current;
      }
      return assignmentKey(groups[0]?.group_id, groups[0]?.area_id);
    });
  }, [groups]);

  const activeGroup = useMemo(
    () => groups.find((group: any) => assignmentKey(group.group_id, group.area_id) === selectedAssignmentKey) ?? groups[0] ?? null,
    [groups, selectedAssignmentKey]
  );

  useEffect(() => {
    setSelectedStudentId((current) => {
      if (current && activeGroup?.students.some((student: any) => student.student_id === current)) {
        return current;
      }
      return activeGroup?.students.find((student: any) => student.student_id)?.student_id || '';
    });
  }, [activeGroup]);

  const activeStudent = useMemo(
    () => activeGroup?.students.find((student: any) => student.student_id === selectedStudentId) ?? activeGroup?.students[0] ?? null,
    [activeGroup, selectedStudentId]
  );

  const selectableStudents = useMemo(
    () => (activeGroup?.students || []).filter((student: any) => Boolean(student.student_id)),
    [activeGroup]
  );

  const {
    data: selectedStudentDetail,
    isLoading: detailLoading,
    error: detailError,
  } = useQuery({
    queryKey: ['teacher-student-detail', selectedYearId, activeGroup?.area_id, selectedStudentId],
    queryFn: async () => {
      if (!selectedYearId || !activeGroup?.area_id || !selectedStudentId) return null;
      const response = await analyticsApi.getTeacherStudentDetail(selectedYearId, selectedStudentId, activeGroup.area_id);
      return normalizeStudentDetail(getPayload(response), activeStudent, activeGroup.area_name);
    },
    enabled: !loading && Boolean(selectedYearId && activeGroup?.area_id && selectedStudentId),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (detailError) {
      toast.error('No se pudo cargar el detalle del estudiante');
    }
  }, [detailError]);

  const periodCategories = activeGroup?.periods.map((period: any) => period.period_name) ?? [];
  const periodSeries = activeGroup
    ? [
        {
          id: 'teacher-average',
          label: `${activeGroup.area_name} promedio`,
          type: 'area' as const,
          color: '#0f766e',
          values: activeGroup.periods.map((period: any) => period.average),
        },
        {
          id: 'teacher-failed',
          label: 'Estudiantes en riesgo',
          type: 'line' as const,
          color: '#dc2626',
          values: activeGroup.periods.map((period: any) => period.failed),
        },
      ]
    : [];

  const studentCategories = activeGroup?.students.map((student: any) => student.student_name) ?? [];
  const studentSeries = activeGroup
    ? [
        {
          id: 'teacher-students',
          label: 'Promedio estudiante',
          type: 'histogram' as const,
          color: '#2563eb',
          values: activeGroup.students.map((student: any) => student.average),
        },
      ]
    : [];

  const detailCategories = selectedStudentDetail?.periods.map((period) => period.period_name) ?? [];
  const detailSeries = selectedStudentDetail
    ? [
        {
          id: 'student-period-average',
          label: `${selectedStudentDetail.area.name} por periodo`,
          type: 'line' as const,
          color: '#ea580c',
          values: selectedStudentDetail.periods.map((period) => period.average),
        },
      ]
    : [];

  const approvalRate = activeGroup?.student_count
    ? Math.round((activeGroup.passed / activeGroup.student_count) * 100)
    : 0;

  const selectedStudentStatus = selectedStudentDetail?.final_average !== undefined
    ? selectedStudentDetail.final_average >= PASSING_SCORE
      ? 'passed'
      : 'failed'
    : activeStudent?.status || 'failed';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold">Mis Grupos y Metricas</h1>
            <p className="text-muted-foreground">Seguimiento real por grupo, grado y area asignada del docente.</p>
          </div>

          <Select value={selectedYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Selecciona un ano escolar" />
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

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No tienes asignaciones docentes para el ano escolar seleccionado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group: any) => (
              <Card key={assignmentKey(group.group_id, group.area_id)} className="hover:shadow-md transition-shadow">
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
                    {group.performance_levels ? (
                      <>
                        <Badge variant={performanceVariant('SUPERIOR')}>Superior: {group.performance_levels.SUPERIOR}</Badge>
                        <Badge variant={performanceVariant('ALTO')}>Alto: {group.performance_levels.ALTO}</Badge>
                        <Badge variant={performanceVariant('BÁSICO')}>Básico: {group.performance_levels.BÁSICO}</Badge>
                        <Badge variant={performanceVariant('BAJO')}>Bajo: {group.performance_levels.BAJO}</Badge>
                      </>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAssignmentKey(assignmentKey(group.group_id, group.area_id))}
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Ver metricas
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/teacher/activities/${group.group_id}/${group.area_id}?school_year_id=${selectedYearId}`)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Actividades
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
            <div className="space-y-2">
              <CardTitle>Analitica del Grupo</CardTitle>
              {activeGroup && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Grupo {activeGroup.group_name}</Badge>
                  <Badge variant="outline">Grado {activeGroup.grade_name}</Badge>
                  <Badge variant="secondary">{activeGroup.area_name}</Badge>
                </div>
              )}
            </div>
            <Select value={selectedAssignmentKey} onValueChange={setSelectedAssignmentKey}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Selecciona grupo y area" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group: any) => (
                  <SelectItem key={assignmentKey(group.group_id, group.area_id)} value={assignmentKey(group.group_id, group.area_id)}>
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
                    { label: 'Area', value: activeGroup.area_name },
                    { label: 'Estudiantes', value: activeGroup.student_count },
                    { label: 'Promedio', value: activeGroup.average.toFixed(1) },
                    { label: 'Aprobacion', value: `${approvalRate}%` },
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
                      <CardTitle className="text-base">Evolucion del Grupo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {periodCategories.length > 0 ? (
                        <LightweightCategoryChart categories={periodCategories} series={periodSeries} height={300} />
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No hay datos de tendencia por periodo.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Promedio por Estudiante</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {studentCategories.length > 0 ? (
                        <LightweightCategoryChart categories={studentCategories} series={studentSeries} height={300} />
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No hay estudiantes con metricas consolidadas.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estudiante</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Promedio</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Detalle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeGroup.students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No hay estudiantes para esta asignacion.
                          </TableCell>
                        </TableRow>
                      ) : (
                        activeGroup.students.map((student: any) => (
                          <TableRow
                            key={student.student_id || `${student.student_name}-${student.average}`}
                            className={student.student_id === selectedStudentId ? 'bg-muted/40' : ''}
                          >
                            <TableCell className="font-medium">{student.student_name}</TableCell>
                            <TableCell>{student.student_email || 'Sin email'}</TableCell>
                            <TableCell>{student.average.toFixed(1)}</TableCell>
                            <TableCell>
                              <Badge variant={performanceVariant(student.performance_level)}>
                                {student.performance_level || (student.status === 'passed' ? 'Aprobado' : 'En riesgo')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={student.student_id === selectedStudentId ? 'default' : 'outline'}
                                disabled={!student.student_id}
                                onClick={() => setSelectedStudentId(student.student_id || '')}
                              >
                                Ver detalle
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Detalle del Estudiante</CardTitle>
              <p className="text-sm text-muted-foreground">
                Consulta el consolidado real por periodo para el estudiante seleccionado.
              </p>
            </div>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={selectableStudents.length === 0}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Selecciona un estudiante" />
              </SelectTrigger>
              <SelectContent>
                {selectableStudents.map((student: any) => (
                  <SelectItem key={student.student_id} value={student.student_id || ''}>
                    {student.student_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-6">
            {!activeGroup || activeGroup.students.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay estudiantes activos para esta asignacion docente.
              </p>
            ) : detailLoading ? (
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-20" />
                  ))}
                </div>
                <Skeleton className="h-72 w-full" />
              </div>
            ) : !selectedStudentDetail ? (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed py-10 text-muted-foreground">
                <Eye className="h-4 w-4" />
                No se pudo cargar el detalle del estudiante seleccionado.
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Estudiante</p>
                    <p className="mt-1 text-lg font-display font-bold">{selectedStudentDetail.student.full_name}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="mt-1 text-lg font-display font-bold break-words">
                      {selectedStudentDetail.student.email || 'Sin email'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <div className="mt-2">
                      <Badge variant={selectedStudentStatus === 'passed' ? 'default' : 'destructive'}>
                        {selectedStudentStatus === 'passed' ? 'Aprobado' : 'En riesgo'}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Promedio final</p>
                    <p className="mt-1 text-2xl font-display font-bold">{selectedStudentDetail.final_average.toFixed(1)}</p>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Evolucion de {selectedStudentDetail.student.full_name} en {selectedStudentDetail.area.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {detailCategories.length > 0 ? (
                      <LightweightCategoryChart categories={detailCategories} series={detailSeries} height={280} />
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Este estudiante aun no tiene resultados consolidados por periodo en esta area.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Periodo</TableHead>
                        <TableHead>Promedio</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStudentDetail.periods.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            No hay periodos consolidados para este estudiante.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedStudentDetail.periods.map((period) => {
                          const periodPassed = period.average >= PASSING_SCORE;
                          return (
                            <TableRow key={period.period_name}>
                              <TableCell className="font-medium">{period.period_name}</TableCell>
                              <TableCell>{period.average.toFixed(1)}</TableCell>
                              <TableCell>
                                <Badge variant={periodPassed ? 'default' : 'destructive'}>
                                  {periodPassed ? 'Aprobado' : 'En riesgo'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
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
