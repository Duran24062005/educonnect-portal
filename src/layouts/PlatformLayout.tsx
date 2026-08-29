import { Building2, LogOut, Plus, ShieldCheck } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuthStore } from '@/store/auth';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getRoleLabel } from '@/lib/auth';

const platformItems = [
  { title: 'Instituciones', url: '/platform/institutions', icon: Building2 },
];

const PlatformLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, person, logout } = useAuthStore();
  const navigate = useNavigate();
  const displayName = person ? `${person.first_name} ${person.last_name}` : user?.email || 'Operador';
  const initials = person
    ? `${person.first_name[0] || ''}${person.last_name[0] || ''}`.toUpperCase()
    : (user?.email?.[0] || 'O').toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-950/5">
        <Sidebar collapsible="icon" className="border-r-0 bg-slate-950 text-slate-100">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">EduConnect</p>
                <p className="truncate text-sm font-semibold text-white">Control de plataforma</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Operación global</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {platformItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild tooltip={item.title} className="text-slate-300 hover:bg-white/10 hover:text-white data-[active=true]:bg-cyan-400 data-[active=true]:text-slate-950">
                        <NavLink to={item.url} activeClassName="bg-cyan-400 text-slate-950 font-semibold">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="mt-auto border-t border-white/10 p-3 group-data-[collapsible=icon]:hidden">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/20 text-sm font-bold text-cyan-200">{initials}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="text-xs text-slate-400">{getRoleLabel(user?.role)}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-white/10 hover:text-white" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
            </Button>
          </div>
        </Sidebar>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/90 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-600">Workspace global</p>
                <p className="text-sm font-medium text-muted-foreground">Clientes e instituciones</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" className="hidden gap-2 sm:flex" onClick={() => navigate('/platform/institutions?new=1')}>
                <Plus className="h-4 w-4" /> Nueva institución
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => navigate('/platform/institutions?new=1')} aria-label="Nueva institución">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PlatformLayout;
