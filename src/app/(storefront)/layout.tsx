import { Footer } from "@/components/layout/footer/footer";
import { Navbar } from "@/components/layout/navbar/navbar";
import { getNavbarData } from "@/services/navbar";
import { getCatalogCategories } from "@/services/categories";
import { getGlobalSearchData } from "@/services/catalog";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navbarData, categories] = await Promise.all([getNavbarData(), getCatalogCategories()]);
  const searchData = getGlobalSearchData();

  return (
    <>
      <Navbar data={{ ...navbarData, ...searchData, categories }} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
