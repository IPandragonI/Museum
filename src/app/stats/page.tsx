import { StatsView } from "@/components/stats/StatsView";
import { PageTitle } from "@/components/ui/PageTitle";

export default function Page() {
  return (
    <>
      <PageTitle k="nav.stats" />
      <StatsView />
    </>
  );
}
