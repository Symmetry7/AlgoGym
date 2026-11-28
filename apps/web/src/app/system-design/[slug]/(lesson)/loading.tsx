import { MascotLoader } from "@/components/brand/mascot";
import { AppShell } from "@/components/shell/shells";

export default function Loading() {
  return (
    <AppShell>
      <MascotLoader label="Loading the lesson" className="min-h-[60dvh]" />
    </AppShell>
  );
}
