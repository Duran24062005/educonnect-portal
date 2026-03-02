import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { evaluationsApi } from '@/api/evaluations';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const MyGradesPage = () => {
  const { user } = useAuthStore();
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    evaluationsApi.getStudentScores(user._id)
      .then((res) => setScores(res.data?.scores || res.data || []))
      .catch(() => toast.error('Error al cargar calificaciones'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Mis Calificaciones</h1>
          <p className="text-muted-foreground">Consulta tus notas por área</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evaluación</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      </TableRow>
                    ))
                  ) : scores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No hay calificaciones registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    scores.map((s: any) => (
                      <TableRow key={s._id}>
                        <TableCell className="font-medium">{s.grade_item?.name || 'N/A'}</TableCell>
                        <TableCell>{s.grade_item?.area?.name || 'N/A'}</TableCell>
                        <TableCell className="font-semibold">{s.score}</TableCell>
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

export default MyGradesPage;
