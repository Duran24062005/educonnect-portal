import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, Clock3, Download, ExternalLink, File, FolderOpen, Link2, Loader2, UserRound, Users } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth';
import { normalizeRole } from '@/lib/auth';
import { isValidObjectId } from '@/lib/object-id';
import { materialsApi, type Material } from '@/api/materials';

const dateLabel = (value?: string | null) => value ? new Date(value).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha pendiente';
const dateTimeLabel = (value?: string | null) => value ? new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : 'Fecha pendiente';
const timeLabel = (value?: string | null) => value ? new Date(value).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : 'Hora pendiente';
const sizeLabel = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const MaterialDetailPage = () => {
  const navigate = useNavigate();
  const { materialId } = useParams<{ materialId: string }>();
  const role = normalizeRole(useAuthStore((state) => state.user?.role));
  const isTeacher = role === 'teacher';
  const validId = Boolean(materialId && isValidObjectId(materialId));

  const materialQuery = useQuery({
    queryKey: ['material', isTeacher ? 'teacher' : 'student', materialId],
    queryFn: async () => isTeacher
      ? materialsApi.getTeacherMaterial(materialId!).then((result) => result.material)
      : materialsApi.getStudentMaterial(materialId!).then((result) => result.material),
    enabled: validId,
    staleTime: 30_000,
  });

  const material = materialQuery.data;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <Button variant="ghost" className="-ml-2 px-2" onClick={() => navigate('/materials')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a materiales
        </Button>

        {materialQuery.isLoading ? <DetailSkeleton /> : !validId || materialQuery.isError || !material ? (
          <Card className="border-dashed">
            <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <FolderOpen className="h-10 w-10 text-primary/70" />
              <h1 className="mt-4 font-display text-xl font-bold">No se pudo cargar el material</h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">El material no existe, fue eliminado o no tienes permisos para verlo.</p>
              <Button className="mt-5" variant="outline" onClick={() => navigate('/materials')}>Ir a materiales</Button>
            </CardContent>
          </Card>
        ) : <MaterialDetail material={material} />}
      </div>
    </DashboardLayout>
  );
};

const MaterialDetail = ({ material }: { material: Material }) => {
  const isLink = material.material_type === 'link';
  const href = isLink ? material.link_url : material.file_url;
  const resourceLabel = isLink ? 'Enlace web' : 'Archivo adjunto';

  return (
    <>
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              {isLink ? <Link2 className="h-8 w-8" /> : <File className="h-8 w-8" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Biblioteca de aula</p>
              <h1 className="mt-2 break-words font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{material.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{isLink ? 'ENLACE' : 'ARCHIVO'}</Badge>
                <span className="text-sm text-muted-foreground">{resourceLabel}</span>
              </div>
            </div>
          </div>
          {href ? <Button asChild size="lg" className="shrink-0"><a href={href} target="_blank" rel="noreferrer" download={!isLink ? material.original_name || undefined : undefined}>{isLink ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}{isLink ? 'Abrir enlace' : 'Descargar archivo'}</a></Button> : <Button size="lg" disabled className="shrink-0"><Loader2 className="h-4 w-4" />Recurso no disponible</Button>}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader><CardTitle>Información del material</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <DetailField label="Descripción" value={material.description || 'Este material no tiene una descripción.'} multiline />
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Tipo de recurso" value={resourceLabel} />
              {!isLink && <DetailField label="Archivo" value={material.original_name || 'Archivo sin nombre'} />}
              {!isLink && material.size_bytes > 0 && <DetailField label="Tamaño" value={sizeLabel(material.size_bytes)} />}
              <DetailField label="Publicado" value={dateTimeLabel(material.created_at)} />
              <DetailField label="Última actualización" value={dateTimeLabel(material.updated_at)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sesión relacionada</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <DetailIconField icon={CalendarDays} label="Fecha" value={dateLabel(material.session.start_at)} />
            <DetailIconField icon={Clock3} label="Horario" value={`${timeLabel(material.session.start_at)} – ${timeLabel(material.session.end_at)}`} />
            <DetailIconField icon={Users} label="Grupo" value={`${material.session.group.name} · ${material.session.grade.name}`} />
            <DetailIconField icon={BookOpen} label="Materia" value={material.session.area.name} />
            <DetailIconField icon={UserRound} label="Docente" value={material.teacher?.name || material.session.teacher.name} />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

const DetailField = ({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) => <div className={multiline ? 'rounded-2xl border border-border/60 bg-muted/20 p-4' : 'rounded-2xl border border-border/60 bg-muted/20 p-4'}><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className={`mt-2 text-sm ${multiline ? 'whitespace-pre-wrap leading-6' : 'font-semibold'}`}>{value}</p></div>;
const DetailIconField = ({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) => <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-semibold">{value}</p></div></div>;
const DetailSkeleton = () => <div className="space-y-6"><Skeleton className="h-56 w-full rounded-3xl" /><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div></div>;

export default MaterialDetailPage;
