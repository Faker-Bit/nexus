import { route, ok, parseBody } from "@/lib/api";
import { walletNonceSchema } from "@/lib/validation";
import { issueWalletNonce, walletMessage } from "@/lib/auth";

const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const POST = route(
  async (req: Request) => {
    const { address } = await parseBody(req, walletNonceSchema);
    const nonce = await issueWalletNonce(address);
    return ok({
      nonce,
      message: walletMessage(address, nonce, ORIGIN),
    });
  },
  { limit: 15, windowMs: 60_000, scope: "wallet-nonce" },
);