import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usePromotionSchoolYears, useRunPromotion } from '@/hooks/admin/useAdminPromotions';

const PromotionsPage = () => {
  const { data: years = [], isLoading } = usePromotionSchoolYears();
  const promotionMutation = useRunPromotion();

  const [fromYearId, setFromYearId] = useState('');
  const [toYearId, setToYearId] = useState('');
  const [summary, setSummary] = useState<any | null>(null);

  const yearOptions = useMemo(
    () => years.map((year: any) => ({ value: year._id, label: year.name || String(year.year) })),
    [years]
  );

  const runPromotion = async () => {
    if (!fromYearId || !toYearId) {
      toast.error('Selecciona año origen y año destino');
      return;
    }
    if (fromYearId === toYearId) {
      toast.error('El año origen y destino no pueden ser iguales');
      return;
    }

    try {
      const response = await promotionMutation.mutateAsync({
        from_school_year_id: fromYearId,
        to_school_year_id: toYearId,
      });
      const payload = response.data?.data ?? response.data;
      setSummary(payload?.summary ?? payload);
      toast.success(response.data?.message || 'Promoción anual ejecutada');
    } catch (err: any) {
      const payload = err.response?.data;
      setSummary(payload?.data?.summary || null);
      toast.error(payload?.message || 'No se pudo ejecutar la promoción anual');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Promoción Anual</h1>
          <p className="text-muted-foreground">Ejecuta la promoción masiva entre años escolares.</p>
        </div>

        <Alert className="border-warning/30 bg-warning/10">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Acción crítica</AlertTitle>
          <AlertDescription>
            Esta operación es masiva y usa resultados finales. Si hay estudiantes sin resultado final, el backend puede rechazar toda la ejecución.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de promoción</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div className="space-y-2">
              <p className="text-sm font-medium">Año origen</p>
              <Select value={fromYearId} onValueChange={setFromYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona año origen" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Año destino</p>
              <Select value={toYearId} onValueChange={setToYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona año destino" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isLoading || promotionMutation.isPending}>
                  {promotionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Ejecutar promoción
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar promoción anual</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se ejecutará una promoción masiva del año seleccionado de origen al año de destino. Esta acción puede modificar estado académico y de usuario.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={runPromotion}>Confirmar y ejecutar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de ejecución</CardTitle>
          </CardHeader>
          <CardContent>
            {!summary ? (
              <p className="text-muted-foreground">Aún no hay una ejecución en esta sesión.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Promovidos</p>
                  <p className="text-2xl font-display font-bold">{summary.promoted ?? 0}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Repiten</p>
                  <p className="text-2xl font-display font-bold">{summary.repeated ?? 0}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Egresados</p>
                  <p className="text-2xl font-display font-bold">{summary.graduated ?? 0}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Revisión manual</p>
                  <p className="text-2xl font-display font-bold">{summary.manual_review ?? 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PromotionsPage;
