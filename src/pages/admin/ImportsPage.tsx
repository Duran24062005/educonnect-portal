import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { importsApi, type ImportEntity, type ImportJob } from '@/api/imports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { CheckCircle2, CircleAlert, FileUp, History, Loader2, RefreshCcw } from 'lucide-react';

const entityOptions: Array<{ value: ImportEntity; label: string; columns: string }> = [
  { value: 'students', label: 'Estudiantes', columns: 'correo, nombre, apellido, tipo_documento, numero_documento, clave' },
  { value: 'guardians', label: 'Acudientes y vínculos', columns: 'correo, nombre, apellido, tipo_documento, numero_documento, clave, documento_estudiante, parentesco' },
  { value: 'teachers', label: 'Docentes', columns: 'correo, nombre, apellido, tipo_documento, numero_documento, clave' },
  { value: 'grades', label: 'Grados', columns: 'nombre, nivel' },
  { value: 'areas', label: 'Áreas y asignaturas', columns: 'nombre, descripcion' },
  { value: 'groups', label: 'Grupos', columns: 'ano, grado, nombre, capacidad' },
  { value: 'enrollments', label: 'Matrículas', columns: 'documento_estudiante, ano, nombre_grupo' },
];

const statusLabel: Record<string, string> = {
  preview: 'Previsualizada',
  confirmed: 'Confirmada',
  failed: 'Fallida',
};

const ImportsPage = () => {
  const [entity, setEntity] = useState<ImportEntity>('students');
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const selectedEntity = useMemo(() => entityOptions.find((option) => option.value === entity), [entity]);

  const loadJobs = async () => {
    try {
      setJobs(await importsApi.list());
    } catch {
      toast.error('No se pudo cargar el historial de importaciones');
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handlePreview = async () => {
    if (!file) {
      toast.error('Selecciona un archivo CSV');
      return;
    }
    setLoading(true);
    try {
      const result = await importsApi.preview(entity, file);
      setJob(result);
      await loadJobs();
      if (result.summary.invalid > 0) toast.warning('La carga tiene errores y no se puede confirmar todavía');
      else toast.success('Previsualización lista para revisión');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se pudo previsualizar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!job || job.errors.length > 0) return;
    setConfirming(true);
    try {
      const result = await importsApi.confirm(job._id);
      setJob(result);
      await loadJobs();
      toast.success('Importación confirmada');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se pudo confirmar la importación');
    } finally {
      setConfirming(false);
    }
  };

  const openJob = async (id: string) => {
    try {
      setJob(await importsApi.get(id));
    } catch {
      toast.error('No se pudo abrir la importación');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold">Importaciones</h1>
            <p className="text-muted-foreground">Carga datos CSV con revisión antes de guardarlos</p>
          </div>
          <Button variant="outline" size="icon" onClick={loadJobs} aria-label="Actualizar historial" title="Actualizar historial">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><FileUp className="h-4 w-4" />Nueva carga</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[minmax(220px,0.7fr)_minmax(280px,1fr)_auto] md:items-end">
            <div className="space-y-2">
              <Label>Tipo de datos</Label>
              <Select value={entity} onValueChange={(value) => setEntity(value as ImportEntity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{entityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-file">Archivo CSV</Label>
              <Input id="import-file" type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] || null)} />
              <p className="text-xs text-muted-foreground">Columnas esperadas: {selectedEntity?.columns}</p>
            </div>
            <Button onClick={handlePreview} disabled={loading || !file}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
              Previsualizar
            </Button>
          </CardContent>
        </Card>

        {job && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Revisión: {job.file_name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{selectedEntity?.label || job.entity} · {statusLabel[job.status] || job.status}</p>
              </div>
              <Button onClick={handleConfirm} disabled={confirming || job.status !== 'preview' || job.errors.length > 0}>
                {confirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Confirmar carga
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ['Filas', job.summary.total],
                  ['Válidas', job.summary.valid],
                  ['Con errores', job.summary.invalid],
                  ['Guardadas', job.summary.created + job.summary.updated],
                ].map(([label, value]) => <div key={label} className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>)}
              </div>
              {job.errors.length > 0 ? (
                <Alert variant="destructive">
                  <CircleAlert className="h-4 w-4" />
                  <AlertTitle>Corrige los errores antes de confirmar</AlertTitle>
                  <AlertDescription>
                    <div className="mt-3 overflow-auto rounded-md border border-destructive/20">
                      <Table>
                        <TableHeader><TableRow><TableHead>Fila</TableHead><TableHead>Campo</TableHead><TableHead>Detalle</TableHead></TableRow></TableHeader>
                        <TableBody>{job.errors.map((error, index) => <TableRow key={`${error.row_number}-${error.field}-${index}`}><TableCell>{error.row_number}</TableCell><TableCell>{error.field}</TableCell><TableCell>{error.message}</TableCell></TableRow>)}</TableBody>
                      </Table>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert><CheckCircle2 className="h-4 w-4" /><AlertTitle>Lista para confirmar</AlertTitle><AlertDescription>La validación no encontró errores por fila.</AlertDescription></Alert>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" />Historial reciente</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>Archivo</TableHead><TableHead>Tipo</TableHead><TableHead>Resultado</TableHead><TableHead>Filas</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader>
                <TableBody>
                  {jobs.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No hay cargas registradas</TableCell></TableRow> : jobs.map((item) => <TableRow key={item._id}><TableCell className="font-medium">{item.file_name}</TableCell><TableCell>{entityOptions.find((option) => option.value === item.entity)?.label || item.entity}</TableCell><TableCell><Badge variant={item.status === 'confirmed' ? 'default' : item.status === 'failed' ? 'destructive' : 'secondary'}>{statusLabel[item.status] || item.status}</Badge></TableCell><TableCell>{item.summary.total}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => openJob(item._id)}>Ver</Button></TableCell></TableRow>)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ImportsPage;
