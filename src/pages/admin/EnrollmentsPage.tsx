import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowRightLeft, Loader2, RefreshCcw, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAdminUiStore } from '@/store/admin-ui';
import { useAdminGrades, useAdminGroupsByYear, useAdminSchoolYears } from '@/hooks/admin/useAdminGroups';
import {
  useAdminStudents,
  useAssignStudentAula,
  useCreateEnrollment,
  useGroupStudents,
  useStudentEnrollments,
  useTransferEnrollment,
  useUpdateEnrollmentStatus,
} from '@/hooks/admin/useAdminEnrollments';
import { useAdminAulas } from '@/hooks/admin/useAdminAulas';

const ENROLLMENT_STATUSES = ['active', 'transferred', 'retired'] as const;

const statusClassMap: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  transferred: 'bg-info/10 text-info border-info/20',
  retired: 'bg-destructive/10 text-destructive border-destructive/20',
};

const resolveGradeName = (group: any, grades: any[]) => {
  if (group?.grade?.name) return group.grade.name;
  if (typeof group?.grade_id === 'object' && group?.grade_id?.name) return group.grade_id.name;

  const gradeId = typeof group?.grade_id === 'string' ? group.grade_id : group?.grade?._id;
  if (!gradeId) return null;

  const grade = grades.find((item: any) => item?._id === gradeId);
  return grade?.name || null;
};

