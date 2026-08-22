import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, ClipboardCheck, Download, Loader2, Lock, RefreshCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/store/auth';
import { normalizeRole } from '@/lib/auth';
import { academicApi } from '@/api/academic';
import { analyticsApi } from '@/api/analytics';
import { attendanceApi, type AttendanceRecord, type AttendanceSession, type AttendanceStatus } from '@/api/attendance';
import { useSchoolYears } from '@/hooks/useSchoolYears';
import { useAdminGroupsByYear } from '@/hooks/admin/useAdminGroups';
import { asArray, unwrapPayload } from '@/hooks/admin/utils';

const statusLabels: Record<AttendanceStatus, string> = {
  pending: 'Pendiente',
  present: 'Presente',
  absent: 'Ausente',
  late: 'Tarde',
  excused: 'Justificada',
};

const statusVariants: Record<AttendanceStatus, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  present: 'default',
  absent: 'destructive',
  late: 'outline',
  excused: 'secondary',
};

const today = () => new Date().toISOString().slice(0, 10);

const AttendancePage = () => {
  const role = normalizeRole(useAuthStore((state) => state.user?.role));
  const queryClient = useQueryClient();
  const { data: years = [], isLoading: loadingYears } = useSchoolYears();
  const activeYear = years.find((year: any) => year?.is_active) || years[0];
  const [yearId, setYearId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [date, setDate] = useState(today);
  const [topic, setTopic] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [draftRecords, setDraftRecords] = useState<Record<string, { status: AttendanceStatus; note: string; justification: string }>>({});
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!yearId && activeYear?._id) setYearId(activeYear._id);
  }, [activeYear, yearId]);

  const adminGroups = useAdminGroupsByYear(role === 'admin' ? yearId : undefined);
  const teacherGroups = useQuery({
    queryKey: ['attendance', 'teacher-groups', yearId],
    queryFn: async () => {
      const response = await analyticsApi.getTeacherGroups(yearId);
      return asArray(unwrapPayload(response.data), ['groups']);
    },
    enabled: role === 'teacher' && Boolean(yearId),
    staleTime: 60_000,
  });
  const groups = role === 'admin'
    ? adminGroups.data || []
    : teacherGroups.data || [];
  const normalizedGroups = useMemo(() => groups.map((group: any) => ({
    id: group._id || group.group_id,
    label: `${group.name || group.group_name || 'Grupo'} · ${group.grade_id?.name || group.grade_name || 'Sin grado'}`,
    areaId: group.area_id,
  })).filter((group) => Boolean(group.id)), [groups]);

  useEffect(() => {
    if (!groupId && normalizedGroups[0]?.id) setGroupId(normalizedGroups[0].id);
    if (groupId && !normalizedGroups.some((group) => group.id === groupId)) setGroupId(normalizedGroups[0]?.id || '');
  }, [groupId, normalizedGroups]);

  const periodsQuery = useQuery({
    queryKey: ['attendance', 'periods', yearId],
    queryFn: async () => asArray(unwrapPayload((await academicApi.getPeriods(yearId)).data), ['periods']),
    enabled: Boolean(yearId),
    staleTime: 60_000,
  });
  const areasQuery = useQuery({
    queryKey: ['attendance', 'areas'],
    queryFn: async () => asArray(unwrapPayload((await academicApi.getAreas()).data), ['areas']),
    enabled: role === 'admin',
    staleTime: 60_000,
  });
  const selectedGroup = normalizedGroups.find((group) => group.id === groupId);
  const [periodId, setPeriodId] = useState('');
  const [areaId, setAreaId] = useState('');

  const sessionListQuery = useQuery({
    queryKey: ['attendance', 'sessions', yearId, groupId],
    queryFn: async () => {
      const response = await attendanceApi.listSessions({ school_year_id: yearId, group_id: groupId });
      return response.data.data.sessions;
    },
    enabled: Boolean(yearId && groupId),
  });
  const sessionQuery = useQuery({
    queryKey: ['attendance', 'session', selectedSessionId],
    queryFn: async () => (await attendanceApi.getSession(selectedSessionId)).data.data,
    enabled: Boolean(selectedSessionId),
  });

  useEffect(() => {
    if (!selectedSessionId && sessionListQuery.data?.[0]?._id) setSelectedSessionId(sessionListQuery.data[0]._id);
    if (selectedSessionId && !sessionListQuery.data?.some((session) => session._id === selectedSessionId)) {
      setSelectedSessionId(sessionListQuery.data?.[0]?._id || '');
    }
  }, [selectedSessionId, sessionListQuery.data]);

  useEffect(() => {
    const records = sessionQuery.data?.records || [];
    setDraftRecords(Object.fromEntries(records.map((record) => [record.student._id, {
      status: record.status,
      note: record.note || '',
      justification: record.justification || '',
    }])));
  }, [sessionQuery.data]);

  const createMutation = useMutation({
    mutationFn: () => attendanceApi.createSession({
      school_year_id: yearId,
      group_id: groupId,
      period_id: periodId || undefined,
      area_id: areaId || selectedGroup?.areaId || undefined,
      date,
      topic: topic || undefined,
    }),
    onSuccess: async (response) => {
      const created = response.data.data as AttendanceSession;
      setSelectedSessionId(created._id);
      await queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions', yearId, groupId] });
      toast.success('Sesión de asistencia creada');
    },
  });
  const saveMutation = useMutation({
    mutationFn: () => attendanceApi.updateRecords(selectedSessionId, Object.entries(draftRecords).map(([student_id, value]) => ({
      student_id,
      status: value.status,
      note: value.note || null,
      justification: value.justification || null,
    }))),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attendance', 'session', selectedSessionId] });
      await queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions', yearId, groupId] });
      toast.success('Asistencia guardada');
    },
  });
  const statusMutation = useMutation({
    mutationFn: (status: 'open' | 'closed') => attendanceApi.updateStatus(selectedSessionId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attendance', 'session', selectedSessionId] });
      await queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions', yearId, groupId] });
      toast.success('Estado de sesión actualizado');
    },
  });

  const currentSession = sessionQuery.data;
  const busy = loadingYears || adminGroups.isLoading || teacherGroups.isLoading;

  const exportReport = async () => {
    if (!yearId) return;
    setExporting(true);
    try {
      const response = await attendanceApi.downloadReport({ school_year_id: yearId, group_id: groupId || undefined });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'reporte-asistencia.csv';
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Reporte descargado');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'No se pudo descargar el reporte');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header>
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><ClipboardCheck className="h-4 w-4" />Control académico</div>{role === 'admin' && <Button variant="outline" size="sm" onClick={exportReport} disabled={exporting || !yearId}><Download className="h-4 w-4 mr-2" />{exporting ? 'Descargando' : 'Exportar CSV'}</Button>}</div>
          <h1 className="mt-2 text-3xl font-display font-extrabold tracking-tight">Asistencia</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Registra la asistencia de estudiantes matriculados y deja trazabilidad de las justificaciones.</p>
        </header>

        {busy ? <Card><CardContent className="flex min-h-44 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent></Card> : (
          <>
            <Card>
              <CardHeader><CardTitle>Nueva sesión</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2"><Label>Año escolar</Label><Select value={yearId} onValueChange={setYearId}><SelectTrigger><SelectValue placeholder="Selecciona año" /></SelectTrigger><SelectContent>{years.map((year: any) => <SelectItem key={year._id} value={year._id}>{year.name || year.year}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Grupo</Label><Select value={groupId} onValueChange={setGroupId}><SelectTrigger><SelectValue placeholder="Selecciona grupo" /></SelectTrigger><SelectContent>{normalizedGroups.map((group) => <SelectItem key={group.id} value={group.id}>{group.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
                <div className="space-y-2"><Label>Periodo</Label><Select value={periodId} onValueChange={setPeriodId}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{(periodsQuery.data || []).map((period: any) => <SelectItem key={period._id} value={period._id}>{period.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Área</Label><Select value={areaId} onValueChange={setAreaId}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{(areasQuery.data || []).map((area: any) => <SelectItem key={area._id} value={area._id}>{area.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2 md:col-span-2 xl:col-span-4"><Label>Tema u observación</Label><Input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Ej. Clase de ecuaciones" /></div>
                <Button className="self-end" onClick={() => createMutation.mutate()} disabled={!yearId || !groupId || !date || createMutation.isPending}><ClipboardCheck className="h-4 w-4" />Crear sesión</Button>
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
              <Card className="h-fit">
                <CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle className="text-base">Sesiones del grupo</CardTitle><Button size="icon" variant="ghost" onClick={() => sessionListQuery.refetch()} aria-label="Actualizar sesiones" title="Actualizar sesiones"><RefreshCcw className="h-4 w-4" /></Button></CardHeader>
                <CardContent className="space-y-2">
                  {sessionListQuery.data?.length ? sessionListQuery.data.map((session) => <button key={session._id} type="button" onClick={() => setSelectedSessionId(session._id)} className={`w-full rounded-xl border p-3 text-left ${selectedSessionId === session._id ? 'border-primary bg-primary/5' : 'border-border/70 hover:bg-muted/40'}`}><div className="flex items-center justify-between gap-2"><span className="font-medium">{session.date}</span><Badge variant={session.status === 'closed' ? 'secondary' : 'default'}>{session.status === 'closed' ? 'Cerrada' : 'Abierta'}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{session.area?.name || 'General'}{session.topic ? ` · ${session.topic}` : ''}</p></button>) : <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay sesiones para este grupo.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>{currentSession ? `Registro del ${currentSession.date}` : 'Selecciona una sesión'}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{currentSession?.group?.name || 'Grupo'} · {currentSession?.area?.name || 'Sin área'}</p></div>{currentSession && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || currentSession.status === 'closed'}><Save className="h-4 w-4" />Guardar</Button><Button variant="outline" onClick={() => statusMutation.mutate(currentSession.status === 'closed' ? 'open' : 'closed')} disabled={statusMutation.isPending}>{currentSession.status === 'closed' ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{currentSession.status === 'closed' ? 'Reabrir' : 'Cerrar sesión'}</Button></div>}</CardHeader>
                <CardContent>
                  {!currentSession ? <div className="flex min-h-56 flex-col items-center justify-center text-center"><AlertCircle className="h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium">Selecciona una sesión para registrar estados.</p></div> : <div className="space-y-3">{currentSession.records.map((record: AttendanceRecord) => { const draft = draftRecords[record.student._id] || { status: record.status, note: '', justification: '' }; return <div key={record.student._id} className="grid gap-3 rounded-xl border border-border/70 p-3 md:grid-cols-[minmax(0,1fr)_150px_1fr]"><div className="flex items-center gap-2"><span className="font-medium">{record.student.full_name}</span><Badge variant={statusVariants[draft.status]}>{statusLabels[draft.status]}</Badge></div><Select value={draft.status} onValueChange={(value) => setDraftRecords((current) => ({ ...current, [record.student._id]: { ...draft, status: value as AttendanceStatus } }))} disabled={currentSession.status === 'closed'}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><div className="space-y-2"><Input placeholder="Nota" value={draft.note} onChange={(event) => setDraftRecords((current) => ({ ...current, [record.student._id]: { ...draft, note: event.target.value } }))} disabled={currentSession.status === 'closed'} />{draft.status === 'excused' && <Textarea placeholder="Justificación requerida" value={draft.justification} onChange={(event) => setDraftRecords((current) => ({ ...current, [record.student._id]: { ...draft, justification: event.target.value } }))} disabled={currentSession.status === 'closed'} />}</div></div>; })}</div>}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendancePage;
