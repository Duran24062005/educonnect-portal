import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { activitiesApi, type Activity } from '@/api/activities';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { getMediaUrl } from '@/lib/media';
import { isValidObjectId } from '@/lib/object-id';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, Loader2, X } from 'lucide-react';

const formatDateTime = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const getStateBadge = (status?: string) => {
  if (status === 'graded') return { label: 'Calificada', variant: 'default' as const };
  if (status === 'submitted') return { label: 'Entregada', variant: 'secondary' as const };
  if (status === 'late') return { label: 'Vencida', variant: 'destructive' as const };
  if (status === 'upcoming') return { label: 'Programada', variant: 'outline' as const };
  return { label: 'Pendiente', variant: 'outline' as const };
};

const StudentActivityDetailPage = () => {
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId: string }>();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const load = async () => {
    if (!activityId || !isValidObjectId(activityId)) {
      toast.error('Actividad inválida');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await activitiesApi.getStudentActivity(activityId);
      setActivity(result.activity);
    } catch {
      setActivity(null);
      toast.error('No se pudo cargar la actividad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [activityId]);

  const canUpload = useMemo(() => {
    if (!activity) return false;
    const now = new Date();
    return now >= new Date(activity.open_at) && now <= new Date(activity.due_at);
  }, [activity]);

  const acceptValue = useMemo(
    () => activity?.allowed_extensions.filter((extension) => extension !== 'link').map((extension) => `.${extension}`).join(',') || '',
    [activity]
  );

  const allowsLink = Boolean(activity?.allowed_extensions.includes('link'));
  const allowsFile = Boolean(activity?.allowed_extensions.some((extension) => extension !== 'link'));

  const uploadSubmission = async () => {
    if (!activity) {
      return;
    }

    const hasFile = Boolean(selectedFile);
    const hasLink = Boolean(linkUrl.trim());

    if ((hasFile && hasLink) || (!hasFile && !hasLink)) {
      toast.error('Envía una entrega usando archivo o link, pero no ambos');
      return;
    }

    setUploading(true);
    try {
      const result = await activitiesApi.submitStudentActivity(activity._id, {
        file: selectedFile,
        link_url: linkUrl.trim() || null,
      });
      setActivity({
        ...activity,
        student_state: result.activity.student_state,
        submission: result.submission,
      });
      clearSelectedFile();
      setLinkUrl('');
      toast.success('Entrega enviada correctamente');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'No se pudo enviar la entrega');
    } finally {
      setUploading(false);
    }
  };

  const badge = getStateBadge(activity?.student_state);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button variant="ghost" className="mb-2 px-0" onClick={() => navigate('/my-activities')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a mis actividades
            </Button>
            <h1 className="text-2xl font-display font-bold">{loading ? 'Actividad' : activity?.title || 'Actividad'}</h1>
            {!loading && activity && (
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{activity.group?.name || 'Grupo'}</Badge>
                <Badge variant="outline">{activity.area?.name || 'Materia'}</Badge>
                <Badge variant="secondary">{badge.label}</Badge>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !activity ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No se pudo cargar la actividad solicitada.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Instrucciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">Periodo</p>
                      <p className="mt-1 text-lg font-display font-bold">{activity.period?.name || 'N/A'}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">Disponible</p>
                      <p className="mt-1 text-sm font-semibold">{formatDateTime(activity.open_at)}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">Fecha límite</p>
                      <p className="mt-1 text-sm font-semibold">{formatDateTime(activity.due_at)}</p>
                    </div>
                  </div>

                  {activity.description && (
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea value={activity.description} readOnly rows={3} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Contexto</Label>
                    <Textarea value={activity.context} readOnly rows={10} />
                  </div>

                  <div className="space-y-2">
                    <Label>Formatos permitidos</Label>
                    <div className="flex flex-wrap gap-2">
                      {activity.allowed_extensions.map((extension) => (
                        <Badge key={extension} variant="outline" className="uppercase">{extension}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mi entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Estado actual</p>
                    <div className="mt-2">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </div>

                  {activity.submission ? (
                    <div className="space-y-3 rounded-2xl border border-border/60 p-4">
                      <div>
                        <p className="text-sm font-medium">{activity.submission.submission_type === 'link' ? 'Link enviado' : 'Archivo enviado'}</p>
                        {activity.submission.submission_type === 'link' ? (
                          <a
                            href={activity.submission.link_url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                          >
                            {activity.submission.link_url}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <a
                            href={getMediaUrl(activity.submission.file_url) || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                          >
                            {activity.submission.original_name}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Entregado el {formatDateTime(activity.submission.submitted_at)}</p>
                      {activity.submission.score_10 !== null && (
                        <p className="text-sm font-semibold">Nota: {activity.submission.score_10.toFixed(2)} / 10</p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                      Todavía no has enviado un archivo para esta actividad.
                    </div>
                  )}

                  <div className="space-y-3">
                    {allowsFile && (
                      <div className="space-y-2">
                        <Label>Subir o reemplazar archivo</Label>
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept={acceptValue}
                          disabled={!canUpload}
                          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                        />
                        {selectedFile && (
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                            <div>
                              <p className="font-medium">Archivo en cola</p>
                              <p className="text-muted-foreground">{selectedFile.name}</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={clearSelectedFile}>
                              <X className="h-4 w-4" />
                              Quitar archivo
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    {allowsLink && (
                      <div className="space-y-2">
                        <Label>Entregar por link</Label>
                        <Input
                          type="url"
                          placeholder="https://drive.google.com/... o https://github.com/..."
                          value={linkUrl}
                          disabled={!canUpload}
                          onChange={(event) => setLinkUrl(event.target.value)}
                        />
                      </div>
                    )}
                    {!canUpload && (
                      <p className="text-sm text-muted-foreground">
                        La entrega solo está habilitada entre la apertura y la fecha límite configuradas por el docente.
                      </p>
                    )}
                    <Button onClick={uploadSubmission} disabled={(!selectedFile && !linkUrl.trim()) || !canUpload || uploading}>
                      {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {activity.submission ? 'Reemplazar entrega' : 'Enviar entrega'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Rúbrica evaluativa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Criterio</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Puntaje máximo</TableHead>
                        <TableHead>Tu puntaje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activity.rubric_criteria.map((criterion) => {
                        const graded = activity.submission?.rubric_scores.find((score) => score.criterion_id === criterion._id);
                        return (
                          <TableRow key={criterion._id}>
                            <TableCell className="font-medium">{criterion.title}</TableCell>
                            <TableCell>{criterion.description || 'Sin descripción adicional'}</TableCell>
                            <TableCell>{criterion.max_points}</TableCell>
                            <TableCell>{graded ? graded.earned_points : 'Pendiente'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {activity.submission?.teacher_feedback && (
              <Card>
                <CardHeader>
                  <CardTitle>Retroalimentación del docente</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea value={activity.submission.teacher_feedback} readOnly rows={8} />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentActivityDetailPage;
