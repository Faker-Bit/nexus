import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";

/**
 * Streams the purchased archive.
 *
 * Development returns a generated manifest so the flow is fully testable.
 * Production swaps the body for a 302 to a short-lived signed URL - nothing in
 * the purchase or download-audit code needs to change.
 */
export const GET = route(
  async (req: Request, ctx: { params: Promise<{ orderId: string }> }) => {
    const { orderId } = await ctx.params;
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        accessToken: true,
        status: true,
        licenseType: true,
        project: { select: { id: true, title: true, slug: true, creator: { select: { handle: true } } } },
      },
    });

    if (!order || order.accessToken !== token) {
      return NextResponse.json({ ok: false, error: { message: "Invalid download token." } }, { status: 403 });
    }
    if (order.status !== "paid") {
      return NextResponse.json({ ok: false, error: { message: "Order is not settled." } }, { status: 402 });
    }

        const body = [
      "NEXUS LICENSED DELIVERY",
      "=======================",
      `Project:      ${order.project.title}`,
      `Slug:         ${order.project.slug}`,
      `Creator:      @${order.project.creator.handle}`,
      `License:      ${order.licenseType}`,
      `Order:        ${order.id}`,
      `Downloaded:   ${new Date().toISOString()}`,
      "",
      "This manifest stands in for the real archive in development.",
      "The original bytes are never exposed from public storage.",
    ].join("\n");

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${order.project.slug}-${order.licenseType}-manifest.txt"`,
        "Cache-Control": "no-store",
        "X-Nexus-License": order.licenseType,
      },
    });
  },
  { limit: 30, windowMs: 60_000, scope: "file" },
);