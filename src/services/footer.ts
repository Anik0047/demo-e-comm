import { footerData } from "@/data/footer";
import type { FooterData } from "@/types/footer";

export async function getFooterData(): Promise<FooterData> {
  return footerData;
}
