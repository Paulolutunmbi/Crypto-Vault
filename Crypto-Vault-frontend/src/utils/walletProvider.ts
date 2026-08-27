export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider & { providers?: Eip1193Provider[] };
  }
}

export const getWalletProvider = (): Eip1193Provider | null => {
  const injected = window.ethereum;
  return injected?.providers?.[0] ?? injected ?? null;
};
