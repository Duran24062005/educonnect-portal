import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { academicApi } from '@/api/academic';
import { evaluationsApi } from '@/api/evaluations';
import { groupsApi } from '@/api/groups';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

const unwrap = (res: any, key?: string) => {
  const data = res?.data?.data ?? res?.data;
  if (key && Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.students)) return data.students;
  if (Array.isArray(data?.scores)) return data.scores;
  if (Array.isArray(data?.areas)) return data.areas;
  if (Array.isArray(data?.gradeItems)) return data.gradeItems;
  return [];
};

const GroupScoresPage = () => {
  const { id } = useParams<{ id: string }>();
  const [students, setStudents] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [newScore, setNewScore] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadStudentsAndAreas = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [studentsRes, areasRes] = await Promise.all([groupsApi.getGroupStudents(id), academicApi.getAreas()]);
      const loadedStudents = unwrap(studentsRes, 'students');
      const loadedAreas = unwrap(areasRes, 'areas');
      setStudents(loadedStudents);
      setAreas(loadedAreas);
      if (loadedStudents[0]?._id) setSelectedStudent(loadedStudents[0]._id);
      if (loadedAreas[0]?._id) setSelectedArea(loadedAreas[0]._id);
    } catch {
      toast.error('No se pudo cargar la información del grupo');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (areaId: string) => {
    try {
      const res = await evaluationsApi.getGradeItems({ area_id: areaId });
      const loadedItems = unwrap(res, 'gradeItems');
      setItems(loadedItems);
      if (loadedItems[0]?._id) setSelectedItem(loadedItems[0]._id);
      else setSelectedItem('');
    } catch {
      setItems([]);
      setSelectedItem('');
      toast.error('No se pudieron cargar los ítems de evaluación');
    }
  };

  const loadScoresByItem = async (itemId: string) => {
    if (!itemId) return;
    try {
      const res = await evaluationsApi.getGradeItemScores(itemId);
      setScores(unwrap(res, 'scores'));
    } catch {
      setScores([]);
      toast.error('No se pudieron cargar las calificaciones del ítem');
    }
  };

  useEffect(() => {
    loadStudentsAndAreas();
  }, [id]);

  useEffect(() => {
    if (selectedArea) loadItems(selectedArea);
  }, [selectedArea]);

  useEffect(() => {
    if (selectedItem) loadScoresByItem(selectedItem);
    else setScores([]);
  }, [selectedItem]);

  const mappedStudents = useMemo(
    () => students.map((entry) => entry.student || entry),
    [students]
  );

  const handleSave = async () => {
    if (!selectedStudent || !selectedItem || !newScore) {
      toast.error('Selecciona estudiante, ítem y nota');
      return;
    }

    const numericScore = Number(newScore);
    if (Number.isNaN(numericScore) || numericScore < 0) {
      toast.error('Ingresa una nota válida');
      return;
    }

    setSaving(true);
    try {
      await evaluationsApi.createScore({
        student_id: selectedStudent,
        grade_item_id: selectedItem,
        score: numericScore,
      });
      toast.success('Calificación guardada');
      setNewScore('');
      await loadScoresByItem(selectedItem);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo guardar la calificación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Registro de Calificaciones</h1>
          <p className="text-muted-foreground">Grupo {id}. Registra notas por ítem de evaluación.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registrar calificación</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Área</Label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger><SelectValue placeholder="Selecciona área" /></SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area._id} value={area._id}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ítem</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger><SelectValue placeholder="Selecciona ítem" /></SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estudiante</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger><SelectValue placeholder="Selecciona estudiante" /></SelectTrigger>
                <SelectContent>
                  {mappedStudents.map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.person ? `${student.person.first_name} ${student.person.last_name}` : student.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nota</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step="0.1"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  placeholder="0.0"
                />
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas del ítem seleccionado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Ítem</TableHead>
                    <TableHead>Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      </TableRow>
                    ))
                  ) : scores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No hay calificaciones registradas para este ítem
                      </TableCell>
                    </TableRow>
                  ) : (
                    scores.map((score) => (
                      <TableRow key={score._id}>
                        <TableCell className="font-medium">
                          {score.student?.person
                            ? `${score.student.person.first_name} ${score.student.person.last_name}`
                            : score.student?.email || 'N/A'}
                        </TableCell>
                        <TableCell>{score.grade_item?.name || 'N/A'}</TableCell>
                        <TableCell>{score.score}</TableCell>
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

export default GroupScoresPage;
