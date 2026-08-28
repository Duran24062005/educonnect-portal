import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, Clock3, Pencil, Plus, Save, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { calendarApi, type CalendarCatalog } from '@/api/calendar';
import { scheduleApi, type ScheduleSlotInput, type WeeklySchedule } from '@/api/schedule';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const DAYS = [
  { value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' }, { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' }, { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' }, { value: 7, label: 'Domingo' },
];

const EMPTY_CATALOG: CalendarCatalog = { years: [], grades: [], groups: [], areas: [], teachers: [], aulas: [] };

const emptySlot = (catalog: CalendarCatalog): ScheduleSlotInput => ({
  group_id: catalog.groups[0]?.id || '',
  area_id: catalog.areas[0]?.id || '',
  teacher_id: catalog.teachers[0]?.id || '',
  aula_id: catalog.aulas[0]?.id || '',
  weekday: 1,
  start_time: '06:15',
  end_time: '07:15',
});

const entityName = (catalog: CalendarCatalog, collection: 'groups' | 'areas' | 'teachers' | 'aulas', id: string) =>
  catalog[collection].find((item) => item.id === id)?.name || 'Sin asignar';

const ScheduleManagementPage = () => {
  const queryClient = useQueryClient();
  const [schoolYearId, setSchoolYearId] = useState('');
  const [workingSchedule, setWorkingSchedule] = useState<WeeklySchedule | null>(null);
  const [slotForm, setSlotForm] = useState<ScheduleSlotInput | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  const catalogQuery = useQuery({
    queryKey: ['schedule-catalog', schoolYearId],
    queryFn: () => calendarApi.catalog('admin', schoolYearId || undefined),
    staleTime: 60_000,
  });
  const catalog = catalogQuery.data || EMPTY_CATALOG;

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
    setSlotForm(null);
    setEditingSlotId(null);
  }, [schoolYearId]);

  useEffect(() => {
    if (baseSchedule) {
      setWorkingSchedule((current) => current?.id === baseSchedule.id ? current : baseSchedule);
      setSlotForm(null);
      setEditingSlotId(null);
    }
  }, [baseSchedule]);

  const schedule = workingSchedule || baseSchedule;
  const draft = schedule?.status === 'draft' ? schedule : null;
  const slots = draft?.slots || [];

  const createDraftMutation = useMutation({
    mutationFn: () => scheduleApi.createDraft(schoolYearId),
    onSuccess: (created) => {
      setWorkingSchedule(created);
      void queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Borrador listo para editar');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo crear el borrador'),
  });

  const saveMutation = useMutation({
    mutationFn: () => scheduleApi.update(draft!.id, {
      school_days: draft!.school_days,
      availability_windows: draft!.availability_windows.map(({ window_id, group_id, start_time, end_time }) => ({ window_id, group_id, start_time, end_time })),
      slots: slots.map(({ slot_id, group_id, area_id, teacher_id, aula_id, weekday, start_time, end_time }) => ({ slot_id, group_id, area_id, teacher_id, aula_id, weekday, start_time, end_time })),
    }),
    onSuccess: (updated) => {
      setWorkingSchedule(updated);
      void queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Borrador guardado');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo guardar el borrador'),
  });

  const publishMutation = useMutation({
    mutationFn: () => scheduleApi.publish(draft!.id),
    onSuccess: (published) => {
      setWorkingSchedule(published);
      void queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Horario publicado');
    },
    onError: (error: any) => {
      const errors = error?.response?.data?.details?.errors;
      toast.error(Array.isArray(errors) ? errors.join(' · ') : error?.response?.data?.message || 'No se pudo publicar el horario');
    },
  });

  const updateDraft = (changes: Partial<WeeklySchedule>) => setWorkingSchedule((current) => current ? { ...current, ...changes } : current);

  const saveSlot = () => {
    if (!slotForm || !draft) return;
    if (!slotForm.group_id || !slotForm.area_id || !slotForm.teacher_id || !slotForm.aula_id) {
      toast.error('Completa grupo, materia, docente y aula');
      return;
    }
    if (!draft.school_days.includes(slotForm.weekday)) {
      toast.error('Selecciona un día lectivo');
      return;
    }
    if (slotForm.start_time >= slotForm.end_time) {
      toast.error('La hora inicial debe ser anterior a la final');
      return;
    }

    const slot = { ...slotForm, slot_id: editingSlotId || slotForm.slot_id || crypto.randomUUID() };
    updateDraft({ slots: editingSlotId ? slots.map((item) => item.slot_id === editingSlotId ? { ...item, ...slot } : item) : [...slots, slot as any] });
    setSlotForm(null);
    setEditingSlotId(null);
  };

  const startEditSlot = (slot: any) => {
    setEditingSlotId(slot.slot_id);
    setSlotForm({
      slot_id: slot.slot_id,
      group_id: slot.group_id,
      area_id: slot.area_id,
      teacher_id: slot.teacher_id,
      aula_id: slot.aula_id,
      weekday: slot.weekday,
      start_time: slot.start_time,
      end_time: slot.end_time,
    });
  };

  const removeSlot = (slotId: string) => updateDraft({ slots: slots.filter((item) => item.slot_id !== slotId) });
  const groupedSlots = DAYS.map((day) => ({ day, slots: slots.filter((slot) => slot.weekday === day.value).sort((a, b) => a.start_time.localeCompare(b.start_time)) }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><CalendarDays className="h-4 w-4" />Configuración académica</div>
            <h1 className="mt-2 text-3xl font-display font-extrabold tracking-tight">Horario semanal por curso</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Configura cada clase con su materia, día y rango horario. Las jornadas definen los límites institucionales.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={schoolYearId} onValueChange={setSchoolYearId}><SelectTrigger className="w-48"><SelectValue placeholder="Año escolar" /></SelectTrigger><SelectContent>{catalog.years.map((year) => <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>)}</SelectContent></Select>
            {!draft && <Button onClick={() => createDraftMutation.mutate()} disabled={!schoolYearId || createDraftMutation.isPending}><Plus className="h-4 w-4" />Crear borrador</Button>}
          </div>
        </header>

        {schedule && <div className="flex flex-wrap items-center gap-2"><Badge variant={schedule.status === 'published' ? 'default' : 'secondary'}>{schedule.status === 'published' ? 'Publicado' : `Borrador v${schedule.version}`}</Badge>{schedule.status === 'published' && <span className="text-sm text-muted-foreground">Crea un borrador para proponer cambios.</span>}</div>}

        {draft && <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4" />Días lectivos</CardTitle>
              <CardDescription>Solo estos días podrán tener clases publicadas.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">{DAYS.map((day) => { const active = draft.school_days.includes(day.value); return <Button key={day.value} type="button" variant={active ? 'default' : 'outline'} size="sm" onClick={() => updateDraft({ school_days: active && draft.school_days.length > 1 ? draft.school_days.filter((value) => value !== day.value) : active ? draft.school_days : [...draft.school_days, day.value].sort() })}>{active && <Check className="h-4 w-4" />}{day.label}</Button>; })}</CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div><CardTitle className="text-base">Clases de la semana</CardTitle><CardDescription className="mt-1">Ejemplo: lunes 06:15-08:15 Inglés y lunes 08:15-09:15 Sociales.</CardDescription></div>
                <Button variant="outline" onClick={() => { setEditingSlotId(null); setSlotForm(emptySlot(catalog)); }}><Plus className="h-4 w-4" />Agregar clase</Button>
              </CardHeader>
              <CardContent className="space-y-5">
                {groupedSlots.every(({ slots: daySlots }) => daySlots.length === 0) && <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Todavía no hay clases configuradas.</p>}
                {groupedSlots.map(({ day, slots: daySlots }) => daySlots.length > 0 && (
                  <section key={day.value} aria-labelledby={`day-${day.value}`}>
                    <div className="mb-2 flex items-center justify-between border-b pb-2"><h2 id={`day-${day.value}`} className="font-semibold">{day.label}</h2><span className="text-xs text-muted-foreground">{daySlots.length} {daySlots.length === 1 ? 'clase' : 'clases'}</span></div>
                    <div className="space-y-2">{daySlots.map((slot) => <div key={slot.slot_id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold">{entityName(catalog, 'areas', slot.area_id)}</p><p className="text-sm text-muted-foreground">{slot.start_time} - {slot.end_time} · {entityName(catalog, 'groups', slot.group_id)}</p><p className="text-xs text-muted-foreground">{entityName(catalog, 'teachers', slot.teacher_id)} · {entityName(catalog, 'aulas', slot.aula_id)}</p></div><div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => startEditSlot(slot)}><Pencil className="h-4 w-4" />Editar</Button><Button variant="ghost" size="icon" aria-label={`Eliminar clase de ${entityName(catalog, 'areas', slot.area_id)}`} onClick={() => removeSlot(slot.slot_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>)}</div>
                  </section>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">{editingSlotId ? 'Editar clase' : 'Nueva clase'}</CardTitle><CardDescription>El bloque debe quedar dentro de la jornada asignada al grupo.</CardDescription></CardHeader>
              <CardContent>{slotForm ? <div className="space-y-4">
                <Field label="Curso"><Select value={slotForm.group_id} onValueChange={(value) => setSlotForm({ ...slotForm, group_id: value })}><SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger><SelectContent>{catalog.groups.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Materia"><Select value={slotForm.area_id} onValueChange={(value) => setSlotForm({ ...slotForm, area_id: value })}><SelectTrigger><SelectValue placeholder="Selecciona una materia" /></SelectTrigger><SelectContent>{catalog.areas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Día"><Select value={String(slotForm.weekday)} onValueChange={(value) => setSlotForm({ ...slotForm, weekday: Number(value) })}><SelectTrigger><SelectValue placeholder="Selecciona un día" /></SelectTrigger><SelectContent>{DAYS.filter((day) => draft.school_days.includes(day.value)).map((day) => <SelectItem key={day.value} value={String(day.value)}>{day.label}</SelectItem>)}</SelectContent></Select></Field>
                <div className="grid grid-cols-2 gap-3"><Field label="Inicio"><Input type="time" value={slotForm.start_time} onChange={(event) => setSlotForm({ ...slotForm, start_time: event.target.value })} /></Field><Field label="Fin"><Input type="time" value={slotForm.end_time} onChange={(event) => setSlotForm({ ...slotForm, end_time: event.target.value })} /></Field></div>
                <Field label="Docente"><Select value={slotForm.teacher_id} onValueChange={(value) => setSlotForm({ ...slotForm, teacher_id: value })}><SelectTrigger><SelectValue placeholder="Selecciona un docente" /></SelectTrigger><SelectContent>{catalog.teachers.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Aula"><Select value={slotForm.aula_id} onValueChange={(value) => setSlotForm({ ...slotForm, aula_id: value })}><SelectTrigger><SelectValue placeholder="Selecciona un aula" /></SelectTrigger><SelectContent>{catalog.aulas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field>
                <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => { setSlotForm(null); setEditingSlotId(null); }}><X className="h-4 w-4" />Cancelar</Button><Button className="flex-1" onClick={saveSlot}><Check className="h-4 w-4" />Guardar clase</Button></div>
              </div> : <p className="text-sm text-muted-foreground">Selecciona “Agregar clase” o edita una clase existente.</p>}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Ventanas por grupo</CardTitle><CardDescription>Estos límites se mantienen para compatibilidad y se toman de la jornada de cada grupo.</CardDescription></CardHeader>
            <CardContent className="space-y-2">{draft.availability_windows.length === 0 ? <p className="text-sm text-muted-foreground">No hay ventanas generales configuradas.</p> : draft.availability_windows.map((window) => <div key={window.window_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><span className="font-medium">{window.group?.name || entityName(catalog, 'groups', window.group_id)}</span><span className="text-sm text-muted-foreground">{window.start_time} - {window.end_time}</span></div>)}</CardContent>
          </Card>

          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Save className="h-4 w-4" />Guardar borrador</Button><Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}><Send className="h-4 w-4" />Validar y publicar</Button></div>
        </>}

        {!schedule && !schedulesQuery.isLoading && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No hay horario para este año. Crea un borrador para comenzar.</CardContent></Card>}
      </div>
    </DashboardLayout>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="space-y-2"><Label>{label}</Label>{children}</div>;

export default ScheduleManagementPage;
