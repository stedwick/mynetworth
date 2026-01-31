import MePageTemplate from "@/app/components/templates/MePageTemplate";
import { mockCategories } from "@/app/demo/page";

export default function MePage() {
  return <MePageTemplate categories={mockCategories} />;
}
