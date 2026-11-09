import { DailyPanel } from "@/components/home/DailyPanel";
import { FreePlay } from "@/components/home/FreePlay";
import { ProgressStrip } from "@/components/home/ProgressStrip";

export default function Home() {
  return (
    <>
      <section className="pb-14 pt-10 sm:pb-20 sm:pt-20">
        <p className="eyebrow">An art discovery game</p>
        <h1 className="display mt-5 max-w-4xl text-[clamp(3rem,9vw,7.25rem)]">
          Art is meant to be <em className="text-accent">discovered.</em>
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
          Name a masterpiece from a few squares, recognise a detail, tell a Dürer from a Rembrandt, and put centuries in order. No account, no ads — just the art.
        </p>
      </section>
      <DailyPanel />
      <FreePlay />
      <ProgressStrip />
    </>
  );
}
