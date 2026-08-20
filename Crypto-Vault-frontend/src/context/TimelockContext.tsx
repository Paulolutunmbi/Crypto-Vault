import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  TimeLock,
  TokenInfo,
  NetworkConfig,
  WalletState,
  TimelockStats,
  TransactionState,
  NotificationItem,
  LockStatus,
} from '../types/timelock';
import {
  SUPPORTED_NETWORKS,
  SUPPORTED_TOKENS,
  INITIAL_ACTIVE_LOCKS,
  INITIAL_READY_LOCKS,
  INITIAL_COMPLETED_LOCKS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';

interface ToastState {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface CreateLockParams {
  tokenSymbol: string;
  amount: number;
  unlockTimestamp: number;
  beneficiary: string;
  memo?: string;
}

interface TimelockContextType {
  // Navigation & UI state
  activeTab: 'dashboard' | 'vaults' | 'governance' | 'docs';
  setActiveTab: (tab: 'dashboard' | 'vaults' | 'governance' | 'docs') => void;
  
  // Wallet
  wallet: WalletState;
  connectWallet: () => void;
  disconnectWallet: () => void;
  switchNetwork: (network: NetworkConfig) => void;
  requestFaucet: (symbol: string) => void;

  // Tokens & Stats
  tokens: TokenInfo[];
  stats: TimelockStats;
  currentTime: number;

  // Locks Data
  allLocks: TimeLock[];
  activeLocks: TimeLock[];
  readyLocks: TimeLock[];
  completedLocks: TimeLock[];

  // Actions
  createLock: (params: CreateLockParams) => Promise<TimeLock>;
  withdrawLock: (lockId: string) => Promise<boolean>;
  extendLock: (lockId: string, additionalMs: number) => Promise<boolean>;

  // Transaction execution modal state
  txState: TransactionState | null;
  resetTxState: () => void;

  // Modal controls
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  withdrawTargetLock: TimeLock | null;
  setWithdrawTargetLock: (lock: TimeLock | null) => void;
  detailTargetLock: TimeLock | null;
  setDetailTargetLock: (lock: TimeLock | null) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  isNotifOpen: boolean;
  setIsNotifOpen: (open: boolean) => void;

  // Notifications
  notifications: NotificationItem[];
  markAllNotificationsRead: () => void;
  unreadNotifCount: number;

  // Toast
  toasts: ToastState[];
  addToast: (toast: Omit<ToastState, 'id'>) => void;
  removeToast: (id: string) => void;

  // Filtering & Sorting
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: 'ALL' | LockStatus;
  setFilterStatus: (status: 'ALL' | LockStatus) => void;
  filterToken: string;
  setFilterToken: (token: string) => void;
}

const TimelockContext = createContext<TimelockContextType | undefined>(undefined);

export const TimelockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vaults' | 'governance' | 'docs'>('dashboard');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [tokens, setTokens] = useState<TokenInfo[]>(SUPPORTED_TOKENS);
  
  // Initial locks combining active, ready, and completed
  const [locks, setLocks] = useState<TimeLock[]>([
    ...INITIAL_ACTIVE_LOCKS,
    ...INITIAL_READY_LOCKS,
    ...INITIAL_COMPLETED_LOCKS,
  ]);

  const [wallet, setWallet] = useState<WalletState>({
    isConnected: true,
    address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    network: SUPPORTED_NETWORKS[0],
    ethBalance: 4.825,
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  
  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [withdrawTargetLock, setWithdrawTargetLock] = useState<TimeLock | null>(null);
  const [detailTargetLock, setDetailTargetLock] = useState<TimeLock | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [txState, setTxState] = useState<TransactionState | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | LockStatus>('ALL');
  const [filterToken, setFilterToken] = useState('ALL');

  // Real-time ticking interval for precision countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      // Check if any LOCKED items have crossed the unlock timestamp
      setLocks(prevLocks => {
        let changed = false;
        const updated = prevLocks.map(item => {
          if (item.status === 'LOCKED' && now >= item.unlocksAtTimestamp) {
            changed = true;
            return { ...item, status: 'READY' as LockStatus };
          }
          return item;
        });
        return changed ? updated : prevLocks;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const addToast = (toast: Omit<ToastState, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const connectWallet = () => {
    setWallet(prev => ({
      ...prev,
      isConnected: true,
      address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    }));
    addToast({
      type: 'success',
      title: 'Wallet Connected',
      message: 'Connected to 0x7a2...4f9c on Ethereum Mainnet',
    });
  };

  const disconnectWallet = () => {
    setWallet(prev => ({
      ...prev,
      isConnected: false,
    }));
    addToast({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'You are viewing the vault in read-only mode.',
    });
  };

  const switchNetwork = (network: NetworkConfig) => {
    setWallet(prev => ({
      ...prev,
      network,
    }));
    addToast({
      type: 'success',
      title: 'Network Switched',
      message: `Active chain changed to ${network.name}`,
    });
  };

  const requestFaucet = (symbol: string) => {
    setTokens(prev =>
      prev.map(tok => {
        if (tok.symbol === symbol) {
          const addAmount = symbol === 'ETH' ? 2 : symbol === 'USDC' ? 10000 : 100;
          return { ...tok, userBalance: tok.userBalance + addAmount };
        }
        return tok;
      })
    );
    addToast({
      type: 'success',
      title: 'Test Tokens Minted',
      message: `Added test ${symbol} to your connected wallet`,
    });
  };

  const resetTxState = () => {
    setTxState(null);
  };

  // Create Lock Simulation (Smart Contract approval & deposit)
  const createLock = async (params: CreateLockParams): Promise<TimeLock> => {
    const token = tokens.find(t => t.symbol === params.tokenSymbol) || tokens[0];
    const amountUsd = params.amount * token.priceUsd;
    const now = Date.now();
    const unlockDate = new Date(params.unlockTimestamp);
    const lockDate = new Date(now);

    const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' };
    const lockedDateFormatted = lockDate.toLocaleDateString('en-US', formatOptions);
    const unlockDateFormatted = unlockDate.toLocaleDateString('en-US', formatOptions);

    const newLock: TimeLock = {
      id: `lock-${Date.now().toString(36)}`,
      vaultAddress: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      tokenSymbol: token.symbol,
      tokenName: `${token.name} (${token.symbol})`,
      amount: params.amount,
      amountUsd,
      lockedAtTimestamp: now,
      unlocksAtTimestamp: params.unlockTimestamp,
      lockedDateFormatted,
      unlockDateFormatted,
      status: now >= params.unlockTimestamp ? 'READY' : 'LOCKED',
      beneficiary: params.beneficiary || wallet.address,
      creator: wallet.address,
      transactionHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockNumber: 18460000 + Math.floor(Math.random() * 1000),
      memo: params.memo || 'Custom Institutional Time-Lock',
    };

    // Deduct user balance
    setTokens(prev =>
      prev.map(tok => {
        if (tok.symbol === token.symbol) {
          return { ...tok, userBalance: Math.max(0, tok.userBalance - params.amount) };
        }
        return tok;
      })
    );

    setLocks(prev => [newLock, ...prev]);

    // Add notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: 'lock',
      title: 'Time-Lock Created',
      message: `Locked ${params.amount.toLocaleString()} ${token.symbol} until ${unlockDateFormatted}`,
      timestamp: Date.now(),
      read: false,
      txHash: newLock.transactionHash,
    };
    setNotifications(prev => [newNotif, ...prev]);

    addToast({
      type: 'success',
      title: 'Time-Lock Initiated',
      message: `Successfully locked ${params.amount} ${token.symbol}`,
    });

    return newLock;
  };

  // Withdraw simulation
  const withdrawLock = async (lockId: string): Promise<boolean> => {
    const lock = locks.find(l => l.id === lockId);
    if (!lock) return false;

    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    // Update lock status
    setLocks(prev =>
      prev.map(l => {
        if (l.id === lockId) {
          return {
            ...l,
            status: 'WITHDRAWN' as LockStatus,
            withdrawnAtTimestamp: Date.now(),
            withdrawnTxHash: txHash,
          };
        }
        return l;
      })
    );

    // Return tokens to wallet balance
    setTokens(prev =>
      prev.map(tok => {
        if (tok.symbol === lock.tokenSymbol) {
          return { ...tok, userBalance: tok.userBalance + lock.amount };
        }
        return tok;
      })
    );

    // Add notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: 'withdraw',
      title: 'Withdrawal Executed',
      message: `Withdrew ${lock.amount.toLocaleString()} ${lock.tokenSymbol} to your wallet.`,
      timestamp: Date.now(),
      read: false,
      txHash,
    };
    setNotifications(prev => [notif, ...prev]);

    addToast({
      type: 'success',
      title: 'Tokens Withdrawn',
      message: `${lock.amount.toLocaleString()} ${lock.tokenSymbol} transferred to your wallet.`,
    });

    return true;
  };

  // Extend lock
  const extendLock = async (lockId: string, additionalMs: number): Promise<boolean> => {
    setLocks(prev =>
      prev.map(l => {
        if (l.id === lockId) {
          const newUnlock = l.unlocksAtTimestamp + additionalMs;
          const unlockDate = new Date(newUnlock);
          const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' };
          return {
            ...l,
            unlocksAtTimestamp: newUnlock,
            unlockDateFormatted: unlockDate.toLocaleDateString('en-US', formatOptions),
            status: 'LOCKED' as LockStatus,
          };
        }
        return l;
      })
    );

    addToast({
      type: 'info',
      title: 'Lock Extended',
      message: `Timelock duration successfully extended.`,
    });

    return true;
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotifCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Derived categorized locks
  const activeLocks = useMemo(() => {
    return locks.filter(l => l.status === 'LOCKED');
  }, [locks]);

  const readyLocks = useMemo(() => {
    return locks.filter(l => l.status === 'READY');
  }, [locks]);

  const completedLocks = useMemo(() => {
    return locks.filter(l => l.status === 'WITHDRAWN');
  }, [locks]);

  // High level metrics
  const stats: TimelockStats = useMemo(() => {
    const totalLockedUsd = activeLocks.reduce((acc, l) => acc + l.amountUsd, 0);
    const readyToWithdrawUsd = readyLocks.reduce((acc, l) => acc + l.amountUsd, 0);
    const uniqueAssets = new Set(activeLocks.map(l => l.tokenSymbol)).size;

    return {
      totalLockedUsd: totalLockedUsd > 0 ? totalLockedUsd : 1240000,
      totalLockedChangeWeek: 2.4,
      activeLocksCount: activeLocks.length,
      assetsCount: uniqueAssets || 4,
      readyToWithdrawUsd: readyToWithdrawUsd > 0 ? readyToWithdrawUsd : 45200,
      readyToWithdrawCount: readyLocks.length,
      completedLocksCount: 104 + completedLocks.length - INITIAL_COMPLETED_LOCKS.length,
    };
  }, [activeLocks, readyLocks, completedLocks]);

  return (
    <TimelockContext.Provider
      value={{
        activeTab,
        setActiveTab,
        wallet,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        requestFaucet,
        tokens,
        stats,
        currentTime,
        allLocks: locks,
        activeLocks,
        readyLocks,
        completedLocks,
        createLock,
        withdrawLock,
        extendLock,
        txState,
        resetTxState,
        isCreateModalOpen,
        setIsCreateModalOpen,
        withdrawTargetLock,
        setWithdrawTargetLock,
        detailTargetLock,
        setDetailTargetLock,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isNotifOpen,
        setIsNotifOpen,
        notifications,
        markAllNotificationsRead,
        unreadNotifCount,
        toasts,
        addToast,
        removeToast,
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        filterToken,
        setFilterToken,
      }}
    >
      {children}
    </TimelockContext.Provider>
  );
};

export const useTimelock = (): TimelockContextType => {
  const context = useContext(TimelockContext);
  if (!context) {
    throw new Error('useTimelock must be used within a TimelockProvider');
  }
  return context;
};
