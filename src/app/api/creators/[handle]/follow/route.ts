import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { route, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

/** Follow / unfollow a creator. */
export const POST = route(
  async (req: NextRequest, ctx: { params: Promise<{ handle: string }> }) => {
    const { handle } = await ctx.params;
    const user = await requireUser();

    const creator = await prisma.user.findUnique({ where: { handle }, select: { id: true } });
    if (!creator) throw ApiError.notFound("That creator does not exist.");
    if (creator.id === user.id) throw ApiError.badRequest("You cannot follow yourself.");

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: creator.id } },
      select: { followerId: true },
    });

    if (existing) {
      await prisma.follow.delete({ where: { followerId_followingId: { followerId: user.id, followingId: creator.id } } });
    } else {
      await prisma.follow.create({ data: { followerId: user.id, followingId: creator.id } });
      await prisma.notification.create({
        data: {
          userId: creator.id,
          type: "system",
          title: "New follower",
          body: `${user.displayName} is following your work.`,
          link: `/c/${user.handle}`,
        },
      });
    }

    const count = await prisma.follow.count({ where: { followingId: creator.id } });
    return ok({ following: !existing, followerCount: count });
  },
  { limit: 60, windowMs: 60_000, scope: "follow" },
);