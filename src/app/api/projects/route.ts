import { prisma } from "@/lib/db";
import { route, ok, created, parseBody, parseIntParam } from "@/lib/api";
import { discoverySchema, projectCreateSchema } from "@/lib/validation";
import { requireCreator } from "@/lib/auth";
import { discoverProjects, toCardData } from "@/lib/queries";
import { bustCache } from "@/lib/db";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  const url = new URL(req.url);
  const input = discoverySchema.parse({
    q: url.searchParams.get("q") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    tags: url.searchParams.get("tags") ?? undefined,
    language: url.searchParams.get("language") ?? undefined,
    license: url.searchParams.get("license") ?? undefined,
    minPrice: url.searchParams.get("minPrice") ?? undefined,
    maxPrice: url.searchParams.get("maxPrice") ?? undefined,
    sort: url.searchParams.get("sort") ?? "trending",
    featured: url.searchParams.get("featured") ?? undefined,
    free: url.searchParams.get("free") ?? undefined,
    minRating: url.searchParams.get("minRating") ?? undefined,
    page: url.searchParams.get("page") ?? 1,
    perPage: parseIntParam(url.searchParams.get("perPage"), 12, 1, 48),
  });

  const result = await discoverProjects(input);
  return ok({ ...result, items: result.items.map(toCardData) });
});

export const POST = route(
  async (req: Request) => {
    const user = await requireCreator();
    const body = await parseBody(req, projectCreateSchema);

    const base = slugify(body.title) || "untitled";
    let slug = base;
    for (let i = 2; await prisma.project.findUnique({ where: { slug }, select: { id: true } }); i++) {
      slug = `${base}-${i}`;
    }

    const project = await prisma.project.create({
      data: {
        slug,
        title: body.title,
        tagline: body.tagline,
        summary: body.tagline,
        description: body.description,
        category: body.category,
        language: body.language ?? null,
        license: body.license,
        tagsString: body.tags.join(","),
        priceCents: body.priceCents,
        currency: body.currency,
        chain: body.chain,
        acceptsOffers: body.acceptsOffers,
        acceptsMeme: body.acceptsMeme,
        memeToken: body.acceptsMeme ? (body.memeToken ?? null) : null,
        coverImage: body.coverImage ?? null,
        demoUrl: body.demoUrl ?? null,
        repoUrl: body.repoUrl ?? null,
        docsUrl: body.docsUrl ?? null,
        websiteUrl: body.websiteUrl ?? null,
        previewVideo: body.previewVideo ?? null,
        fileName: body.fileName ?? null,
        fileSizeBytes: body.fileSizeBytes ?? null,
        status: body.status,
        trendingScore: 50,
        publishedAt: body.status === "published" ? new Date() : null,
        creatorId: user.id,
        assets: { create: body.assets.map((asset, i) => ({ ...asset, position: i })) },
        tags: { create: body.tags.map((name) => ({ name: name.toLowerCase() })) },
      },
      select: { id: true, slug: true, status: true },
    });

    bustCache("landing");
    return created({ project });
  },
  { limit: 30, windowMs: 60 * 60_000, scope: "project-create" },
);