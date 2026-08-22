import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { ArrowRight, CalendarDays, Clock3, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { calendarApi, type CalendarQuery, type CalendarRole } from '@/api/calendar';
import { getNextSession, formatSessionDate, formatSessionTime } from '@/lib/calendar-utils';
import { useNavigate } from 'react-router-dom';

interface NextClassCardProps {
  role?: Extract<CalendarRole, 'teacher' | 'student'>;
}

const StudentNextClassCard = ({ role = 'student' }: NextClassCardProps) => {
  const navigate = useNavigate();
  const query = useMemo<CalendarQuery>(() => {
    const today = new Date();
    return {
      role,
      from: format(today, 'yyyy-MM-dd'),
      to: format(addDays(today, 14), 'yyyy-MM-dd'),
    };
  }, [role]);
  const { data, isLoading } = useQuery({
    queryKey: ['calendar', 'student-next-class', query],
    queryFn: () => calendarApi.list(query),
    staleTime: 30_000,
  });
  const nextSession = getNextSession(data?.sessions || []);

  return (
    <Card className="border-primary/25 bg-primary/[0.035] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-primary" />Próxima clase</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{role === 'teacher' ? 'Tu siguiente sesión como docente.' : 'Tu siguiente sesión programada.'}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')}>
          Ver calendario<ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3"><Skeleton className="h-5 w-36" /><Skeleton className="h-4 w-64" /><Skeleton className="h-4 w-48" /></div>
        ) : nextSession ? (
          <button type="button" className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => navigate('/calendar')}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="default">{formatSessionDate(nextSession.startAt)}</Badge>
                <h3 className="mt-3 text-2xl font-display font-bold">{nextSession.area.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{nextSession.topic}</p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground sm:text-right">
                <p className="inline-flex items-center gap-2 sm:flex sm:justify-end"><Clock3 className="h-4 w-4 text-primary" />{formatSessionTime(nextSession.startAt)} - {formatSessionTime(nextSession.endAt)}</p>
                <p className="inline-flex items-center gap-2 sm:flex sm:justify-end"><MapPin className="h-4 w-4 text-primary" />{nextSession.aula.name} · {role === 'teacher' ? nextSession.group.name : nextSession.teacher.name}</p>
              </div>
            </div>
            {nextSession.pendingActivities.length > 0 && <p className="mt-4 text-xs font-semibold text-primary">{nextSession.pendingActivities.length} actividad pendiente relacionada con esta materia</p>}
          </button>
        ) : (
          <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">No tienes clases próximas programadas.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentNextClassCard;
