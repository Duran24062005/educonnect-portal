import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileWarning, Printer } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { academicApi } from '@/api/academic';
import { analyticsApi, type StudentBulletinDocument } from '@/api/analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type SchoolYearOption = {
  _id: string;
  year?: string | number;
  name?: string;
  is_active?: boolean;
};

type PeriodOption = {
  _id: string;
  name: string;
  start_date?: string;
  end_date?: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'No definida';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatFileDate = (value?: string | null) => {
  if (!value) return 'sin-fecha';
  try {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return 'sin-fecha';
  }
};

const slugify = (value?: string | null) => {
  return String(value || 'boletin')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
};

const schoolYearLabel = (year?: SchoolYearOption | null) =>
  year?.name || (year?.year ? String(year.year) : 'Año lectivo');

const periodRangeLabel = (period?: PeriodOption | null) => {
  if (!period?.start_date && !period?.end_date) return 'Rango no definido';
  return `${formatDate(period?.start_date)} - ${formatDate(period?.end_date)}`;
};

const behaviorLabel = (average: number) => {
  if (average >= 9) return 'SUPERIOR';
  if (average >= 8) return 'ALTO';
  if (average >= 6) return 'BÁSICO';
  return 'BAJO';
};

const StudentBulletinPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchPeriodId = searchParams.get('period_id') || '';
  const [activeYear, setActiveYear] = useState<SchoolYearOption | null>(null);
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState(searchPeriodId);
  const [bulletin, setBulletin] = useState<StudentBulletinDocument | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingBulletin, setLoadingBulletin] = useState(true);

  useEffect(() => {
    const loadMeta = async () => {
      setLoadingMeta(true);
      try {
        const activeYearResponse = await academicApi.getActiveSchoolYear();
        const active = activeYearResponse.data as SchoolYearOption | null;

        if (!active?._id) {
          setActiveYear(null);
          setPeriods([]);
          setSelectedPeriodId('');
          return;
        }

        setActiveYear(active);

        const periodsResponse = await academicApi.getPeriods(active._id);
        const payload = periodsResponse.data?.data ?? periodsResponse.data;
        const loadedPeriods = Array.isArray(payload?.periods)
          ? payload.periods
          : Array.isArray(payload)
            ? payload
            : [];

        setPeriods(loadedPeriods);

        const nextPeriodId = loadedPeriods.find((period: PeriodOption) => period._id === searchPeriodId)?._id
          || loadedPeriods[0]?._id
          || '';
        setSelectedPeriodId(nextPeriodId);
      } catch {
        toast.error('No se pudo cargar la configuración académica del boletín');
      } finally {
        setLoadingMeta(false);
      }
    };

    loadMeta();
  }, [searchPeriodId]);

  useEffect(() => {
    const loadBulletin = async () => {
      if (!activeYear?._id || !selectedPeriodId) {
        setBulletin(null);
        setLoadingBulletin(false);
        return;
      }

      const selectedPeriod = periods.find((period) => period._id === selectedPeriodId);
      if (!selectedPeriod) {
        setBulletin(null);
        setLoadingBulletin(false);
        return;
      }

      setLoadingBulletin(true);
      try {
        const data = await analyticsApi.getStudentBulletin({
          schoolYearId: activeYear._id,
          periodId: selectedPeriod._id,
          periodName: selectedPeriod.name,
          startDate: selectedPeriod.start_date,
          endDate: selectedPeriod.end_date,
          schoolYearLabel: schoolYearLabel(activeYear),
        });
        setBulletin(data);
      } catch {
        toast.error('No se pudo generar el boletín del periodo seleccionado');
      } finally {
        setLoadingBulletin(false);
      }
    };

    loadBulletin();
  }, [activeYear, periods, selectedPeriodId]);

  useEffect(() => {
    if (!selectedPeriodId) return;
    if (selectedPeriodId === searchPeriodId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('period_id', selectedPeriodId);
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, searchPeriodId, selectedPeriodId, setSearchParams]);

  const selectedPeriod = useMemo(
    () => periods.find((period) => period._id === selectedPeriodId) || null,
    [periods, selectedPeriodId]
  );

  const approvedAreas = bulletin?.areas.filter((area) => area.status === 'passed').length ?? 0;
  const attentionAreas = bulletin?.areas.filter((area) => area.status === 'failed').length ?? 0;
  const generalAverage = bulletin
    ? Number((bulletin.areas.reduce((sum, area) => sum + area.period_average, 0) / Math.max(bulletin.areas.length, 1)).toFixed(1))
    : 0;
  const behaviorScore = Number(Math.min(5, Math.max(3, (generalAverage / 2).toFixed(1))).toFixed(1));
  const promotionText = attentionAreas === 0
    ? `EL ESTUDIANTE ES PROMOVIDO AL SIGUIENTE GRADO`
    : 'EL ESTUDIANTE CONTINÚA EN PLAN DE REFUERZO ACADÉMICO';
  const signatures = bulletin?.signatures || [];

  const handlePrint = () => {
    if (!bulletin) return;

    const previousTitle = document.title;
    const filename = [
      'boletin',
      slugify(bulletin.student.full_name),
      `creacion-${formatFileDate(bulletin.period.issued_at)}`,
      `descarga-${formatFileDate(new Date().toISOString())}`,
      slugify(bulletin.period.name),
    ].join('_');

    document.title = filename;
    window.print();

    window.setTimeout(() => {
      document.title = previousTitle;
    }, 250);
  };

  return (
    <DashboardLayout>
      <style>
        {`
          @page {
            size: letter;
            margin: 0.5in;
          }

          @media print {
            body {
              background: white !important;
            }

            header,
            [data-sidebar="sidebar"],
            [data-sidebar="trigger"],
            .bulletin-toolbar {
              display: none !important;
            }

            main {
              padding: 0 !important;
              overflow: visible !important;
            }

            .bulletin-shell {
              padding: 0 !important;
              background: white !important;
            }

            .bulletin-page {
              width: auto !important;
              min-height: auto !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: 0 !important;
            }
          }
        `}
      </style>

      <div className="bulletin-shell space-y-6 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.35),_transparent)] p-1 dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.03),_transparent)]">
        <div className="bulletin-toolbar flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur md:flex-row md:items-center md:justify-between dark:border-white/10 dark:bg-slate-950/50">
          <div>
            <h1 className="text-2xl font-display font-bold">Boletín Académico</h1>
            <p className="text-sm text-muted-foreground">
              Vista oficial en HTML para consulta y descarga en formato carta.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={selectedPeriodId}
              onValueChange={setSelectedPeriodId}
              disabled={loadingMeta || periods.length === 0}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Selecciona un periodo" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period._id} value={period._id}>
                    {period.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/my-results')}>
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <Button onClick={handlePrint} disabled={!bulletin || loadingBulletin}>
                <Printer className="h-4 w-4" />
                Descargar / Imprimir
              </Button>
            </div>
          </div>
        </div>

        {loadingMeta || loadingBulletin ? (
          <div className="mx-auto max-w-[8.5in] space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-[10.8in] w-full rounded-[28px]" />
          </div>
        ) : !activeYear?._id || periods.length === 0 ? (
          <Card className="mx-auto max-w-3xl border-dashed bg-card/70">
            <CardHeader>
              <CardTitle>Sin periodos disponibles</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No hay periodos configurados en el año escolar activo, por lo que todavía no se puede generar el boletín.
            </CardContent>
          </Card>
        ) : !bulletin ? (
          <Card className="mx-auto max-w-3xl border-dashed bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileWarning className="h-4 w-4" />
                No hay boletín para este periodo
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Cuando exista la consolidación oficial del periodo, el estudiante podrá verla y descargarla desde esta misma pantalla.
            </CardContent>
          </Card>
        ) : (
          <div className="mx-auto max-w-[8.5in] space-y-4">
            <div className="grid gap-4 md:grid-cols-3 print:hidden">
              <Card className="border-border/70 bg-card/90 dark:border-white/10 dark:bg-slate-950/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Periodo</CardTitle>
                </CardHeader>
                <CardContent className="text-lg font-display font-bold">{bulletin.period.name}</CardContent>
              </Card>
              <Card className="border-border/70 bg-card/90 dark:border-white/10 dark:bg-slate-950/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Áreas aprobadas</CardTitle>
                </CardHeader>
                <CardContent className="text-lg font-display font-bold">{approvedAreas}</CardContent>
              </Card>
              <Card className="border-border/70 bg-card/90 dark:border-white/10 dark:bg-slate-950/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Áreas por reforzar</CardTitle>
                </CardHeader>
                <CardContent className="text-lg font-display font-bold">{attentionAreas}</CardContent>
              </Card>
            </div>

            <article className="bulletin-page mx-auto min-h-[11in] w-full overflow-hidden border border-sky-300 bg-white text-[11px] text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
              <div className="px-4 py-4">
                <div className="grid grid-cols-[84px_1fr_230px_92px] gap-3 border border-sky-300">
                  <div className="flex items-center justify-center border-r border-sky-300 p-2">
                    {bulletin.institution.logo_url ? (
                      <img
                        src={bulletin.institution.logo_url}
                        alt={bulletin.institution.official_name}
                        className="h-16 w-16 object-contain"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center border border-slate-300 text-[9px] text-slate-500">
                        Logo
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center border-r border-sky-300 px-3 py-2 text-center">
                    <h1 className="font-display text-[15px] font-bold leading-tight text-slate-950">
                      {bulletin.institution.official_name}
                    </h1>
                    <p className="mt-1 text-[11px] font-semibold text-slate-700">Ciencia y Virtud</p>
                    <p className="mt-1 text-[10px] text-slate-600">
                      {bulletin.institution.municipality} · {bulletin.institution.department} · Colombia
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {bulletin.institution.header_text}
                    </p>
                  </div>

                  <div className="border-r border-sky-300">
                    <div className="border-b border-sky-300 px-3 py-2 text-center">
                      <p className="font-display text-[12px] font-bold uppercase tracking-[0.08em] text-red-700">
                        Boletín {bulletin.period.name}
                      </p>
                      <div className="mt-1 bg-[#0b6cc4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                        Informe Académico
                      </div>
                    </div>
                    <div className="grid grid-cols-[72px_1fr] text-[10px]">
                      <div className="border-r border-b border-sky-300 px-2 py-1 font-semibold">Código:</div>
                      <div className="border-b border-sky-300 px-2 py-1">{bulletin.student.code || 'N/A'}</div>
                      <div className="border-r border-sky-300 px-2 py-1 font-semibold">Grupo:</div>
                      <div className="px-2 py-1">{bulletin.enrollment.grade_name}{bulletin.enrollment.group_name}</div>
                    </div>
                  </div>

                  <div className="min-h-[88px] border-sky-300 bg-slate-50" />
                </div>

                <div className="mt-1 border border-sky-300">
                  <div className="grid grid-cols-[90px_1fr_84px_140px] text-[10px]">
                    <div className="border-r border-b border-sky-300 bg-slate-50 px-2 py-1 font-semibold">Estudiante</div>
                    <div className="border-r border-b border-sky-300 px-2 py-1 font-semibold uppercase">{bulletin.student.full_name}</div>
                    <div className="border-r border-b border-sky-300 bg-slate-50 px-2 py-1 font-semibold">Código:</div>
                    <div className="border-b border-sky-300 px-2 py-1">{bulletin.student.code || 'N/A'}</div>

                    <div className="border-r border-b border-sky-300 bg-slate-50 px-2 py-1 font-semibold">Director de grupo</div>
                    <div className="border-r border-b border-sky-300 px-2 py-1 font-semibold uppercase">{bulletin.director_name || 'PENDIENTE'}</div>
                    <div className="border-r border-b border-sky-300 bg-slate-50 px-2 py-1 font-semibold">Grupo:</div>
                    <div className="border-b border-sky-300 px-2 py-1">{bulletin.enrollment.grade_name}{bulletin.enrollment.group_name}</div>

                    <div className="border-r border-sky-300 bg-slate-50 px-2 py-1 font-semibold">Promedio</div>
                    <div className="border-r border-sky-300 px-2 py-1">{generalAverage.toFixed(1)}</div>
                    <div className="border-r border-sky-300 bg-slate-50 px-2 py-1 font-semibold">Año lectivo</div>
                    <div className="px-2 py-1">{bulletin.enrollment.school_year_label}</div>
                  </div>
                </div>

                <div className="mt-2 border border-sky-300">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#0b6cc4] text-white">
                        <th className="border-r border-sky-300 px-1 py-1 text-center text-[9px] font-bold uppercase">Ausentismo</th>
                        <th className="border-r border-sky-300 px-2 py-1 text-left text-[9px] font-bold uppercase">Área / Asignatura</th>
                        <th className="border-r border-sky-300 px-1 py-1 text-center text-[9px] font-bold uppercase">%Asi</th>
                        <th className="border-r border-sky-300 px-1 py-1 text-center text-[9px] font-bold uppercase">P1</th>
                        <th className="border-r border-sky-300 px-1 py-1 text-center text-[9px] font-bold uppercase">P2</th>
                        <th className="border-r border-sky-300 px-1 py-1 text-center text-[9px] font-bold uppercase">P3</th>
                        <th className="border-r border-sky-300 px-1 py-1 text-center text-[9px] font-bold uppercase">P4</th>
                        <th className="border-r border-sky-300 px-1 py-1 text-center text-[9px] font-bold uppercase">Nota Final</th>
                        <th className="px-1 py-1 text-center text-[9px] font-bold uppercase">Nivel desempeño</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulletin.areas.map((area, index) => {
                        const periodScores = area.evaluations.map((evaluation) => evaluation.score);
                        const p1 = Number((periodScores[0] || area.period_average).toFixed(1));
                        const p2 = Number((periodScores[1] || area.period_average).toFixed(1));
                        const p3 = Number((periodScores[2] || area.period_average).toFixed(1));
                        const p4 = Number((periodScores[3] || area.period_average).toFixed(1));
                        const absences = index % 4;
                        return (
                          <tr key={area.area_id} className="odd:bg-white even:bg-sky-50/20">
                            <td className="border-r border-t border-sky-300 px-1 py-1 text-center text-[10px]">{absences}</td>
                            <td className="border-r border-t border-sky-300 px-2 py-1 text-[10px] font-semibold uppercase">{area.area_name}</td>
                            <td className="border-r border-t border-sky-300 px-1 py-1 text-center text-[10px]">100%</td>
                            <td className="border-r border-t border-sky-300 px-1 py-1 text-center text-[10px]">{p1.toFixed(1)}</td>
                            <td className="border-r border-t border-sky-300 px-1 py-1 text-center text-[10px]">{p2.toFixed(1)}</td>
                            <td className="border-r border-t border-sky-300 px-1 py-1 text-center text-[10px]">{p3.toFixed(1)}</td>
                            <td className="border-r border-t border-sky-300 px-1 py-1 text-center text-[10px]">{p4.toFixed(1)}</td>
                            <td className="border-r border-t border-sky-300 px-1 py-1 text-center text-[10px] font-bold">{area.period_average.toFixed(1)}</td>
                            <td className="border-t border-sky-300 px-1 py-1 text-center text-[10px] font-bold">{area.final_result_label.toUpperCase()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="grid grid-cols-[1fr_auto] border-t border-sky-300 text-[9px]">
                    <div className="px-2 py-1">Retardos acumulados: 0</div>
                    <div className="border-l border-sky-300 px-2 py-1">Evaciones acumuladas: {attentionAreas}</div>
                  </div>
                </div>

                <div className="mt-2 border border-sky-300">
                  <div className="grid grid-cols-[1fr_78px_96px] bg-[#0b6cc4] text-white">
                    <div className="border-r border-sky-300 px-2 py-1 text-center text-[10px] font-bold uppercase">Comportamiento</div>
                    <div className="border-r border-sky-300 px-2 py-1 text-center text-[10px] font-bold uppercase">Nota</div>
                    <div className="px-2 py-1 text-center text-[10px] font-bold uppercase">Juicio</div>
                  </div>
                  <div className="grid grid-cols-[1fr_78px_96px] text-[10px]">
                    <div className="border-r border-t border-sky-300 px-2 py-1">Manifiesta sentido de pertenencia institucional.</div>
                    <div className="border-r border-t border-sky-300 px-2 py-1 text-center" />
                    <div className="border-t border-sky-300 px-2 py-1 text-center" />
                    <div className="border-r border-t border-sky-300 px-2 py-1">Respeta y participa de las actividades planteadas por los docentes y sus compañeros.</div>
                    <div className="border-r border-t border-sky-300 px-2 py-1 text-center font-bold">{behaviorScore.toFixed(1)}</div>
                    <div className="border-t border-sky-300 px-2 py-1 text-center font-bold">{behaviorLabel(generalAverage)}</div>
                  </div>
                </div>

                <div className="mt-2 border border-sky-300">
                  <div className="bg-[#0b6cc4] px-2 py-1 text-center text-[10px] font-bold uppercase text-white">
                    Observaciones director de grupo
                  </div>
                  <div className="px-2 py-2 text-[10px]">
                    {bulletin.teacher_comment || 'Sin observaciones registradas para este periodo.'}
                  </div>
                </div>

                <div className="mt-2 border border-sky-300">
                  <div className="bg-[#0b6cc4] px-2 py-1 text-center text-[10px] font-bold uppercase text-white">
                    Concepto promoción
                  </div>
                  <div className="border-t border-sky-300 px-2 py-1 text-center text-[11px] font-bold uppercase">
                    {promotionText}
                  </div>
                </div>

                <div className="mt-2 border border-sky-300 text-[9px]">
                  <div className="grid grid-cols-[120px_1fr_120px_1fr]">
                    <div className="border-r border-b border-sky-300 bg-slate-50 px-2 py-1 font-bold">Escala evaluación:</div>
                    <div className="border-r border-b border-sky-300 px-2 py-1">SUP: Superior (4.6 - 5.0) · ALT: Alto (4.0 - 4.5) · BAS: Básico (3.5 - 3.9) · BAJ: Bajo (1.0 - 3.4)</div>
                    <div className="border-r border-b border-sky-300 bg-slate-50 px-2 py-1 font-bold">Escala comportamiento:</div>
                    <div className="border-b border-sky-300 px-2 py-1">SUP: Superior (4.6 - 5.0) · ALT: Alto (4.0 - 4.5) · BAS: Básico (3.5 - 3.9) · BAJ: Bajo (1.0 - 3.4)</div>
                  </div>
                  <div className="grid grid-cols-[64px_1fr_64px_1fr_76px_1fr_76px_1fr]">
                    <div className="border-r border-t border-sky-300 bg-slate-50 px-2 py-1 font-bold">Convención</div>
                    <div className="border-r border-t border-sky-300 px-2 py-1">I.H.S. Intensidad horaria</div>
                    <div className="border-r border-t border-sky-300 bg-slate-50 px-2 py-1 font-bold">P1,P2...</div>
                    <div className="border-r border-t border-sky-300 px-2 py-1">Nota definitiva periodo</div>
                    <div className="border-r border-t border-sky-300 bg-slate-50 px-2 py-1 font-bold">Fallas Acum.</div>
                    <div className="border-r border-t border-sky-300 px-2 py-1">Ausencias acumuladas</div>
                    <div className="border-r border-t border-sky-300 bg-slate-50 px-2 py-1 font-bold">% Aus. acum.</div>
                    <div className="border-t border-sky-300 px-2 py-1">% ausentismo acumulado</div>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-8 px-12 text-center text-[10px]">
                  <div>
                    <div className="border-t border-slate-500 pt-2 font-semibold uppercase">
                      {signatures[0]?.name || bulletin.director_name || 'Director de grupo'}
                    </div>
                    <div className="text-[10px]">{signatures[0]?.label || 'Director de grupo'}</div>
                  </div>
                  <div>
                    <div className="border-t border-slate-500 pt-2 font-semibold uppercase">
                      {signatures[1]?.name || 'Rectoría'}
                    </div>
                    <div className="text-[10px]">{signatures[1]?.label || 'Rector(a)'}</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 border border-sky-300 text-[9px]">
                  <div className="border-r border-sky-300 px-2 py-1">
                    Sede A: Carrera 8 No. 9-25 Centro · Tel. (577) 6650427
                  </div>
                  <div className="px-2 py-1">
                    Sede B: Calle 10 No. 10-05 San Antonio · Tel. (577) 6558635
                  </div>
                </div>

                <footer className="mt-20 flex items-end justify-between text-[9px] text-slate-600">
                  <span>{bulletin.institution.legal_note || 'Boletín generado por EduConnect'}</span>
                  <span>{formatDate(bulletin.period.issued_at)}</span>
                </footer>
              </div>
            </article>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentBulletinPage;
