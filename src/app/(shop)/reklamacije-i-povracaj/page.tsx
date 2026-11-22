import { StaticPage, staticPageMetadata } from "@/components/pages/static-page";

export const generateMetadata = () => staticPageMetadata("reklamacije-i-povracaj");

export default function Page() {
  return <StaticPage slug="reklamacije-i-povracaj" />;
}