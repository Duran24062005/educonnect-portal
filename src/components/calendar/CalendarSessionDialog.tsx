import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BookOpen, CalendarCheck, CalendarDays, Check, Clock3, Info, Loader2, MapPin, Pencil, Save, Trash2, UserRound, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CALENDAR_DATA_SOURCE, type CalendarCatalog, type CalendarRole, type CalendarSession, type CalendarSessionInput } from '@/api/calendar';
import { materialsApi, type Material } from '@/api/materials';
import { scheduleApi } from '@/api/schedule';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { formatSessionDate, formatSessionTime } from '@/lib/calendar-utils';

interface CalendarSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: CalendarSession | null;
  role: CalendarRole;
  catalog: CalendarCatalog;
  schoolYearId: string;
  canEdit: boolean;
  onSave: (input: CalendarSessionInput, sessionId?: string) => Promise<unknown>;
  onCancelSession: (session: CalendarSession) => Promise<void>;
  onActivateSession: (session: CalendarSession) => Promise<void>;
}

interface FormState {
  date: string;
  startTime: string;
  endTime: string;
  groupId: string;
  areaId: string;
  teacherId: string;
  aulaId: string;
  topic: string;
  scheduleSlotId: string;
}

const DAYS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const toFormState = (session: CalendarSession | null, catalog: CalendarCatalog): FormState => {
  const startAt = session?.startAt ?? new Date().toISOString();
  const endAt = session?.endAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();

  return {
    date: format(parseISO(startAt), 'yyyy-MM-dd'),
    startTime: format(parseISO(startAt), 'HH:mm'),
    endTime: format(parseISO(endAt), 'HH:mm'),
    groupId: session?.group?.id ?? catalog.groups[0]?.id ?? '',
    areaId: session?.area?.id ?? catalog.areas[0]?.id ?? '',
    teacherId: session?.teacher?.id ?? catalog.teachers[0]?.id ?? '',
    aulaId: session?.aula?.id ?? catalog.aulas[0]?.id ?? '',
    topic: session?.topic ?? '',
    scheduleSlotId: '',
  };
};

const weekdayForDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? 0 : date.getDay() === 0 ? 7 : date.getDay();
};

const dateForWeekday = (value: string, weekday: number) => {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime()) || !weekday) return value;
  const current = weekdayForDate(value);
  const offset = (weekday - current + 7) % 7;
  date.setDate(date.getDate() + offset);
  return format(date, 'yyyy-MM-dd');
};

const getSaveErrorMessage = (error: any) => {
  const data = error?.response?.data;
  const detailMessages = Array.isArray(data?.details)
    ? data.details.map((detail: any) => detail?.message).filter(Boolean)
    : [];
  const ruleMessages = Array.isArray(data?.details?.errors) ? data.details.errors : [];
  return [...ruleMessages, ...detailMessages].join(' · ') || data?.message || 'No se pudo guardar la sesión.';
};

