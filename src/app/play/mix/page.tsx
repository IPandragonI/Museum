import { Suspense } from "react";
import { MixRunner } from "@/components/game/MixRunner";

export default function MixPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm text-muted">…</p>}>
      <MixRunner />
    </Suspense>
  );
}
