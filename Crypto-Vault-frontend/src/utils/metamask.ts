import { getWalletProvider } from './walletProvider';

export async function addTokenToWallet(address: string, symbol: string, decimals: number, image?: string): Promise<boolean> {
  const provider = getWalletProvider();
  if (!provider) return false;

  try {
    const result = await provider.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: { address, symbol, decimals, ...(image ? { image } : {}) },
      },
    });

    return !!result;
  } catch {
    return false;
  }
}
