import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { route, ok, parseBody } from "@/lib/api";
import { projectUpdateSchema } from "@/lib/validation";
import { loadUser } from "@/lib/auth";
import { bustCache } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { ApiError } from "@/lib/api-error";
import { recordView } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export const GET = route(
  async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
            reputation: true,
            ratingAvg: true,
            ratingCount: true,
            totalSales: true,
            createdAt: true,
          },
        },
        assets: { orderBy: { position: "asc" } },
        tags: true,
      },
    });
    if (!project) throw ApiError.notFound("That project does not exist.");

    await recordView(project.id, null, null);
    return ok({ project: { ...project, viewCount: project.viewCount + 1 } });
  },
  { limit: 240, windowMs: 60_000, scope: "project-read" },
);

export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await loadUser();
  if (!user) throw ApiError.unauthorized();

  const project = await prisma.project.findUnique({ where: { id }, select: { creatorId: true } });
  if (!project) throw ApiError.notFound("That project does not exist.");
  if (project.creatorId !== user.id) throw ApiError.forbidden("You can only edit your own projects.");

  const body = await parseBody(req, projectUpdateSchema);

  let slug: string | undefined;
  if (body.slug && body.slug !== undefined) {
    slug = slugify(body.slug);
    const clash = await prisma.project.findUnique({ where: { slug }, select: { id: true } });
    if (clash && clash.id !== id) throw ApiError.conflict("That URL is already taken.");
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(body.title ? { title: body.title } : {}),
      ...(body.tagline ? { tagline: body.tagline, summary: body.tagline } : {}),
      ...(body.description ? { description: body.description } : {}),
      ...(body.category ? { category: body.category } : {}),
      ...(body.language !== undefined ? { language: body.language } : {}),
      ...(body.license ? { license: body.license } : {}),
      ...(body.priceCents !== undefined ? { priceCents: body.priceCents } : {}),
      ...(body.currency ? { currency: body.currency } : {}),
      ...(body.chain ? { chain: body.chain } : {}),
      ...(body.acceptsOffers !== undefined ? { acceptsOffers: body.acceptsOffers } : {}),
      ...(body.acceptsMeme !== undefined ? { acceptsMeme: body.acceptsMeme } : {}),
      ...(body.memeToken !== undefined ? { memeToken: body.memeToken } : {}),
      ...(body.coverImage !== undefined ? { coverImage: body.coverImage } : {}),
      ...(body.demoUrl !== undefined ? { demoUrl: body.demoUrl } : {}),
      ...(body.repoUrl !== undefined ? { repoUrl: body.repoUrl } : {}),
      ...(body.docsUrl !== undefined ? { docsUrl: body.docsUrl } : {}),
      ...(body.websiteUrl !== undefined ? { websiteUrl: body.websiteUrl } : {}),
      ...(body.previewVideo !== undefined ? { previewVideo: body.previewVideo } : {}),
      ...(body.fileName !== undefined ? { fileName: body.fileName } : {}),
      ...(body.fileSizeBytes !== undefined ? { fileSizeBytes: body.fileSizeBytes } : {}),
      ...(body.status ? { status: body.status, publishedAt: body.status === "published" ? new Date() : undefined } : {}),
      ...(slug ? { slug } : {}),
      ...(body.tags
        ? {
            tagsString: body.tags.join(","),
            tags: { deleteMany: {}, create: body.tags.map((name) => ({ name: name.toLowerCase() })) },
          }
        : {}),
      ...(body.assets
        ? {
            assets: {
              deleteMany: {},
              create: body.assets.map((asset, i) => ({ ...asset, position: i })),
            },
          }
        : {}),
    },
    select: { id: true, slug: true, status: true, updatedAt: true },
  });

  bustCache("landing");
  return ok({ project: updated });
});

export const DELETE = route(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await loadUser();
  if (!user) throw ApiError.unauthorized();

  const project = await prisma.project.findUnique({ where: { id }, select: { creatorId: true, _count: { select: { orders: true } } } });
  if (!project) throw ApiError.notFound("That project does not exist.");
  if (project.creatorId !== user.id) throw ApiError.forbidden("You can only remove your own projects.");

  // Sold work stays on the books - archive instead of deleting.
  if (project._count.orders > 0) {
    await prisma.project.update({ where: { id }, data: { status: "archived", featured: false } });
    bustCache("landing");
    return ok({ archived: true });
  }

  await prisma.project.delete({ where: { id } });
  bustCache("landing");
  return ok({ deleted: true });
});