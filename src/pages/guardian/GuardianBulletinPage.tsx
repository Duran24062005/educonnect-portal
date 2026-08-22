import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/layouts/DashboardLayout';
import { academicApi } from '@/api/academic';
import { guardiansApi } from '@/api/guardians';
import { useSchoolYears } from '@/hooks/useSchoolYears';
import { asArray, unwrapPayload } from '@/hooks/admin/utils';

const GuardianBulletinPage = () => {
  const { data: years = [], isLoading: yearsLoading } = useSchoolYears();
  const activeYear = years.find((year: any) => year?.is_active) || years[0];
  const [yearId, setYearId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [periodId, setPeriodId] = useState('');

  useEffect(() => {
    if (!yearId && activeYear?._id) setYearId(activeYear._id);
  }, [activeYear, yearId]);

  const studentsQuery = useQuery({
    queryKey: ['guardian', 'students'],
    queryFn: guardiansApi.getMyStudents,
  });
  const periodsQuery = useQuery({
    queryKey: ['guardian', 'periods', yearId],
    queryFn: async () => asArray(unwrapPayload((await academicApi.getPeriods(yearId)).data), ['periods']),
    enabled: Boolean(yearId),
  });
  const students = studentsQuery.data?.students || [];
  const periods = periodsQuery.data || [];

  useEffect(() => {
    if (!studentId && students[0]?._id) setStudentId(students[0]._id);
    if (studentId && !students.some((student) => student._id === studentId)) setStudentId(students[0]?._id || '');
  }, [studentId, students]);

  useEffect(() => {
    if (!periodId && periods[0]?._id) setPeriodId(periods[0]._id);
    if (periodId && !periods.some((period: any) => period._id === periodId)) setPeriodId(periods[0]?._id || '');
  }, [periodId, periods]);

  const bulletinQuery = useQuery({
    queryKey: ['guardian', 'bulletin', yearId, periodId, studentId],
    queryFn: () => guardiansApi.getBulletin({ schoolYearId: yearId, periodId, studentId }),
    enabled: Boolean(yearId && periodId && studentId),
  });
  const loading = yearsLoading || studentsQuery.isLoading || periodsQuery.isLoading;
  const bulletin = bulletinQuery.data;
  const selectedStudent = useMemo(() => students.find((student) => student._id === studentId), [studentId, students]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><FileText className="h-4 w-4" />Documentos académicos</div>
            <h1 className="mt-2 text-3xl font-display font-extrabold tracking-tight">Boletines</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Consulta el boletín básico de cada estudiante vinculado a tu cuenta.</p>
          </div>
          <Button variant="outline" onClick={() => window.print()} disabled={!bulletin}><Printer className="h-4 w-4" />Imprimir vista</Button>
        </header>

        <Card>
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="guardian-bulletin-year">Año escolar</label><Select value={yearId} onValueChange={setYearId}><SelectTrigger id="guardian-bulletin-year"><SelectValue placeholder="Selecciona año" /></SelectTrigger><SelectContent>{years.map((year: any) => <SelectItem key={year._id} value={year._id}>{year.name || year.year}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="guardian-bulletin-student">Estudiante</label><Select value={studentId} onValueChange={setStudentId}><SelectTrigger id="guardian-bulletin-student"><SelectValue placeholder="Selecciona estudiante" /></SelectTrigger><SelectContent>{students.map((student) => <SelectItem key={student._id} value={student._id}>{student.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="guardian-bulletin-period">Periodo</label><Select value={periodId} onValueChange={setPeriodId}><SelectTrigger id="guardian-bulletin-period"><SelectValue placeholder="Selecciona periodo" /></SelectTrigger><SelectContent>{periods.map((period: any) => <SelectItem key={period._id} value={period._id}>{period.name}</SelectItem>)}</SelectContent></Select></div>
          </CardContent>
        </Card>

        {loading || bulletinQuery.isLoading ? <Skeleton className="h-[620px] w-full rounded-2xl" /> : bulletinQuery.isError ? <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">No se pudo generar el boletín para la selección actual.</CardContent></Card> : !bulletin ? <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">No hay boletín disponible para este estudiante y periodo.</CardContent></Card> : (
          <article className="mx-auto max-w-5xl space-y-6 border border-border/70 bg-card p-6 shadow-sm print:border-0 print:shadow-none">
            <div className="border-b border-border/70 pb-5 text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Boletín académico básico</p><h2 className="mt-2 text-2xl font-display font-bold">{bulletin.institution.official_name}</h2><p className="mt-1 text-sm text-muted-foreground">{bulletin.period.name} · {bulletin.enrollment.school_year_label}</p></div>
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Estudiante</p><p className="mt-1 font-semibold">{bulletin.student.full_name}</p></div><div><p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Matrícula</p><p className="mt-1 font-semibold">{bulletin.enrollment.grade_name} {bulletin.enrollment.group_name}</p></div><div><p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Documento</p><p className="mt-1 font-semibold">{bulletin.student.document_label}: {bulletin.student.document_number}</p></div><div><p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Acudiente</p><p className="mt-1 font-semibold">{selectedStudent?.relationship || 'Vínculo autorizado'}</p></div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] border-collapse text-sm"><thead><tr className="border-b border-border/70 text-left"><th className="px-3 py-3 font-semibold">Área</th><th className="px-3 py-3 font-semibold">Promedio</th><th className="px-3 py-3 font-semibold">Desempeño</th><th className="px-3 py-3 font-semibold">Evaluaciones</th></tr></thead><tbody>{bulletin.areas.map((area) => <tr key={area.area_id} className="border-b border-border/50"><td className="px-3 py-3 font-medium">{area.area_name}</td><td className="px-3 py-3">{area.period_average.toFixed(1)}</td><td className="px-3 py-3">{area.final_result_label}</td><td className="px-3 py-3">{area.evaluations.length ? area.evaluations.map((evaluation) => `${evaluation.name}: ${evaluation.score.toFixed(1)}`).join(' · ') : 'Sin evaluaciones registradas'}</td></tr>)}</tbody></table></div>
            <p className="text-xs text-muted-foreground">Vista informativa generada con datos académicos del periodo. Este documento no reemplaza el boletín oficial firmado o verificable.</p>
          </article>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GuardianBulletinPage;
