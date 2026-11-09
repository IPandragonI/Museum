import { CreditsView } from "@/components/credits/CreditsView";
import { PageTitle } from "@/components/ui/PageTitle";

export default function Page() {
  return (
    <>
      <PageTitle k="credits.title" />
      <CreditsView />
    </>
  );
}
