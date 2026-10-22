"use client";

import { useEffect, useState } from "react";

type ComparableMember = {
  userId: string;
  name: string;
  solves7: number;
  solves30: number;
  lastVerifiedAt: string | null;
};

export function MemberComparison({ members, currentUserId }: { members: ComparableMember[]; currentUserId?: string }) {
  const [firstId, setFirstId] = useState("");
  const [secondId, setSecondId] = useState("");

  useEffect(() => {
    if (!members.length) return;
    if (!members.some((member) => member.userId === firstId)) {
      setFirstId(members.find((member) => member.userId === currentUserId)?.userId ?? members[0].userId);
    }
    const nextFirstId = members.some((member) => member.userId === firstId) ? firstId : members.find((member) => member.userId === currentUserId)?.userId ?? members[0].userId;
    if (!members.some((member) => member.userId === secondId) || secondId === nextFirstId) {
      setSecondId(members.find((member) => member.userId !== nextFirstId)?.userId ?? "");
    }
  }, [members, currentUserId, firstId, secondId]);

  const first = members.find((member) => member.userId === firstId);
  const second = members.find((member) => member.userId === secondId);
  if (members.length < 2) return null;

  return <div className="border-t p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold">Compare practice</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Verified unique solves in the same time windows. Missing sync data is shown separately.</p>
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        <select aria-label="First member to compare" value={firstId} onChange={(event) => setFirstId(event.target.value)} className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs sm:w-44">
          {members.map((member) => <option key={member.userId} value={member.userId}>{member.name}</option>)}
        </select>
        <select aria-label="Second member to compare" value={secondId} onChange={(event) => setSecondId(event.target.value)} className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs sm:w-44">
          {members.filter((member) => member.userId !== firstId).map((member) => <option key={member.userId} value={member.userId}>{member.name}</option>)}
        </select>
      </div>
    </div>
    {first && second && first.userId !== second.userId && <div className="mt-6 space-y-5">
      {([ ["Last 7 days", "solves7"], ["Last 30 days", "solves30"] ] as const).map(([label, key]) => {
        const maximum = Math.max(1, first[key], second[key]);
        return <div key={key}>
          <p className="mb-2 text-[11px] font-medium text-muted-foreground">{label}</p>
          {[first, second].map((member, index) => <div key={member.userId} className="mb-2 grid grid-cols-[minmax(5rem,8rem)_1fr_2rem] items-center gap-3 text-xs last:mb-0">
            <span className="truncate" title={member.name}>{member.name}</span>
            <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${member.name}: ${member[key]} verified solves in ${label.toLowerCase()}`}>
              <div className={`h-full rounded-full ${index === 0 ? "bg-primary" : "bg-foreground/55"}`} style={{ width: `${member[key] / maximum * 100}%` }} />
            </div>
            <span className="text-right font-mono tabular-nums">{member[key]}</span>
          </div>)}
        </div>;
      })}
      <p className="text-[11px] text-muted-foreground">Last verified activity: {first.name} · {first.lastVerifiedAt ? new Date(first.lastVerifiedAt).toLocaleDateString() : "insufficient data"}; {second.name} · {second.lastVerifiedAt ? new Date(second.lastVerifiedAt).toLocaleDateString() : "insufficient data"}.</p>
    </div>}
  </div>;
}
