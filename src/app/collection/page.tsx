import { CollectionView } from "@/components/collection/CollectionView";
import { PageTitle } from "@/components/ui/PageTitle";

export default function Page() {
  return (
    <>
      <PageTitle k="nav.collection" />
      <CollectionView />
    </>
  );
}
