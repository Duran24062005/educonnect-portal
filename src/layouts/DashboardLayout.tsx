import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuthStore } from '@/store/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getMediaUrl } from '@/lib/media';
import { getDashboardLabel, getRoleLabel } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type NotificationItem } from '@/api/notifications';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const getNotificationDestination = (notification: NotificationItem, role?: string | null) => {
  const normalizedRole = String(role || '').toLowerCase();
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

  return '/notifications';
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, person, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const displayName = person
    ? `${person.first_name} ${person.last_name}`
    : user?.email || 'Usuario';

  const initials = person
    ? `${person.first_name[0]}${person.last_name[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';
  const profilePhotoUrl = getMediaUrl(person?.profile_photo_url || person?.profile_photo);

  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const result = await notificationsApi.unreadCount();
      return result.unread_count;
    },
  });

  const recentNotificationsQuery = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      const result = await notificationsApi.list({ limit: 5 });
      return result.notifications;
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
      await invalidateNotifications();
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenNotification = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    navigate(getNotificationDestination(notification, user?.role));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b bg-card flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="hidden sm:block">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Panel de {getDashboardLabel(user?.role)}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                    <Bell className="w-5 h-5" />
                    {(unreadCountQuery.data ?? 0) > 0 && (
                      <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {unreadCountQuery.data}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[360px] p-0">
                  <div className="flex items-center justify-between px-3 py-2">
                    <DropdownMenuLabel className="px-0 py-0">Notificaciones</DropdownMenuLabel>
                    {(unreadCountQuery.data ?? 0) > 0 && (
                      <Badge variant="secondary">{unreadCountQuery.data} nuevas</Badge>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <ScrollArea className="max-h-[320px]">
                    <div className="p-1">
                      {(recentNotificationsQuery.data ?? []).length === 0 ? (
                        <div className="px-3 py-6 text-sm text-muted-foreground">
                          No tienes notificaciones todavía.
                        </div>
                      ) : (
                        recentNotificationsQuery.data?.map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            className="flex cursor-pointer flex-col items-start gap-1 rounded-md px-3 py-3"
                            onClick={() => handleOpenNotification(notification)}
                          >
                            <div className="flex w-full items-center justify-between gap-2">
                              <span className="font-medium">{notification.title}</span>
                              {!notification.is_read && <Badge variant="secondary">Nueva</Badge>}
                            </div>
                            <span className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  <DropdownMenuSeparator />
                  <div className="flex items-center justify-between gap-2 p-2">
                    <Button variant="ghost" size="sm" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
                      Marcar todas
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
                      Ver todas
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profilePhotoUrl || undefined} alt={displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{getRoleLabel(user?.role)}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
