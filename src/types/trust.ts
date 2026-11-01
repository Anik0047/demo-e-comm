export type TrustIcon = "truck" | "banknote" | "rotate" | "shield";

export interface TrustPoint {
  id: string;
  icon: TrustIcon;
  title: string;
  text: string;
}
