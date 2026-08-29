import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Building2, Check, ChevronLeft, ChevronRight, Edit3, Loader2, Mail, MoreHorizontal, Pause, Plus, Search, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import PlatformLayout from '@/layouts/PlatformLayout';
import { platformApi, type InstitutionCreatePayload, type InstitutionType, type PlatformInstitution, type PlatformInstitutionStatus } from '@/api/platform';
import { extractApiError } from '@/lib/http';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const initialCreateForm: InstitutionCreatePayload = {
  institution: { name: '', code: '', type: 'public', max_students: 800, timezone: 'America/Bogota' },
  primary_admin: { first_name: '', last_name: '', email: '', document_type: 'CC', document_number: '', phone: '' },
};

const institutionTypeLabel: Record<InstitutionType, string> = { public: 'Pública', private: 'Privada' };
const statusLabel: Record<PlatformInstitutionStatus, string> = { sandbox: 'Sandbox', active: 'Activa', suspended: 'Suspendida', archived: 'Archivada' };
const statusClass: Record<PlatformInstitutionStatus, string> = {
  sandbox: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
  active: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
  suspended: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-300',
  archived: 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
};

const getAdminName = (institution: PlatformInstitution) => {
  const person = institution.primary_admin?.person;
  return person ? `${person.first_name} ${person.last_name}` : 'Sin administrador';
};

const getErrorMessage = (error: unknown, fallback: string) => extractApiError(error).message || fallback;

const PlatformInstitutionsPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<InstitutionType | 'all'>('all');
  const [status, setStatus] = useState<PlatformInstitutionStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(searchParams.get('new') === '1');
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState<InstitutionCreatePayload>(initialCreateForm);
  const [assignForm, setAssignForm] = useState<InstitutionCreatePayload['primary_admin']>(initialCreateForm.primary_admin);
  const [editForm, setEditForm] = useState({ name: '', code: '', max_students: 800, timezone: 'America/Bogota' });
  const limit = 8;

  const listQuery = useQuery({
    queryKey: ['platform', 'institutions', { search, type, status, page }],
    queryFn: async () => {
      const response = await platformApi.listInstitutions({
        search: search.trim() || undefined,
        type: type === 'all' ? undefined : type,
        status: status === 'all' ? undefined : status,
        page,
        limit,
      });
      return response.data.data;
    },
  });

  const selectedQuery = useQuery({
    queryKey: ['platform', 'institution', selectedId],
    queryFn: async () => (await platformApi.getInstitution(selectedId as string)).data.data,
    enabled: Boolean(selectedId),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['platform', 'institutions'] });
    if (selectedId) await queryClient.invalidateQueries({ queryKey: ['platform', 'institution', selectedId] });
  };

  const createMutation = useMutation({
    mutationFn: platformApi.createInstitution,
    onSuccess: async (response) => {
      const invitation = response.data.data.invitation;
      toast.success(invitation.sent ? 'Institución creada e invitación enviada' : 'Institución creada; revisa el envío de la invitación');
      setCreateForm(initialCreateForm);
      setCreateOpen(false);
      setSearchParams({});
      await refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo crear la institución')),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => platformApi.updateInstitution(id, data),
    onSuccess: async () => {
      toast.success('Datos institucionales actualizados');
      setEditOpen(false);
      await refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo actualizar la institución')),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InstitutionCreatePayload['primary_admin'] }) => platformApi.assignPrimaryAdmin(id, data),
    onSuccess: async (response) => {
      const invitation = response.data.data.invitation;
      toast.success(invitation.sent ? 'Administrador asignado e invitación enviada' : 'Administrador asignado; revisa el envío de la invitación');
      setAssignForm(initialCreateForm.primary_admin);
      setAssignOpen(false);
      await refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo asignar el administrador')),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'active' | 'suspended' }) => platformApi.changeInstitutionStatus(id, nextStatus),
    onSuccess: async (_response, variables) => {
      toast.success(variables.nextStatus === 'active' ? 'Institución activada' : 'Institución suspendida');
      await refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo cambiar el estado')),
  });

  const invitationMutation = useMutation({
    mutationFn: platformApi.resendInvitation,
    onSuccess: (response) => toast.success(response.data.data.sent ? 'Invitación reenviada' : 'La invitación quedó pendiente de envío'),
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo reenviar la invitación')),
  });

  const institutions = useMemo(() => listQuery.data?.institutions ?? [], [listQuery.data?.institutions]);
  const pagination = listQuery.data?.pagination;
  const selected = selectedQuery.data ?? institutions.find((item) => item._id === selectedId) ?? null;
  const counts = useMemo(() => ({
    total: pagination?.total ?? 0,
    sandbox: institutions.filter((item) => item.status === 'sandbox').length,
    active: institutions.filter((item) => item.status === 'active').length,
    suspended: institutions.filter((item) => item.status === 'suspended').length,
  }), [institutions, pagination?.total]);

  useEffect(() => {
    if (searchParams.get('new') === '1') setCreateOpen(true);
  }, [searchParams]);

  const updateCreateInstitution = (field: keyof InstitutionCreatePayload['institution'], value: string | number) => {
    setCreateForm((current) => ({ ...current, institution: { ...current.institution, [field]: value } }));
  };

  const updateCreateAdmin = (field: keyof InstitutionCreatePayload['primary_admin'], value: string) => {
    setCreateForm((current) => ({ ...current, primary_admin: { ...current.primary_admin, [field]: value } }));
  };

  const validateCreateForm = () => {
    const { institution, primary_admin } = createForm;
    if (!institution.name.trim() || !institution.code.trim()) return 'Completa el nombre y código de la institución';
    if (!primary_admin.first_name.trim() || !primary_admin.last_name.trim() || !primary_admin.email.trim()) return 'Completa los datos básicos del administrador';
    if (!primary_admin.document_number.trim()) return 'El documento del administrador es requerido';
    return null;
  };

  const submitCreate = () => {
    const validationError = validateCreateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    createMutation.mutate(createForm);
  };

  const openEdit = (institution: PlatformInstitution) => {
    setSelectedId(institution._id);
    setEditForm({ name: institution.name, code: institution.code, max_students: institution.max_students, timezone: institution.timezone });
    setEditOpen(true);
  };

  const openAssign = (institution: PlatformInstitution) => {
    setSelectedId(institution._id);
    setAssignForm(initialCreateForm.primary_admin);
    setAssignOpen(true);
  };

  const validateAssignForm = () => {
    if (!assignForm.first_name.trim() || !assignForm.last_name.trim() || !assignForm.email.trim()) return 'Completa los datos básicos del administrador';
    if (!assignForm.document_number.trim()) return 'El documento del administrador es requerido';
    return null;
  };

  const submitAssign = () => {
    const validationError = validateAssignForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (selectedId) assignMutation.mutate({ id: selectedId, data: assignForm });
  };

  const closeCreate = (open: boolean) => {
    setCreateOpen(open);
    if (!open) setSearchParams({});
  };

  const requestStatusChange = (institution: PlatformInstitution) => {
    const nextStatus = institution.status === 'active' ? 'suspended' : 'active';
    const action = nextStatus === 'active' ? 'activar' : 'suspender';
    if (window.confirm(`¿Quieres ${action} ${institution.name}?`)) statusMutation.mutate({ id: institution._id, nextStatus });
  };

  return (
    <PlatformLayout>
      <div className="mx-auto max-w-[1500px] space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-950/10 sm:px-10 sm:py-10">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[32px] border-cyan-400/20" />
          <div className="absolute -bottom-32 right-32 h-72 w-72 rounded-full border border-white/10" />
          <div className="relative max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Operación de plataforma
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Una nueva institución empieza aquí.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Crea el espacio de tu próximo cliente, deja listo a su administrador principal y conserva una vista clara de toda la operación.</p>
            <Button className="mt-6 gap-2 bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Crear institución</Button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Instituciones encontradas', value: counts.total, tone: 'text-slate-950 dark:text-white', icon: Building2 },
            { label: 'Sandbox visibles', value: counts.sandbox, tone: 'text-amber-600', icon: MoreHorizontal },
            { label: 'Activas visibles', value: counts.active, tone: 'text-emerald-600', icon: Check },
            { label: 'Suspendidas visibles', value: counts.suspended, tone: 'text-rose-600', icon: Pause },
          ].map((item) => (
            <Card key={item.label} className="rounded-2xl border-border/70 shadow-sm">
              <CardContent className="flex items-center justify-between p-4 sm:p-5">
                <div><p className="text-xs text-muted-foreground">{item.label}</p><p className={`mt-1 text-2xl font-bold ${item.tone}`}>{item.value}</p></div>
                <item.icon className={`h-5 w-5 ${item.tone}`} />
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="gap-4 border-b pb-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><CardTitle className="text-xl">Instituciones</CardTitle><p className="mt-1 text-sm text-muted-foreground">Clientes que operan sobre esta instalación.</p></div><Button variant="outline" className="gap-2" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Nueva institución</Button></div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_150px]">
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por nombre o código" className="pl-9" /></div>
                <select aria-label="Filtrar por tipo" value={type} onChange={(event) => { setType(event.target.value as InstitutionType | 'all'); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Todos los tipos</option><option value="public">Públicas</option><option value="private">Privadas</option></select>
                <select aria-label="Filtrar por estado" value={status} onChange={(event) => { setStatus(event.target.value as PlatformInstitutionStatus | 'all'); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Todos los estados</option><option value="sandbox">Sandbox</option><option value="active">Activas</option><option value="suspended">Suspendidas</option></select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead className="pl-6">Institución</TableHead><TableHead>Administrador principal</TableHead><TableHead>Tipo</TableHead><TableHead>Estado</TableHead><TableHead className="pr-6 text-right">Acciones</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {listQuery.isLoading && Array.from({ length: 5 }).map((_, index) => <TableRow key={index}><TableCell className="pl-6"><Skeleton className="h-5 w-44" /><Skeleton className="mt-2 h-3 w-20" /></TableCell><TableCell><Skeleton className="h-4 w-36" /></TableCell><TableCell><Skeleton className="h-5 w-16" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="ml-auto h-8 w-16" /></TableCell></TableRow>)}
                    {!listQuery.isLoading && institutions.length === 0 && <TableRow><TableCell colSpan={5} className="py-14 text-center"><Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" /><p className="font-medium">No hay instituciones con estos filtros</p><p className="mt-1 text-sm text-muted-foreground">Crea el primer cliente para comenzar el onboarding.</p></TableCell></TableRow>}
                    {!listQuery.isLoading && institutions.map((institution) => <TableRow key={institution._id} className={`cursor-pointer transition-colors hover:bg-muted/40 ${selectedId === institution._id ? 'bg-cyan-50/60 dark:bg-cyan-950/20' : ''}`} onClick={() => setSelectedId(institution._id)}>
                      <TableCell className="pl-6"><div className="font-semibold">{institution.name}</div><div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{institution.code}</div></TableCell>
                      <TableCell><div className="font-medium">{getAdminName(institution)}</div><div className="mt-1 text-xs text-muted-foreground">{institution.primary_admin?.email || 'Sin correo'}</div></TableCell>
                      <TableCell><Badge variant="outline">{institutionTypeLabel[institution.type]}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={statusClass[institution.status]}>{statusLabel[institution.status]}</Badge></TableCell>
                      <TableCell className="pr-6"><div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}><Button variant="ghost" size="icon" aria-label={`Editar ${institution.name}`} onClick={() => openEdit(institution)}><Edit3 className="h-4 w-4" /></Button>{institution.status !== 'archived' && <Button variant="ghost" size="icon" aria-label={institution.status === 'active' ? `Suspender ${institution.name}` : `Activar ${institution.name}`} onClick={() => requestStatusChange(institution)} disabled={statusMutation.isPending}>{institution.status === 'active' ? <Pause className="h-4 w-4" /> : <Check className="h-4 w-4" />}</Button>}</div></TableCell>
                    </TableRow>)}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between border-t px-6 py-3 text-sm text-muted-foreground"><span>{pagination?.total ?? 0} instituciones</span><div className="flex items-center gap-1"><Button variant="ghost" size="icon" aria-label="Página anterior" disabled={page <= 1 || listQuery.isFetching} onClick={() => setPage((current) => Math.max(current - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button><span className="min-w-16 text-center text-xs">Página {pagination?.current_page ?? page} de {Math.max(pagination?.total_pages ?? 1, 1)}</span><Button variant="ghost" size="icon" aria-label="Página siguiente" disabled={page >= (pagination?.total_pages ?? 1) || listQuery.isFetching} onClick={() => setPage((current) => current + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
            </CardContent>
          </Card>

          <Card className="h-fit rounded-2xl border-border/70 shadow-sm xl:sticky xl:top-6">
            <CardHeader><CardTitle className="text-lg">Ficha del cliente</CardTitle><p className="text-sm text-muted-foreground">Selecciona una institución para revisar su acceso principal.</p></CardHeader>
            <CardContent>{!selected && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground"><Building2 className="mx-auto mb-3 h-7 w-7" />Elige una fila del listado.</div>}{selected && <div className="space-y-5"><div><div className="flex items-start justify-between gap-3"><div><p className="font-display text-xl font-bold">{selected.name}</p><p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">{selected.code}</p></div><Badge variant="outline" className={statusClass[selected.status]}>{statusLabel[selected.status]}</Badge></div><p className="mt-3 text-sm text-muted-foreground">{institutionTypeLabel[selected.type]} · Hasta {selected.max_students} estudiantes · {selected.timezone}</p></div><Separator /><div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Administrador principal</p>{selected.primary_admin ? <><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300"><UserRound className="h-5 w-5" /></div><div className="min-w-0"><p className="font-medium">{getAdminName(selected)}</p><p className="truncate text-xs text-muted-foreground">{selected.primary_admin.email || 'Sin correo'}</p></div></div>{selected.type === 'public' && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">Este administrador está registrado como rector único de la institución pública.</p>}</> : <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-200">Esta institución aún no tiene administrador principal.</div>}</div><div className="flex flex-col gap-2">{!selected.primary_admin && <Button className="justify-start gap-2 bg-cyan-600 text-white hover:bg-cyan-700" onClick={() => openAssign(selected)}><UserRound className="h-4 w-4" /> Asignar administrador</Button>}<Button variant="outline" className="justify-start gap-2" onClick={() => openEdit(selected)}><Edit3 className="h-4 w-4" /> Editar datos</Button>{selected.primary_admin && <Button variant="outline" className="justify-start gap-2" onClick={() => invitationMutation.mutate(selected._id)} disabled={invitationMutation.isPending}><Mail className="h-4 w-4" /> Reenviar invitación</Button>}{selected.status !== 'archived' && <Button variant="outline" className="justify-start gap-2" onClick={() => requestStatusChange(selected)} disabled={statusMutation.isPending}>{selected.status === 'active' ? <Pause className="h-4 w-4" /> : <Check className="h-4 w-4" />} {selected.status === 'active' ? 'Suspender institución' : 'Activar institución'}</Button>}</div></div>}</CardContent>
          </Card>
        </section>
      </div>

      <Dialog open={createOpen} onOpenChange={closeCreate}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Crear institución</DialogTitle><DialogDescription>Registra el cliente y deja listo a su primer administrador. La institución comenzará en sandbox.</DialogDescription></DialogHeader><div className="space-y-6 py-2"><div><p className="mb-3 text-sm font-semibold text-foreground">Datos de la institución</p><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="institution-name">Nombre</Label><Input id="institution-name" value={createForm.institution.name} onChange={(event) => updateCreateInstitution('name', event.target.value)} placeholder="Colegio Ejemplo" /></div><div className="space-y-2"><Label htmlFor="institution-code">Código</Label><Input id="institution-code" value={createForm.institution.code} onChange={(event) => updateCreateInstitution('code', event.target.value.toUpperCase())} placeholder="COLEGIO-EJEMPLO" /></div><div className="space-y-2"><Label htmlFor="institution-type">Tipo</Label><select id="institution-type" value={createForm.institution.type} onChange={(event) => updateCreateInstitution('type', event.target.value as InstitutionType)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="public">Pública</option><option value="private">Privada</option></select></div><div className="space-y-2"><Label htmlFor="institution-capacity">Límite de estudiantes</Label><Input id="institution-capacity" type="number" min={1} max={800} value={createForm.institution.max_students} onChange={(event) => updateCreateInstitution('max_students', Number(event.target.value))} /></div><div className="space-y-2"><Label htmlFor="institution-timezone">Zona horaria</Label><Input id="institution-timezone" value={createForm.institution.timezone} onChange={(event) => updateCreateInstitution('timezone', event.target.value)} /></div></div></div><Separator /><div><p className="mb-3 text-sm font-semibold text-foreground">Primer administrador</p><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="admin-first-name">Nombres</Label><Input id="admin-first-name" value={createForm.primary_admin.first_name} onChange={(event) => updateCreateAdmin('first_name', event.target.value)} /></div><div className="space-y-2"><Label htmlFor="admin-last-name">Apellidos</Label><Input id="admin-last-name" value={createForm.primary_admin.last_name} onChange={(event) => updateCreateAdmin('last_name', event.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="admin-email">Correo de acceso</Label><Input id="admin-email" type="email" value={createForm.primary_admin.email} onChange={(event) => updateCreateAdmin('email', event.target.value)} placeholder="rectoria@colegio.edu.co" /></div><div className="space-y-2"><Label htmlFor="admin-document-type">Tipo de documento</Label><select id="admin-document-type" value={createForm.primary_admin.document_type} onChange={(event) => updateCreateAdmin('document_type', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="CC">Cédula de ciudadanía</option><option value="CE">Cédula de extranjería</option><option value="RC">Registro civil</option></select></div><div className="space-y-2"><Label htmlFor="admin-document-number">Número de documento</Label><Input id="admin-document-number" value={createForm.primary_admin.document_number} onChange={(event) => updateCreateAdmin('document_number', event.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="admin-phone">Teléfono <span className="font-normal text-muted-foreground">(opcional)</span></Label><Input id="admin-phone" value={createForm.primary_admin.phone || ''} onChange={(event) => updateCreateAdmin('phone', event.target.value)} /></div></div></div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => closeCreate(false)}>Cancelar</Button><Button onClick={submitCreate} disabled={createMutation.isPending} className="gap-2">{createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Crear institución</Button></div></div></DialogContent></Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Asignar administrador principal</DialogTitle><DialogDescription>Se creará un administrador institucional activo y recibirá una invitación para establecer su contraseña.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="assign-admin-first-name">Nombres</Label><Input id="assign-admin-first-name" value={assignForm.first_name} onChange={(event) => setAssignForm({ ...assignForm, first_name: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="assign-admin-last-name">Apellidos</Label><Input id="assign-admin-last-name" value={assignForm.last_name} onChange={(event) => setAssignForm({ ...assignForm, last_name: event.target.value })} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="assign-admin-email">Correo de acceso</Label><Input id="assign-admin-email" type="email" value={assignForm.email} onChange={(event) => setAssignForm({ ...assignForm, email: event.target.value })} placeholder="rectoria@colegio.edu.co" /></div><div className="space-y-2"><Label htmlFor="assign-admin-document-type">Tipo de documento</Label><select id="assign-admin-document-type" value={assignForm.document_type} onChange={(event) => setAssignForm({ ...assignForm, document_type: event.target.value as InstitutionCreatePayload['primary_admin']['document_type'] })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="CC">Cédula de ciudadanía</option><option value="CE">Cédula de extranjería</option><option value="RC">Registro civil</option></select></div><div className="space-y-2"><Label htmlFor="assign-admin-document-number">Número de documento</Label><Input id="assign-admin-document-number" value={assignForm.document_number} onChange={(event) => setAssignForm({ ...assignForm, document_number: event.target.value })} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="assign-admin-phone">Teléfono <span className="font-normal text-muted-foreground">(opcional)</span></Label><Input id="assign-admin-phone" value={assignForm.phone || ''} onChange={(event) => setAssignForm({ ...assignForm, phone: event.target.value })} /></div></div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancelar</Button><Button onClick={submitAssign} disabled={assignMutation.isPending} className="gap-2">{assignMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Asignar administrador</Button></div></DialogContent></Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Editar institución</DialogTitle><DialogDescription>Actualiza la ficha sin cambiar su tipo institucional.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label htmlFor="edit-institution-name">Nombre</Label><Input id="edit-institution-name" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="edit-institution-code">Código</Label><Input id="edit-institution-code" value={editForm.code} onChange={(event) => setEditForm({ ...editForm, code: event.target.value.toUpperCase() })} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="edit-institution-capacity">Límite de estudiantes</Label><Input id="edit-institution-capacity" type="number" min={1} max={800} value={editForm.max_students} onChange={(event) => setEditForm({ ...editForm, max_students: Number(event.target.value) })} /></div><div className="space-y-2"><Label htmlFor="edit-institution-timezone">Zona horaria</Label><Input id="edit-institution-timezone" value={editForm.timezone} onChange={(event) => setEditForm({ ...editForm, timezone: event.target.value })} /></div></div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button><Button onClick={() => selectedId && editMutation.mutate({ id: selectedId, data: editForm })} disabled={editMutation.isPending} className="gap-2">{editMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Guardar cambios</Button></div></div></DialogContent></Dialog>
    </PlatformLayout>
  );
};

export default PlatformInstitutionsPage;
