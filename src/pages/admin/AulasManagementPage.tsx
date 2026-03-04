import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { useAdminAulas, useCreateAula } from '@/hooks/admin/useAdminAulas';

const AulasManagementPage = () => {
  const { data: aulas = [], isLoading } = useAdminAulas();
  const createAula = useCreateAula();

  const [form, setForm] = useState({ name: '', max_capacity: '' });

  const onCreate = async () => {
    const name = form.name.trim();
    const maxCapacity = Number(form.max_capacity);

    if (!name || !form.max_capacity) {
      toast.error('Completa nombre y capacidad máxima');
      return;
    }

    if (Number.isNaN(maxCapacity) || maxCapacity <= 0) {
      toast.error('La capacidad máxima debe ser mayor a 0');
      return;
    }

    try {
      await createAula.mutateAsync({ name, max_capacity: maxCapacity });
      toast.success('Aula creada correctamente');
      setForm({ name: '', max_capacity: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo crear el aula');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Gestión de Aulas</h1>
          <p className="text-muted-foreground">Crea aulas y consulta su capacidad máxima.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nueva aula</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-3 items-end">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Aula 101" />
            </div>
            <div className="space-y-2">
              <Label>Capacidad máxima</Label>
              <Input
                type="number"
                min={1}
                value={form.max_capacity}
                onChange={(e) => setForm((prev) => ({ ...prev, max_capacity: e.target.value }))}
                placeholder="35"
              />
            </div>
            <Button onClick={onCreate} disabled={createAula.isPending}>
              {createAula.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Crear
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listado de aulas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Capacidad máxima</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && aulas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                        No hay aulas registradas
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && aulas.map((aula: any) => (
                    <TableRow key={aula._id}>
                      <TableCell className="font-medium">{aula.name}</TableCell>
                      <TableCell>{aula.max_capacity ?? aula.capacity ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AulasManagementPage;