const EnrollmentsPage = () => {
  const {
    enrollmentYearId,
    selectedGroupId,
    selectedStudentId,
    setEnrollmentYearId,
    setSelectedGroupId,
    setSelectedStudentId,
  } = useAdminUiStore();

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    to_group_id: '',
    reason: '',
    observations: '',
  });
  const [aulaSelections, setAulaSelections] = useState<Record<string, string>>({});

  const { data: years = [], isLoading: loadingYears } = useAdminSchoolYears();
  const { data: groups = [], isLoading: loadingGroups } = useAdminGroupsByYear(enrollmentYearId);
  const { data: grades = [] } = useAdminGrades();
  const { data: students = [], isLoading: loadingStudents } = useAdminStudents();
  const { data: aulas = [] } = useAdminAulas();

  const { data: groupStudents = [], isLoading: loadingGroupStudents, refetch: refetchGroupStudents } = useGroupStudents(selectedGroupId);
  const { data: studentEnrollments = [], isLoading: loadingStudentEnrollments, refetch: refetchStudentEnrollments } = useStudentEnrollments(selectedStudentId);

  const createEnrollment = useCreateEnrollment();
  const transferEnrollment = useTransferEnrollment();
  const updateEnrollmentStatus = useUpdateEnrollmentStatus();
  const assignAula = useAssignStudentAula();

  useEffect(() => {
    if (!enrollmentYearId && years.length > 0) {
      const active = years.find((y: any) => y.is_active);
      if (active?._id) setEnrollmentYearId(active._id);
      else setEnrollmentYearId(years[0]._id);
    }
  }, [enrollmentYearId, years, setEnrollmentYearId]);

  const normalizedGroups = useMemo(
    () =>
      groups.map((group: any) => ({
        id: group._id,
        label: `${group.name} · ${resolveGradeName(group, grades) || 'Sin grado'}`,
      })),
    [groups, grades]
  );

  const normalizedStudents = useMemo(
    () =>
      students.map((user: any) => {
        const person = user.person || user.person_id;
        return {
          id: user._id,
          label: person ? `${person.first_name} ${person.last_name} (${user.email})` : user.email,
        };
      }),
    [students]
  );

  const onCreateEnrollment = async () => {
    if (!selectedStudentId || !selectedGroupId || !enrollmentYearId) {
      toast.error('Selecciona año, grupo y estudiante');
      return;
    }

    try {
      await createEnrollment.mutateAsync({
        student_id: selectedStudentId,
        group_id: selectedGroupId,
        school_year_id: enrollmentYearId,
      });
      toast.success('Matrícula creada');
      refetchGroupStudents();
      refetchStudentEnrollments();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        toast.error('La ruta de matrículas no está disponible en este backend local (404)');
        return;
      }
      toast.error(err.response?.data?.message || 'No se pudo crear la matrícula');
    }
  };

  const onUpdateEnrollmentStatus = async (enrollmentId: string, status: string) => {
    try {
      await updateEnrollmentStatus.mutateAsync({ id: enrollmentId, status: status as any });
      toast.success('Estado de matrícula actualizado');
      refetchGroupStudents();
      refetchStudentEnrollments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar el estado');
    }
  };

  const onTransferEnrollment = async () => {
    if (!selectedStudentId || !enrollmentYearId || !transferForm.to_group_id) {
      toast.error('Completa estudiante, año y grupo destino');
      return;
    }

    try {
      await transferEnrollment.mutateAsync({
        student_id: selectedStudentId,
        school_year_id: enrollmentYearId,
        to_group_id: transferForm.to_group_id,
        reason: transferForm.reason || undefined,
        observations: transferForm.observations || undefined,
      });
      toast.success('Traslado realizado correctamente');
      setTransferOpen(false);
      setTransferForm({ to_group_id: '', reason: '', observations: '' });
      refetchGroupStudents();
      refetchStudentEnrollments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo realizar el traslado');
    }
  };

  const onAssignAula = async (studentId: string) => {
    const aulaId = aulaSelections[studentId];
    if (!aulaId) {
      toast.error('Selecciona un aula');
      return;
    }

    try {
      await assignAula.mutateAsync({ studentId, aulaId });
      toast.success('Aula asignada al estudiante');
      refetchGroupStudents();
      refetchStudentEnrollments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo asignar aula');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Matrículas y Traslados</h1>
          <p className="text-muted-foreground">Gestiona matrículas, estado, traslados y aula por estudiante.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crear matrícula</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
            <div className="space-y-2">
              <Label>Año escolar</Label>
              <Select value={enrollmentYearId} onValueChange={setEnrollmentYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona año" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year: any) => (
                    <SelectItem key={year._id} value={year._id}>
                      {year.name || year.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona grupo" />
                </SelectTrigger>
                <SelectContent>
                  {normalizedGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estudiante</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {normalizedStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={onCreateEnrollment} disabled={createEnrollment.isPending}>
              {createEnrollment.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Matricular
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Matrículas por grupo</CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetchGroupStudents()}>
                <RefreshCcw className="w-4 h-4 mr-2" /> Refrescar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Aula</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(loadingGroupStudents || loadingGroups || loadingYears || loadingStudents) && (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-36 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    )}

                    {!loadingGroupStudents && groupStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No hay matrículas para el grupo seleccionado
                        </TableCell>
                      </TableRow>
                    )}

                    {!loadingGroupStudents && groupStudents.map((entry: any) => {
                      const student = entry.student || entry;
                      const person = student.person || student.person_id;
                      const studentName = person ? `${person.first_name} ${person.last_name}` : student.email;
                      const status = (entry.status || 'active').toLowerCase();
                      const studentId = student._id;

                      return (
                        <TableRow key={entry._id || studentId}>
                          <TableCell className="font-medium">{studentName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusClassMap[status] || ''}>{status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value={aulaSelections[studentId] || ''}
                                onValueChange={(value) => setAulaSelections((prev) => ({ ...prev, [studentId]: value }))}
                              >
                                <SelectTrigger className="h-8 w-36">
                                  <SelectValue placeholder="Asignar" />
                                </SelectTrigger>
                                <SelectContent>
                                  {aulas.map((aula: any) => (
                                    <SelectItem key={aula._id} value={aula._id}>{aula.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="secondary" onClick={() => onAssignAula(studentId)} disabled={assignAula.isPending}>
                                Aula
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={status}
                              onValueChange={(value) => onUpdateEnrollmentStatus(entry._id, value)}
                            >
                              <SelectTrigger className="h-8 ml-auto w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ENROLLMENT_STATUSES.map((value) => (
                                  <SelectItem key={value} value={value}>{value}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Matrículas por estudiante</CardTitle>
              <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!selectedStudentId}>
                    <ArrowRightLeft className="w-4 h-4 mr-2" /> Trasladar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Trasladar estudiante a otro grupo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Grupo destino</Label>
                      <Select
                        value={transferForm.to_group_id}
                        onValueChange={(value) => setTransferForm((prev) => ({ ...prev, to_group_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona grupo destino" />
                        </SelectTrigger>
                        <SelectContent>
                          {normalizedGroups
                            .filter((group) => group.id !== selectedGroupId)
                            .map((group) => (
                              <SelectItem key={group.id} value={group.id}>{group.label}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo (opcional)</Label>
                      <Input
                        value={transferForm.reason}
                        onChange={(e) => setTransferForm((prev) => ({ ...prev, reason: e.target.value }))}
                        placeholder="Cambio de jornada"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Observaciones (opcional)</Label>
                      <Textarea
                        value={transferForm.observations}
                        onChange={(e) => setTransferForm((prev) => ({ ...prev, observations: e.target.value }))}
                        placeholder="Detalle adicional del traslado"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancelar</Button>
                    <Button onClick={onTransferEnrollment} disabled={transferEnrollment.isPending}>
                      {transferEnrollment.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Confirmar traslado
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Año</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingStudentEnrollments && Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      </TableRow>
                    ))}

                    {!loadingStudentEnrollments && studentEnrollments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No hay historial de matrículas para el estudiante
                        </TableCell>
                      </TableRow>
                    )}

                    {!loadingStudentEnrollments && studentEnrollments.map((item: any) => (
                      <TableRow key={item._id}>
                        <TableCell>{item.group?.name || item.group_id?.name || 'N/A'}</TableCell>
                        <TableCell>{item.school_year?.name || item.school_year_id?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusClassMap[(item.status || '').toLowerCase()] || ''}>
                            {item.status || 'N/A'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EnrollmentsPage;
