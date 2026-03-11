import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { groupsApi } from '@/api/groups';
import { usersApi } from '@/api/users';
import { academicApi } from '@/api/academic';
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

const getPayload = (responseData: any) => responseData?.data ?? responseData;

const getArray = (payload: any, key: string) => {
  if (!payload) return [];
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const getPaginationMeta = (raw: any) => {
  const payload = raw?.data?.data ?? raw?.data ?? {};
  const total = payload?.pagination?.total ?? payload?.total ?? payload?.count;
  const pages = payload?.pagination?.total_pages ?? payload?.pagination?.pages ?? payload?.pages;
  return {
    total: typeof total === 'number' ? total : undefined,
    pages: typeof pages === 'number' ? pages : undefined,
  };
};

const getTeacherProfileId = (user: any) =>
  user?.teacher?._id ||
  user?.teacher_id?._id ||
  (typeof user?.teacher_id === 'string' ? user.teacher_id : null) ||
  null;

const normalizeTeacherOption = (user: any) => {
  const person = user?.person || user?.person_id || user?.user_id?.person || user?.user_id?.person_id || null;
  const account = user?.user_id || user;
  const teacherProfileId = getTeacherProfileId(user);

  return {
    id: teacherProfileId,
    label: person ? `${person.first_name} ${person.last_name} (${account?.email || user?.email || 'sin correo'})` : account?.email || user?.email || 'Sin correo',
  };
};

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

const getBackendMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback;

const getEnrollmentStudent = (entry: any) => entry?.student || entry?.student_id || null;

const getEnrollmentStudentName = (entry: any) => {
  const student = getEnrollmentStudent(entry);
  const person =
    student?.person ||
    student?.person_id ||
    student?.user_id?.person ||
    student?.user_id?.person_id;

  if (person?.first_name || person?.last_name) {
    return `${person?.first_name || ''} ${person?.last_name || ''}`.trim();
  }

  return student?.user_id?.email || student?.email || 'N/A';
};

const getEnrollmentStudentEmail = (entry: any) => {
  const student = getEnrollmentStudent(entry);
  return student?.user_id?.email || student?.email || 'N/A';
};

const getGroupMaxCapacity = (group: any) => Number(group?.max_capacity || 0);
const getGroupActiveEnrollments = (group: any) => Number(group?.active_enrollments || 0);
const getGroupAvailableSlots = (group: any) => {
  if (typeof group?.available_slots === 'number') return group.available_slots;
  return Math.max(getGroupMaxCapacity(group) - getGroupActiveEnrollments(group), 0);
};

const GroupDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [allAreas, setAllAreas] = useState<any[]>([]);
  const [gradeAreas, setGradeAreas] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('1');
  const [loading, setLoading] = useState(true);
  const [loadingAssignmentData, setLoadingAssignmentData] = useState(false);
  const [assigningTeacher, setAssigningTeacher] = useState(false);
  const [currentGradeId, setCurrentGradeId] = useState('');

  const normalizedAreaOptions = useMemo(
    () =>
      allAreas.map((entry: any) => {
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
      }).filter((entry) => Boolean(entry.id)),
    [allAreas, gradeAreas]
  );

  const selectedAreaConfigured = normalizedAreaOptions.find((area) => area.id === selectedAreaId)?.configured ?? false;

  useEffect(() => {
    if (!id || !isValidObjectId(id)) {
      setLoading(false);
      toast.error('ID de grupo inválido');
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [groupRes, studentsRes, teachersRes] = await Promise.allSettled([
          groupsApi.get(id),
          groupsApi.getGroupStudents(id),
          groupsApi.getGroupTeachers(id),
        ]);

        let currentGroup: any = null;

        if (groupRes.status === 'fulfilled') {
          const payload = getPayload(groupRes.value.data);
          currentGroup = payload?.group ?? payload;
          setGroup(currentGroup);
        }

        if (studentsRes.status === 'fulfilled') {
          const payload = getPayload(studentsRes.value.data);
          setStudents(getArray(payload, 'students'));
        }

        if (teachersRes.status === 'fulfilled') {
          const payload = getPayload(teachersRes.value.data);
          setTeachers(getArray(payload, 'teachers'));
        }

        const gradeId =
          currentGroup?.grade_id?._id ||
          currentGroup?.grade_id ||
          currentGroup?.grade?._id ||
          currentGroup?.grade ||
          null;

        if (gradeId && isValidObjectId(String(gradeId))) {
          setCurrentGradeId(String(gradeId));
          setLoadingAssignmentData(true);
          try {
            const teacherList: any[] = [];
            const pageSize = 50;
            let page = 1;
            let hasMore = true;

            while (hasMore) {
              const res = await usersApi.listByRole('teacher', { page, limit: pageSize });
              const payload = getPayload(res.data);
              const chunk = getArray(payload, 'users');
              teacherList.push(...chunk);

              const meta = getPaginationMeta(res);
              if (meta.pages) hasMore = page < meta.pages;
              else if (meta.total !== undefined) hasMore = teacherList.length < meta.total;
              else hasMore = chunk.length === pageSize;

              page += 1;
              if (page > 100) hasMore = false;
            }

            const [gradeAreasRes, allAreasRes] = await Promise.all([
              groupsApi.getGradeAreas(String(gradeId)),
              academicApi.getAreas(),
            ]);

            const areaPayload = getPayload(gradeAreasRes.data);
            const allAreasPayload = getPayload(allAreasRes.data);
            setGradeAreas(getArray(areaPayload, 'areas'));
            setAllAreas(getArray(allAreasPayload, 'areas'));
            setTeacherOptions(
              teacherList
                .map(normalizeTeacherOption)
                .filter((entry) => Boolean(entry.id))
            );
          } catch (error) {
            toast.error(getBackendMessage(error, 'No se pudieron cargar docentes y areas del grado'));
          } finally {
            setLoadingAssignmentData(false);
          }
        }
      } catch {
        toast.error('Error al cargar grupo');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const refreshTeachers = async () => {
    if (!id || !isValidObjectId(id)) return;

    const res = await groupsApi.getGroupTeachers(id);
    const payload = getPayload(res.data);
    setTeachers(getArray(payload, 'teachers'));
  };

  const refreshGradeAreas = async () => {
    if (!currentGradeId || !isValidObjectId(currentGradeId)) return;

    const res = await groupsApi.getGradeAreas(currentGradeId);
    const payload = getPayload(res.data);
    setGradeAreas(getArray(payload, 'areas'));
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
        await refreshGradeAreas();
      }

      await groupsApi.assignTeacher({
        teacher_id: selectedTeacherId,
        group_id: id,
        area_id: selectedAreaId,
      });
      await refreshTeachers();
      setSelectedTeacherId('');
      setSelectedAreaId('');
      setWeeklyHours('1');
      toast.success('Docente asignado al grupo');
    } catch (error) {
      toast.error(getBackendMessage(error, 'No se pudo asignar el docente'));
    } finally {
      setAssigningTeacher(false);
    }
  };

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
            {group?.grade?.name && <Badge variant="secondary">{group.grade.name}</Badge>}
            {group?.aula?.name && <Badge variant="outline">{group.aula.name}</Badge>}
            <Badge variant="outline">Capacidad: {getGroupMaxCapacity(group)}</Badge>
            <Badge variant="outline">Matriculados: {getGroupActiveEnrollments(group)}</Badge>
            <Badge variant="outline">Disponibles: {getGroupAvailableSlots(group)}</Badge>
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
                        students.map((s: any) => (
                          <TableRow key={s._id}>
                            <TableCell className="font-medium">{getEnrollmentStudentName(s)}</TableCell>
                            <TableCell>{getEnrollmentStudentEmail(s)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{s.status || 'Activo'}</Badge>
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
                    <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId} disabled={loadingAssignmentData || assigningTeacher}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona docente" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherOptions.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Area</Label>
                    <Select value={selectedAreaId} onValueChange={setSelectedAreaId} disabled={loadingAssignmentData || assigningTeacher}>
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

                  <Button onClick={onAssignTeacher} disabled={assigningTeacher || loadingAssignmentData}>
                    {assigningTeacher ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Asignar
                  </Button>
                </div>

                {normalizedAreaOptions.length === 0 && !loadingAssignmentData && (
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
                      {loadingAssignmentData && teachers.length === 0 ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          </TableRow>
                        ))
                      ) : teachers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No hay docentes asignados
                          </TableCell>
                        </TableRow>
                      ) : (
                        teachers.map((t: any) => (
                          <TableRow key={t._id}>
                            <TableCell className="font-medium">{getTeacherDisplayName(t)}</TableCell>
                            <TableCell>{getTeacherDisplayEmail(t)}</TableCell>
                            <TableCell>{getAreaDisplayName(t)}</TableCell>
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
