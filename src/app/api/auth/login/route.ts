import { prisma } from "@/lib/db";
import { route, ok, parseBody } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { rateLimit } from "@/lib/api";

const MAX_FAILED = 8;

export const POST = route(
  async (req: Request) => {
    const body = await parseBody(req, loginSchema);

    // Per-account + per-IP throttling so credential stuffing is impractical.
    const perAccount = rateLimit(`login:${body.email}`, MAX_FAILED, 15 * 60_000);
    if (!perAccount.ok) throw ApiError.tooMany("Too many attempts. Try again in a few minutes.");

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        handle: true,
        displayName: true,
        passwordHash: true,
        status: true,
        failedLogins: true,
      },
    });

    const invalid = ApiError.unauthorized("Email or password is incorrect.");
    if (!user) throw invalid;
    if (user.status !== "active") {
      throw new ApiError(403, "This account is suspended. Contact support for help.");
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: { increment: 1 } },
      });
      throw invalid;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lastLoginAt: new Date() },
    });

    await createSessionCookie(user, { authMethod: "password" });
    return ok({ user: { id: user.id, handle: user.handle, displayName: user.displayName } });
  },
  { limit: 20, windowMs: 60_000, scope: "login" },
);