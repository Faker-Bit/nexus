"use client";

import { ToastProvider } from "@/components/ui/toast";
import { WalletProvider } from "@/context/wallet-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <WalletProvider>{children}</WalletProvider>
    </ToastProvider>
  );
}