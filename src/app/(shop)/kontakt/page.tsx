import { StaticPage, staticPageMetadata } from "@/components/pages/static-page";

export const generateMetadata = () => staticPageMetadata("kontakt");

export default function Page() {
  return <StaticPage slug="kontakt" />;
}