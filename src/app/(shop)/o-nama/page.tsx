import { StaticPage, staticPageMetadata } from "@/components/pages/static-page";

export const generateMetadata = () => staticPageMetadata("o-nama");

export default function Page() {
  return <StaticPage slug="o-nama" />;
}