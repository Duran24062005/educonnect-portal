import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';

const stats = [
  { value: '1,280', label: 'Estudiantes activos' },
  { value: '86', label: 'Docentes vinculados' },
  { value: '97%', label: 'Entrega oportuna de notas' },
  { value: '100%', label: 'Datos protegidos' },
];

const modules = [
  {
    title: 'Portal Estudiante',
    description: 'Consulta de calificaciones, periodos y seguimiento académico en tiempo real.',
    icon: GraduationCap,
    accentClass: 'text-emerald-400',
  },
  {
    title: 'Portal Docente',
    description: 'Gestión de grupos, actividades evaluativas y registro de desempeño por área.',
    icon: BookOpen,
    accentClass: 'text-blue-400',
  },
  {
    title: 'Portal Familias',
    description: 'Visualización del progreso y alertas clave para acompañamiento del estudiante.',
    icon: UsersRound,
    accentClass: 'text-red-400',
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-card/80 backdrop-blur">
              <img
                src="https://edu-connect-beta.vercel.app/img/EduConectLogo.png"
                alt="Logo EduConnect"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <p className="font-display font-bold leading-none text-foreground">EduConnect</p>
              <p className="mt-1 text-xs leading-none text-muted-foreground">Plataforma institucional educativa</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild className="bg-blue-600 text-white hover:bg-blue-500 font-semibold">
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted))/0.7)] text-foreground">
          <img
            src="/auth_image.avif"
            alt="Comunidad educativa"
            className="absolute inset-0 h-full w-full object-cover opacity-10 dark:opacity-20"
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.9),rgba(219,234,254,0.88),rgba(236,253,245,0.78))] dark:bg-[linear-gradient(120deg,rgba(2,6,23,0.92),rgba(15,23,42,0.94),rgba(6,78,59,0.7))]" />
          <div className="absolute -left-20 -top-20 h-96 w-96 rotate-45 bg-primary/10 dark:bg-white/5" />
          <div className="absolute right-24 top-10 h-72 w-72 rotate-45 bg-emerald-500/10 dark:bg-white/5" />
          <div className="absolute bottom-0 right-0 h-[26rem] w-[26rem] rotate-45 bg-blue-500/10 dark:bg-white/5" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary dark:border-white/15 dark:bg-white/10 dark:text-white/90">
                <Sparkles className="w-4 h-4" />
                Presencia digital del instituto
              </p>

              <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight leading-tight">
                Un portal académico centrado en cada usuario
              </h1>

              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-2xl dark:text-white/90">
                Estudiantes, docentes y familias acceden a su información en un solo lugar,
                con una experiencia clara, institucional y segura.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                  <Link to="/register">Crear cuenta</Link>
                </Button>
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">
                  <Link to="/login">Ingresar al portal</Link>
                </Button>
                <Button asChild size="lg" variant="destructive">
                  <a href="mailto:secretaria@educonnect.edu.co">Soporte</a>
                </Button>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-2xl backdrop-blur-md">
                <img
                  src="/auth_image.avif"
                  alt="Ambiente institucional"
                  className="w-full h-[300px] object-cover rounded-xl"
                />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-lg border border-border/70 bg-background/70 p-3 dark:bg-black/45">
                    <p className="text-xs text-muted-foreground dark:text-white/75">Estado académico</p>
                    <p className="font-semibold">Seguimiento por periodos</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/70 p-3 dark:bg-black/45">
                    <p className="text-xs text-muted-foreground dark:text-white/75">Comunicación</p>
                    <p className="font-semibold">Canal directo con docentes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card border-y border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-4xl md:text-5xl font-display font-bold text-foreground">{item.value}</p>
                <p className="text-sm mt-1 text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Módulos por perfil de usuario</h2>
            <p className="text-muted-foreground mt-3">
              Cada perfil accede a herramientas específicas para su rol dentro del instituto.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {modules.map((module) => (
              <Card key={module.title} className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <module.icon className={`w-5 h-5 ${module.accentClass}`} />
                    {module.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">{module.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 text-sm text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                Plataforma segura y trazable
              </p>
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground">
                Acceso diferenciado para cada actor de la comunidad educativa
              </h3>
              <p className="text-muted-foreground">
                Cada usuario ve solo lo que necesita: información clara para estudiantes,
                gestión académica para docentes y seguimiento para familias.
              </p>
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Enfoque en experiencia de usuario institucional
              </p>
            </div>

            <div className="flex gap-2">
              <Button asChild className="bg-blue-600 hover:bg-blue-500">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <Link to="/register">Registrarme</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 rounded-2xl overflow-hidden border border-border">
            <img src="/auth_image.avif" alt="Instituto educativo" className="w-full h-64 md:h-80 object-cover" />
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-sm">
          <span>© 2026 EduConnect. Portal institucional.</span>
          <span className="inline-flex items-center gap-2"><UserRound className="w-4 h-4" /> Soporte: secretaria@educonnect.edu.co</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
