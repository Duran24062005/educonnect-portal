import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, Filter, List, Plus, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/store/auth';
import { normalizeRole } from '@/lib/auth';
import {
  calendarApi,
  CALENDAR_DATA_SOURCE,
  type CalendarCatalog,
  type CalendarQuery,
  type CalendarRole,
  type CalendarSession,
  type CalendarSessionInput,
} from '@/api/calendar';
import { calendarDemoCatalog } from '@/api/calendarDemo';
import CalendarAgenda from '@/components/calendar/CalendarAgenda';
import CalendarSessionDialog from '@/components/calendar/CalendarSessionDialog';
import CalendarWeekGrid from '@/components/calendar/CalendarWeekGrid';
import {
  formatSessionDate,
  getNextSession,
  getWeekQueryRange,
  getWeekRangeLabel,
  shiftWeek,
} from '@/lib/calendar-utils';

type CalendarView = 'week' | 'agenda';

interface CalendarFilters {
  gradeId: string;
  groupId: string;
  areaId: string;
  teacherId: string;
  aulaId: string;
}

const initialFilters: CalendarFilters = {
  gradeId: '',
  groupId: '',
  areaId: '',
  teacherId: '',
  aulaId: '',
};

const CalendarPage = () => {
  const user = useAuthStore((state) => state.user);
  const rawRole = normalizeRole(user?.role);
  const role: CalendarRole = rawRole === 'admin' || rawRole === 'teacher' ? rawRole : 'student';
  const queryClient = useQueryClient();
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [schoolYearId, setSchoolYearId] = useState(calendarDemoCatalog.years[0]?.id || '');
  const [view, setView] = useState<CalendarView>('week');
  const [filters, setFilters] = useState<CalendarFilters>(initialFilters);
  const [selectedSession, setSelectedSession] = useState<CalendarSession | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const range = useMemo(() => getWeekQueryRange(referenceDate), [referenceDate]);
  const query = useMemo<CalendarQuery>(() => ({
    role,
    from: range.from,
    to: range.to,
    schoolYearId: CALENDAR_DATA_SOURCE === 'demo' ? schoolYearId || undefined : undefined,
    gradeId: filters.gradeId || undefined,
    groupId: filters.groupId || undefined,
    areaId: filters.areaId || undefined,
    teacherId: filters.teacherId || undefined,
    aulaId: filters.aulaId || undefined,
  }), [filters, range.from, range.to, role, schoolYearId]);

  const calendarQuery = useQuery({
    queryKey: ['calendar', query],
    queryFn: () => calendarApi.list(query),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: ({ input, sessionId }: { input: CalendarSessionInput; sessionId?: string }) => (
      sessionId ? calendarApi.update(sessionId, input) : calendarApi.create(input)
    ),
    onSuccess: async (_session, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success(variables.sessionId ? 'Sesión actualizada' : 'Sesión creada');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (session: CalendarSession) => calendarApi.cancel(session.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Sesión cancelada');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (session: CalendarSession) => calendarApi.activate(session.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Sesión reactivada');
    },
  });

  const catalog = useMemo<CalendarCatalog>(() => {
    if (role !== 'teacher') return calendarDemoCatalog;
    const teacher = calendarDemoCatalog.teachers.find((item) => item.id === 'teacher-001');
    return {
      ...calendarDemoCatalog,
      teachers: teacher ? [teacher] : [],
      groups: calendarDemoCatalog.groups.filter((item) => ['group-7a', 'group-8a'].includes(item.id)),
      areas: calendarDemoCatalog.areas.filter((item) => item.id === 'area-math'),
    };
  }, [role]);

  const sessions = calendarQuery.data?.sessions || [];
  const nextSession = getNextSession(sessions);
  const hasFilters = Object.values(filters).some(Boolean);
  const canEditSession = (session: CalendarSession | null) => Boolean(session && (role === 'admin' || (role === 'teacher' && session.teacher.id === 'teacher-001')));

  const openCreate = () => {
    setSelectedSession(null);
    setDialogOpen(true);
  };

  const openSession = (session: CalendarSession) => {
    setSelectedSession(session);
    setDialogOpen(true);
  };

  const handleSave = async (input: CalendarSessionInput, sessionId?: string) => {
    await saveMutation.mutateAsync({ input, sessionId });
  };

  const handleCancel = async (session: CalendarSession) => {
    await cancelMutation.mutateAsync(session);
  };

  const handleActivate = async (session: CalendarSession) => {
    await activateMutation.mutateAsync(session);
  };

  const setFilter = (key: keyof CalendarFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value === 'all' ? '' : value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <CalendarDays className="h-4 w-4" />
              Agenda académica
            </div>
            <h1 className="mt-2 text-3xl font-display font-extrabold tracking-tight">Calendario</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Consulta las clases de la semana, sus responsables y los temas que siguen en agenda.
            </p>
          </div>
          {role !== 'student' && (
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />Nueva sesión
            </Button>
          )}
        </header>

        <section className="rounded-xl border border-border/70 bg-card p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-2 sm:justify-start">
              <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="icon" onClick={() => setReferenceDate((current) => shiftWeek(current, 'previous'))} aria-label="Semana anterior" title="Semana anterior">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => setReferenceDate((current) => shiftWeek(current, 'next'))} aria-label="Semana siguiente" title="Semana siguiente">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setReferenceDate(new Date())}>
                  <RotateCcw className="h-4 w-4" />Hoy
                </Button>
              </div>
              <p className="min-w-[170px] text-center text-sm font-semibold capitalize sm:text-left">{getWeekRangeLabel(referenceDate)}</p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="calendar-school-year" className="whitespace-nowrap text-xs font-medium text-muted-foreground">Año escolar</label>
              <Select value={schoolYearId} onValueChange={setSchoolYearId}>
                <SelectTrigger id="calendar-school-year" className="w-[170px]"><SelectValue placeholder="Año escolar" /></SelectTrigger>
                <SelectContent>{calendarDemoCatalog.years.map((year) => <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <Tabs value={view} onValueChange={(value) => setView(value as CalendarView)}>
              <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                <TabsTrigger value="week"><CalendarDays className="h-4 w-4" />Semana</TabsTrigger>
                <TabsTrigger value="agenda"><List className="h-4 w-4" />Agenda</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {role === 'admin' && (
            <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4 text-sm font-semibold">
              <Filter className="h-4 w-4 text-primary" />Filtros del administrador
            </div>
          )}
          {role !== 'student' && (
            <div className="mt-3 grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2 xl:grid-cols-5">
              {role === 'admin' && (
                <FilterSelect label="Grado" value={filters.gradeId} options={catalog.grades} onChange={(value) => setFilter('gradeId', value)} />
              )}
              <FilterSelect label="Grupo" value={filters.groupId} options={catalog.groups} onChange={(value) => setFilter('groupId', value)} />
              <FilterSelect label="Materia" value={filters.areaId} options={catalog.areas} onChange={(value) => setFilter('areaId', value)} />
              {role === 'admin' && (
                <FilterSelect label="Docente" value={filters.teacherId} options={catalog.teachers} onChange={(value) => setFilter('teacherId', value)} />
              )}
              <FilterSelect label="Aula" value={filters.aulaId} options={catalog.aulas} onChange={(value) => setFilter('aulaId', value)} />
              {hasFilters && (
                <Button variant="ghost" size="sm" className="self-end justify-self-start" onClick={() => setFilters(initialFilters)}>
                  <X className="h-4 w-4" />Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </section>

        {calendarQuery.isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
            <SlidersHorizontal className="h-8 w-8 text-destructive" />
            <h2 className="mt-4 font-display text-lg font-bold">No se pudo cargar el calendario</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">Revisa la conexión o vuelve a intentarlo.</p>
            <Button variant="outline" className="mt-5" onClick={() => calendarQuery.refetch()}>Reintentar</Button>
          </div>
        ) : (
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_300px]">
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/60 bg-muted/15 px-4 py-4 sm:px-6">
                <div>
                  <CardTitle className="text-base">{view === 'week' ? 'Vista semanal' : 'Agenda de la semana'}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{sessions.length} {sessions.length === 1 ? 'sesión visible' : 'sesiones visibles'}</p>
                </div>
                {calendarQuery.isFetching && <span className="text-xs text-muted-foreground">Actualizando…</span>}
              </CardHeader>
              <CardContent className="p-0">
                {calendarQuery.isLoading ? (
                  <div className="space-y-3 p-6">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-[520px] w-full" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                    <CalendarDays className="h-9 w-9 text-muted-foreground" />
                    <h2 className="mt-4 font-display text-lg font-bold">No hay clases para este rango</h2>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">Prueba otra semana o ajusta los filtros seleccionados.</p>
                  </div>
                ) : view === 'week' ? (
                  <CalendarWeekGrid referenceDate={referenceDate} sessions={sessions} onSelectSession={openSession} />
                ) : (
                  <CalendarAgenda referenceDate={referenceDate} sessions={sessions} onSelectSession={openSession} />
                )}
              </CardContent>
            </Card>

            <aside className="space-y-6">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Próxima clase</CardTitle>
                </CardHeader>
                <CardContent>
                  {nextSession ? (
                    <button type="button" onClick={() => openSession(nextSession)} className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Badge variant={nextSession.status === 'cancelled' ? 'secondary' : 'default'}>{nextSession.status === 'cancelled' ? 'Cancelada' : formatSessionDate(nextSession.startAt)}</Badge>
                      <p className="mt-3 text-xl font-display font-bold">{nextSession.area.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{nextSession.topic}</p>
                      <p className="mt-4 text-sm font-semibold">{new Date(nextSession.startAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} - {new Date(nextSession.endAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{nextSession.teacher.name} · {nextSession.aula.name}</p>
                      {nextSession.pendingActivities.length > 0 && <p className="mt-4 text-xs font-semibold text-primary">{nextSession.pendingActivities.length} actividad pendiente relacionada</p>}
                    </button>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay una próxima clase visible en esta semana.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Actividades en agenda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {calendarQuery.data?.pendingActivities.length ? calendarQuery.data.pendingActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                      <p className="min-w-0 truncate text-sm font-medium">{activity.title}</p>
                      <Badge variant={activity.status === 'overdue' ? 'destructive' : activity.status === 'submitted' ? 'secondary' : 'outline'}>
                        {activity.status === 'overdue' ? 'Vencida' : activity.status === 'submitted' ? 'Entregada' : 'Pendiente'}
                      </Badge>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No hay actividades relacionadas en esta semana.</p>}
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </div>

      <CalendarSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        session={selectedSession}
        role={role}
        catalog={catalog}
        canEdit={canEditSession(selectedSession)}
        onSave={handleSave}
        onCancelSession={handleCancel}
        onActivateSession={handleActivate}
      />
    </DashboardLayout>
  );
};

const FilterSelect = ({ label, value, options, onChange }: { label: string; value: string; options: Array<{ id: string; name: string }>; onChange: (value: string) => void }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    <Select value={value || 'all'} onValueChange={onChange}>
      <SelectTrigger className="h-9"><SelectValue placeholder={`Todos: ${label.toLowerCase()}`} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos</SelectItem>
        {options.map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

export default CalendarPage;
