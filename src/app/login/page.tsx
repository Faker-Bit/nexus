import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your NEXUS account to manage your storefront and library.",
};

export default async function LoginPage() {
  const user = await loadUser();
  if (user) redirect("/dashboard");

  return <LoginForm />;
}