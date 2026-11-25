"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Laptop, Moon, Sun } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Choose appearance" className="inline-flex size-9 items-center justify-center rounded-full border border-current/15 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {mounted && resolvedTheme === "light" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label="Appearance">
        {([ ["light", "Light", Sun], ["dark", "Dark", Moon], ["system", "System", Laptop] ] as const).map(([value, label, Icon]) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)} aria-current={mounted && theme === value ? "true" : undefined} className="flex items-center gap-2">
            <Icon size={15} /> {label}
            {mounted && theme === value && <span className="ml-auto text-xs">Selected</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
