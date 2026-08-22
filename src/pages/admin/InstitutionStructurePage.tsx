import { useCallback, useEffect, useState } from 'react';
import { institutionApi, type Campus, type SchoolShift } from '@/api/institution';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Building2, Clock3, Loader2, Pencil, Power, Plus, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const emptyCampus = { name: '', code: '', address: '' };
const emptyShift = { name: '', code: '', start_time: '07:00', end_time: '12:00' };

const errorMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback;

const InstitutionStructurePage = () => {
  const hasInstitutionContext = useAuthStore((state) => Boolean(state.user?.institution_id));
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [shifts, setShifts] = useState<SchoolShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCampus, setSavingCampus] = useState(false);
  const [savingShift, setSavingShift] = useState(false);
  const [campusForm, setCampusForm] = useState(emptyCampus);
  const [shiftForm, setShiftForm] = useState(emptyShift);
  const [editingCampusId, setEditingCampusId] = useState<string | null>(null);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);

  const loadStructure = useCallback(async () => {
    setLoading(true);
    if (!hasInstitutionContext) {
      setCampuses([]);
      setShifts([]);
      setLoading(false);
      return;
    }

    try {
      const [campusesResponse, shiftsResponse] = await Promise.all([
        institutionApi.getCampuses(),
        institutionApi.getShifts(),
      ]);
      setCampuses(campusesResponse.data?.data ?? []);
      setShifts(shiftsResponse.data?.data ?? []);
    } catch (error) {
      toast.error(errorMessage(error, 'No se pudo cargar la estructura institucional'));
    } finally {
      setLoading(false);
    }
  }, [hasInstitutionContext]);

  useEffect(() => {
    loadStructure();
  }, [loadStructure]);

  const resetCampus = () => {
    setCampusForm(emptyCampus);
    setEditingCampusId(null);
  };

  const resetShift = () => {
    setShiftForm(emptyShift);
    setEditingShiftId(null);
  };

  const saveCampus = async () => {
    if (!campusForm.name.trim() || !campusForm.code.trim()) {
      toast.error('Nombre y código de sede son requeridos');
      return;
    }

    setSavingCampus(true);
    try {
      if (editingCampusId) {
        await institutionApi.updateCampus(editingCampusId, campusForm);
        toast.success('Sede actualizada');
      } else {
        await institutionApi.createCampus(campusForm);
        toast.success('Sede creada');
      }
      resetCampus();
      await loadStructure();
    } catch (error) {
      toast.error(errorMessage(error, 'No se pudo guardar la sede'));
    } finally {
      setSavingCampus(false);
    }
  };

  const saveShift = async () => {
    if (!shiftForm.name.trim() || !shiftForm.code.trim() || !shiftForm.start_time || !shiftForm.end_time) {
      toast.error('Nombre, código y horario de jornada son requeridos');
      return;
    }
    if (shiftForm.start_time >= shiftForm.end_time) {
      toast.error('La hora inicial debe ser anterior a la final');
      return;
    }

    setSavingShift(true);
    try {
      if (editingShiftId) {
        await institutionApi.updateShift(editingShiftId, shiftForm);
        toast.success('Jornada actualizada');
      } else {
        await institutionApi.createShift(shiftForm);
        toast.success('Jornada creada');
      }
      resetShift();
      await loadStructure();
    } catch (error) {
      toast.error(errorMessage(error, 'No se pudo guardar la jornada'));
    } finally {
      setSavingShift(false);
    }
  };

  const toggleCampus = async (campus: Campus) => {
    try {
      await institutionApi.updateCampus(campus._id, { status: campus.status === 'active' ? 'inactive' : 'active' });
      toast.success(campus.status === 'active' ? 'Sede desactivada' : 'Sede activada');
      await loadStructure();
    } catch (error) {
      toast.error(errorMessage(error, 'No se pudo cambiar el estado de la sede'));
    }
  };

  const toggleShift = async (shift: SchoolShift) => {
    try {
      await institutionApi.updateShift(shift._id, { status: shift.status === 'active' ? 'inactive' : 'active' });
      toast.success(shift.status === 'active' ? 'Jornada desactivada' : 'Jornada activada');
      await loadStructure();
    } catch (error) {
      toast.error(errorMessage(error, 'No se pudo cambiar el estado de la jornada'));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Sedes y jornadas</h1>
          <p className="text-muted-foreground">Configura las referencias institucionales que pueden usar las matrículas.</p>
        </div>

        {!hasInstitutionContext && (
          <Card className="border-amber-300/60 bg-amber-50/60 dark:border-amber-700/60 dark:bg-amber-950/20">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Tu cuenta todavía no está vinculada a una institución. Asigna una institución al usuario administrador antes de configurar sedes y jornadas.
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4" />{editingCampusId ? 'Editar sede' : 'Nueva sede'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Nombre</Label><Input value={campusForm.name} onChange={(event) => setCampusForm({ ...campusForm, name: event.target.value })} placeholder="Sede principal" /></div>
                <div className="space-y-2"><Label>Código</Label><Input value={campusForm.code} onChange={(event) => setCampusForm({ ...campusForm, code: event.target.value })} placeholder="PRINCIPAL" /></div>
              </div>
              <div className="space-y-2"><Label>Dirección (opcional)</Label><Input value={campusForm.address} onChange={(event) => setCampusForm({ ...campusForm, address: event.target.value })} placeholder="Carrera 10 # 20-30" /></div>
              <div className="flex justify-end gap-2">
                {editingCampusId && <Button type="button" variant="ghost" onClick={resetCampus}><X className="h-4 w-4 mr-2" />Cancelar</Button>}
                <Button onClick={saveCampus} disabled={!hasInstitutionContext || savingCampus}>{savingCampus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}{editingCampusId ? 'Guardar cambios' : 'Crear sede'}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4" />{editingShiftId ? 'Editar jornada' : 'Nueva jornada'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Nombre</Label><Input value={shiftForm.name} onChange={(event) => setShiftForm({ ...shiftForm, name: event.target.value })} placeholder="Mañana" /></div>
                <div className="space-y-2"><Label>Código</Label><Input value={shiftForm.code} onChange={(event) => setShiftForm({ ...shiftForm, code: event.target.value })} placeholder="AM" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Hora inicial</Label><Input type="time" value={shiftForm.start_time} onChange={(event) => setShiftForm({ ...shiftForm, start_time: event.target.value })} /></div>
                <div className="space-y-2"><Label>Hora final</Label><Input type="time" value={shiftForm.end_time} onChange={(event) => setShiftForm({ ...shiftForm, end_time: event.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2">
                {editingShiftId && <Button type="button" variant="ghost" onClick={resetShift}><X className="h-4 w-4 mr-2" />Cancelar</Button>}
                <Button onClick={saveShift} disabled={!hasInstitutionContext || savingShift}>{savingShift ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}{editingShiftId ? 'Guardar cambios' : 'Crear jornada'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Sedes configuradas</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Código</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {loading && Array.from({ length: 3 }).map((_, index) => <TableRow key={index}><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-16" /></TableCell><TableCell><Skeleton className="h-5 w-16" /></TableCell><TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell></TableRow>)}
                    {!loading && campuses.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No hay sedes registradas</TableCell></TableRow>}
                    {!loading && campuses.map((campus) => <TableRow key={campus._id}><TableCell><div className="font-medium">{campus.name}</div><div className="text-xs text-muted-foreground">{campus.address || 'Sin dirección'}</div></TableCell><TableCell>{campus.code}</TableCell><TableCell><Badge variant={campus.status === 'active' ? 'default' : 'secondary'}>{campus.status === 'active' ? 'Activa' : 'Inactiva'}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Editar sede" onClick={() => { setEditingCampusId(campus._id); setCampusForm({ name: campus.name, code: campus.code, address: campus.address || '' }); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title={campus.status === 'active' ? 'Desactivar sede' : 'Activar sede'} onClick={() => toggleCampus(campus)}><Power className="h-4 w-4" /></Button></div></TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Jornadas configuradas</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Horario</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {loading && Array.from({ length: 3 }).map((_, index) => <TableRow key={index}><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-16" /></TableCell><TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell></TableRow>)}
                    {!loading && shifts.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No hay jornadas registradas</TableCell></TableRow>}
                    {!loading && shifts.map((shift) => <TableRow key={shift._id}><TableCell><div className="font-medium">{shift.name}</div><div className="text-xs text-muted-foreground">{shift.code}</div></TableCell><TableCell>{shift.start_time} - {shift.end_time}</TableCell><TableCell><Badge variant={shift.status === 'active' ? 'default' : 'secondary'}>{shift.status === 'active' ? 'Activa' : 'Inactiva'}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Editar jornada" onClick={() => { setEditingShiftId(shift._id); setShiftForm({ name: shift.name, code: shift.code, start_time: shift.start_time, end_time: shift.end_time }); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title={shift.status === 'active' ? 'Desactivar jornada' : 'Activar jornada'} onClick={() => toggleShift(shift)}><Power className="h-4 w-4" /></Button></div></TableCell></TableRow>)}
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

export default InstitutionStructurePage;
