import Link from "next/link";
import { AppShell } from "@/components/shell/shells";
import { primaryAction } from "@/components/system-design/ui";

export default function LessonNotFound() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[560px] px-4 pb-24 pt-20 text-center sm:px-6">
        <h1 className="text-[32px] font-semibold tracking-[-0.025em] text-ag-text">That lesson doesn&rsquo;t exist</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ag-text-muted">The link may be old or mistyped. Every system-design lesson is listed on the track page.</p>
        <Link href="/system-design" className={`${primaryAction} mt-8`}>
          See all lessons
        </Link>
      </div>
    </AppShell>
  );
}
