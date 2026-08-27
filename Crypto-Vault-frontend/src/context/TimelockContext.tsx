import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { BrowserProvider, Contract, ethers } from 'ethers';
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
  ERC20_ABI,
  MOCK_TOKEN_ABI,
  MOCK_TOKEN_ADDRESS,
  PROTOCOL_FEE,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_NETWORK,
  TOKEN_LOCKER_ABI,
  TOKEN_LOCKER_ADDRESS,
} from '../config/contracts';
import { readableError } from '../utils/readableError';
import { detectToken as detectErc20Token } from '../utils/tokenDetection';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown }) => Promise<unknown>;
      on: (event: string, listener: (...args: unknown[]) => void) => void;
      removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
    };
  }
}

interface ToastState {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface CreateLockParams {
  tokenAddress: string;
  amount: string;
  unlockTimestamp: number;
}

interface TimelockContextType {
  activeTab: 'dashboard' | 'vaults' | 'governance' | 'docs' | 'test-tokens';
  setActiveTab: (tab: 'dashboard' | 'vaults' | 'governance' | 'docs' | 'test-tokens') => void;
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (network: NetworkConfig) => Promise<void>;
  tokens: TokenInfo[];
  detectToken: (address: string) => Promise<TokenInfo>;
  stats: TimelockStats;
  currentTime: number;
  allLocks: TimeLock[];
  activeLocks: TimeLock[];
  readyLocks: TimeLock[];
  completedLocks: TimeLock[];
  createLock: (params: CreateLockParams) => Promise<TimeLock>;
  claimFaucet: () => Promise<void>;
  withdrawLock: (lockId: string) => Promise<boolean>;
  txState: TransactionState | null;
  resetTxState: () => void;
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
  notifications: NotificationItem[];
  markAllNotificationsRead: () => void;
  notificationsEnabled: boolean;
  notificationSoundEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationSoundEnabled: (enabled: boolean) => void;
  unreadNotifCount: number;
  toasts: ToastState[];
  addToast: (toast: Omit<ToastState, 'id'>) => void;
  removeToast: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: 'ALL' | LockStatus;
  setFilterStatus: (status: 'ALL' | LockStatus) => void;
  filterToken: string;
  setFilterToken: (token: string) => void;
}

const TimelockContext = createContext<TimelockContextType | undefined>(undefined);
const network: NetworkConfig = SEPOLIA_NETWORK;
const tokenTemplate: TokenInfo = {
  symbol: 'MTK',
  name: 'Mock Token',
  address: MOCK_TOKEN_ADDRESS,
  decimals: 18,
  iconLetter: 'M',
  iconBgColor: '#F0F1ED',
  userBalance: '0',
};
const DISCONNECTED_KEY = 'crypto-vault-wallet-disconnected';
const NOTIFICATION_DEDUPE_KEY = 'crypto-vault-ready-notifications';
const NOTIFICATIONS_ENABLED_KEY = 'crypto-vault-notifications-enabled';
const NOTIFICATION_SOUND_KEY = 'crypto-vault-notification-sound';
const TOKEN_REGISTRY_KEY = 'crypto-vault-token-registry';
const MIN_UNLOCK_BUFFER_MS = 2 * 60 * 1000;

export const TimelockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vaults' | 'governance' | 'docs' | 'test-tokens'>('dashboard');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [chainTimeOffset, setChainTimeOffset] = useState(0);
  const [wallet, setWallet] = useState<WalletState>({ isConnected: false, address: '', network, ethBalance: 0 });
  const [tokens, setTokens] = useState<TokenInfo[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TOKEN_REGISTRY_KEY) || '[]') as TokenInfo[];
      const stored = saved.filter(token => token && ethers.isAddress(token.address)).map(token => ({ ...token, userBalance: '0' }));
      return [tokenTemplate, ...stored.filter(token => token.address.toLowerCase() !== tokenTemplate.address.toLowerCase())];
    } catch {
      return [tokenTemplate];
    }
  });
  const [locks, setLocks] = useState<TimeLock[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [txState, setTxState] = useState<TransactionState | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [withdrawTargetLock, setWithdrawTargetLock] = useState<TimeLock | null>(null);
  const [detailTargetLock, setDetailTargetLock] = useState<TimeLock | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'false');
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(() => localStorage.getItem(NOTIFICATION_SOUND_KEY) !== 'false');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | LockStatus>('ALL');
  const [filterToken, setFilterToken] = useState('ALL');
  const refreshId = React.useRef(0);
  const walletRef = React.useRef(wallet);
  const tokensRef = React.useRef(tokens);
  const previousLocksRef = useRef<TimeLock[] | null>(null);
  const interactedRef = useRef(false);

  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  const addToast = (toast: Omit<ToastState, 'id'>) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    window.setTimeout(() => setToasts(prev => prev.filter(item => item.id !== id)), 4000);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(item => item.id !== id));
  const resetTxState = () => setTxState(null);
  const getProvider = () => (window.ethereum ? new BrowserProvider(window.ethereum as never) : null);

  const playNotificationSound = () => {
    if (!notificationSoundEnabled || !interactedRef.current) return;
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = 660;
      gain.gain.setValueAtTime(0.035, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.18);
      oscillator.addEventListener('ended', () => { void audioContext.close(); });
    } catch {
      // Browser audio policy must not interrupt blockchain state updates.
    }
  };

  const clearWalletState = () => {
    refreshId.current += 1;
    setWallet({ isConnected: false, address: '', network, ethBalance: 0 });
    setLocks([]);
    setTokens(previous => previous.map(token => ({ ...token, userBalance: '0' })));
    setTxState(null);
  };

  useEffect(() => {
    const metadata = tokens.map(({ address, name, symbol, decimals, iconLetter, iconBgColor, priceUsd }) => ({
      address, name, symbol, decimals, iconLetter, iconBgColor, priceUsd,
    }));
    localStorage.setItem(TOKEN_REGISTRY_KEY, JSON.stringify(metadata));
  }, [tokens]);

  const refreshChainState = async (address: string, chainId = SEPOLIA_CHAIN_ID) => {
    const requestId = ++refreshId.current;
    const provider = getProvider();
    if (!provider || chainId !== SEPOLIA_CHAIN_ID || !TOKEN_LOCKER_ADDRESS) return;

    const ethBalance = Number(ethers.formatEther(await provider.getBalance(address)));
    const locker = new Contract(TOKEN_LOCKER_ADDRESS, TOKEN_LOCKER_ABI, provider);
    const ids = (await locker.getUserLocks(address)) as bigint[];
    const block = await provider.getBlock('latest');
    const now = Number(block?.timestamp ?? Math.floor(Date.now() / 1000));
    setChainTimeOffset(now * 1000 - Date.now());

    const loaded = await Promise.all(
      ids.map(async id => {
        const item = await locker.getLock(id);
        const tokenContract = new Contract(item.token, ERC20_ABI, provider);
        let symbol = 'TOKEN';
        let name = item.token;

        try {
          symbol = await tokenContract.symbol();
          name = await tokenContract.name();
        } catch {
          // metadata is optional
        }

        const decimals = Number(await tokenContract.decimals().catch(() => 18));
        const unlock = Number(item.unlockTime) * 1000;

        return {
          id: item.id.toString(),
          tokenAddress: item.token,
          tokenSymbol: symbol,
          tokenName: name,
          amount: ethers.formatUnits(item.amount, decimals),
          amountUsd: 0,
          lockedAtTimestamp: Date.now(),
          unlocksAtTimestamp: unlock,
          lockedDateFormatted: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          unlockDateFormatted: new Date(unlock).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          status: item.withdrawn ? 'WITHDRAWN' : now >= Number(item.unlockTime) ? 'READY' : 'LOCKED',
          owner: item.owner,
          withdrawn: item.withdrawn,
        } as TimeLock;
      })
    );

    if (requestId !== refreshId.current) return;

    setWallet(prev => (prev.address.toLowerCase() === address.toLowerCase() ? { ...prev, ethBalance } : prev));
    setLocks(loaded);
    const trackedTokens = tokensRef.current.filter(token => ethers.isAddress(token.address));
    const refreshedTokens = await Promise.all(trackedTokens.map(async tokenInfo => {
      try {
        const tokenContract = new Contract(tokenInfo.address, ERC20_ABI, provider);
        const balance = await tokenContract.balanceOf(address);
        return { ...tokenInfo, userBalance: ethers.formatUnits(balance, tokenInfo.decimals) };
      } catch {
        return { ...tokenInfo, userBalance: '0' };
      }
    }));
    setTokens(refreshedTokens);
  };

  const setWrongNetwork = (chainId: number, address: string) => {
    refreshId.current += 1;
    setWallet({ isConnected: true, address, network: { ...network, name: `Wrong Network (${chainId})`, chainId }, ethBalance: 0 });
    setTokens([{ ...tokenTemplate, userBalance: '0' }]);
    setLocks([]);
  };

  const handleChain = async (address: string) => {
    const provider = getProvider();
    if (!provider) return;
    const chainId = Number(await provider.send('eth_chainId', []));

    if (chainId !== SEPOLIA_CHAIN_ID) {
      setWrongNetwork(chainId, address);
      addToast({ type: 'warning', title: 'Wrong network', message: 'Please switch your wallet back to Ethereum Sepolia.' });
      return;
    }

    setWallet(prev => ({ ...prev, isConnected: true, address, network, ethBalance: 0 }));

    try {
      await refreshChainState(address, chainId);
    } catch (error) {
      addToast({ type: 'error', ...readableError(error) });
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      addToast({ type: 'error', ...readableError(new Error('Wallet not installed'), 'connect') });
      return;
    }

    try {
      const provider = getProvider()!;
      const accounts = (await provider.send('eth_requestAccounts', [])) as string[];
      if (!accounts[0]) return;
      localStorage.removeItem(DISCONNECTED_KEY);
      await handleChain(accounts[0]);
      addToast({ type: 'success', title: 'Wallet Connected', message: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}` });
    } catch (error) {
      addToast({ type: 'error', ...readableError(error, 'connect') });
    }
  };

  const disconnectWallet = () => {
    localStorage.setItem(DISCONNECTED_KEY, 'true');
    clearWalletState();
  };

  const switchNetwork = async () => {
    if (!window.ethereum) {
      addToast({ type: 'error', ...readableError(new Error('Wallet not installed'), 'switch') });
      return;
    }

    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] });
    } catch (error) {
      addToast({ type: 'error', ...readableError(error, 'switch') });
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const markInteracted = () => { interactedRef.current = true; };
    window.addEventListener('pointerdown', markInteracted, { once: true });
    window.addEventListener('keydown', markInteracted, { once: true });
    return () => {
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('keydown', markInteracted);
    };
  }, []);

  useEffect(() => {
    if (!wallet.isConnected || wallet.network.chainId !== SEPOLIA_CHAIN_ID) return;
    const timer = window.setInterval(() => {
      const provider = getProvider();
      if (!provider) return;
      void provider.getBlock('latest').then(block => {
        if (block) setChainTimeOffset(Number(block.timestamp) * 1000 - Date.now());
      }).catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [wallet.isConnected, wallet.network.chainId]);

  useEffect(() => {
    setLocks(previous => previous.map(lock => {
      if (lock.withdrawn) return lock;
      const status: LockStatus = currentTime + chainTimeOffset >= lock.unlocksAtTimestamp ? 'READY' : 'LOCKED';
      return lock.status === status ? lock : { ...lock, status };
    }));
  }, [currentTime, chainTimeOffset]);

  useEffect(() => {
    const previous = previousLocksRef.current;
    if (!previous) {
      previousLocksRef.current = locks;
      return;
    }
    if (!notificationsEnabled) {
      previousLocksRef.current = locks;
      return;
    }

    const sent = JSON.parse(localStorage.getItem(NOTIFICATION_DEDUPE_KEY) || '[]') as string[];
    const newlyReady = locks.filter(lock => previous.some(item => item.id === lock.id && item.status === 'LOCKED') && lock.status === 'READY');
    const unseen = newlyReady.filter(lock => !sent.includes(`ready-${lock.id}`));
    if (unseen.length) {
      localStorage.setItem(NOTIFICATION_DEDUPE_KEY, JSON.stringify([...sent, ...unseen.map(lock => `ready-${lock.id}`)]));
      const timestamp = Date.now();
      setNotifications(current => [...unseen.map(lock => ({
        id: `ready-${lock.id}`,
        type: 'unlock' as const,
        title: 'Lock Ready',
        message: `Your ${lock.amount} ${lock.tokenSymbol} tokens are now available for withdrawal.`,
        timestamp,
        read: false,
        lockId: lock.id,
      })), ...current]);
      unseen.forEach(lock => addToast({ type: 'success', title: 'Lock Ready', message: `Your ${lock.amount} ${lock.tokenSymbol} lock is ready to withdraw.` }));
      playNotificationSound();
    }
    previousLocksRef.current = locks;
  }, [locks, notificationsEnabled, notificationSoundEnabled]);

  useEffect(() => { localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(notificationsEnabled)); }, [notificationsEnabled]);
  useEffect(() => { localStorage.setItem(NOTIFICATION_SOUND_KEY, String(notificationSoundEnabled)); }, [notificationSoundEnabled]);

  useEffect(() => {
    if (!window.ethereum) return;

    const onAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts?.length) {
        clearWalletState();
        return;
      }
      if (localStorage.getItem(DISCONNECTED_KEY) === 'true' && !walletRef.current.isConnected) return;
      void handleChain(accounts[0]);
    };

    const onChain = (...args: unknown[]) => {
      const chainId = Number(args[0]);
      const currentWallet = walletRef.current;
      if (!currentWallet.isConnected || !currentWallet.address) return;
      if (chainId !== SEPOLIA_CHAIN_ID) setWrongNetwork(chainId, currentWallet.address);
      else void handleChain(currentWallet.address);
    };

    window.ethereum.on('accountsChanged', onAccounts);
    window.ethereum.on('chainChanged', onChain);

    void (async () => {
      if (localStorage.getItem(DISCONNECTED_KEY) === 'true') return;
      const provider = getProvider();
      if (!provider) return;
      const accounts = (await provider.send('eth_accounts', [])) as string[];
      if (accounts[0]) void handleChain(accounts[0]);
    })();

    return () => {
      window.ethereum?.removeListener('accountsChanged', onAccounts);
      window.ethereum?.removeListener('chainChanged', onChain);
    };
  }, []);

  const detectToken = async (address: string) => {
    if (!wallet.isConnected) throw new Error('wallet not connected');
    if (wallet.network.chainId !== SEPOLIA_CHAIN_ID) throw new Error('wrong network');
    const provider = getProvider();
    if (!provider) throw new Error('wallet not installed');
    const token = await detectErc20Token(address, wallet.address, provider);
    setTokens(prev => [...prev.filter(item => item.address.toLowerCase() !== token.address.toLowerCase()), token]);
    return token;
  };

  const createLock = async ({ tokenAddress, amount, unlockTimestamp }: CreateLockParams) => {
    if (!wallet.isConnected || wallet.network.chainId !== SEPOLIA_CHAIN_ID) throw new Error('wrong network');
    if (!ethers.isAddress(tokenAddress) || tokenAddress.toLowerCase() === ethers.ZeroAddress.toLowerCase()) throw new Error('invalid token address');
    if (!amount.trim() || !/^(?:\d+\.?\d*|\.\d+)$/.test(amount) || Number(amount) <= 0) throw new Error('invalid amount');
    if (unlockTimestamp - Date.now() < MIN_UNLOCK_BUFFER_MS) throw new Error('unlock time too close');

    const provider = getProvider();
    if (!provider) throw new Error('wallet not installed');
    if (await provider.getCode(tokenAddress) === '0x') throw new Error('token address has no contract code');

    const signer = await provider.getSigner();
    const token = new Contract(tokenAddress, ERC20_ABI, signer);
    const locker = new Contract(TOKEN_LOCKER_ADDRESS, TOKEN_LOCKER_ABI, signer);
    const decimals = Number(await token.decimals());
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) throw new Error('invalid token decimals');
    const rawAmount = ethers.parseUnits(amount, decimals);

    if ((await token.balanceOf(wallet.address)) < rawAmount) throw new Error('insufficient token balance');
    if ((await token.allowance(wallet.address, TOKEN_LOCKER_ADDRESS)) < rawAmount) {
      setTxState({ step: 'approving', title: 'Approve token', description: 'Waiting for wallet confirmation...' });
      let approval;
      try {
        approval = await token.approve(TOKEN_LOCKER_ADDRESS, rawAmount);
      } catch {
        setTxState(null);
        throw new Error('token approval rejected');
      }
      setTxState({ step: 'approving', title: 'Approve token', description: 'Transaction pending...', txHash: approval.hash });
      try {
        await approval.wait();
      } catch {
        setTxState(null);
        throw new Error('token approval failed');
      }
    }

    if (unlockTimestamp - Date.now() < MIN_UNLOCK_BUFFER_MS) {
      setTxState(null);
      throw new Error('unlock time too close');
    }

    setTxState({ step: 'locking', title: 'Create time-lock', description: 'Waiting for wallet confirmation...' });
    const transaction = await locker.createLock(tokenAddress, rawAmount, Math.floor(unlockTimestamp / 1000), { value: PROTOCOL_FEE });
    setTxState({ step: 'locking', title: 'Create time-lock', description: 'Transaction pending...', txHash: transaction.hash });
    const receipt = await transaction.wait();

    await refreshChainState(wallet.address);

    const created = {
      id: 'pending',
      tokenAddress,
      tokenSymbol: (await token.symbol()) as string,
      tokenName: (await token.name()) as string,
      amount: ethers.formatUnits(rawAmount, decimals),
      amountUsd: 0,
      lockedAtTimestamp: Date.now(),
      unlocksAtTimestamp: unlockTimestamp,
      lockedDateFormatted: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      unlockDateFormatted: new Date(unlockTimestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'LOCKED' as const,
      owner: wallet.address,
      withdrawn: false,
      creationTxHash: transaction.hash,
      creationBlockNumber: receipt?.blockNumber,
    };

    setTxState({ step: 'success', title: 'Transaction confirmed', description: 'Your time-lock has been created.', txHash: transaction.hash });
    addToast({ type: 'success', title: 'Time-Lock Created', message: `${amount} tokens locked until ${new Date(unlockTimestamp).toLocaleString()}.` });
    return created;
  };

  const claimFaucet = async () => {
    if (!wallet.isConnected || wallet.network.chainId !== SEPOLIA_CHAIN_ID) throw new Error('wrong network');
    if (!MOCK_TOKEN_ADDRESS) throw new Error('mock token address not configured');

    const provider = getProvider();
    if (!provider) throw new Error('wallet not installed');

    const signer = await provider.getSigner();
    const token = new Contract(MOCK_TOKEN_ADDRESS, MOCK_TOKEN_ABI, signer);
    const faucetAmount = await token.FAUCET_AMOUNT();

    setTxState({ step: 'locking', title: 'Claim MTK', description: 'Waiting for wallet confirmation...' });
    const transaction = await token.claimFaucet();
    setTxState({ step: 'locking', title: 'Claim MTK', description: 'Transaction pending...', txHash: transaction.hash });
    await transaction.wait();

    const nextBalance = ethers.formatUnits(await token.balanceOf(wallet.address), tokenTemplate.decimals);
    setTokens(prev => prev.map(item => (item.address.toLowerCase() === MOCK_TOKEN_ADDRESS.toLowerCase() ? { ...item, userBalance: nextBalance } : item)));
    await refreshChainState(wallet.address);

    setTxState({ step: 'success', title: 'MTK claimed', description: 'Your Sepolia test tokens have been sent to your wallet.', txHash: transaction.hash });
    addToast({ type: 'success', title: 'MTK Claimed', message: `${ethers.formatUnits(faucetAmount, 18)} MTK added to your wallet.` });
  };

  const withdrawLock = async (lockId: string) => {
    const lock = locks.find(item => item.id === lockId);
    if (!lock || lock.owner.toLowerCase() !== wallet.address.toLowerCase() || lock.withdrawn || lock.unlocksAtTimestamp > currentTime + chainTimeOffset) throw new Error('withdrawal unavailable');

    const provider = getProvider();
    if (!provider) throw new Error('wallet not installed');

    const locker = new Contract(TOKEN_LOCKER_ADDRESS, TOKEN_LOCKER_ABI, await provider.getSigner());
    setTxState({ step: 'withdrawing', title: 'Withdraw tokens', description: 'Waiting for wallet confirmation...' });
    const transaction = await locker.withdraw(lockId);
    setTxState({ step: 'withdrawing', title: 'Withdraw tokens', description: 'Transaction pending...', txHash: transaction.hash });
    await transaction.wait();
    await refreshChainState(wallet.address);

    setTxState({ step: 'success', title: 'Transaction confirmed', description: 'Tokens withdrawn.', txHash: transaction.hash });
    addToast({ type: 'success', title: 'Tokens Withdrawn', message: `${lock.amount} ${lock.tokenSymbol} transferred to your wallet.` });
    return true;
  };

  const activeLocks = useMemo(() => locks.filter(lock => lock.status === 'LOCKED'), [locks]);
  const readyLocks = useMemo(() => locks.filter(lock => lock.status === 'READY'), [locks]);
  const completedLocks = useMemo(() => locks.filter(lock => lock.status === 'WITHDRAWN'), [locks]);
  const stats = useMemo(
    () => ({
      totalLockedUsd: 0,
      totalLockedChangeWeek: 0,
      activeLocksCount: activeLocks.length,
      assetsCount: new Set(activeLocks.map(lock => lock.tokenAddress.toLowerCase())).size,
      readyToWithdrawUsd: 0,
      readyToWithdrawCount: readyLocks.length,
      completedLocksCount: completedLocks.length,
    }),
    [activeLocks, readyLocks, completedLocks]
  );
  const unreadNotifCount = notifications.filter(item => !item.read).length;

  return (
    <TimelockContext.Provider
      value={{
        activeTab,
        setActiveTab,
        wallet,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        tokens,
        detectToken,
        stats,
        currentTime,
        allLocks: locks,
        activeLocks,
        readyLocks,
        completedLocks,
        createLock,
        claimFaucet,
        withdrawLock,
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
        markAllNotificationsRead: () => setNotifications(prev => prev.map(item => ({ ...item, read: true }))),
        notificationsEnabled,
        notificationSoundEnabled,
        setNotificationsEnabled,
        setNotificationSoundEnabled,
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

export const useTimelock = () => {
  const context = useContext(TimelockContext);
  if (!context) throw new Error('useTimelock must be used within a TimelockProvider');
  return context;
};
