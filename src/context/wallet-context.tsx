"use client";

import { useEffect, useMemo, useState } from "react";
import { createContext, useCallback, useContext, type ReactNode } from "react";

export type WalletChainId = 1 | 8453 | 42161 | 137;

export type ConnectedWallet = {
  address: `0x${string}`;
  chainId: WalletChainId;
  label: string;
  isDemo: boolean;
};

type WalletContextValue = {
  wallet: ConnectedWallet | null;
  status: "idle" | "connecting" | "ready" | "error";
  error: string | null;
  hasInjected: boolean;
  available: boolean;
  connect: (preferredChain?: WalletChainId) => Promise<ConnectedWallet | null>;
  disconnect: () => void;
  switchChain: (chainId: WalletChainId) => Promise<boolean>;
  signMessage: (message: string) => Promise<string | null>;
  reset: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export const CHAIN_BY_ID: Record<WalletChainId, { name: string; key: string; color: string }> = {
  1: { name: "Ethereum", key: "ethereum", color: "#00d9c0" },
  8453: { name: "Base", key: "base", color: "#00ff9d" },
  42161: { name: "Arbitrum", key: "arbitrum", color: "#5cffc4" },
  137: { name: "Polygon", key: "polygon", color: "#12e0a0" },
};

export const CHAIN_ID_BY_KEY: Record<string, WalletChainId> = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  polygon: 137,
};

const STORAGE_KEY = "nexus.wallet";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function getInjected(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  return eth ?? null;
}

/** Deterministic demo identity so the checkout flow is testable without an extension. */
const DEMO_ADDRESS = "0x9F3Cf07dC4bB2A1e6dE5fC8bA7D6e4F1a2B3c4D5" as `0x${string}`;

function hexFrom(text: string) {
  let out = "";
  for (let i = 0; i < text.length; i++) out += text.charCodeAt(i).toString(16).padStart(2, "0");
  return `0x${out.slice(0, 128)}`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [status, setStatus] = useState<WalletContextValue["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasInjected, setHasInjected] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHasInjected(Boolean(getInjected()));
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ConnectedWallet;
        if (parsed?.address) setWallet(parsed);
      }
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: ConnectedWallet | null) => {
    setWallet(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setStatus("idle");
  }, []);

  const connect = useCallback(
    async (preferredChain: WalletChainId = 8453) => {
      setStatus("connecting");
      setError(null);
      const injected = getInjected();
      if (!injected) {
        const demo: ConnectedWallet = {
          address: DEMO_ADDRESS,
          chainId: preferredChain,
          label: "Demo wallet",
          isDemo: true,
        };
        persist(demo);
        setStatus("ready");
        return demo;
      }
      try {
        const accounts = (await injected.request({ method: "eth_requestAccounts" })) as string[];
        const address = accounts?.[0] as `0x${string}` | undefined;
        if (!address) throw new Error("No account returned by the wallet.");
        const rawChain = (await injected.request({ method: "eth_chainId" })) as string;
        const chainId = Number.parseInt(rawChain, 16) as WalletChainId;
        const next: ConnectedWallet = {
          address,
          chainId,
          label: CHAIN_BY_ID[chainId]?.name ?? `Chain ${chainId}`,
          isDemo: false,
        };
        persist(next);
        setStatus("ready");
        return next;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Wallet connection was rejected.";
        setError(message);
        setStatus("error");
        return null;
      }
    },
    [persist],
  );

  const disconnect = useCallback(() => {
    persist(null);
    setStatus("idle");
  }, [persist]);

  const switchChain = useCallback(
    async (chainId: WalletChainId) => {
      setWallet((current) => {
        if (!current) return current;
        const next = { ...current, chainId, label: CHAIN_BY_ID[chainId]?.name ?? current.label };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
      const injected = getInjected();
      if (!injected) return true;
      try {
        await injected.request({ method: "wallet_switchEthereumChain", params: [{ chainId: `0x${chainId.toString(16)}` }] });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not switch network.");
        return false;
      }
    },
    [],
  );

  const signMessage = useCallback(
    async (message: string) => {
      if (!wallet) {
        setError("Connect a wallet first.");
        return null;
      }
      const injected = getInjected();
      if (injected && !wallet.isDemo) {
        try {
          return (await injected.request({
            method: "personal_sign",
            params: [message, wallet.address],
          })) as string;
        } catch (err) {
          setError(err instanceof Error ? err.message : "Signature rejected.");
          return null;
        }
      }
      // Demo signing: deterministic pseudo-signature. The server verifies real
      // signatures, so this path only exists to make the flow explorable.
      return hexFrom(`${wallet.address}:${message}`);
    },
    [wallet],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      wallet: hydrated ? wallet : null,
      status,
      error,
      hasInjected,
      available: typeof window === "undefined" ? true : hasInjected,
      connect,
      disconnect,
      switchChain,
      signMessage,
      reset,
    }),
    [wallet, hydrated, status, error, hasInjected, connect, disconnect, switchChain, signMessage, reset],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}

export function shortWallet(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}-${address.slice(-4)}`;
}

export function useHydrated() {
  const [v, setV] = useState(false);
  useEffect(() => setV(true), []);
  return v;
}