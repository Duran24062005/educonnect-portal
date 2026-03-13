import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { notificationsApi, type NotificationItem } from '@/api/notifications';
import { academicApi } from '@/api/academic';
import { analyticsApi } from '@/api/analytics';
import { useAuthStore } from '@/store/auth';
import { getRoleLabel, normalizeRole } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Bell, CheckCheck, ExternalLink, Send } from 'lucide-react';
import { toast } from 'sonner';

const formatDateTime = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const getNotificationDestination = (notification: NotificationItem, role?: string | null) => {
  const normalizedRole = normalizeRole(role);

  if (notification.type === 'activity_created' && normalizedRole === 'student' && notification.source_id) {
    return `/my-activities/${notification.source_id}`;
  }

  if (notification.type === 'activity_submitted' && normalizedRole === 'teacher') {
    const groupId = notification.metadata?.group_id;
    const areaId = notification.metadata?.area_id;
    if (groupId && areaId) {
      return `/teacher/activities/${groupId}/${areaId}`;
    }
  }

  return null;
};

const NotificationRow = ({
  notification,
  role,
  onOpen,
  onMarkRead,
}: {
  notification: NotificationItem;
  role?: string | null;
  onOpen: (notification: NotificationItem) => void;
  onMarkRead: (id: string) => void;
}) => {
  const destination = getNotificationDestination(notification, role);

  return (
    <div className={`rounded-2xl border p-4 ${notification.is_read ? 'border-border/60 bg-background' : 'border-primary/20 bg-primary/5'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{notification.title}</p>
            {!notification.is_read && <Badge variant="secondary">Nueva</Badge>}
            <Badge variant="outline">{formatDateTime(notification.created_at)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          {notification.created_by?.full_name && (
            <p className="text-xs text-muted-foreground">
              Enviada por {notification.created_by.full_name} ({getRoleLabel(notification.created_by.role)})
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!notification.is_read && (
            <Button type="button" variant="outline" size="sm" onClick={() => onMarkRead(notification.id)}>
              Marcar leída
            </Button>
          )}
          {destination && (
            <Button type="button" size="sm" onClick={() => onOpen(notification)}>
              Abrir
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [adminTitle, setAdminTitle] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [targetRole, setTargetRole] = useState<'admin' | 'teacher' | 'student' | 'teacher_student' | 'teacher_admin' | 'all'>('teacher');
  const [teacherTitle, setTeacherTitle] = useState('');
  const [teacherMessage, setTeacherMessage] = useState('');
  const [teacherScope, setTeacherScope] = useState<'all_my_students' | 'group'>('all_my_students');
  const [teacherGroupId, setTeacherGroupId] = useState('');

  const notificationsQuery = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const result = await notificationsApi.list({
        read: filter === 'all' ? undefined : filter === 'read',
        limit: 100,
      });
      return result.notifications;
    },
  });

  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const result = await notificationsApi.unreadCount();
      return result.unread_count;
    },
  });

  const teacherGroupsQuery = useQuery({
    queryKey: ['teacher-notification-groups'],
    enabled: role === 'teacher',
    queryFn: async () => {
      const activeResponse = await academicApi.getActiveSchoolYear();
      const activeYear = activeResponse.data;
      const activeYearId = activeYear?._id;
      if (!activeYearId) return [];

      const response = await analyticsApi.getTeacherGroups(activeYearId);
      const payload = response.data?.data ?? response.data;
      return Array.isArray(payload?.groups) ? payload.groups : [];
    },
  });

  const invalidateNotifications = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
  };

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: async () => {
      await invalidateNotifications();
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: async () => {
      toast.success('Notificaciones marcadas como leídas');
      await invalidateNotifications();
    },
  });

  const adminAnnouncementMutation = useMutation({
    mutationFn: () =>
      notificationsApi.createAdminAnnouncement({
        title: adminTitle.trim(),
        message: adminMessage.trim(),
        target_role: targetRole,
      }),
    onSuccess: async (result) => {
      toast.success(`Anuncio enviado a ${result.created_count} destinatarios`);
      setAdminTitle('');
      setAdminMessage('');
      await invalidateNotifications();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'No se pudo enviar el anuncio');
    },
  });

  const teacherAnnouncementMutation = useMutation({
    mutationFn: () =>
      notificationsApi.createTeacherAnnouncement({
        title: teacherTitle.trim(),
        message: teacherMessage.trim(),
        scope: teacherScope,
        group_id: teacherScope === 'group' ? teacherGroupId : null,
      }),
    onSuccess: async (result) => {
      toast.success(`Anuncio enviado a ${result.created_count} destinatarios`);
      setTeacherTitle('');
      setTeacherMessage('');
      setTeacherScope('all_my_students');
      setTeacherGroupId('');
      await invalidateNotifications();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'No se pudo enviar el anuncio');
    },
  });

  const handleOpenNotification = async (notification: NotificationItem) => {
    const destination = getNotificationDestination(notification, user?.role);
    if (!notification.is_read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    if (destination) {
      navigate(destination);
    }
  };

  const teacherGroups = useMemo(() => {
    const raw = teacherGroupsQuery.data ?? [];
    const unique = new Map<string, { group_id: string; label: string }>();

    raw.forEach((item: any) => {
      if (!item?.group_id || unique.has(item.group_id)) return;
      unique.set(item.group_id, {
        group_id: item.group_id,
        label: `${item.group_name || 'Grupo'}${item.area_name ? ` · ${item.area_name}` : ''}`,
      });
    });

    return Array.from(unique.values());
  }, [teacherGroupsQuery.data]);

  const notifications = notificationsQuery.data ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold">Notificaciones</h1>
            <p className="text-muted-foreground">Historial, lectura y anuncios según tu rol.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Bell className="mr-1 h-4 w-4" />
              {unreadCountQuery.data ?? 0} pendientes
            </Badge>
            <Button variant="outline" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
              <CheckCheck className="h-4 w-4" />
              Marcar todas
            </Button>
          </div>
        </div>

        {(role === 'admin' || role === 'teacher') && (
          <div className="grid gap-4 lg:grid-cols-2">
            {role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle>Anuncio administrativo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input value={adminTitle} onChange={(event) => setAdminTitle(event.target.value)} placeholder="Ej. Recordatorio institucional" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensaje</Label>
                    <Textarea value={adminMessage} onChange={(event) => setAdminMessage(event.target.value)} rows={5} placeholder="Escribe el mensaje que verán los destinatarios." />
                  </div>
                  <div className="space-y-2">
                    <Label>Enviar a</Label>
                    <Select value={targetRole} onValueChange={(value: 'admin' | 'teacher' | 'student' | 'teacher_student' | 'teacher_admin' | 'all') => setTargetRole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el rol destinatario" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Solo admins</SelectItem>
                        <SelectItem value="teacher">Solo docentes</SelectItem>
                        <SelectItem value="student">Solo estudiantes</SelectItem>
                        <SelectItem value="teacher_student">Docentes y estudiantes</SelectItem>
                        <SelectItem value="teacher_admin">Docentes y admins</SelectItem>
                        <SelectItem value="all">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => adminAnnouncementMutation.mutate()}
                    disabled={!adminTitle.trim() || !adminMessage.trim() || adminAnnouncementMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                    Enviar anuncio
                  </Button>
                </CardContent>
              </Card>
            )}

            {role === 'teacher' && (
              <Card>
                <CardHeader>
                  <CardTitle>Anuncio docente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input value={teacherTitle} onChange={(event) => setTeacherTitle(event.target.value)} placeholder="Ej. Entrega pendiente" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensaje</Label>
                    <Textarea value={teacherMessage} onChange={(event) => setTeacherMessage(event.target.value)} rows={5} placeholder="Escribe el mensaje para tus estudiantes." />
                  </div>
                  <div className="space-y-2">
                    <Label>Alcance</Label>
                    <Select value={teacherScope} onValueChange={(value: 'all_my_students' | 'group') => setTeacherScope(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_my_students">Todos mis estudiantes</SelectItem>
                        <SelectItem value="group">Solo un grupo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {teacherScope === 'group' && (
                    <div className="space-y-2">
                      <Label>Grupo</Label>
                      <Select value={teacherGroupId} onValueChange={setTeacherGroupId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          {teacherGroups.map((group) => (
                            <SelectItem key={group.group_id} value={group.group_id}>
                              {group.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button
                    onClick={() => teacherAnnouncementMutation.mutate()}
                    disabled={
                      !teacherTitle.trim() ||
                      !teacherMessage.trim() ||
                      teacherAnnouncementMutation.isPending ||
                      (teacherScope === 'group' && !teacherGroupId)
                    }
                  >
                    <Send className="h-4 w-4" />
                    Enviar anuncio
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bandeja</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'unread' | 'read')}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="unread">No leídas</TabsTrigger>
                <TabsTrigger value="read">Leídas</TabsTrigger>
              </TabsList>
              <TabsContent value={filter} className="mt-4">
                {notificationsQuery.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-24 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                    No hay notificaciones para este filtro.
                  </div>
                ) : (
                  <ScrollArea className="max-h-[640px] pr-3">
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <NotificationRow
                          key={notification.id}
                          notification={notification}
                          role={user?.role}
                          onOpen={handleOpenNotification}
                          onMarkRead={(id) => markAsReadMutation.mutate(id)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
