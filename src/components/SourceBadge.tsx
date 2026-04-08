"use client";

import { SOURCE_META } from "@/lib/sources";

export default function SourceBadge({ source }: { source: string }) {
  const meta = SOURCE_META[source] || SOURCE_META.manual;
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 whitespace-nowrap"
      style={{ background: meta.bgColor, color: meta.color }}
      title={meta.description}
    >
      {meta.label}
    </span>
  );
}
