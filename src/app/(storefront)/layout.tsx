import { Navbar } from "@/components/layout/navbar/navbar";
import { getNavbarData } from "@/services/navbar";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navbarData = await getNavbarData();

  return (
    <>
      <Navbar data={navbarData} />
      <main>{children}</main>
    </>
  );
}
