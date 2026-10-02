import { route, ok } from "@/lib/api";
import { loadUser, getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await loadUser();
  const session = await getSession();
  if (!user) return ok({ authenticated: false, user: null });

  const [wallets, counts] = await Promise.all([
    prisma.wallet.findMany({ where: { userId: user.id }, orderBy: { isPrimary: "desc" } }),
    Promise.all([
      prisma.project.count({ where: { creatorId: user.id } }),
      prisma.order.count({ where: { buyerId: user.id, status: "paid" } }),
      prisma.offer.count({ where: { buyerId: user.id, status: "pending" } }),
    ]),
  ]);

  return ok({
    authenticated: true,
    user,
    wallets,
    authMethod: session?.authMethod ?? "password",
    counts: { projects: counts[0], purchases: counts[1], openOffers: counts[2] },
  });
});