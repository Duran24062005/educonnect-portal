import { GraduationCap } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[minmax(0,760px)_1fr]">
      {/* Left branding panel */}
      <div
        className="relative hidden overflow-hidden rounded-r-[2rem] bg-cover bg-center bg-no-repeat p-10 lg:flex lg:flex-col lg:justify-between"
        style={{ backgroundImage: "url('/auth_image.avif')" }}
      >
        <div className="absolute inset-0 bg-primary/70 dark:bg-primary/78" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/30 to-slate-950/55 dark:from-slate-950/5 dark:via-slate-950/20 dark:to-slate-950/45" />
        <div className="absolute inset-0 opacity-20 dark:opacity-10">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary-foreground/25" />
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-primary-foreground/10" />
          <div className="absolute left-1/3 top-1/2 h-48 w-48 rounded-full bg-primary-foreground/15" />
        </div>
        <div className="relative z-10">
          <a href="/">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                  <img
                    src="https://edu-connect-beta.vercel.app/img/EduConectLogo.png"
                    alt="Logo EduConnect"
                    className="w-7 h-7 object-contain"
                  />
                </div>
              <span className="text-2xl font-display font-bold text-primary-foreground">EduConnect</span>
            </div>
          </a>
        </div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-display font-bold text-primary-foreground leading-tight">
            Gestiona tu institución educativa de forma inteligente
          </h2>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Estudiantes, docentes, calificaciones y más — todo en un solo lugar.
          </p>
        </div>
        <div className="relative z-10 text-primary-foreground/50 text-sm">
          © 2026 EduConnect. Todos los derechos reservados.
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">EduConnect</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
