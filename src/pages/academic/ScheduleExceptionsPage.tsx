import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarDays, Check, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';
import DashboardLayout from '@/layouts/DashboardLayout';
import { calendarApi, type CalendarCatalog } from '@/api/calendar';
import { scheduleApi } from '@/api/schedule';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatSessionDate, formatSessionTime } from '@/lib/calendar-utils';

type ExceptionType = 'cancelled' | 'additional' | 'override';
const EMPTY_CATALOG: CalendarCatalog = { years: [], grades: [], groups: [], areas: [], teachers: [], aulas: [] };

const ScheduleExceptionsPage = () => {
  const queryClient = useQueryClient();
  const [type, setType] = useState<ExceptionType>('cancelled');
  const [reason, setReason] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [schoolYearId, setSchoolYearId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [groupId, setGroupId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [aulaId, setAulaId] = useState('');
  const range = useMemo(() => ({ from: format(new Date(), 'yyyy-MM-dd'), to: format(addDays(new Date(), 31), 'yyyy-MM-dd') }), []);
  const catalogQuery = useQuery({ queryKey: ['exception-catalog', schoolYearId], queryFn: () => calendarApi.catalog('admin', schoolYearId || undefined), staleTime: 60_000 });
  const catalog = catalogQuery.data || EMPTY_CATALOG;
  const sessionsQuery = useQuery({ queryKey: ['exception-sessions', range.from, range.to, schoolYearId], queryFn: () => calendarApi.list({ role: 'admin', ...range, schoolYearId: schoolYearId || undefined }), staleTime: 30_000 });
  const sessions = sessionsQuery.data?.sessions || [];
  const selectedSession = sessions.find((session) => session.id === sessionId);
  const mutation = useMutation({
    mutationFn: () => {
      const base = { type, reason: reason.trim() } as Record<string, unknown>;
      if (type === 'cancelled') return scheduleApi.createException({ ...base, session_id: sessionId });
      const selected = type === 'override' ? selectedSession : null;
      return scheduleApi.createException({
        ...base,
        session_id: selected?.id,
        school_year_id: schoolYearId || selected?.schoolYear.id,
        group_id: groupId || selected?.group.id,
        area_id: areaId || selected?.area.id,
        teacher_id: teacherId || selected?.teacher.id,
        aula_id: aulaId || selected?.aula.id,
        start_at: new Date(`${date}T${startTime}:00`).toISOString(),
        end_at: new Date(`${date}T${endTime}:00`).toISOString(),
      });
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['calendar'] }); await queryClient.invalidateQueries({ queryKey: ['exception-sessions'] }); setReason(''); setSessionId(''); toast.success('Excepción registrada'); },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo registrar la excepción'),
  });
  const submit = () => {
    if (!reason.trim()) return toast.error('Escribe el motivo de la excepción');
    if ((type === 'cancelled' || type === 'override') && !sessionId) return toast.error('Selecciona una sesión');
    if (type !== 'cancelled' && (!schoolYearId || !groupId || !areaId || !teacherId || !aulaId)) return toast.error('Completa los datos de la sesión extraordinaria');
    if (startTime >= endTime) return toast.error('La hora inicial debe ser anterior a la final');
    mutation.mutate();
  };
  const setSession = (id: string) => { setSessionId(id); const session = sessions.find((item) => item.id === id); if (session) { setSchoolYearId(session.schoolYear.id); setGroupId(session.group.id); setAreaId(session.area.id); setTeacherId(session.teacher.id); setAulaId(session.aula.id); setDate(format(new Date(session.startAt), 'yyyy-MM-dd')); setStartTime(format(new Date(session.startAt), 'HH:mm')); setEndTime(format(new Date(session.endAt), 'HH:mm')); } };

  return <DashboardLayout><div className="space-y-6"><header><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><AlertTriangle className="h-4 w-4" />Administración académica</div><h1 className="mt-2 text-3xl font-display font-extrabold tracking-tight">Excepciones del horario</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Cancela, mueve o agrega una ocurrencia sin destruir el horario institucional base.</p></header>
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4" />Nueva excepción</CardTitle><CardDescription>El motivo queda registrado junto con la proyección resultante.</CardDescription></CardHeader><CardContent className="space-y-4"><Field label="Tipo"><Select value={type} onValueChange={(value) => setType(value as ExceptionType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cancelled">Cancelar ocurrencia</SelectItem><SelectItem value="override">Mover ocurrencia</SelectItem><SelectItem value="additional">Agregar ocurrencia</SelectItem></SelectContent></Select></Field>{type !== 'additional' && <Field label="Sesión afectada"><Select value={sessionId} onValueChange={setSession}><SelectTrigger><SelectValue placeholder="Selecciona una sesión" /></SelectTrigger><SelectContent>{sessions.filter((session) => session.status !== 'cancelled').map((session) => <SelectItem key={session.id} value={session.id}>{formatSessionDate(session.startAt)} · {session.area.name} · {session.group.name}</SelectItem>)}</SelectContent></Select></Field>}{type !== 'cancelled' && <><Field label="Año escolar"><Select value={schoolYearId} onValueChange={setSchoolYearId}><SelectTrigger><SelectValue placeholder="Selecciona un año" /></SelectTrigger><SelectContent>{catalog.years.map((year) => <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>)}</SelectContent></Select></Field><div className="grid grid-cols-2 gap-3"><Field label="Fecha"><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field><Field label="Aula"><Select value={aulaId} onValueChange={setAulaId}><SelectTrigger><SelectValue placeholder="Aula" /></SelectTrigger><SelectContent>{catalog.aulas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Inicio"><Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></Field><Field label="Fin"><Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></Field></div>{type === 'additional' && <><Field label="Grupo"><Select value={groupId} onValueChange={setGroupId}><SelectTrigger><SelectValue placeholder="Grupo" /></SelectTrigger><SelectContent>{catalog.groups.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Área"><Select value={areaId} onValueChange={setAreaId}><SelectTrigger><SelectValue placeholder="Área" /></SelectTrigger><SelectContent>{catalog.areas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Docente"><Select value={teacherId} onValueChange={setTeacherId}><SelectTrigger><SelectValue placeholder="Docente" /></SelectTrigger><SelectContent>{catalog.teachers.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field></>}</>}<Field label="Motivo"><Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Ej. Jornada institucional o cambio autorizado de aula" /></Field><Button className="w-full" onClick={submit} disabled={mutation.isPending}><Check className="h-4 w-4" />Registrar excepción</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Sesiones próximas</CardTitle><CardDescription>Las excepciones se proyectan sobre una ocurrencia concreta y conservan el horario base.</CardDescription></CardHeader><CardContent>{sessionsQuery.isLoading ? <p className="py-8 text-sm text-muted-foreground">Cargando sesiones…</p> : sessions.length ? <div className="space-y-2">{sessions.map((session) => <div key={session.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{session.area.name} · {session.group.name}</p><p className="text-sm text-muted-foreground">{formatSessionDate(session.startAt)} · {formatSessionTime(session.startAt)}–{formatSessionTime(session.endAt)} · {session.aula.name}</p></div><Badge variant={session.status === 'cancelled' ? 'secondary' : 'outline'}>{session.status === 'cancelled' ? 'Cancelada' : 'Programada'}</Badge></div>)}</div> : <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No hay sesiones en las próximas semanas.</p>}</CardContent></Card></div>
  </div></DashboardLayout>;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="space-y-2"><Label>{label}</Label>{children}</div>;
export default ScheduleExceptionsPage;
