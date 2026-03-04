import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { groupsApi } from '@/api/groups';
import { academicApi } from '@/api/academic';
import { evaluationsApi } from '@/api/evaluations';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const arrayFrom = (res: any, key?: string) => {
  const data = res?.data?.data ?? res?.data;
  if (key && Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.groups)) return data.groups;
  if (Array.isArray(data?.students)) return data.students;
  if (Array.isArray(data?.periods)) return data.periods;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const PeriodResultsPage = () => {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const loadInitial = async () => {
      if (!user?._id) return;
      setLoading(true);
      try {
        const [groupsRes, yearsRes] = await Promise.all([
          groupsApi.getTeacherGroups(user._id),
          academicApi.getSchoolYears(),
        ]);
        const teacherGroups = arrayFrom(groupsRes, 'groups');
        setGroups(teacherGroups);

        const years = arrayFrom(yearsRes, 'schoolYears');
        const activeYear = years.find((year: any) => year?.is_active) || years[0];
        if (activeYear?._id) {
          const periodsRes = await academicApi.getPeriods(activeYear._id);
          const loadedPeriods = arrayFrom(periodsRes, 'periods');
          setPeriods(loadedPeriods);
          if (loadedPeriods[0]?._id) setSelectedPeriod(loadedPeriods[0]._id);
        }

        const firstGroupId = teacherGroups[0]?.group?._id || teacherGroups[0]?._id;
        if (firstGroupId) setSelectedGroup(firstGroupId);
      } catch {
        toast.error('No se pudo cargar el contexto del docente');
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, [user]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedGroup) return;
      try {
        const res = await groupsApi.getGroupStudents(selectedGroup);
        const groupStudents = arrayFrom(res, 'students');
        setStudents(groupStudents);
        const firstStudent = groupStudents[0]?.student?._id || groupStudents[0]?._id;
        if (firstStudent) setSelectedStudent(firstStudent);
      } catch {
        setStudents([]);
        toast.error('No se pudieron cargar estudiantes del grupo');
      }
    };

    loadStudents();
  }, [selectedGroup]);

  useEffect(() => {
    const loadResults = async () => {
      if (!selectedStudent) return;
      try {
        const res = await evaluationsApi.getStudentPeriodResults(selectedStudent);
        setResults(arrayFrom(res, 'results'));
      } catch {
        setResults([]);
      }
    };

    loadResults();
  }, [selectedStudent]);

  const calculate = async () => {
    if (!selectedStudent || !selectedPeriod) {
      toast.error('Selecciona estudiante y periodo');
      return;
    }

    setCalculating(true);
    try {
      await evaluationsApi.calculatePeriodResults({
        student_id: selectedStudent,
        period_id: selectedPeriod,
      });
      toast.success('Cálculo de periodo ejecutado');
      const res = await evaluationsApi.getStudentPeriodResults(selectedStudent);
      setResults(arrayFrom(res, 'results'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo calcular el resultado');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Resultados de Periodo</h1>
          <p className="text-muted-foreground">Calcula y consulta resultados por estudiante.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Parámetros</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Grupo</label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger><SelectValue placeholder="Selecciona grupo" /></SelectTrigger>
                <SelectContent>
                  {groups.map((group) => {
                    const groupId = group.group?._id || group._id;
                    const groupName = group.group?.name || group.name;
                    return <SelectItem key={groupId} value={groupId}>{groupName}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estudiante</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger><SelectValue placeholder="Selecciona estudiante" /></SelectTrigger>
                <SelectContent>
                  {students.map((entry) => {
                    const student = entry.student || entry;
                    return (
                      <SelectItem key={student._id} value={student._id}>
                        {student.person ? `${student.person.first_name} ${student.person.last_name}` : student.email}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Periodo</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger><SelectValue placeholder="Selecciona periodo" /></SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period._id} value={period._id}>{period.name || period.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={calculate} disabled={calculating}>
              {calculating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Calcular
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultados del estudiante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Promedio</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay resultados disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((result) => (
                      <TableRow key={result._id}>
                        <TableCell>{result.period?.name || 'N/A'}</TableCell>
                        <TableCell>{result.area?.name || 'N/A'}</TableCell>
                        <TableCell>{result.average ?? result.score ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant={result.passed ? 'default' : 'destructive'}>
                            {result.passed ? 'Aprobado' : 'Reprobado'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PeriodResultsPage;
