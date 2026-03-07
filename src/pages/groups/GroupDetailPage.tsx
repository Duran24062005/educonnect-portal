import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { groupsApi } from '@/api/groups';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, BookOpen } from 'lucide-react';
import { isValidObjectId } from '@/lib/object-id';

const getPayload = (responseData: any) => responseData?.data ?? responseData;

const getArray = (payload: any, key: string) => {
  if (!payload) return [];
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const GroupDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !isValidObjectId(id)) {
      setLoading(false);
      toast.error('ID de grupo inválido');
      return;
    }
    const load = async () => {
      try {
        const [groupRes, studentsRes, teachersRes] = await Promise.allSettled([
          groupsApi.get(id),
          groupsApi.getGroupStudents(id),
          groupsApi.getGroupTeachers(id),
        ]);
        if (groupRes.status === 'fulfilled') {
          const payload = getPayload(groupRes.value.data);
          setGroup(payload?.group ?? payload);
        }
        if (studentsRes.status === 'fulfilled') {
          const payload = getPayload(studentsRes.value.data);
          setStudents(getArray(payload, 'students'));
        }
        if (teachersRes.status === 'fulfilled') {
          const payload = getPayload(teachersRes.value.data);
          setTeachers(getArray(payload, 'teachers'));
        }
      } catch {
        toast.error('Error al cargar grupo');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
                            <TableCell className="font-medium">
                              {s.student?.person ? `${s.student.person.first_name} ${s.student.person.last_name}` : s.student?.email || 'N/A'}
                            </TableCell>
                            <TableCell>{s.student?.email || 'N/A'}</TableCell>
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
              <CardContent className="pt-6">
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Área</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                            No hay docentes asignados
                          </TableCell>
                        </TableRow>
                      ) : (
                        teachers.map((t: any) => (
                          <TableRow key={t._id}>
                            <TableCell className="font-medium">
                              {t.teacher?.person ? `${t.teacher.person.first_name} ${t.teacher.person.last_name}` : t.teacher?.email || 'N/A'}
                            </TableCell>
                            <TableCell>{t.area?.name || 'N/A'}</TableCell>
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
