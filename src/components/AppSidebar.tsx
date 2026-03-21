import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  BookOpen,
  School,
  ClipboardList,
  BarChart3,
  Layers,
  Building,
  Timer,
  ArrowRightLeft,
  GitMerge,
  FileText,
  Bell,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { normalizeRole } from '@/lib/auth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

const adminItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Notificaciones', url: '/notifications', icon: Bell },
  { title: 'Usuarios', url: '/users', icon: Users },
  { title: 'Pendientes', url: '/users/pending', icon: UserCheck },
];

const academicItems = [
  { title: 'Años Escolares', url: '/academic/school-years', icon: Calendar },
  { title: 'Periodos', url: '/academic/periods', icon: Timer },
  { title: 'Grados', url: '/academic/grades', icon: Layers },
  { title: 'Áreas', url: '/academic/areas', icon: BookOpen },
  { title: 'Aulas', url: '/academic/aulas', icon: Building },
  { title: 'Promociones', url: '/academic/promotions', icon: GitMerge },
];

const groupItems = [
  { title: 'Grupos', url: '/groups', icon: School },
  { title: 'Matrículas', url: '/groups/enrollments', icon: ArrowRightLeft },
  { title: 'Estadísticas', url: '/evaluations/stats', icon: BarChart3 },
];

const teacherItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Notificaciones', url: '/notifications', icon: Bell },
  { title: 'Mis Grupos', url: '/my-groups', icon: School },
  { title: 'Resultados', url: '/period-results', icon: BarChart3 },
];

const studentItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Notificaciones', url: '/notifications', icon: Bell },
  { title: 'Mis Actividades', url: '/my-activities', icon: FileText },
  { title: 'Mis Calificaciones', url: '/my-grades', icon: ClipboardList },
  { title: 'Mis Resultados', url: '/my-results', icon: BarChart3 },
  { title: 'Mis Boletines', url: '/my-bulletins', icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const renderGroup = (label: string, items: typeof adminItems) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider font-semibold">
        {!collapsed && label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                tooltip={item.title}
              >
                <NavLink
                  to={item.url}
                  end={item.url === '/dashboard'}
                  className="transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <img
                src="https://edu-connect-beta.vercel.app/img/EduConectLogo.png"
                alt="Logo EduConnect"
                className="w-7 h-7 object-contain"
              />
          </div>
          {!collapsed && (
            <span className="text-lg font-display font-bold text-sidebar-foreground">
              EduConnect
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {role === 'admin' && (
          <>
            {renderGroup('General', adminItems)}
            {renderGroup('Académico', academicItems)}
            {renderGroup('Organización', groupItems)}
          </>
        )}
        {role === 'teacher' && renderGroup('Docente', teacherItems)}
        {role === 'student' && renderGroup('Estudiante', studentItems)}
      </SidebarContent>
    </Sidebar>
  );
}
