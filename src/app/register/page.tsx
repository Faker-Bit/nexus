import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadUser } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create your storefront",
  description: "Open a free NEXUS storefront. List code, apps, bots, AI tools and get paid on-chain.",
};

export default async function RegisterPage() {
  const user = await loadUser();
  if (user) redirect("/dashboard");

  return <RegisterForm />;
}