import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GameRunner } from "@/components/game/GameRunner";
import { MODES, isMode } from "@/lib/game/config";

export function generateStaticParams() {
  return MODES.map((mode) => ({ mode }));
}

export const dynamicParams = false;

export default async function PlayPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!isMode(mode)) notFound();
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm text-muted">Loading…</p>}>
      <GameRunner mode={mode} />
    </Suspense>
  );
}
