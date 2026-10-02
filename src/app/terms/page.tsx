import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/legal-doc";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The rules of the NEXUS marketplace: accounts, listings, fees, settlement and refunds.",
};

export default function TermsPage() {
  return <LegalDoc slug="terms" />;
}