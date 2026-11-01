import { Banner } from "@/components/home/banner/banner";
import { getHeroSlides } from "@/services/banner";

export default async function HomePage() {
  const slides = await getHeroSlides();

  return <Banner slides={slides} />;
}
