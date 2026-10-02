import { prisma } from "@/lib/db";
import { route, ok, created, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectWalletSchema } from "@/lib/validation";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
  return ok({ wallets });
});

export const POST = route(
  async (req: Request) => {
    const user = await requireUser();
    const body = await parseBody(req, connectWalletSchema);

    const existing = await prisma.wallet.findUnique({
      where: { chain_address: { chain: body.chain, address: body.address } },
      select: { userId: true },
    });
    if (existing && existing.userId !== user.id) {
      throw ApiError.conflict("That address is already linked to another account.");
    }

    if (body.isPrimary) {
      await prisma.wallet.updateMany({ where: { userId: user.id }, data: { isPrimary: false } });
    }

    const wallet = await prisma.wallet.upsert({
      where: { chain_address: { chain: body.chain, address: body.address } },
      create: { userId: user.id, chain: body.chain, address: body.address, isPrimary: body.isPrimary },
      update: { isPrimary: body.isPrimary },
    });

    if (body.isPrimary) {
      await prisma.user.update({ where: { id: user.id }, data: { payoutAddress: body.address, defaultChain: body.chain } });
    }

    return created({ wallet });
  },
  { limit: 10, windowMs: 60_000, scope: "wallet-link" },
);

export const DELETE = route(
  async (req: Request) => {
    const user = await requireUser();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw ApiError.badRequest("Which wallet?");

    const wallet = await prisma.wallet.findUnique({ where: { id }, select: { userId: true, isPrimary: true } });
    if (!wallet || wallet.userId !== user.id) throw ApiError.notFound("Wallet not found.");
    if (wallet.isPrimary) throw ApiError.badRequest("Set another wallet as primary first.");

    await prisma.wallet.delete({ where: { id } });
    return ok({ removed: true });
  },
  { limit: 20, windowMs: 60_000, scope: "wallet-unlink" },
);