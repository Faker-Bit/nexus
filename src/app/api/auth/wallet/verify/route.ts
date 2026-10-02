import { route, ok, parseBody } from "@/lib/api";
import { walletVerifySchema } from "@/lib/validation";
import {
  assertSignature,
  consumeWalletNonce,
  createSessionCookie,
  resolveWalletUser,
  walletMessage,
} from "@/lib/auth";

const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const POST = route(
  async (req: Request) => {
    const { address, signature, chain } = await parseBody(req, walletVerifySchema);

    const nonce = await consumeWalletNonce(address);
    assertSignature(address, signature, walletMessage(address, nonce, ORIGIN));

    const { user, created } = await resolveWalletUser(address, chain);
    await createSessionCookie(user, { wallet: address, authMethod: "wallet" });

    return ok({
      user: {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        verified: user.verified,
      },
      created,
    });
  },
  { limit: 10, windowMs: 60_000, scope: "wallet-verify" },
);