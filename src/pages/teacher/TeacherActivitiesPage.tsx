import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { activitiesApi, ACTIVITY_ALLOWED_EXTENSIONS, type Activity, type ActivityAllowedExtension, type TeacherActivitySubmissionSummary } from '@/api/activities';
import { academicApi } from '@/api/academic';
import { groupsApi } from '@/api/groups';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMediaUrl } from '@/lib/media';
import { assertObjectId, isValidObjectId } from '@/lib/object-id';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, Loader2, Pencil, Plus, Save } from 'lucide-react';

type CriterionForm = {
  title: string;
  description: string;
  max_points: string;
};

type ActivityForm = {
  title: string;
  description: string;
  context: string;
  period_id: string;
  open_at: string;
  due_at: string;
  allowed_extensions: ActivityAllowedExtension[];
  rubric_criteria: CriterionForm[];
};

type ReviewForm = {
  rubric_scores: Array<{
    criterion_id: string;
    title: string;
    max_points: number;
    earned_points: string;
    feedback: string;
  }>;
  teacher_feedback: string;
};

const unwrap = (response: any) => response?.data?.data ?? response?.data;

const defaultCriterion = (): CriterionForm => ({
  title: '',
  description: '',
  max_points: '10',
});

const createInitialForm = (periodId = ''): ActivityForm => ({
  title: '',
  description: '',
  context: '',
  period_id: periodId,
  open_at: '',
  due_at: '',
  allowed_extensions: ['pdf'],
  rubric_criteria: [defaultCriterion()],
});

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const parsePositiveNumber = (value: string) => {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const buildReviewForm = (activity: Activity, row: TeacherActivitySubmissionSummary | null): ReviewForm => ({
  rubric_scores: activity.rubric_criteria.map((criterion) => {
    const existing = row?.submission?.rubric_scores.find((score) => score.criterion_id === criterion._id);
    return {
      criterion_id: criterion._id,
      title: criterion.title,
      max_points: criterion.max_points,
      earned_points: existing ? String(existing.earned_points) : '',
      feedback: existing?.feedback || '',
    };
  }),
  teacher_feedback: row?.submission?.teacher_feedback || '',
});

const getStateBadge = (status: string) => {
  if (status === 'graded') return { label: 'Calificada', variant: 'default' as const };
  if (status === 'submitted') return { label: 'Entregada', variant: 'secondary' as const };
  if (status === 'late') return { label: 'Vencida', variant: 'destructive' as const };
  if (status === 'upcoming') return { label: 'Programada', variant: 'outline' as const };
  return { label: 'Pendiente', variant: 'outline' as const };
};

const TeacherActivitiesPage = () => {
  const { groupId, areaId } = useParams<{ groupId: string; areaId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [contextLoading, setContextLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingActivity, setSavingActivity] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [assignment, setAssignment] = useState<{
    groupName: string;
    gradeName: string;
    areaName: string;
    schoolYearId: string;
  } | null>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [submissions, setSubmissions] = useState<TeacherActivitySubmissionSummary[]>([]);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingRubricLocked, setEditingRubricLocked] = useState(false);
  const [form, setForm] = useState<ActivityForm>(createInitialForm());
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reviewForm, setReviewForm] = useState<ReviewForm>({ rubric_scores: [], teacher_feedback: '' });
  const openAtInputRef = useRef<HTMLInputElement | null>(null);
  const dueAtInputRef = useRef<HTMLInputElement | null>(null);

  const validParams = Boolean(groupId && areaId && isValidObjectId(groupId) && isValidObjectId(areaId));

  const resetForm = (periodId = periods[0]?._id || '') => {
    setEditingActivityId(null);
    setEditingRubricLocked(false);
    setForm(createInitialForm(periodId));
  };

  const loadContext = async () => {
    if (!validParams || !groupId || !areaId) {
      toast.error('La ruta de actividades es inválida');
      setContextLoading(false);
      return;
    }

    setContextLoading(true);
    try {
      const [groupRes, areasRes] = await Promise.all([
        groupsApi.get(groupId),
        academicApi.getAreas(),
      ]);
      const group = unwrap(groupRes);
      const areasPayload = unwrap(areasRes);
      const areas = Array.isArray(areasPayload?.areas) ? areasPayload.areas : Array.isArray(areasPayload) ? areasPayload : [];
      const area = areas.find((item: any) => item?._id === areaId);
      const schoolYearId = searchParams.get('school_year_id')
        || group?.school_year_id?._id
        || group?.school_year_id;

      if (!schoolYearId || !isValidObjectId(schoolYearId)) {
        throw new Error('No se pudo determinar el año escolar');
      }

      const periodsRes = await academicApi.getPeriods(schoolYearId);
      const periodsPayload = unwrap(periodsRes);
      const loadedPeriods = Array.isArray(periodsPayload?.periods)
        ? periodsPayload.periods
        : Array.isArray(periodsPayload)
          ? periodsPayload
          : [];

      setAssignment({
        groupName: group?.name || 'Grupo',
        gradeName: group?.grade_id?.name || 'N/A',
        areaName: area?.name || 'Área',
        schoolYearId,
      });
      setPeriods(loadedPeriods);
      setForm((current) => (current.period_id ? current : { ...current, period_id: loadedPeriods[0]?._id || '' }));
    } catch {
      toast.error('No se pudo cargar el contexto de la asignación');
    } finally {
      setContextLoading(false);
    }
  };

  const loadActivities = async () => {
    if (!groupId || !areaId || !validParams) return;
    setActivitiesLoading(true);
    try {
      const result = await activitiesApi.getTeacherActivities({ group_id: groupId, area_id: areaId });
      setActivities(result.activities);
      setSelectedActivityId((current) => {
        if (current && result.activities.some((activity) => activity._id === current)) return current;
        return result.activities[0]?._id || '';
      });
    } catch {
      setActivities([]);
      setSelectedActivityId('');
      toast.error('No se pudieron cargar las actividades');
    } finally {
      setActivitiesLoading(false);
    }
  };

  const loadSelectedActivity = async (activityId: string, nextStudentId?: string) => {
    if (!activityId) {
      setSelectedActivity(null);
      setSubmissions([]);
      setSelectedStudentId('');
      setReviewForm({ rubric_scores: [], teacher_feedback: '' });
      return;
    }

    setDetailLoading(true);
    try {
      const result = await activitiesApi.getTeacherActivitySubmissions(activityId);
      setSelectedActivity(result.activity);
      setSubmissions(result.submissions);

      const preferredStudentId = nextStudentId || selectedStudentId;
      const selectedRow = result.submissions.find((item) => item.student._id === preferredStudentId && item.submission)
        || result.submissions.find((item) => item.submission)
        || null;

      setSelectedStudentId(selectedRow?.student._id || '');
      setReviewForm(buildReviewForm(result.activity, selectedRow));
    } catch {
      setSelectedActivity(null);
      setSubmissions([]);
      setSelectedStudentId('');
      setReviewForm({ rubric_scores: [], teacher_feedback: '' });
      toast.error('No se pudo cargar el detalle de la actividad');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadContext();
  }, [groupId, areaId, searchParams.toString()]);

  useEffect(() => {
    if (!validParams) return;
    void loadActivities();
  }, [groupId, areaId]);

  useEffect(() => {
    if (!selectedActivityId) {
      setSelectedActivity(null);
      setSubmissions([]);
      setSelectedStudentId('');
      setReviewForm({ rubric_scores: [], teacher_feedback: '' });
      return;
    }
    void loadSelectedActivity(selectedActivityId);
  }, [selectedActivityId]);

  const selectedSubmissionRow = useMemo(
    () => submissions.find((row) => row.student._id === selectedStudentId) || null,
    [submissions, selectedStudentId]
  );

  const setFormField = (key: keyof ActivityForm, value: string | ActivityAllowedExtension[] | CriterionForm[]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateCriterion = (index: number, key: keyof CriterionForm, value: string) => {
    setForm((current) => ({
      ...current,
      rubric_criteria: current.rubric_criteria.map((criterion, criterionIndex) =>
        criterionIndex === index ? { ...criterion, [key]: value } : criterion
      ),
    }));
  };

  const toggleExtension = (extension: ActivityAllowedExtension, checked: boolean) => {
    setForm((current) => ({
      ...current,
      allowed_extensions: checked
        ? [...new Set([...current.allowed_extensions, extension])]
        : current.allowed_extensions.filter((item) => item !== extension),
    }));
  };

  const startEdit = (activity: Activity) => {
    setEditingActivityId(activity._id);
    setEditingRubricLocked(activity.rubric_locked);
    setSelectedActivityId(activity._id);
    setForm({
      title: activity.title,
      description: activity.description || '',
      context: activity.context,
      period_id: activity.period?._id || '',
      open_at: toDateTimeLocal(activity.open_at),
      due_at: toDateTimeLocal(activity.due_at),
      allowed_extensions: activity.allowed_extensions,
      rubric_criteria: activity.rubric_criteria.map((criterion) => ({
        title: criterion.title,
        description: criterion.description || '',
        max_points: String(criterion.max_points),
      })),
    });
  };

  const submitActivity = async () => {
    if (!groupId || !areaId) return;
    const resolvedPeriodId = form.period_id || periods[0]?._id || '';
    const resolvedOpenAt = form.open_at || openAtInputRef.current?.value || '';
    const resolvedDueAt = form.due_at || dueAtInputRef.current?.value || '';

    if (!form.title.trim() || !form.context.trim() || !resolvedPeriodId || !resolvedOpenAt) {
      const missingFields = [
        !form.title.trim() ? 'título' : null,
        !form.context.trim() ? 'contexto' : null,
        !resolvedPeriodId ? 'periodo' : null,
        !resolvedOpenAt ? 'apertura' : null,
      ].filter(Boolean);
      toast.error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
      return;
    }
    if (form.allowed_extensions.length === 0) {
      toast.error('Selecciona al menos un formato permitido');
      return;
    }
    if (form.rubric_criteria.some((criterion) => !criterion.title.trim() || Number(criterion.max_points) <= 0)) {
      toast.error('Cada criterio debe tener nombre y puntaje mayor a 0');
      return;
    }

    const openAt = new Date(resolvedOpenAt);
    const dueAt = resolvedDueAt ? new Date(resolvedDueAt) : new Date(openAt.getTime() + (60 * 60 * 1000));
    if (Number.isNaN(openAt.getTime()) || Number.isNaN(dueAt.getTime())) {
      toast.error('Las fechas de apertura o vencimiento no son válidas');
      return;
    }
    if (openAt >= dueAt) {
      toast.error('La fecha de vencimiento debe ser posterior a la apertura');
      return;
    }

    const normalizedCriteria = form.rubric_criteria.map((criterion) => ({
      title: criterion.title.trim(),
      description: criterion.description.trim() || null,
      max_points: parsePositiveNumber(criterion.max_points),
    }));
    if (normalizedCriteria.some((criterion) => !Number.isFinite(criterion.max_points) || criterion.max_points <= 0)) {
      toast.error('Cada criterio debe tener un puntaje numérico válido mayor a 0');
      return;
    }

    setSavingActivity(true);
    try {
      const normalizedGroupId = assertObjectId(groupId, 'group_id');
      const normalizedAreaId = assertObjectId(areaId, 'area_id');
      const normalizedPeriodId = assertObjectId(resolvedPeriodId, 'period_id');
      const basePayload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        context: form.context.trim(),
        open_at: openAt.toISOString(),
        due_at: resolvedDueAt ? dueAt.toISOString() : undefined,
        allowed_extensions: form.allowed_extensions,
      };

      let activityId = editingActivityId;
      if (editingActivityId) {
        const response = await activitiesApi.updateTeacherActivity(editingActivityId, {
          ...basePayload,
          ...(editingRubricLocked
            ? {}
            : {
                rubric_criteria: normalizedCriteria,
              }),
        });
        activityId = response.activity._id;
        toast.success('Actividad actualizada');
      } else {
        const response = await activitiesApi.createTeacherActivity({
          ...basePayload,
          rubric_criteria: normalizedCriteria,
          group_id: normalizedGroupId,
          area_id: normalizedAreaId,
          period_id: normalizedPeriodId,
        });
        activityId = response.activity._id;
        toast.success('Actividad creada');
      }

      await loadActivities();
      if (activityId) {
        setSelectedActivityId(activityId);
        await loadSelectedActivity(activityId);
      }
      resetForm(form.period_id || periods[0]?._id || '');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'No se pudo guardar la actividad');
    } finally {
      setSavingActivity(false);
    }
  };

  const saveReview = async () => {
    if (!selectedActivity || !selectedStudentId) return;
    if (reviewForm.rubric_scores.some((score) => score.earned_points === '')) {
      toast.error('Debes calificar todos los criterios');
      return;
    }

    setSavingReview(true);
    try {
      await activitiesApi.reviewTeacherActivitySubmission(selectedActivity._id, selectedStudentId, {
        rubric_scores: reviewForm.rubric_scores.map((score) => ({
          criterion_id: score.criterion_id,
          earned_points: Number(score.earned_points),
          feedback: score.feedback.trim() || null,
        })),
        teacher_feedback: reviewForm.teacher_feedback.trim() || null,
      });
      toast.success('Calificación guardada');
      await loadSelectedActivity(selectedActivity._id, selectedStudentId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'No se pudo guardar la revisión');
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" className="mb-2 px-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-display font-bold">Actividades Calificables</h1>
          {contextLoading ? (
            <Skeleton className="mt-2 h-5 w-72" />
          ) : assignment ? (
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">Grupo {assignment.groupName}</Badge>
              <Badge variant="outline">Grado {assignment.gradeName}</Badge>
              <Badge variant="secondary">{assignment.areaName}</Badge>
            </div>
          ) : (
            <p className="text-muted-foreground">No se pudo resolver la asignación docente.</p>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>{editingActivityId ? 'Editar actividad' : 'Nueva actividad'}</CardTitle>
              {editingActivityId && (
                <Button variant="outline" onClick={() => resetForm(selectedActivity?.period?._id || periods[0]?._id || '')}>
                  Cancelar edición
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(event) => setFormField('title', event.target.value)} placeholder="Taller de fracciones" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descripción opcional</Label>
                  <Textarea value={form.description} onChange={(event) => setFormField('description', event.target.value)} rows={3} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Contexto</Label>
                  <Textarea value={form.context} onChange={(event) => setFormField('context', event.target.value)} rows={6} />
                </div>
              <div className="space-y-2">
                  <Label>Periodo</Label>
                  <Select value={form.period_id} onValueChange={(value) => setFormField('period_id', value)} disabled={Boolean(editingActivityId)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period._id} value={period._id}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Apertura</Label>
                  <Input
                    ref={openAtInputRef}
                    type="datetime-local"
                    value={form.open_at}
                    onChange={(event) => setFormField('open_at', event.target.value)}
                    onInput={(event) => setFormField('open_at', (event.target as HTMLInputElement).value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimiento</Label>
                  <Input
                    ref={dueAtInputRef}
                    type="datetime-local"
                    value={form.due_at}
                    onChange={(event) => setFormField('due_at', event.target.value)}
                    onInput={(event) => setFormField('due_at', (event.target as HTMLInputElement).value)}
                  />
                  <p className="text-xs text-muted-foreground">Opcional. Si no lo defines, se asignará una hora después de la apertura.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Formatos permitidos</Label>
                  <p className="text-sm text-muted-foreground">El estudiante podrá subir un solo archivo usando cualquiera de los formatos seleccionados.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {ACTIVITY_ALLOWED_EXTENSIONS.map((extension) => (
                    <label key={extension} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                      <Checkbox
                        checked={form.allowed_extensions.includes(extension)}
                        onCheckedChange={(checked) => toggleExtension(extension, checked === true)}
                      />
                      <span className="uppercase">{extension}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Rúbrica evaluativa</Label>
                    <p className="text-sm text-muted-foreground">Define criterios y puntajes máximos para calificar la entrega.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={editingRubricLocked}
                    onClick={() => setForm((current) => ({
                      ...current,
                      rubric_criteria: [...current.rubric_criteria, defaultCriterion()],
                    }))}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar criterio
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.rubric_criteria.map((criterion, index) => (
                    <div key={`${index}-${criterion.title}`} className="rounded-2xl border border-border/60 p-4">
                      <div className="grid gap-4 md:grid-cols-[1fr_160px_auto]">
                        <div className="space-y-2">
                          <Label>Criterio</Label>
                          <Input
                            value={criterion.title}
                            disabled={editingRubricLocked}
                            onChange={(event) => updateCriterion(index, 'title', event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Puntaje máximo</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.1"
                            value={criterion.max_points}
                            disabled={editingRubricLocked}
                            onChange={(event) => updateCriterion(index, 'max_points', event.target.value)}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={form.rubric_criteria.length === 1 || editingRubricLocked}
                            onClick={() => setForm((current) => ({
                              ...current,
                              rubric_criteria: current.rubric_criteria.filter((_, criterionIndex) => criterionIndex !== index),
                            }))}
                          >
                            Quitar
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label>Descripción opcional</Label>
                        <Textarea
                          value={criterion.description}
                          disabled={editingRubricLocked}
                          onChange={(event) => updateCriterion(index, 'description', event.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={submitActivity} disabled={savingActivity}>
                  {savingActivity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {editingActivityId ? 'Guardar cambios' : 'Crear actividad'}
                </Button>
                {editingRubricLocked && (
                  <p className="text-sm text-muted-foreground">La rúbrica de esta actividad ya está bloqueada porque existen entregas.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividades publicadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activitiesLoading ? (
                Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 w-full" />)
              ) : activities.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Aún no hay actividades para esta asignación.
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity._id}
                    className={`rounded-2xl border p-4 ${selectedActivityId === activity._id ? 'border-primary bg-primary/5' : 'border-border/60'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.period?.name || 'Sin periodo'} · vence {formatDateTime(activity.due_at)}
                        </p>
                      </div>
                      <Badge variant="outline">{activity.rubric_max_points} pts</Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-muted/40 p-2">
                        <p className="text-muted-foreground">Grupo</p>
                        <p className="font-semibold">{activity.submission_summary?.total_students ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <p className="text-muted-foreground">Entregas</p>
                        <p className="font-semibold">{activity.submission_summary?.submitted_count ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <p className="text-muted-foreground">Calif.</p>
                        <p className="font-semibold">{activity.submission_summary?.graded_count ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <p className="text-muted-foreground">Tarde</p>
                        <p className="font-semibold">{activity.submission_summary?.late_count ?? 0}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedActivityId(activity._id)}>
                        Revisar
                      </Button>
                      <Button size="sm" onClick={() => startEdit(activity)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entregas del grupo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {detailLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : !selectedActivity ? (
              <p className="text-sm text-muted-foreground">Selecciona una actividad para revisar las entregas del grupo.</p>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Actividad</p>
                    <p className="mt-1 text-lg font-display font-bold">{selectedActivity.title}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Periodo</p>
                    <p className="mt-1 text-lg font-display font-bold">{selectedActivity.period?.name || 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Vence</p>
                    <p className="mt-1 text-lg font-display font-bold">{formatDateTime(selectedActivity.due_at)}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Puntaje total</p>
                    <p className="mt-1 text-lg font-display font-bold">{selectedActivity.rubric_max_points}</p>
                  </div>
                </div>

                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estudiante</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Archivo</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                            No hay estudiantes matriculados activos en el grupo.
                          </TableCell>
                        </TableRow>
                      ) : (
                        submissions.map((row) => {
                          const badge = getStateBadge(row.status);
                          const isSelected = row.student._id === selectedStudentId;
                          return (
                            <TableRow key={row.student._id} className={isSelected ? 'bg-muted/40' : undefined}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{row.student.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{row.student.email || 'Sin email'}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </TableCell>
                              <TableCell>
                                {row.submission ? (
                                  row.submission.submission_type === 'link' ? (
                                    <a
                                      href={row.submission.link_url || '#'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                                    >
                                      Abrir link
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  ) : (
                                    <a
                                      href={getMediaUrl(row.submission.file_url) || '#'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                                    >
                                      {row.submission.original_name}
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  )
                                ) : (
                                  <span className="text-sm text-muted-foreground">Sin entrega</span>
                                )}
                              </TableCell>
                              <TableCell>{row.submission?.score_10?.toFixed?.(2) || 'N/A'}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!row.submission}
                                  onClick={() => {
                                    setSelectedStudentId(row.student._id);
                                    setReviewForm(buildReviewForm(selectedActivity, row));
                                  }}
                                >
                                  Revisar
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {selectedSubmissionRow?.submission && (
                  <Card className="border-border/60">
                    <CardHeader>
                      <CardTitle className="text-base">Calificar entrega de {selectedSubmissionRow.student.full_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                          <p className="text-xs text-muted-foreground">
                            {selectedSubmissionRow.submission.submission_type === 'link' ? 'Link' : 'Archivo'}
                          </p>
                          {selectedSubmissionRow.submission.submission_type === 'link' ? (
                            <a
                              href={selectedSubmissionRow.submission.link_url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                            >
                              Abrir link entregado
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <a
                              href={getMediaUrl(selectedSubmissionRow.submission.file_url) || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                            >
                              {selectedSubmissionRow.submission.original_name}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                          <p className="text-xs text-muted-foreground">Entregado</p>
                          <p className="mt-1 text-sm font-semibold">{formatDateTime(selectedSubmissionRow.submission.submitted_at)}</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                          <p className="text-xs text-muted-foreground">Estado</p>
                          <p className="mt-1 text-sm font-semibold">{getStateBadge(selectedSubmissionRow.status).label}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {reviewForm.rubric_scores.map((score, index) => (
                          <div key={score.criterion_id} className="rounded-2xl border border-border/60 p-4">
                            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                              <div>
                                <p className="font-medium">{score.title}</p>
                                <p className="text-sm text-muted-foreground">Máximo {score.max_points} puntos</p>
                              </div>
                              <div className="space-y-2">
                                <Label>Puntaje obtenido</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={score.max_points}
                                  step="0.1"
                                  value={score.earned_points}
                                  onChange={(event) => setReviewForm((current) => ({
                                    ...current,
                                    rubric_scores: current.rubric_scores.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, earned_points: event.target.value } : item
                                    ),
                                  }))}
                                />
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <Label>Feedback opcional</Label>
                              <Textarea
                                rows={3}
                                value={score.feedback}
                                onChange={(event) => setReviewForm((current) => ({
                                  ...current,
                                  rubric_scores: current.rubric_scores.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, feedback: event.target.value } : item
                                  ),
                                }))}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <Label>Retroalimentación final</Label>
                        <Textarea
                          rows={5}
                          value={reviewForm.teacher_feedback}
                          onChange={(event) => setReviewForm((current) => ({ ...current, teacher_feedback: event.target.value }))}
                        />
                      </div>

                      <Button onClick={saveReview} disabled={savingReview}>
                        {savingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar calificación
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherActivitiesPage;