const CalendarSessionDialog = ({
  open,
  onOpenChange,
  session,
  role,
  catalog,
  schoolYearId,
  canEdit,
  onSave,
  onCancelSession,
  onActivateSession,
}: CalendarSessionDialogProps) => {
  const isCreating = !session;
  const isTeacherScheduleSession = role === 'teacher' && Boolean(session?.scheduleId);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(isCreating);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [activating, setActivating] = useState(false);
  const [form, setForm] = useState<FormState>(() => toFormState(session, catalog));
  const [formError, setFormError] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const availabilityQuery = useQuery({
    queryKey: ['teacher-schedule-availability', schoolYearId],
    queryFn: () => scheduleApi.teacherAvailability(schoolYearId),
    enabled: open && isCreating && role === 'teacher' && CALENDAR_DATA_SOURCE === 'api' && Boolean(schoolYearId),
    staleTime: 60_000,
  });
  const availability = availabilityQuery.data?.schedules?.[0] || null;
  const scheduleSlots = useMemo(() => availability?.slots || [], [availability?.slots]);
  const selectedSlot = scheduleSlots.find((slot) => slot.slot_id === form.scheduleSlotId);
  const teacherBlockLocked = role === 'teacher' && isCreating && scheduleSlots.length > 0;

  useEffect(() => {
    if (open) {
      setEditing(isCreating);
      setForm(toFormState(session, catalog));
      setFormError('');
    }
  }, [open, session, catalog, isCreating]);

  useEffect(() => {
    if (!open || !isCreating || role !== 'teacher' || !availability || form.scheduleSlotId) return;
    const firstSlot = availability.slots[0];
    if (firstSlot) {
      setForm((current) => ({
        ...current,
        scheduleSlotId: firstSlot.slot_id,
        groupId: firstSlot.group_id,
        areaId: firstSlot.area_id,
        teacherId: firstSlot.teacher_id,
        aulaId: firstSlot.aula_id,
        date: dateForWeekday(current.date, firstSlot.weekday),
        startTime: firstSlot.start_time,
        endTime: firstSlot.end_time,
      }));
      return;
    }
    const firstWindow = availability.availability_windows[0];
    if (firstWindow) {
      setForm((current) => ({ ...current, groupId: firstWindow.group_id, teacherId: catalog.teachers[0]?.id || current.teacherId }));
    }
  }, [availability, catalog.teachers, form.scheduleSlotId, isCreating, open, role]);

  useEffect(() => {
    let active = true;
    const sessionId = session?.id;
    if (!open || !sessionId || !['teacher', 'student'].includes(role)) {
      setMaterials([]);
      return () => { active = false; };
    }

    setMaterialsLoading(true);
    const load = role === 'teacher'
      ? materialsApi.getTeacherMaterials({ session_id: sessionId })
      : materialsApi.getStudentMaterials({ session_id: sessionId });
    load.then((result) => {
      if (active) setMaterials(result.materials);
    }).catch(() => {
      if (active) setMaterials([]);
    }).finally(() => {
      if (active) setMaterialsLoading(false);
    });

    return () => { active = false; };
  }, [open, role, session?.id]);

  const title = isCreating ? 'Nueva sesión' : editing ? 'Editar sesión' : session?.area?.name || 'Detalle de sesión';
  const availableGroups = useMemo(() => catalog.groups, [catalog.groups]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError('');
  };

  const handleSave = async () => {
    if (!form.topic.trim()) {
      setFormError('Escribe el tema de la sesión.');
      return;
    }
    if (!form.groupId || !form.areaId || !form.teacherId || !form.aulaId) {
      setFormError('Selecciona grupo, materia, docente y aula.');
      return;
    }

    if (role === 'teacher' && isCreating && CALENDAR_DATA_SOURCE === 'api') {
      if (availabilityQuery.isLoading) {
        setFormError('Espera a que carguen tus bloques publicados.');
        return;
      }
      if (!availability || (!availability.slots.length && !availability.availability_windows.length)) {
        setFormError('No tienes bloques publicados para este año escolar. Pide al administrador que publique el horario.');
        return;
      }
      if (availability.slots.length && !selectedSlot) {
        setFormError('Selecciona un bloque publicado para crear la sesión.');
        return;
      }
      if (selectedSlot && weekdayForDate(form.date) !== selectedSlot.weekday) {
        setFormError(`El bloque seleccionado corresponde al ${DAYS[selectedSlot.weekday]}. Cambia la fecha a ese día.`);
        return;
      }
    }

    const startAt = new Date(`${form.date}T${form.startTime}:00`);
    const endAt = new Date(`${form.date}T${form.endTime}:00`);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
      setFormError('La hora final debe ser posterior a la hora de inicio.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        schoolYearId: schoolYearId || catalog.years[0]?.id || '',
        groupId: form.groupId,
        areaId: form.areaId,
        teacherId: form.teacherId,
        aulaId: form.aulaId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        topic: form.topic.trim(),
      }, session?.id);
      onOpenChange(false);
    } catch (error) {
      setFormError(getSaveErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!session) return;
    setCancelling(true);
    try {
      await onCancelSession(session);
      onOpenChange(false);
    } catch {
      setFormError('No se pudo cancelar la sesión.');
    } finally {
      setCancelling(false);
    }
  };

  const handleActivate = async () => {
    if (!session) return;
    setActivating(true);
    try {
      await onActivateSession(session);
      onOpenChange(false);
    } catch {
      setFormError('No se pudo reactivar la sesión.');
    } finally {
      setActivating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            <CalendarDays className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {isCreating ? 'Registra una clase dentro de la disponibilidad publicada para el grupo.' : editing ? 'Actualiza la información de esta sesión.' : 'Consulta el detalle de la clase y sus actividades.'}
          </DialogDescription>
        </DialogHeader>

        {!editing && session ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={session.status === 'cancelled' ? 'secondary' : 'default'}>
                {session.status === 'cancelled' ? 'Cancelada' : 'Programada'}
              </Badge>
              {session.pendingActivities.length > 0 && <Badge variant="outline">{session.pendingActivities.length} actividad{session.pendingActivities.length === 1 ? '' : 'es'}</Badge>}
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{formatSessionDate(session.startAt)}</p>
              <p className="mt-2 text-2xl font-display font-bold">{formatSessionTime(session.startAt)} - {formatSessionTime(session.endAt)}</p>
              <p className="mt-2 text-sm text-muted-foreground">{session.topic}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow icon={BookOpen} label="Materia" value={session.area.name} />
              <DetailRow icon={UserRound} label="Docente" value={session.teacher.name} />
              <DetailRow icon={Users} label="Grupo" value={`${session.group.name} · ${session.grade.name}`} />
              <DetailRow icon={MapPin} label="Aula" value={session.aula.name} />
            </div>

            <div className="border-t border-border/70 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Actividades relacionadas</p>
                  <p className="text-sm text-muted-foreground">Tareas asociadas al grupo y la materia.</p>
                </div>
                <Clock3 className="h-4 w-4 text-muted-foreground" />
              </div>
              {session.pendingActivities.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {session.pendingActivities.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2 text-sm">
                      <span className="min-w-0 truncate">{item.title}</span>
                      <Badge variant={item.status === 'overdue' ? 'destructive' : item.status === 'submitted' ? 'secondary' : 'outline'}>
                        {item.status === 'overdue' ? 'Vencida' : item.status === 'submitted' ? 'Entregada' : 'Pendiente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No hay actividades pendientes para esta sesión.</p>
              )}
            </div>

            <div className="border-t border-border/70 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Materiales de la sesión</p>
                  <p className="text-sm text-muted-foreground">Guías, documentos y enlaces publicados para este grupo.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/materials?session_id=${session.id}`)}>
                  <FolderOpenIcon />{role === 'teacher' ? 'Gestionar' : 'Ver materiales'}
                </Button>
              </div>
              {materialsLoading ? (
                <p className="mt-3 text-sm text-muted-foreground">Cargando materiales…</p>
              ) : materials.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {materials.map((material) => {
                    const href = material.material_type === 'link' ? material.link_url : material.file_url;
                    return (
                      <a key={material._id} href={href || '#'} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2 text-sm transition-colors hover:border-primary/50">
                        <span className="min-w-0 truncate font-medium">{material.title}</span>
                        <Badge variant="outline">{material.material_type === 'link' ? 'Enlace' : 'Archivo'}</Badge>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Todavía no hay materiales para esta sesión.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={selectedSlot ? `Fecha (${DAYS[selectedSlot.weekday]})` : 'Fecha'} htmlFor="calendar-date">
                <Input id="calendar-date" type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} disabled={isTeacherScheduleSession} />
              </Field>
              <Field label="Inicio" htmlFor="calendar-start-time">
                <Input id="calendar-start-time" type="time" value={form.startTime} onChange={(event) => updateField('startTime', event.target.value)} disabled={isTeacherScheduleSession || teacherBlockLocked} />
              </Field>
              <Field label="Final" htmlFor="calendar-end-time">
                <Input id="calendar-end-time" type="time" value={form.endTime} onChange={(event) => updateField('endTime', event.target.value)} disabled={isTeacherScheduleSession || teacherBlockLocked} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Grupo">
                <Select value={form.groupId} onValueChange={(value) => updateField('groupId', value)} disabled={isTeacherScheduleSession || teacherBlockLocked}>
                  <SelectTrigger><SelectValue placeholder="Selecciona grupo" /></SelectTrigger>
                  <SelectContent>{availableGroups.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Materia">
                <Select value={form.areaId} onValueChange={(value) => updateField('areaId', value)} disabled={isTeacherScheduleSession || teacherBlockLocked}>
                  <SelectTrigger><SelectValue placeholder="Selecciona materia" /></SelectTrigger>
                  <SelectContent>{catalog.areas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Docente">
                <Select value={form.teacherId} onValueChange={(value) => updateField('teacherId', value)} disabled={role === 'teacher' || teacherBlockLocked}>
                  <SelectTrigger><SelectValue placeholder="Selecciona docente" /></SelectTrigger>
                  <SelectContent>{catalog.teachers.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Aula">
                <Select value={form.aulaId} onValueChange={(value) => updateField('aulaId', value)} disabled={isTeacherScheduleSession || teacherBlockLocked}>
                  <SelectTrigger><SelectValue placeholder="Selecciona aula" /></SelectTrigger>
                  <SelectContent>{catalog.aulas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Tema de la sesión" htmlFor="calendar-topic">
              <Textarea id="calendar-topic" value={form.topic} onChange={(event) => updateField('topic', event.target.value)} placeholder="Ej. Ecuaciones lineales y representación gráfica" rows={3} />
            </Field>

            {role === 'teacher' && isCreating && CALENDAR_DATA_SOURCE === 'api' && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Elige un bloque publicado</p>
                    <p className="mt-1 text-sm text-muted-foreground">El grupo, la materia y la hora se validan contra este horario. La fecha debe caer en el día indicado.</p>
                    {availabilityQuery.isLoading ? (
                      <p className="mt-3 text-sm text-muted-foreground">Cargando tus bloques…</p>
                    ) : scheduleSlots.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        <Label htmlFor="calendar-schedule-slot">Bloque de clase</Label>
                        <Select value={form.scheduleSlotId} onValueChange={(value) => {
                          const slot = scheduleSlots.find((item) => item.slot_id === value);
                          if (!slot) return;
                          setForm((current) => ({
                            ...current,
                            scheduleSlotId: value,
                            groupId: slot.group_id,
                            areaId: slot.area_id,
                            teacherId: slot.teacher_id,
                            aulaId: slot.aula_id,
                            date: dateForWeekday(current.date, slot.weekday),
                            startTime: slot.start_time,
                            endTime: slot.end_time,
                          }));
                          setFormError('');
                        }}>
                          <SelectTrigger id="calendar-schedule-slot" aria-label="Bloque de clase"><SelectValue placeholder="Selecciona un bloque" /></SelectTrigger>
                          <SelectContent>{scheduleSlots.map((slot) => <SelectItem key={slot.slot_id} value={slot.slot_id}>{DAYS[slot.weekday]} · {slot.start_time}–{slot.end_time} · {slot.group.name} · {slot.area.name}</SelectItem>)}</SelectContent>
                        </Select>
                        {selectedSlot && <p className="flex items-center gap-1.5 text-xs text-primary"><Check className="h-3.5 w-3.5" />{selectedSlot.group.name} · {selectedSlot.area.name} · {DAYS[selectedSlot.weekday]} {selectedSlot.start_time}–{selectedSlot.end_time}</p>}
                      </div>
                    ) : availability?.availability_windows.length ? (
                      <div className="mt-3 space-y-2 text-sm"><p className="font-medium">Jornadas disponibles</p>{availability.availability_windows.map((window) => <div key={window.window_id} className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2"><span>{window.group.name}</span><span className="text-muted-foreground">{window.start_time}–{window.end_time}</span></div>)}</div>
                    ) : (
                      <p className="mt-3 text-sm text-destructive">No hay bloques publicados para este año escolar.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {formError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {!editing && canEdit && role === 'admin' && session?.status === 'cancelled' && (
            <Button type="button" variant="outline" className="sm:mr-auto" onClick={handleActivate} disabled={activating}>
              {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
              Reactivar clase
            </Button>
          )}
          {!editing && canEdit && role === 'admin' && session?.status !== 'cancelled' && (
            <>
              <Button type="button" variant="outline" className="sm:mr-auto" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Cancelar clase
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" />Editar
              </Button>
            </>
          )}
          {!editing && role === 'teacher' && session?.scheduleId && session.status !== 'cancelled' && (
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />Registrar tema
            </Button>
          )}
          {editing && (
            <>
              {!isCreating && <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Volver al detalle</Button>}
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isCreating ? 'Crear sesión' : 'Guardar cambios'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
  </div>
);

const DetailRow = ({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) => (
  <div className="flex items-start gap-3 rounded-md border border-border/60 bg-muted/15 p-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  </div>
);

const FolderOpenIcon = () => <BookOpen className="h-4 w-4" />;

export default CalendarSessionDialog;
