import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CalendarDays, Check, Clock3, FileText, LockKeyhole, MapPin, Save, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { materialsApi, type Material } from '@/api/materials';
import { lessonPlansApi, type LessonPlanInput } from '@/api/lessonPlans';
import type { CalendarRole, CalendarSession, LessonPlan } from '@/api/calendar';
import { formatSessionDate, formatSessionTime } from '@/lib/calendar-utils';

interface CalendarSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: CalendarSession | null;
  role: CalendarRole;
}

interface PlanForm {
  topic: string;
  learning_objective: string;
  description: string;
  teacher_notes: string;
  homework: string;
}

const emptyPlan: PlanForm = { topic: '', learning_objective: '', description: '', teacher_notes: '', homework: '' };
const toPlanForm = (plan: LessonPlan | null): PlanForm => plan ? {
  topic: plan.topic,
  learning_objective: plan.learningObjective,
  description: plan.description,
  teacher_notes: plan.teacherNotes,
  homework: plan.homework,
} : emptyPlan;

const planStatusLabel = (status: CalendarSession['planningStatus']) => status === 'completed' ? 'Planeación completa' : status === 'draft' ? 'Borrador' : 'Pendiente de preparar';
const getErrorMessage = (error: any) => error?.response?.data?.message || 'No se pudo guardar la planeación.';

