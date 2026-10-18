"use client";

import Link from "next/link";
import { ArrowUpRight, CircleHelp } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";

export function ProductPage({
  title,
  description,
  note,
  action,
}: {
  title: string;
  description: string;
  note: string;
  action?: { label: string; href: string };
}) {
  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-7">
        <header>
          <p className="mb-2 text-sm text-[#929bae]">AlgoGym</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#929bae]">
            {description}
          </p>
        </header>
        <Card className="rounded-lg border-[#252a36] bg-[#10131b]">
          <CardContent className="flex items-start gap-3 p-5 sm:p-6">
            <CircleHelp className="mt-0.5 shrink-0 text-[#a78bfa]" size={18} />
            <div>
              <h2 className="text-sm font-medium">Data availability</h2>
              <p className="mt-1 text-sm leading-6 text-[#929bae]">{note}</p>
              {action && (
                <Link
                  href={action.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm text-[#b5a2ff] hover:text-[#d1c5ff]"
                >
                  {action.label}
                  <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
