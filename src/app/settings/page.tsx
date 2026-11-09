import { SettingsView } from "@/components/settings/SettingsView";
import { PageTitle } from "@/components/ui/PageTitle";

export default function Page() {
  return (
    <>
      <PageTitle k="nav.settings" />
      <SettingsView />
    </>
  );
}
