import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "compact" | "full";
}

export function ThemeToggle({ className, variant = "compact" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = (mounted ? resolvedTheme : "dark") !== "light";
  const nextTheme = isDark ? "light" : "dark";
  const label = isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro";

  return (
    <Button
      type="button"
      variant="outline"
      size={variant === "compact" ? "icon" : "sm"}
      className={cn(
        "border-border/70 bg-background/80 backdrop-blur hover:bg-accent/80",
        variant === "full" && "justify-start gap-2 px-3",
        className
      )}
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {variant === "full" ? <span>{isDark ? "Tema claro" : "Tema oscuro"}</span> : null}
    </Button>
  );
}
