import { StaticPage, staticPageMetadata } from "@/components/pages/static-page";

export const generateMetadata = () => staticPageMetadata("saradnja");

export default function Page() {
  return <StaticPage slug="saradnja" />;
}