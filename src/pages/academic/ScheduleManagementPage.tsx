import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, Clock3, Plus, Save, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { calendarApi } from '@/api/calendar';
import { scheduleApi, type AvailabilityWindowInput, type WeeklySchedule } from '@/api/schedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const DAYS = [
  { value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' }, { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' }, { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' }, { value: 7, label: 'Domingo' },
];

const emptyWindow = (catalog: { groups: Array<{ id: string }> }): AvailabilityWindowInput => ({
  group_id: catalog.groups[0]?.id || '',
  start_time: '06:15',
  end_time: '12:15',
});

const ScheduleManagementPage = () => {
  const queryClient = useQueryClient();
  const [schoolYearId, setSchoolYearId] = useState('');
  const [workingSchedule, setWorkingSchedule] = useState<WeeklySchedule | null>(null);
  const [windowForm, setWindowForm] = useState<AvailabilityWindowInput | null>(null);
  const [editingWindowId, setEditingWindowId] = useState<string | null>(null);

  const catalogQuery = useQuery({
    queryKey: ['schedule-catalog', schoolYearId],
    queryFn: () => calendarApi.catalog('admin', schoolYearId || undefined),
    staleTime: 60_000,
  });
  const catalog = catalogQuery.data || { years: [], grades: [], groups: [], areas: [], teachers: [], aulas: [] };

  useEffect(() => {
    if (!schoolYearId && catalog.years[0]?.id) setSchoolYearId(catalog.years[0].id);
  }, [catalog.years, schoolYearId]);

  const schedulesQuery = useQuery({
    queryKey: ['schedules', schoolYearId],
    enabled: Boolean(schoolYearId),
    queryFn: () => scheduleApi.list(schoolYearId),
  });
  const baseSchedule = useMemo(() => {
    const schedules = schedulesQuery.data?.schedules || [];
    return schedules.find((item) => item.status === 'draft') || schedules.find((item) => item.status === 'published') || null;
  }, [schedulesQuery.data]);

  useEffect(() => {
    setWorkingSchedule(null);
    setWindowForm(null);
    setEditingWindowId(null);
  }, [schoolYearId]);

  useEffect(() => {
    if (baseSchedule) {
      setWorkingSchedule((current) => current?.id === baseSchedule.id ? current : baseSchedule);
      setWindowForm(null);
      setEditingWindowId(null);
    }
  }, [baseSchedule]);

  const schedule = workingSchedule || baseSchedule;
  const draft = schedule?.status === 'draft' ? schedule : null;

  const createDraftMutation = useMutation({
    mutationFn: () => scheduleApi.createDraft(schoolYearId),
    onSuccess: (created) => { setWorkingSchedule(created); void queryClient.invalidateQueries({ queryKey: ['schedules'] }); toast.success('Borrador listo para editar'); },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo crear el borrador'),
  });
  const saveMutation = useMutation({
    mutationFn: () => scheduleApi.update(draft!.id, { school_days: draft!.school_days, availability_windows: draft!.availability_windows.map(({ window_id, group_id, start_time, end_time }) => ({ window_id, group_id, start_time, end_time })) }),
    onSuccess: (updated) => { setWorkingSchedule(updated); void queryClient.invalidateQueries({ queryKey: ['schedules'] }); toast.success('Borrador guardado'); },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo guardar el borrador'),
  });
  const publishMutation = useMutation({
    mutationFn: () => scheduleApi.publish(draft!.id),
    onSuccess: (published) => { setWorkingSchedule(published); void queryClient.invalidateQueries({ queryKey: ['schedules'] }); toast.success('Horario publicado'); },
    onError: (error: any) => {
      const errors = error?.response?.data?.details?.errors;
      toast.error(Array.isArray(errors) ? errors.join(' · ') : error?.response?.data?.message || 'No se pudo publicar el horario');
    },
  });

  const updateDraft = (changes: Partial<WeeklySchedule>) => setWorkingSchedule((current) => current ? { ...current, ...changes } : current);
  const saveWindow = () => {
    if (!windowForm || !draft) return;
    if (!windowForm.group_id || !windowForm.start_time || !windowForm.end_time) { toast.error('Completa grupo y horario'); return; }
    const window = { ...windowForm, window_id: editingWindowId || windowForm.window_id || crypto.randomUUID() };
    updateDraft({ availability_windows: editingWindowId ? draft.availability_windows.map((item) => item.window_id === editingWindowId ? { ...item, ...window } : item) : [...draft.availability_windows, window as any] });
    setWindowForm(null);
    setEditingWindowId(null);
  };
  const startEditWindow = (window: any) => { setEditingWindowId(window.window_id); setWindowForm({ window_id: window.window_id, group_id: window.group_id, start_time: window.start_time, end_time: window.end_time }); };
  const removeWindow = (windowId: string) => { if (draft) updateDraft({ availability_windows: draft.availability_windows.filter((item) => item.window_id !== windowId) }); };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><CalendarDays className="h-4 w-4" />Configuración académica</div>
            <h1 className="mt-2 text-3xl font-display font-extrabold tracking-tight">Disponibilidad semanal</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Define la ventana horaria permitida para que cada grupo registre sus clases.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={schoolYearId} onValueChange={setSchoolYearId}><SelectTrigger className="w-48"><SelectValue placeholder="Año escolar" /></SelectTrigger><SelectContent>{catalog.years.map((year) => <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>)}</SelectContent></Select>
            {!draft && <Button onClick={() => createDraftMutation.mutate()} disabled={!schoolYearId || createDraftMutation.isPending}><Plus className="h-4 w-4" />Crear borrador</Button>}
          </div>
        </header>

        {schedule && <div className="flex flex-wrap items-center gap-2"><Badge variant={schedule.status === 'published' ? 'default' : 'secondary'}>{schedule.status === 'published' ? 'Publicado' : `Borrador v${schedule.version}`}</Badge>{schedule.status === 'published' && <span className="text-sm text-muted-foreground">Crea un borrador para proponer cambios a las ventanas.</span>}</div>}

        {draft && <>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4" />Días lectivos</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{DAYS.map((day) => { const active = draft.school_days.includes(day.value); return <Button key={day.value} type="button" variant={active ? 'default' : 'outline'} size="sm" onClick={() => updateDraft({ school_days: active && draft.school_days.length > 1 ? draft.school_days.filter((value) => value !== day.value) : active ? draft.school_days : [...draft.school_days, day.value].sort() })}>{active && <Check className="h-4 w-4" />}{day.label}</Button>; })}</CardContent></Card>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card><CardHeader className="flex flex-row items-center justify-between gap-3"><div><CardTitle className="text-base">Ventanas por grupo</CardTitle><p className="mt-1 text-sm text-muted-foreground">Las clases deben quedar dentro de estas horas y en los días lectivos publicados.</p></div><Button variant="outline" onClick={() => { setEditingWindowId(null); setWindowForm(emptyWindow(catalog)); }}><Plus className="h-4 w-4" />Agregar grupo</Button></CardHeader><CardContent className="space-y-3">{draft.availability_windows.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Todavía no hay ventanas configuradas.</p> : draft.availability_windows.map((window) => <div key={window.window_id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{window.group?.name || catalog.groups.find((item) => item.id === window.group_id)?.name || 'Grupo'}</p><p className="text-sm text-muted-foreground">{window.start_time} - {window.end_time} · {draft.school_days.map((day) => DAYS.find((item) => item.value === day)?.label).join(', ')}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => startEditWindow(window)}>Editar</Button><Button variant="ghost" size="icon" aria-label="Eliminar ventana" onClick={() => removeWindow(window.window_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>)}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">{editingWindowId ? 'Editar ventana' : 'Nueva ventana'}</CardTitle></CardHeader><CardContent>{windowForm ? <div className="space-y-4"><Field label="Grupo"><Select value={windowForm.group_id} onValueChange={(value) => setWindowForm({ ...windowForm, group_id: value })}><SelectTrigger><SelectValue placeholder="Grupo" /></SelectTrigger><SelectContent>{catalog.groups.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field><div className="grid grid-cols-2 gap-3"><Field label="Inicio"><Input type="time" value={windowForm.start_time} onChange={(event) => setWindowForm({ ...windowForm, start_time: event.target.value })} /></Field><Field label="Final"><Input type="time" value={windowForm.end_time} onChange={(event) => setWindowForm({ ...windowForm, end_time: event.target.value })} /></Field></div><div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => { setWindowForm(null); setEditingWindowId(null); }}><X className="h-4 w-4" />Cancelar</Button><Button className="flex-1" onClick={saveWindow}><Check className="h-4 w-4" />Guardar ventana</Button></div></div> : <p className="text-sm text-muted-foreground">Selecciona “Agregar grupo” o edita una ventana existente.</p>}</CardContent></Card>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Save className="h-4 w-4" />Guardar borrador</Button><Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}><SendIcon /><span>Validar y publicar</span></Button></div>
        </>}

        {!schedule && !schedulesQuery.isLoading && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No hay disponibilidad para este año. Crea un borrador para comenzar.</CardContent></Card>}
      </div>
    </DashboardLayout>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="space-y-2"><Label>{label}</Label>{children}</div>;
const SendIcon = () => <Send className="h-4 w-4" />;

export default ScheduleManagementPage;
