import type { Metadata } from "next";
import { DailyPanel } from "@/components/home/DailyPanel";

export const metadata: Metadata = { title: "Daily challenge" };

export default function DailyPage() {
  return (
    <div className="pt-6 sm:pt-12">
      <DailyPanel variant="page" />
      <section className="grid gap-8 py-12 text-[0.95rem] text-muted sm:grid-cols-3">
        <div>
          <h2 className="eyebrow mb-2">One exhibition for everyone</h2>
          <p>Today’s thirteen artworks are chosen from the date alone (UTC), so every player on every device sees exactly the same questions.</p>
        </div>
        <div>
          <h2 className="eyebrow mb-2">No second attempts</h2>
          <p>Once a game is finished it is final — you can revisit its results, but not replay it to improve the score.</p>
        </div>
        <div>
          <h2 className="eyebrow mb-2">Pick up where you left off</h2>
          <p>Progress is saved after every answer. Close the tab, come back later, and carry on.</p>
        </div>
      </section>
    </div>
  );
}
