import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { route, ok } from "@/lib/api";
import { loadUser } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

/** Idempotent like toggle. Returns authoritative counters so the UI can reconcile. */
async function toggle(userId: string, projectId: string, like: boolean) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, likeCount: true } });
  if (!project) throw ApiError.notFound("That project does not exist.");

  if (like) {
    const existing = await prisma.projectLike.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { userId: true },
    });
    if (!existing) {
      await prisma.$transaction([
        prisma.projectLike.create({ data: { userId, projectId } }),
        prisma.project.update({ where: { id: projectId }, data: { likeCount: { increment: 1 } } }),
      ]);
    }
  } else {
    const deleted = await prisma.projectLike
      .delete({ where: { userId_projectId: { userId, projectId } } })
      .catch(() => null);
    if (deleted) {
      await prisma.project.update({
        where: { id: projectId },
        data: { likeCount: { decrement: 1 } },
      });
    }
  }

  const fresh = await prisma.project.findUnique({ where: { id: projectId }, select: { likeCount: true } });
  return { liked: like, likeCount: Math.max(0, fresh?.likeCount ?? 0) };
}

export const POST = route(
  async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const user = await loadUser();
    if (!user) throw ApiError.unauthorized("Sign in to save projects.");
    return ok(await toggle(user.id, id, true));
  },
  { limit: 120, windowMs: 60_000, scope: "like" },
);

export const DELETE = route(
  async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const user = await loadUser();
    if (!user) throw ApiError.unauthorized();
    return ok(await toggle(user.id, id, false));
  },
  { limit: 120, windowMs: 60_000, scope: "like" },
);