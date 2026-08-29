import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, ExternalLink, File, FileUp, FolderOpen, Link2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/auth';
import { normalizeRole } from '@/lib/auth';
import { materialsApi, type Material, type MaterialMutationPayload, type MaterialSession } from '@/api/materials';

type ResourceMode = 'file' | 'link';
type MaterialForm = {
  title: string;
  description: string;
  session_id: string;
  resourceMode: ResourceMode;
  link_url: string;
  file: File | null;
};

const emptyForm: MaterialForm = { title: '', description: '', session_id: '', resourceMode: 'file', link_url: '', file: null };
const emptyMaterials: Material[] = [];

const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha pendiente';
const timeLabel = (session: MaterialSession) => `${dateLabel(session.start_at)} · ${new Date(session.start_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
const sizeLabel = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const MaterialsPage = () => {
  const role = normalizeRole(useAuthStore((state) => state.user?.role));
  const isTeacher = role === 'teacher';
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [groupFilter, setGroupFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState(() => searchParams.get('session_id') || '');
  const [formOpen, setFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [form, setForm] = useState<MaterialForm>(emptyForm);

  const sessionQuery = useQuery({
    queryKey: ['material-sessions', groupFilter, areaFilter],
    queryFn: () => materialsApi.getTeacherSessions({ group_id: groupFilter || undefined, area_id: areaFilter || undefined }),
    enabled: isTeacher,
    staleTime: 30_000,
  });
  const sessions = sessionQuery.data?.sessions || [];
  const teacherReady = !sessionQuery.isLoading;
  const materialsQuery = useQuery({
    queryKey: ['materials', isTeacher ? 'teacher' : 'student', groupFilter, areaFilter, sessionFilter],
    queryFn: () => isTeacher
      ? materialsApi.getTeacherMaterials({ group_id: groupFilter || undefined, area_id: areaFilter || undefined, session_id: sessionFilter || undefined })
      : materialsApi.getStudentMaterials({ area_id: areaFilter || undefined, session_id: sessionFilter || undefined }),
    staleTime: 30_000,
  });
  const materials = materialsQuery.data?.materials || emptyMaterials;
  const filterSessions = isTeacher ? sessions : materials.map((item) => item.session).filter((item, index, list) => list.findIndex((candidate) => candidate._id === item._id) === index);
  const areas = useMemo(() => uniqueEntities(materials.map((item) => item.session.area)), [materials]);

  const mutation = useMutation({
    mutationFn: async (payload: MaterialMutationPayload & { materialId?: string }) => payload.materialId
      ? materialsApi.updateTeacherMaterial(payload.materialId, payload)
      : materialsApi.createTeacherMaterial(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success(editingMaterial ? 'Material actualizado' : 'Material publicado');
      setFormOpen(false);
      setEditingMaterial(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (materialId: string) => materialsApi.deleteTeacherMaterial(materialId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material eliminado');
    },
  });

  const updateForm = (key: keyof MaterialForm, value: string | File | null) => setForm((current) => ({ ...current, [key]: value }));
  const openCreate = () => {
    const selected = sessions[0];
    setEditingMaterial(null);
    setForm({ ...emptyForm, session_id: selected?._id || '' });
    setFormOpen(true);
  };
  const openEdit = (material: Material) => {
    setEditingMaterial(material);
    setForm({
      title: material.title,
      description: material.description || '',
      session_id: material.session._id,
      resourceMode: material.material_type,
      link_url: material.link_url || '',
      file: null,
    });
    setFormOpen(true);
  };
  const handleSubmit = () => {
    if (!form.title.trim() || !form.session_id) {
      toast.error('Completa título y sesión.');
      return;
    }
    if (form.resourceMode === 'file' && !form.file && !editingMaterial) {
      toast.error('Selecciona un archivo.');
      return;
    }
    if (form.resourceMode === 'link' && !form.link_url.trim()) {
      toast.error('Escribe un enlace válido.');
      return;
    }
    mutation.mutate({
      materialId: editingMaterial?._id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      session_id: form.session_id,
      link_url: form.resourceMode === 'link' ? form.link_url.trim() : undefined,
      file: form.resourceMode === 'file' ? form.file : undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><BookOpen className="h-4 w-4" />Biblioteca de aula</div>
            <h1 className="mt-2 text-3xl font-display font-extrabold tracking-tight">Materiales</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Guías, documentos y enlaces ordenados por la sesión en la que los necesitas.</p>
          </div>
          {isTeacher && <Button onClick={openCreate} disabled={!teacherReady}><Plus className="h-4 w-4" />Nuevo material</Button>}
        </header>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {isTeacher && <FilterSelect label="Grupo" value={groupFilter} options={uniqueEntities(sessions.map((item) => item.group))} onChange={setGroupFilter} />}
            <FilterSelect label="Materia" value={areaFilter} options={isTeacher ? uniqueEntities(sessions.map((item) => item.area)) : areas} onChange={setAreaFilter} />
            <FilterSelect label="Sesión" value={sessionFilter} options={filterSessions.map((item) => ({ _id: item._id, name: `${dateLabel(item.start_at)} · ${item.group.name} · ${item.area.name}` }))} onChange={setSessionFilter} />
          </CardContent>
        </Card>

        {materialsQuery.isError ? (
          <Card className="border-destructive/30 bg-destructive/5"><CardContent className="flex min-h-48 flex-col items-center justify-center text-center"><FolderOpen className="h-8 w-8 text-destructive" /><p className="mt-3 font-semibold">No se pudieron cargar los materiales</p><p className="mt-1 text-sm text-muted-foreground">Revisa la conexión e inténtalo de nuevo.</p><Button className="mt-4" variant="outline" onClick={() => void materialsQuery.refetch()}>Reintentar</Button></CardContent></Card>
        ) : materialsQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-52" /><Skeleton className="h-52" /></div>
        ) : materials.length === 0 ? (
          <Card className="border-dashed border-border/80"><CardContent className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><FolderOpen className="h-10 w-10 text-primary/70" /><h2 className="mt-4 font-display text-xl font-bold">Aún no hay materiales</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">{isTeacher ? 'Publica una guía o un enlace y quedará organizado junto a la sesión correspondiente.' : 'Cuando tu docente publique una guía, aparecerá aquí y en el calendario.'}</p>{isTeacher && <Button className="mt-5" onClick={openCreate} disabled={!teacherReady}><Plus className="h-4 w-4" />Publicar el primero</Button>}</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {materials.map((material) => <MaterialCard key={material._id} material={material} isTeacher={isTeacher} onEdit={openEdit} onDelete={(item) => { if (window.confirm(`¿Eliminar “${item.title}”?`)) deleteMutation.mutate(item._id); }} />)}
          </div>
        )}
      </div>

      {isTeacher && (
        <>
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader><DialogTitle>{editingMaterial ? 'Editar material' : 'Nuevo material'}</DialogTitle><DialogDescription>Asocia un recurso a una sesión para que el grupo lo encuentre en contexto.</DialogDescription></DialogHeader>
              <div className="space-y-4">
                <Field label="Título" htmlFor="material-title"><Input id="material-title" value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Ej. Guía de ecuaciones" /></Field>
                <Field label="Descripción" htmlFor="material-description"><Textarea id="material-description" value={form.description} onChange={(event) => updateForm('description', event.target.value)} rows={3} placeholder="Qué encontrará el estudiante en este recurso" /></Field>
                <Field label="Sesión"><Select value={form.session_id} onValueChange={(value) => updateForm('session_id', value)}><SelectTrigger><SelectValue placeholder="Selecciona una sesión" /></SelectTrigger><SelectContent>{sessions.map((item) => <SelectItem key={item._id} value={item._id}>{dateLabel(item.start_at)} · {item.group.name} · {item.area.name}</SelectItem>)}</SelectContent></Select></Field>
                <div className="space-y-2"><Label>Recurso</Label><div className="grid grid-cols-2 gap-2"><Button type="button" variant={form.resourceMode === 'file' ? 'default' : 'outline'} onClick={() => updateForm('resourceMode', 'file')}><FileUp className="h-4 w-4" />Archivo</Button><Button type="button" variant={form.resourceMode === 'link' ? 'default' : 'outline'} onClick={() => updateForm('resourceMode', 'link')}><Link2 className="h-4 w-4" />Enlace</Button></div></div>
                {form.resourceMode === 'file' ? <Field label={editingMaterial?.original_name ? `Reemplazar archivo (${editingMaterial.original_name})` : 'Archivo'} htmlFor="material-file"><Input id="material-file" type="file" onChange={(event) => updateForm('file', event.target.files?.[0] || null)} />{form.file && <p className="text-xs text-muted-foreground">{form.file.name} · {sizeLabel(form.file.size)}</p>}</Field> : <Field label="Enlace web" htmlFor="material-link"><Input id="material-link" type="url" value={form.link_url} onChange={(event) => updateForm('link_url', event.target.value)} placeholder="https://..." /></Field>}
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setFormOpen(false)}>Cancelar</Button><Button onClick={handleSubmit} disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}{editingMaterial ? 'Guardar cambios' : 'Publicar material'}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
};

const uniqueEntities = (items: Array<{ _id: string; name: string }>) => [...new Map(items.filter((item) => item?._id).map((item) => [item._id, item])).values()];

const FilterSelect = ({ label, value, options, onChange }: { label: string; value: string; options: Array<{ _id: string; name: string }>; onChange: (value: string) => void }) => <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label><Select value={value || 'all'} onValueChange={(next) => onChange(next === 'all' ? '' : next)}><SelectTrigger className="h-9"><SelectValue placeholder={`Todos: ${label.toLowerCase()}`} /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{options.map((option) => <SelectItem key={option._id} value={option._id}>{option.name}</SelectItem>)}</SelectContent></Select></div>;

const MaterialCard = ({ material, isTeacher, onEdit, onDelete }: { material: Material; isTeacher: boolean; onEdit: (material: Material) => void; onDelete: (material: Material) => void }) => {
  const isLink = material.material_type === 'link';
  const href = isLink ? material.link_url : material.file_url;
  return <Card className="group overflow-hidden border-border/70 shadow-sm transition-colors hover:border-primary/40"><CardHeader className="border-b border-border/60 bg-muted/15 pb-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{isLink ? <Link2 className="h-5 w-5" /> : <File className="h-5 w-5" />}</div><div className="min-w-0"><CardTitle className="truncate text-base">{material.title}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{isLink ? 'Enlace web' : material.original_name || 'Archivo'}{!isLink && material.size_bytes > 0 ? ` · ${sizeLabel(material.size_bytes)}` : ''}</p></div></div><Badge variant="outline">{isLink ? 'LINK' : 'ARCHIVO'}</Badge></div></CardHeader><CardContent className="space-y-4 p-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{material.session.area.name} · {material.session.group.name}</p><p className="mt-1 text-sm font-semibold">Clase programada</p><p className="mt-1 text-xs text-muted-foreground">{timeLabel(material.session)}</p></div>{material.description && <p className="line-clamp-2 text-sm text-muted-foreground">{material.description}</p>}<div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">{href ? <Button asChild size="sm"><a href={href} target="_blank" rel="noreferrer" download={!isLink ? material.original_name || undefined : undefined}><ExternalLink className="h-4 w-4" />{isLink ? 'Abrir enlace' : 'Abrir archivo'}</a></Button> : <span className="text-xs text-destructive">Recurso no disponible</span>}{isTeacher && <div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={`Editar ${material.title}`} onClick={() => onEdit(material)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`Eliminar ${material.title}`} onClick={() => onDelete(material)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}</div></CardContent></Card>;
};

const Field = ({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) => <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;

export default MaterialsPage;
