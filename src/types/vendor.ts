export interface VendorSummary {
  id: string;
  name: string;
  slug: string;
}

export type VendorStatus = "pending" | "approved" | "rejected" | "suspended";
export type VendorAvatarTone = "brand" | "accent" | "sky" | "ink" | "info-ink" | "sale" | "brand-strong" | "accent-strong";

export interface Vendor extends VendorSummary {
  initials: string;
  avatarTone: VendorAvatarTone;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string;
  location: string;
  verified: boolean;
  ratingAverage: number;
  ratingCount: number;
  productCount: number;
  followerCount: number;
  joinedAt: string;
  status: VendorStatus;
}
