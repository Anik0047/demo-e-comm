import type { Metadata } from "next";
import CustomerAccountLayoutClient from "./account-layout-client";

export const metadata: Metadata = {
  title: "Customer account",
  description: "Manage sample customer account details in this browser.",
  robots: { index: false, follow: false },
};

export default function CustomerAccountLayout({ children }: { children: React.ReactNode }) {
  return <CustomerAccountLayoutClient>{children}</CustomerAccountLayoutClient>;
}
