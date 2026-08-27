export type LockStatus = 'LOCKED' | 'READY' | 'WITHDRAWN';

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  iconLetter: string;
  iconBgColor?: string;
  priceUsd?: number;
  userBalance: string;
}

export interface TimeLock {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  amount: string;
  amountUsd?: number;
  lockedAtTimestamp: number; // unix ms
  unlocksAtTimestamp: number; // unix ms
  lockedDateFormatted: string;
  unlockDateFormatted: string;
  status: LockStatus;
  owner: string;
  withdrawn: boolean;
  creationTxHash?: string;
  creationBlockNumber?: number;
}

export interface TimelockStats {
  totalLockedUsd: number;
  totalLockedChangeWeek: number;
  activeLocksCount: number;
  assetsCount: number;
  readyToWithdrawUsd: number;
  readyToWithdrawCount: number;
  completedLocksCount: number;
}

export interface NetworkConfig {
  id: string;
  name: string;
  chainId: number;
  currencySymbol: string;
  explorerUrl: string;
  icon: string;
  isTestnet?: boolean;
}

export interface WalletState {
  isConnected: boolean;
  address: string;
  network: NetworkConfig;
  ethBalance: number;
}

export type TxStep = 'idle' | 'preparing' | 'awaitingApproval' | 'approving' | 'locking' | 'withdrawing' | 'success' | 'failed';

export interface TransactionState {
  step: TxStep;
  title: string;
  description: string;
  txHash?: string;
  error?: string;
}

export interface NotificationItem {
  id: string;
  type: 'unlock' | 'withdraw' | 'lock' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  lockId?: string;
  txHash?: string;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  timelockDelay: string;
  eta: string;
  status: 'QUEUED' | 'EXECUTABLE' | 'EXECUTED' | 'CANCELLED';
  proposer: string;
  targetContract: string;
  value: string;
  forVotes: string;
  againstVotes: string;
}
