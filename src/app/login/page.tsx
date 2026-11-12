import type { Metadata } from "next";
import LoginClient from "./login-client";

export const metadata: Metadata = {
  title: "Demo account sign in",
  description: "Choose a seeded account to explore the Kenakata frontend demonstration.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return <LoginClient />;
}
