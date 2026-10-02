import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/legal-doc";

export const metadata: Metadata = {
  title: "Licence terms",
  description: "Standard, extended and resale tiers, and how creator licences are recorded on each order.",
};

export default function Page() {
  return <LegalDoc slug="licenses" />;
}
