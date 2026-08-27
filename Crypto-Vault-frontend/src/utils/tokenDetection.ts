import { Contract, ethers } from 'ethers';
import { ERC20_ABI, SEPOLIA_CHAIN_ID, TOKEN_LOCKER_ADDRESS } from '../config/contracts';
import { TokenInfo } from '../types/timelock';

export async function detectToken(
  address: string,
  walletAddress: string,
  provider: ethers.Provider,
): Promise<TokenInfo> {
  const normalizedAddress = address.trim();
  if (!ethers.isAddress(normalizedAddress)) throw new Error('invalid token address');
  if (normalizedAddress.toLowerCase() === ethers.ZeroAddress.toLowerCase()) throw new Error('zero token address');
  if (!walletAddress || !ethers.isAddress(walletAddress)) throw new Error('wallet not connected');
  if (!TOKEN_LOCKER_ADDRESS) throw new Error('token locker address unavailable');

  let network: ethers.Network;
  try {
    network = await provider.getNetwork();
  } catch {
    throw new Error('rpc provider unavailable');
  }
  if (network.chainId !== BigInt(SEPOLIA_CHAIN_ID)) throw new Error('wrong network');

  let code: string;
  try {
    code = await provider.getCode(normalizedAddress);
  } catch {
    throw new Error('rpc provider unavailable');
  }
  if (code === '0x') throw new Error('token address has no contract code');

  const token = new Contract(normalizedAddress, ERC20_ABI, provider);
  let name: unknown;
  let symbol: unknown;
  let decimals: unknown;
  try {
    [name, symbol, decimals] = await Promise.all([token.name(), token.symbol(), token.decimals()]);
  } catch {
    throw new Error('token metadata unavailable');
  }

  const normalizedDecimals = Number(decimals);
  if (!Number.isInteger(normalizedDecimals) || normalizedDecimals < 0 || normalizedDecimals > 255) {
    throw new Error('invalid token decimals');
  }
  if (!String(name).trim() || !String(symbol).trim()) throw new Error('token metadata unavailable');

  let balance: bigint;
  try {
    balance = await token.balanceOf(walletAddress);
  } catch {
    throw new Error('token balance read failed');
  }

  try {
    await token.allowance(walletAddress, TOKEN_LOCKER_ADDRESS);
  } catch {
    throw new Error('token allowance read failed');
  }

  return {
    address: normalizedAddress,
    name: String(name),
    symbol: String(symbol),
    decimals: normalizedDecimals,
    iconLetter: String(symbol).charAt(0).toUpperCase() || '?',
    iconBgColor: '#F0F1ED',
    userBalance: ethers.formatUnits(balance, normalizedDecimals),
  };
}
