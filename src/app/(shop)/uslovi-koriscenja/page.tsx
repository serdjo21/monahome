import { StaticPage, staticPageMetadata } from "@/components/pages/static-page";

export const generateMetadata = () => staticPageMetadata("uslovi-koriscenja");

export default function Page() {
  return <StaticPage slug="uslovi-koriscenja" />;
}