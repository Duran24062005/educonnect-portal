import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, CalendarCheck, CalendarDays, Clock3, Loader2, MapPin, Pencil, Save, Trash2, UserRound, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { CalendarCatalog, CalendarRole, CalendarSession, CalendarSessionInput } from '@/api/calendar';
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
  onSave: (input: CalendarSessionInput, sessionId?: string) => Promise<void>;
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
}

const toFormState = (session: CalendarSession | null, catalog: CalendarCatalog): FormState => {
  const source = session || {
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    group: catalog.groups[0],
    area: catalog.areas[0],
    teacher: catalog.teachers[0],
    aula: catalog.aulas[0],
    topic: '',
  } as CalendarSession;

  return {
    date: format(parseISO(source.startAt), 'yyyy-MM-dd'),
    startTime: format(parseISO(source.startAt), 'HH:mm'),
    endTime: format(parseISO(source.endAt), 'HH:mm'),
    groupId: source.group.id,
    areaId: source.area.id,
    teacherId: source.teacher.id,
    aulaId: source.aula.id,
    topic: source.topic,
  };
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
  const [editing, setEditing] = useState(isCreating);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [activating, setActivating] = useState(false);
  const [form, setForm] = useState<FormState>(() => toFormState(session, catalog));
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (open) {
      setEditing(isCreating);
      setForm(toFormState(session, catalog));
      setFormError('');
    }
  }, [open, session, catalog, isCreating]);

  const title = isCreating ? 'Nueva sesión' : editing ? 'Editar sesión' : session.area.name;
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
    } catch {
      setFormError('No se pudo guardar la sesión. Revisa los datos e inténtalo de nuevo.');
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
            {isCreating ? 'Programa una sesión para la agenda demo.' : editing ? 'Actualiza la información de esta sesión.' : 'Consulta el detalle de la clase y sus actividades.'}
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
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Fecha" htmlFor="calendar-date">
                <Input id="calendar-date" type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} />
              </Field>
              <Field label="Inicio" htmlFor="calendar-start-time">
                <Input id="calendar-start-time" type="time" value={form.startTime} onChange={(event) => updateField('startTime', event.target.value)} />
              </Field>
              <Field label="Final" htmlFor="calendar-end-time">
                <Input id="calendar-end-time" type="time" value={form.endTime} onChange={(event) => updateField('endTime', event.target.value)} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Grupo">
                <Select value={form.groupId} onValueChange={(value) => updateField('groupId', value)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona grupo" /></SelectTrigger>
                  <SelectContent>{availableGroups.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Materia">
                <Select value={form.areaId} onValueChange={(value) => updateField('areaId', value)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona materia" /></SelectTrigger>
                  <SelectContent>{catalog.areas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Docente">
                <Select value={form.teacherId} onValueChange={(value) => updateField('teacherId', value)} disabled={role === 'teacher'}>
                  <SelectTrigger><SelectValue placeholder="Selecciona docente" /></SelectTrigger>
                  <SelectContent>{catalog.teachers.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Aula">
                <Select value={form.aulaId} onValueChange={(value) => updateField('aulaId', value)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona aula" /></SelectTrigger>
                  <SelectContent>{catalog.aulas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Tema de la sesión" htmlFor="calendar-topic">
              <Textarea id="calendar-topic" value={form.topic} onChange={(event) => updateField('topic', event.target.value)} placeholder="Ej. Ecuaciones lineales y representación gráfica" rows={3} />
            </Field>

            {formError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {!editing && canEdit && session?.status === 'cancelled' && (
            <Button type="button" variant="outline" className="sm:mr-auto" onClick={handleActivate} disabled={activating}>
              {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
              Reactivar clase
            </Button>
          )}
          {!editing && canEdit && session?.status !== 'cancelled' && (
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

export default CalendarSessionDialog;
