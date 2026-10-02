import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/legal-doc";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "The only cookies NEXUS sets, and what we deliberately do not set.",
};

export default function Page() {
  return <LegalDoc slug="cookies" />;
}
