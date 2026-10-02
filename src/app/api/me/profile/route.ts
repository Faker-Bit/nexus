import { prisma } from "@/lib/db";
import { route, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validation";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export const PATCH = route(
  async (req: Request) => {
    const user = await requireUser();
    const body = await parseBody(req, profileUpdateSchema);

    if (body.isCreator === false && user.reputation > 0) {
      throw ApiError.badRequest("Creators with sales history must stay in creator mode.");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.displayName ? { displayName: body.displayName } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(body.website !== undefined ? { website: body.website } : {}),
        ...(body.github !== undefined ? { github: body.github } : {}),
        ...(body.twitter !== undefined ? { twitter: body.twitter } : {}),
        ...(body.discord !== undefined ? { discord: body.discord } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
        ...(body.coverUrl !== undefined ? { coverUrl: body.coverUrl } : {}),
        ...(body.isCreator !== undefined ? { isCreator: body.isCreator } : {}),
        ...(body.payoutAddress !== undefined ? { payoutAddress: body.payoutAddress } : {}),
        ...(body.defaultChain ? { defaultChain: body.defaultChain } : {}),
      },
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
        isCreator: true,
        payoutAddress: true,
        defaultChain: true,
      },
    });

    return ok({ user: updated });
  },
  { limit: 30, windowMs: 60_000, scope: "profile-update" },
);