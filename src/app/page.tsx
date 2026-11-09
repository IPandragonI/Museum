import { DailyPanel } from "@/components/home/DailyPanel";
import { FreePlay } from "@/components/home/FreePlay";
import { HomeHero } from "@/components/home/HomeHero";
import { ProgressStrip } from "@/components/home/ProgressStrip";
import { PageTitle } from "@/components/ui/PageTitle";

export default function Home() {
  return (
    <>
      <PageTitle />
      <HomeHero />
      <DailyPanel />
      <FreePlay />
      <ProgressStrip />
    </>
  );
}
