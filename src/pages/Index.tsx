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
      <header className="sticky top-0 z-40 border-b border-border/70 bg-black/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 overflow-hidden">
              <img
                src="https://edu-connect-beta.vercel.app/img/EduConectLogo.png"
                alt="Logo EduConnect"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <p className="font-display font-bold leading-none text-white">EduConnect</p>
              <p className="text-xs text-white/70 mt-1 leading-none">Plataforma institucional educativa</p>
            </div>
          </div>

          <Button asChild className="bg-blue-600 text-white hover:bg-blue-500 font-semibold">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-black text-white">
          <img
            src="/auth_image.avif"
            alt="Comunidad educativa"
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-slate-950/95 to-emerald-950/80" />
          <div className="absolute -left-20 -top-20 w-96 h-96 rotate-45 bg-white/5" />
          <div className="absolute right-24 top-10 w-72 h-72 rotate-45 bg-white/5" />
          <div className="absolute right-0 bottom-0 w-[26rem] h-[26rem] rotate-45 bg-white/5" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-sm text-white/90">
                <Sparkles className="w-4 h-4" />
                Presencia digital del instituto
              </p>

              <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight leading-tight">
                Un portal académico centrado en cada usuario
              </h1>

              <p className="text-lg md:text-2xl text-white/90 max-w-2xl leading-relaxed">
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
              <div className="rounded-2xl border border-white/20 bg-black/40 backdrop-blur-md p-4 shadow-2xl">
                <img
                  src="/auth_image.avif"
                  alt="Ambiente institucional"
                  className="w-full h-[300px] object-cover rounded-xl"
                />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-lg bg-black/45 border border-white/20 p-3">
                    <p className="text-xs text-white/75">Estado académico</p>
                    <p className="font-semibold">Seguimiento por periodos</p>
                  </div>
                  <div className="rounded-lg bg-black/45 border border-white/20 p-3">
                    <p className="text-xs text-white/75">Comunicación</p>
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

      <footer className="bg-black text-white/80 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-sm">
          <span>© 2026 EduConnect. Portal institucional.</span>
          <span className="inline-flex items-center gap-2"><UserRound className="w-4 h-4" /> Soporte: secretaria@educonnect.edu.co</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
