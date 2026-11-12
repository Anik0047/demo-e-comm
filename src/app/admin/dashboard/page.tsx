import type { Metadata } from "next";
import AdminDashboardClient from "./admin-dashboard-client";

export const metadata: Metadata = {
  title: "Admin dashboard",
  description: "Administration interface for the Kenakata frontend demonstration.",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
