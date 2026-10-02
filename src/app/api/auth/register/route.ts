import { prisma } from "@/lib/db";
import { route, created, parseBody, fail } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { createSessionCookie, hashPassword, passwordProblems } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { bustCache } from "@/lib/db";

export const POST = route(
  async (req: Request) => {
    const body = await parseBody(req, registerSchema);

    const passwordIssues = passwordProblems(body.password);
    if (passwordIssues.length) {
      throw ApiError.badRequest("That password is too easy to guess.", passwordIssues);
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { handle: body.handle }] },
      select: { email: true, handle: true },
    });
    if (existing) {
      throw ApiError.conflict(
        existing.email === body.email ? "That email is already registered." : `The handle @${existing.handle} is taken.`,
      );
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        handle: body.handle,
        displayName: body.displayName,
        isCreator: true,
        createdAt: new Date(),
      },
      select: { id: true, handle: true, displayName: true },
    });

    await createSessionCookie(user, { authMethod: "password" });
    bustCache("landing");

    return created({
      user: { ...user, handle: `@${user.handle}` },
      redirectTo: "/dashboard",
    });
  },
  { limit: 5, windowMs: 600_000, scope: "register" },
);

export const GET = route(async () => fail("Use POST.", 405));