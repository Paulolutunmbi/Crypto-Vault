import { ethers } from 'ethers';

export const SEPOLIA_CHAIN_ID = 11155111;
export const TOKEN_LOCKER_ADDRESS = (import.meta.env.VITE_TOKEN_LOCKER_ADDRESS ?? '').trim();
export const HUMBLE_TOKEN_ADDRESS = (import.meta.env.VITE_HUMBLE_TOKEN_ADDRESS ?? '').trim();
export const SEPOLIA_RPC_URL = (import.meta.env.VITE_SEPOLIA_RPC_URL ?? '').trim();
export const PROTOCOL_FEE = ethers.parseEther('0.0001');

export const SEPOLIA_NETWORK = {
  id: 'sepolia',
  name: 'Ethereum Sepolia',
  chainId: SEPOLIA_CHAIN_ID,
  currencySymbol: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  icon: '◆',
  isTestnet: true,
};

export const TOKEN_LOCKER_ABI = [
  'function PROTOCOL_FEE() view returns (uint256)',
  'function getUserLocks(address user) view returns (uint256[])',
  'function getLock(uint256 lockId) view returns (uint256 id, address token, address owner, uint256 amount, uint256 unlockTime, bool withdrawn)',
  'function createLock(address token, uint256 amount, uint256 unlockTime) payable returns (uint256 lockId)',
  'function withdraw(uint256 lockId)',
  'event LockCreated(uint256 indexed lockId, address indexed token, address indexed owner, uint256 amount, uint256 unlockTime)',
  'event LockWithdrawn(uint256 indexed lockId, address indexed token, address indexed owner, uint256 amount)',
];

export const HUMBLE_TOKEN_ABI = [
  'function lastClaimAt(address) view returns (uint256)',
  'function claimFaucet()',
  'function FAUCET_AMOUNT() view returns (uint256)',
  'function FAUCET_COOLDOWN() view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'event FaucetClaimed(address indexed claimant, uint256 amount, uint256 claimedAt)',
];

export const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
];
