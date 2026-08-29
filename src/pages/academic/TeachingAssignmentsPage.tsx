import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Check, Link2, Plus, UserRound, Users } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calendarApi, type CalendarCatalog } from '@/api/calendar';
import { teachingAssignmentsApi, type TeachingAssignmentInput } from '@/api/teachingAssignments';

const EMPTY_CATALOG: CalendarCatalog = { years: [], grades: [], groups: [], areas: [], teachers: [], aulas: [] };

const TeachingAssignmentsPage = () => {
  const queryClient = useQueryClient();
  const [schoolYearId, setSchoolYearId] = useState('');
  const [form, setForm] = useState<TeachingAssignmentInput>({ school_year_id: '', teacher_id: '', group_id: '', area_id: '' });
  const catalogQuery = useQuery({ queryKey: ['assignment-catalog', schoolYearId], queryFn: () => calendarApi.catalog('admin', schoolYearId || undefined), staleTime: 60_000 });
  const catalog = catalogQuery.data || EMPTY_CATALOG;
  const assignmentQuery = useQuery({ queryKey: ['teaching-assignments', schoolYearId], queryFn: () => teachingAssignmentsApi.list({ school_year_id: schoolYearId || undefined, status: 'active' }), enabled: Boolean(schoolYearId), staleTime: 30_000 });

  useEffect(() => {
    if (!schoolYearId && catalog.years[0]?.id) setSchoolYearId(catalog.years[0].id);
  }, [catalog.years, schoolYearId]);
  useEffect(() => setForm((current) => ({ ...current, school_year_id: schoolYearId })), [schoolYearId]);

  const createMutation = useMutation({
    mutationFn: () => teachingAssignmentsApi.create(form),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['teaching-assignments'] }); setForm((current) => ({ ...current, teacher_id: '', group_id: '', area_id: '' })); toast.success('Asignación creada'); },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo crear la asignación'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) => teachingAssignmentsApi.update(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['teaching-assignments'] }),
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo actualizar la asignación'),
  });
  const setField = (key: keyof TeachingAssignmentInput, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const ready = Boolean(form.school_year_id && form.teacher_id && form.group_id && form.area_id);

  return <DashboardLayout><div className="space-y-6">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><Link2 className="h-4 w-4" />Organización académica</div><h1 className="mt-2 text-3xl font-display font-extrabold tracking-tight">Asignaciones docentes</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Define quién puede enseñar cada área a cada grupo durante el año escolar. Luego usa estas asignaciones para construir el horario.</p></div><Select value={schoolYearId} onValueChange={setSchoolYearId}><SelectTrigger className="w-52"><SelectValue placeholder="Año escolar" /></SelectTrigger><SelectContent>{catalog.years.map((year) => <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>)}</SelectContent></Select></header>
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4" />Nueva asignación</CardTitle><CardDescription>La asignación es el contexto que después heredará cada entrada de horario.</CardDescription></CardHeader><CardContent className="space-y-4">
        <Field label="Docente"><Select value={form.teacher_id} onValueChange={(value) => setField('teacher_id', value)}><SelectTrigger><SelectValue placeholder="Selecciona un docente" /></SelectTrigger><SelectContent>{catalog.teachers.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Área"><Select value={form.area_id} onValueChange={(value) => setField('area_id', value)}><SelectTrigger><SelectValue placeholder="Selecciona un área" /></SelectTrigger><SelectContent>{catalog.areas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Grupo"><Select value={form.group_id} onValueChange={(value) => setField('group_id', value)}><SelectTrigger><SelectValue placeholder="Selecciona un grupo" /></SelectTrigger><SelectContent>{catalog.groups.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm"><p className="font-semibold">Año escolar</p><p className="mt-1 text-muted-foreground">{catalog.years.find((item) => item.id === schoolYearId)?.name || 'Selecciona un año'}</p></div>
        <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!ready || createMutation.isPending}><Check className="h-4 w-4" />Guardar asignación</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Asignaciones activas</CardTitle><CardDescription>{assignmentQuery.data?.assignments.length || 0} relaciones disponibles para programar.</CardDescription></CardHeader><CardContent>{assignmentQuery.isLoading ? <p className="py-8 text-sm text-muted-foreground">Cargando asignaciones…</p> : assignmentQuery.data?.assignments.length ? <div className="space-y-3">{assignmentQuery.data.assignments.map((assignment) => <div key={assignment.id} className="flex flex-col gap-3 rounded-lg border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline"><BookOpen className="h-3 w-3" />{assignment.area.name}</Badge><span className="font-semibold">{assignment.group.name}</span></div><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><UserRound className="h-4 w-4" />{assignment.teacher.name}<span aria-hidden="true">·</span><Users className="h-4 w-4" />{assignment.schoolYear?.name || catalog.years.find((year) => year.id === assignment.schoolYearId)?.name}</p></div><Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: assignment.id, status: 'inactive' })} disabled={updateMutation.isPending}>Desactivar</Button></div>)}</div> : <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Todavía no hay asignaciones para este año.</p>}</CardContent></Card>
    </div>
  </div></DashboardLayout>;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="space-y-2"><Label>{label}</Label>{children}</div>;
export default TeachingAssignmentsPage;
