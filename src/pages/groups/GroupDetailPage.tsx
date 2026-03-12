import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { groupsApi } from '@/api/groups';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, BookOpen, Loader2, Plus } from 'lucide-react';
import { isValidObjectId } from '@/lib/object-id';
import { useGroupDetailSummary } from '@/hooks/useGroupDetailSummary';

const getTeacherDisplayName = (assignment: any) => {
  const teacher = assignment?.teacher || assignment?.teacher_id || null;
  const person = teacher?.person || teacher?.person_id || teacher?.user_id?.person || teacher?.user_id?.person_id;
  if (person) return `${person.first_name} ${person.last_name}`;
  return teacher?.user_id?.email || teacher?.email || 'N/A';
};

const getTeacherDisplayEmail = (assignment: any) => {
  const teacher = assignment?.teacher || assignment?.teacher_id || null;
  return teacher?.user_id?.email || teacher?.email || 'N/A';
};

const getAreaDisplayName = (assignment: any) => assignment?.area?.name || assignment?.area_id?.name || 'N/A';
const getEnrollmentStudent = (entry: any) => entry?.student || entry?.student_id || null;

const getEnrollmentStudentName = (entry: any) => {
  const student = getEnrollmentStudent(entry);
  const person = student?.person || student?.person_id || student?.user_id?.person || student?.user_id?.person_id;
  if (person?.first_name || person?.last_name) {
    return `${person?.first_name || ''} ${person?.last_name || ''}`.trim();
  }
  return student?.user_id?.email || student?.email || 'N/A';
};

const getEnrollmentStudentEmail = (entry: any) => {
  const student = getEnrollmentStudent(entry);
  return student?.user_id?.email || student?.email || 'N/A';
};

const GroupDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('1');
  const [assigningTeacher, setAssigningTeacher] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: summary,
    isLoading: loading,
  } = useGroupDetailSummary(id && isValidObjectId(id) ? id : undefined);

  const group = summary?.group || null;
  const students = summary?.students || [];
  const teachers = summary?.teachers || [];
  const teacherOptions = summary?.teacher_options || [];
  const allAreas = summary?.areas || [];
  const gradeAreas = summary?.grade_areas || [];
  const currentGradeId = group?.grade_id?._id || group?.grade_id || null;

  const normalizedAreaOptions = useMemo(
    () =>
      allAreas
        .map((entry: any) => {
          const area = entry?.area || entry?.area_id || entry || null;
          const isConfigured = gradeAreas.some((gradeArea: any) => {
            const gradeAreaId = gradeArea?.area?._id || gradeArea?.area_id?._id || gradeArea?.area_id;
            return String(gradeAreaId || '') === String(area?._id || '');
          });
          return {
            id: area?._id || '',
            label: area?.name || 'Area sin nombre',
            configured: isConfigured,
          };
        })
        .filter((entry) => Boolean(entry.id)),
    [allAreas, gradeAreas]
  );

  const selectedAreaConfigured = normalizedAreaOptions.find((area) => area.id === selectedAreaId)?.configured ?? false;

  const refreshSummary = async () => {
    await queryClient.invalidateQueries({ queryKey: ['group-detail-summary', id] });
  };

  const onAssignTeacher = async () => {
    if (!id || !selectedTeacherId || !selectedAreaId) {
      toast.error('Selecciona docente y area');
      return;
    }

    try {
      setAssigningTeacher(true);
      if (!selectedAreaConfigured) {
        const parsedWeeklyHours = Number(weeklyHours);
        if (Number.isNaN(parsedWeeklyHours) || parsedWeeklyHours < 1) {
          toast.error('Las horas semanales deben ser al menos 1');
          return;
        }

        if (!currentGradeId) {
          toast.error('No se pudo determinar el grado del grupo');
          return;
        }

        await groupsApi.assignGradeArea({
          grade_id: currentGradeId,
          area_id: selectedAreaId,
          weekly_hours: parsedWeeklyHours,
        });
      }

      await groupsApi.assignTeacher({
        teacher_id: selectedTeacherId,
        group_id: id,
        area_id: selectedAreaId,
      });
      await refreshSummary();
      setSelectedTeacherId('');
      setSelectedAreaId('');
      setWeeklyHours('1');
      toast.success('Docente asignado al grupo');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'No se pudo asignar el docente');
    } finally {
      setAssigningTeacher(false);
    }
  };

  if (!id || !isValidObjectId(id)) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">ID de grupo inválido</CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">{group?.name || 'Grupo'}</h1>
          <div className="flex items-center gap-2 mt-1">
            {group?.grade_id?.name && <Badge variant="secondary">{group.grade_id.name}</Badge>}
            {group?.aula?.name && <Badge variant="outline">{group.aula.name}</Badge>}
            <Badge variant="outline">Capacidad: {Number(group?.max_capacity || 0)}</Badge>
            <Badge variant="outline">Matriculados: {Number(group?.active_enrollments || 0)}</Badge>
            <Badge variant="outline">Disponibles: {Number(group?.available_slots || 0)}</Badge>
          </div>
        </div>

        <Tabs defaultValue="students">
          <TabsList>
            <TabsTrigger value="students" className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />Estudiantes ({students.length})
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />Docentes ({teachers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No hay estudiantes inscritos
                          </TableCell>
                        </TableRow>
                      ) : (
                        students.map((student: any) => (
                          <TableRow key={student._id}>
                            <TableCell className="font-medium">{getEnrollmentStudentName(student)}</TableCell>
                            <TableCell>{getEnrollmentStudentEmail(student)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{student.status || 'Activo'}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers">
            <Card>
              <CardHeader>
                <CardTitle>Asignar docente al grupo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto] items-end">
                  <div className="space-y-2">
                    <Label>Docente</Label>
                    <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId} disabled={assigningTeacher}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona docente" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherOptions.map((teacher: any) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Area</Label>
                    <Select value={selectedAreaId} onValueChange={setSelectedAreaId} disabled={assigningTeacher}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona area" />
                      </SelectTrigger>
                      <SelectContent>
                        {normalizedAreaOptions.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.label}{area.configured ? '' : ' (nueva para este grado)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!selectedAreaConfigured && selectedAreaId && (
                    <div className="space-y-2 lg:col-span-2">
                      <Label>Horas semanales para vincular el area al grado</Label>
                      <Input
                        type="number"
                        min={1}
                        value={weeklyHours}
                        onChange={(event) => setWeeklyHours(event.target.value)}
                        disabled={assigningTeacher}
                      />
                    </div>
                  )}

                  <Button onClick={onAssignTeacher} disabled={assigningTeacher}>
                    {assigningTeacher ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Asignar
                  </Button>
                </div>

                {normalizedAreaOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay areas disponibles. Verifica la configuracion academica del grado.
                  </p>
                )}

                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Area</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No hay docentes asignados
                          </TableCell>
                        </TableRow>
                      ) : (
                        teachers.map((teacher: any) => (
                          <TableRow key={teacher._id}>
                            <TableCell className="font-medium">{getTeacherDisplayName(teacher)}</TableCell>
                            <TableCell>{getTeacherDisplayEmail(teacher)}</TableCell>
                            <TableCell>{getAreaDisplayName(teacher)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default GroupDetailPage;
