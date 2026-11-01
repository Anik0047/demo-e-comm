import { trustPoints } from "@/data/trust-points";
import type { TrustPoint } from "@/types/trust";

export async function getTrustPoints(): Promise<TrustPoint[]> {
  return trustPoints;
}
