import { loadUser } from "@/lib/auth";
import { HeaderNav } from "./header-nav";

export async function SiteHeader() {
  const user = await loadUser();
  return (
    <HeaderNav
      user={
        user
          ? {
              handle: user.handle,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              isCreator: user.isCreator,
              verified: user.verified,
            }
          : null
      }
    />
  );
}