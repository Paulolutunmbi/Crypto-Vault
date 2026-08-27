import { MOCK_TOKEN_ADDRESS } from '../config/contracts';

export async function addMockTokenToWallet(): Promise<boolean> {
  if (!window.ethereum) {
    return false;
  }

  try {
    const result = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: MOCK_TOKEN_ADDRESS,
          symbol: 'MTK',
          decimals: 18,
        },
      },
    });

    return !!result;
  } catch {
    return false;
  }
}
