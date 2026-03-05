import { GraduationCap } from 'lucide-react';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div
        className="hidden lg:flex lg:w-[600px] xl:w-[760px] flex-col justify-between p-10 relative overflow-hidden bg-cover bg-center bg-no-repeat
        rounded-tr-3xl"
        style={{ backgroundImage: "url('/auth_image.avif')" }}
      >
        <div className="absolute inset-0 bg-primary/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/40" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary-foreground/20" />
          <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-primary-foreground/10" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-primary-foreground/15" />
        </div>
        <div className="relative z-10">
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
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
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
