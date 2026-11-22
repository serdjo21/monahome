import { StaticPage, staticPageMetadata } from "@/components/pages/static-page";

export const generateMetadata = () => staticPageMetadata("kolacici");

export default function Page() {
  return <StaticPage slug="kolacici" />;
}