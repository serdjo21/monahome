import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#sadrzaj"
        className="sr-only z-50 bg-ink px-4 py-3 label text-surface focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Preskoči na sadržaj
      </a>
      <Header />
      <main id="sadrzaj">{children}</main>
      <Footer />
    </>
  );
}