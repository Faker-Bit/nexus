import { redirect } from "next/navigation";
import { loadUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EnableCreatorButton } from "@/components/dashboard/enable-creator-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await loadUser();
  if (!user) redirect("/login?next=/dashboard");

  if (!user.isCreator) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="glass rounded-2xl p-8">
          <h1 className="text-2xl font-semibold">Creator mode is off</h1>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-mist-400">
            Your account is set up as a buyer. Turn on creator mode to publish projects, track sales and receive
            payouts.
          </p>
          <div className="mt-6 flex justify-center">
            <EnableCreatorButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      user={{
        handle: user.handle,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isCreator: user.isCreator,
        totalEarningsCents: user.totalEarningsCents,
      }}
    >
      {children}
    </DashboardShell>
  );
}