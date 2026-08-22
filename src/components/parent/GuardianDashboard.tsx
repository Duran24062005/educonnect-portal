import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  UsersRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSchoolYears } from '@/hooks/useSchoolYears';
import { guardiansApi, type GuardianStudentDashboard } from '@/api/guardians';
import LightweightCategoryChart from '@/components/charts/LightweightCategoryChart';

interface SchoolYearOption {
  _id: string;
  year: number;
  name?: string;
  is_active?: boolean;
}

const relationshipLabels = {
  mother: 'Madre',
  father: 'Padre',
  guardian: 'Acudiente',
  other: 'Familiar autorizado',
} as const;

const getInitials = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'ES';

const formatAverage = (value?: number | null) => Number(value || 0).toFixed(1);

const statusLabel = (status?: string) => {
  if (status === 'passed') return 'Aprobado';
  if (status === 'repeating') return 'En recuperación';
  return 'Requiere atención';
};

const StudentSummaryCard = ({
  item,
  selected,
  onSelect,
}: {
  item: GuardianStudentDashboard;
  selected: boolean;
  onSelect: () => void;
}) => {
  const { student, overview } = item;
  const initials = getInitials(student.full_name);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border/70 bg-card hover:bg-accent/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={student.profile_photo_url || undefined} alt={student.full_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold">{student.full_name}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {student.group?.grade_name ? `Grado ${student.group.grade_name}` : 'Sin grado'}
              {student.group?.name ? ` · ${student.group.name}` : ''}
            </p>
          </div>
        </div>
        <ChevronRight className={`h-4 w-4 shrink-0 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted/50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Promedio</p>
          <p className="mt-1 text-lg font-display font-bold">{formatAverage(overview.general_average)}</p>
        </div>
        <div className="rounded-xl bg-muted/50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Estado</p>
          <Badge className="mt-1" variant={overview.final_status === 'passed' ? 'default' : 'destructive'}>
            {statusLabel(overview.final_status)}
          </Badge>
        </div>
      </div>
    </button>
  );
};

const GuardianDashboard = () => {
  const { data: years = [], isLoading: yearsLoading } = useSchoolYears() as {
    data?: SchoolYearOption[];
    isLoading: boolean;
  };
  const activeYear = useMemo(
    () => years.find((year) => year?.is_active) || years[0] || null,
    [years]
  );
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const effectiveYearId = selectedYearId || activeYear?._id || '';

  const dashboardQuery = useQuery({
    queryKey: ['guardian-dashboard', effectiveYearId],
    queryFn: () => guardiansApi.getDashboard(effectiveYearId),
    enabled: Boolean(effectiveYearId),
  });
  const attendanceQuery = useQuery({
    queryKey: ['guardian-attendance', effectiveYearId],
    queryFn: () => guardiansApi.getAttendance(effectiveYearId),
    enabled: Boolean(effectiveYearId),
  });

  const students = dashboardQuery.data?.students || [];
  const selectedStudent = students.find((item) => item.student._id === selectedStudentId) || students[0] || null;
  const attendanceStudents = attendanceQuery.data?.students || [];
  const isBusy = yearsLoading || dashboardQuery.isLoading;
  const selectedAreas = selectedStudent?.areas || [];
  const selectedPeriods = selectedStudent?.periods || [];
  const selectedAreaCategories = selectedAreas.map((area) => area.area_name);
  const selectedAreaSeries = [
    {
      id: 'guardian-area-average',
      label: 'Promedio final',
      type: 'histogram' as const,
      color: '#2563eb',
      values: selectedAreas.map((area) => Number(area.final_average)),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(14,116,144,0.15),rgba(255,255,255,0.95)_48%,rgba(16,185,129,0.12))] p-6 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(8,145,178,0.22),rgba(15,23,42,0.2)_46%,rgba(16,185,129,0.16))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Panel familiar</p>
            <h1 className="mt-3 text-3xl font-display font-extrabold tracking-tight">Acompaña el avance de tus estudiantes</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Consulta el rendimiento de cada estudiante vinculado a tu cuenta y cambia de perfil sin perder el contexto académico.
            </p>
          </div>

          <div className="w-full lg:w-52">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Año escolar</p>
            <Select value={effectiveYearId} onValueChange={setSelectedYearId}>
              <SelectTrigger className="w-full bg-background/85">
                <SelectValue placeholder="Selecciona año escolar" />
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
        </div>
      </section>

      {isBusy ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      ) : dashboardQuery.isError ? (
        <Card>
          <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-semibold">No se pudo cargar la información familiar</p>
              <p className="mt-1 text-sm text-muted-foreground">Intenta nuevamente o comunícate con la institución.</p>
            </div>
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
            <UsersRound className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">No hay estudiantes vinculados</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                La institución todavía no ha asociado estudiantes a tu cuenta de acudiente.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <section>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-display font-bold">Mis estudiantes</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {students.length === 1 ? 'Un estudiante vinculado' : `${students.length} estudiantes vinculados`}
                </p>
              </div>
              <Badge variant="secondary">{dashboardQuery.data?.school_year?.name || 'Año escolar'}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {students.map((item) => (
                <StudentSummaryCard
                  key={item.student._id}
                  item={item}
                  selected={selectedStudent?.student._id === item.student._id}
                  onSelect={() => setSelectedStudentId(item.student._id)}
                />
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-display font-bold">Asistencia por estudiante</h2>
                <p className="mt-1 text-sm text-muted-foreground">Consulta presentes, ausencias, tardanzas y justificaciones autorizadas.</p>
              </div>
              <CalendarCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {attendanceStudents.map((item) => (
                <Card key={item.student._id}>
                  <CardHeader className="pb-3"><CardTitle className="text-base">{item.student.full_name}</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-muted/40 px-3 py-2"><p className="text-xs text-muted-foreground">Asistencia</p><p className="mt-1 text-xl font-display font-bold">{item.attendance.attendance_rate === null ? 'N/D' : `${item.attendance.attendance_rate}%`}</p></div>
                    <div className="rounded-xl bg-muted/40 px-3 py-2"><p className="text-xs text-muted-foreground">Sesiones</p><p className="mt-1 text-xl font-display font-bold">{item.attendance.totals.sessions}</p></div>
                    <p><span className="font-semibold text-emerald-600">{item.attendance.totals.present}</span> presentes</p>
                    <p><span className="font-semibold text-destructive">{item.attendance.totals.absent}</span> ausencias</p>
                    <p><span className="font-semibold text-amber-600">{item.attendance.totals.late}</span> tardanzas</p>
                    <p><span className="font-semibold text-sky-600">{item.attendance.totals.excused}</span> justificadas</p>
                  </CardContent>
                </Card>
              ))}
              {attendanceQuery.isLoading && <Skeleton className="h-40 w-full rounded-2xl" />}
            </div>
          </section>

          {selectedStudent && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedStudent.student.profile_photo_url || undefined} alt={selectedStudent.student.full_name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(selectedStudent.student.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-display font-bold">Detalle de {selectedStudent.student.full_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {relationshipLabels[selectedStudent.student.relationship]} · {selectedStudent.student.group?.name || 'Grupo pendiente'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Promedio general</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-display font-bold">{formatAverage(selectedStudent.overview.general_average)}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Áreas aprobadas</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-display font-bold">{selectedStudent.overview.passed_areas}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Áreas en riesgo</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-display font-bold text-destructive">{selectedStudent.overview.failed_areas}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Mejor área</CardTitle></CardHeader>
                  <CardContent><p className="truncate text-lg font-display font-bold">{selectedStudent.overview.best_area || 'Sin resultados'}</p></CardContent>
                </Card>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4" /> Rendimiento por área</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedAreaCategories.length > 0 ? (
                      <LightweightCategoryChart categories={selectedAreaCategories} series={selectedAreaSeries} height={280} />
                    ) : (
                      <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay calificaciones consolidadas.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4" /> Áreas para acompañar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedAreas.length > 0 ? selectedAreas
                      .slice()
                      .sort((a, b) => a.final_average - b.final_average)
                      .slice(0, 4)
                      .map((area) => (
                        <div key={area.area_id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                          <div className="min-w-0"><p className="truncate font-medium">{area.area_name}</p><p className="text-xs text-muted-foreground">{area.status === 'failed' ? 'Requiere refuerzo' : 'En seguimiento'}</p></div>
                          <Badge variant={area.status === 'failed' ? 'destructive' : 'secondary'}>{formatAverage(area.final_average)}</Badge>
                        </div>
                      )) : <p className="text-sm text-muted-foreground">Sin áreas para mostrar.</p>}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4" /> Evolución por periodo</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPeriods.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {selectedPeriods.map((period) => (
                        <div key={period.period_id} className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                          <p className="text-sm font-medium">{period.period_name}</p>
                          <p className="mt-2 text-xl font-display font-bold">{formatAverage(period.general_average)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{period.passed_areas} aprobadas · {period.failed_areas} en riesgo</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay periodos consolidados para este año escolar.</p>
                  )}
                </CardContent>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default GuardianDashboard;
