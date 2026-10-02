import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/legal-doc";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What NEXUS collects, where it lives, how long we keep it and how to get it deleted.",
};

export default function Page() {
  return <LegalDoc slug="privacy" />;
}
