import { DailyNotes } from "@/components/home/DailyNotes";
import { DailyPanel } from "@/components/home/DailyPanel";
import { PageTitle } from "@/components/ui/PageTitle";

export default function DailyPage() {
  return (
    <div className="pt-6 sm:pt-12">
      <PageTitle k="daily.pageTitle" />
      <DailyPanel variant="page" />
      <DailyNotes />
    </div>
  );
}
