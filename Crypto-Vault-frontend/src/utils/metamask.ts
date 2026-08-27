export async function addTokenToWallet(address: string, symbol: string, decimals: number, image?: string): Promise<boolean> {
  if (!window.ethereum) return false;

  try {
    const result = await window.ethereum.request({
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
