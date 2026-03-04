import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { groupsApi } from '@/api/groups';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Users, Eye } from 'lucide-react';

const MyGroupsPage = () => {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?._id) return;
    groupsApi.getTeacherGroups(user._id)
      .then((res) => setGroups(res.data?.groups || res.data || []))
      .catch(() => toast.error('Error al cargar grupos'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Mis Grupos</h1>
          <p className="text-muted-foreground">Grupos asignados como docente</p>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20" /></CardContent></Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No tienes grupos asignados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g: any) => {
              const groupId = g.group?._id || g._id;
              return (
              <Card key={g._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {g.group?.name || g.name}
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {g.area?.name && <Badge variant="secondary">{g.area.name}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/groups/${groupId}`)}>
                      Ver grupo
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/groups/${groupId}/grade-items`)}>
                      Ítems
                    </Button>
                    <Button size="sm" onClick={() => navigate(`/groups/${groupId}/scores`)}>
                      Notas
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyGroupsPage;
