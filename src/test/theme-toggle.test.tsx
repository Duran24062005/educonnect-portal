import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeProvider } from "@/components/theme-provider";

describe("ThemeToggle", () => {
  it("switches the document theme and persists it", async () => {
    document.documentElement.className = "";
    window.localStorage.clear();

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cambiar a tema claro/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /cambiar a tema claro/i }));

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(window.localStorage.getItem("educonnect-theme")).toBe("light");
    });

    fireEvent.click(screen.getByRole("button", { name: /cambiar a tema oscuro/i }));

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(window.localStorage.getItem("educonnect-theme")).toBe("dark");
    });
  });
});