const CalendarSessionDialog = ({ open, onOpenChange, session, role }: CalendarSessionDialogProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PlanForm>(emptyPlan);
  const [error, setError] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const canEditPlan = role === 'teacher' && session?.status !== 'cancelled' && (session.permissions?.canEditLessonPlan ?? true);

  const planQuery = useQuery({
    queryKey: ['lesson-plan', session?.id],
    queryFn: () => lessonPlansApi.getBySession(session!.id),
    enabled: open && Boolean(session?.id),
    staleTime: 30_000,
  });
  const plan = planQuery.data ?? session?.lessonPlan ?? null;

  useEffect(() => {
    setForm(toPlanForm(plan));
    setError('');
  }, [open, plan, session?.id]);

  useEffect(() => {
    let active = true;
    if (!open || !session?.id || !['teacher', 'student', 'parent'].includes(role)) {
      setMaterials([]);
      return () => { active = false; };
    }
    const load = role === 'teacher'
      ? materialsApi.getTeacherMaterials({ session_id: session.id })
      : materialsApi.getStudentMaterials({ session_id: session.id });
    load.then((result) => { if (active) setMaterials(result.materials); }).catch(() => { if (active) setMaterials([]); });
    return () => { active = false; };
  }, [open, role, session?.id]);

  const saveMutation = useMutation({
    mutationFn: (status: 'draft' | 'completed') => {
      const payload: LessonPlanInput = { session_id: session!.id, ...form, status };
      return plan?.id ? lessonPlansApi.update(plan.id, payload) : lessonPlansApi.create(payload);
    },
    onSuccess: async (saved) => {
      setForm(toPlanForm(saved));
      await queryClient.invalidateQueries({ queryKey: ['calendar'] });
      await queryClient.invalidateQueries({ queryKey: ['lesson-plan', session?.id] });
      toast.success(saved.status === 'completed' ? 'Planeación marcada como completa' : 'Borrador guardado');
      setError('');
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  });

  if (!session) return null;
  const isStudentView = role === 'student' || role === 'parent';
  const visiblePlan = isStudentView && plan?.status !== 'completed' ? null : plan;
  const setField = (key: keyof PlanForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  };
  const savePlan = (status: 'draft' | 'completed') => {
    if (status === 'completed' && (!form.topic.trim() || !form.learning_objective.trim())) {
      setError('Para completar la planeación necesitas tema y objetivo de aprendizaje.');
      return;
    }
    saveMutation.mutate(status);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6"><CalendarDays className="h-5 w-5 text-primary" />{session.area.name} · {session.group.name}</DialogTitle>
          <DialogDescription>La institución administra la clase. Aquí puedes consultar su asignación y, si corresponde, preparar su contenido.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Clase asignada</p><p className="mt-2 text-xl font-display font-bold">{formatSessionDate(session.startAt)}</p><p className="mt-1 text-sm font-semibold tabular-nums">{formatSessionTime(session.startAt)} – {formatSessionTime(session.endAt)}</p></div>
              <Badge variant={session.status === 'cancelled' ? 'secondary' : session.planningStatus === 'completed' ? 'default' : 'outline'}>{session.status === 'cancelled' ? 'Cancelada' : planStatusLabel(session.planningStatus)}</Badge>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <LockedDetail icon={Users} label="Grupo" value={`${session.group.name} · ${session.grade.name}`} />
              <LockedDetail icon={BookOpen} label="Área" value={session.area.name} />
              <LockedDetail icon={MapPin} label="Aula" value={session.aula.name} />
              <LockedDetail icon={Clock3} label="Horario" value={`${formatSessionDate(session.startAt)} · ${formatSessionTime(session.startAt)}–${formatSessionTime(session.endAt)}`} />
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" />Administrado por la institución</p>
          </section>

          <section aria-labelledby="lesson-plan-title">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="lesson-plan-title" className="font-display text-lg font-bold">Planeación de clase</h2><p className="mt-1 text-sm text-muted-foreground">{canEditPlan ? 'Puedes editar el contenido pedagógico de esta clase.' : 'Contenido pedagógico disponible según los permisos de tu rol.'}</p></div>{canEditPlan && <Badge variant="outline">✏ Puedes editar este contenido</Badge>}</div>
            {planQuery.isLoading ? <div className="mt-4 space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-24 w-full" /></div> : canEditPlan ? (
              <div className="mt-4 space-y-4">
                <Field label="Tema" htmlFor="lesson-plan-topic"><Input id="lesson-plan-topic" value={form.topic} onChange={(event) => setField('topic', event.target.value)} placeholder="Ej. Present Simple" /></Field>
                <Field label="Objetivo de aprendizaje" htmlFor="lesson-plan-objective"><Textarea id="lesson-plan-objective" value={form.learning_objective} onChange={(event) => setField('learning_objective', event.target.value)} rows={3} placeholder="Qué podrá comprender o hacer el grupo al finalizar" /></Field>
                <Field label="Descripción" htmlFor="lesson-plan-description"><Textarea id="lesson-plan-description" value={form.description} onChange={(event) => setField('description', event.target.value)} rows={3} placeholder="Secuencia y enfoque de la clase" /></Field>
                <div className="grid gap-4 sm:grid-cols-2"><Field label="Tarea" htmlFor="lesson-plan-homework"><Textarea id="lesson-plan-homework" value={form.homework} onChange={(event) => setField('homework', event.target.value)} rows={3} placeholder="Trabajo para después de clase" /></Field><Field label="Observaciones" htmlFor="lesson-plan-notes"><Textarea id="lesson-plan-notes" value={form.teacher_notes} onChange={(event) => setField('teacher_notes', event.target.value)} rows={3} placeholder="Notas privadas para el docente" /></Field></div>
              </div>
            ) : visiblePlan ? <PlanReadOnly plan={visiblePlan} privateNotes={role === 'admin'} /> : <p className="mt-4 rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Planeación aún no disponible.</p>}
            {error && <p role="alert" className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
          </section>

          {(role === 'teacher' || role === 'student') && <section className="border-t border-border/70 pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Materiales y actividades</h2><p className="text-sm text-muted-foreground">Recursos relacionados con esta clase.</p></div><Button type="button" variant="outline" size="sm" onClick={() => navigate(`/materials?session_id=${session.id}`)}><FileText className="h-4 w-4" />{role === 'teacher' ? 'Gestionar materiales' : 'Ver materiales'}</Button></div>{materials.length > 0 ? <div className="mt-3 space-y-2">{materials.map((material) => <button key={material._id} type="button" onClick={() => navigate(`/materials/${material._id}`)} className="flex w-full items-center justify-between rounded-md border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"><span className="truncate font-medium">{material.title}</span><Badge variant="outline">{material.material_type === 'link' ? 'Enlace' : 'Archivo'}</Badge></button>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Todavía no hay materiales publicados.</p>}{session.pendingActivities.length > 0 && <p className="mt-4 text-sm text-muted-foreground">{session.pendingActivities.length} actividad{session.pendingActivities.length === 1 ? '' : 'es'} relacionada{session.pendingActivities.length === 1 ? '' : 's'}.</p>}</section>}
        </div>

        <DialogFooter>{canEditPlan ? <><Button type="button" variant="outline" onClick={() => savePlan('draft')} disabled={saveMutation.isPending}><Save className="h-4 w-4" />Guardar borrador</Button><Button type="button" onClick={() => savePlan('completed')} disabled={saveMutation.isPending}><Check className="h-4 w-4" />Marcar como completa</Button></> : <Button type="button" onClick={() => onOpenChange(false)}>Cerrar</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) => <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
const LockedDetail = ({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) => <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background p-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-medium">{value}</p></div></div>;
const PlanReadOnly = ({ plan, privateNotes }: { plan: LessonPlan; privateNotes: boolean }) => <div className="mt-4 grid gap-4 sm:grid-cols-2"><ReadOnlyField label="Tema" value={plan.topic} /><ReadOnlyField label="Objetivo de aprendizaje" value={plan.learningObjective} /><ReadOnlyField label="Descripción" value={plan.description} /><ReadOnlyField label="Tarea" value={plan.homework} />{privateNotes && <ReadOnlyField label="Observaciones del docente" value={plan.teacherNotes} />}</div>;
const ReadOnlyField = ({ label, value }: { label: string; value: string }) => <div className="rounded-lg border border-border/60 bg-muted/15 p-3"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm">{value || 'Sin información publicada.'}</p></div>;

export default CalendarSessionDialog;
