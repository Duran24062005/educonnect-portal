import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { evaluationsApi } from '@/api/evaluations';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const MyResultsPage = () => {
  const { user } = useAuthStore();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    evaluationsApi.getStudentPeriodResults(user._id)
      .then((res) => setResults(res.data?.results || res.data || []))
      .catch(() => toast.error('Error al cargar resultados'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Mis Resultados</h1>
          <p className="text-muted-foreground">Resultados por periodo y finales</p>
        </div>
        <Card>
          <CardContent className="pt-6">
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
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No hay resultados disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((r: any) => (
                      <TableRow key={r._id}>
                        <TableCell>{r.period?.name || 'N/A'}</TableCell>
                        <TableCell>{r.area?.name || 'N/A'}</TableCell>
                        <TableCell className="font-semibold">{r.average?.toFixed(1) || r.score}</TableCell>
                        <TableCell>
                          <Badge variant={r.passed ? 'default' : 'destructive'}>
                            {r.passed ? 'Aprobado' : 'Reprobado'}
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

export default MyResultsPage;
