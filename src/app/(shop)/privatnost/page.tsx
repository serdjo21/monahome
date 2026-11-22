import { StaticPage, staticPageMetadata } from "@/components/pages/static-page";

export const generateMetadata = () => staticPageMetadata("privatnost");

export default function Page() {
  return <StaticPage slug="privatnost" />;
}