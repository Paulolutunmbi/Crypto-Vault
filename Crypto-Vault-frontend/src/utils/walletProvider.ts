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

let mobileSdkPromise: Promise<unknown> | null = null;
let connectedMobileProvider: Eip1193Provider | null = null;

export const getWalletProvider = (): Eip1193Provider | null => {
  const injected = window.ethereum;
  return injected?.providers?.[0] ?? injected ?? connectedMobileProvider;
};

export const connectMetaMaskMobile = async (): Promise<Eip1193Provider> => {
  if (!mobileSdkPromise) {
    mobileSdkPromise = import('@metamask/connect/evm').then(({ createMetamaskConnectEVM }) => createMetamaskConnectEVM({
      dapp: { name: 'Crypto-Vault', url: window.location.origin },
    } as never));
  }

  const sdk = await mobileSdkPromise as {
    connect: (options: { chainIds: number[] }) => Promise<unknown>;
    getProvider: () => Eip1193Provider;
  };
  await sdk.connect({ chainIds: [11155111] });
  connectedMobileProvider = sdk.getProvider();
  return connectedMobileProvider;
};
