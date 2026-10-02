import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { prisma } from "@/lib/db";
import { loadUser } from "@/lib/auth";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
import { PageHeader } from "@/components/ui/section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await loadUser();
  if (!user) redirect("/login?next=/dashboard/settings");

  const [profile, wallets] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        id: true,
        handle: true,
        displayName: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        location: true,
        website: true,
        github: true,
        twitter: true,
        discord: true,
        payoutAddress: true,
        defaultChain: true,
      },
    }),
    prisma.wallet.findMany({ where: { userId: user.id }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] }),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={
          <>
            <Settings className="size-3" /> Configuration
          </>
        }
        title="Settings"
        description="Public profile, payout routing and linked wallets."
      />
      <SettingsPanel profile={profile} wallets={wallets} />
    </div>
  );
}