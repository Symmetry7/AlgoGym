import { MascotLoader } from "@/components/brand/mascot";
import { AppShell } from "@/components/shell/shells";

export default function Loading() {
  return (
    <AppShell>
      <MascotLoader label="Loading your prep" className="min-h-[70vh]" />
    </AppShell>
  );
}
