import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Copy, ExternalLink, Loader2, Shield, Sparkles, Wallet2 } from 'lucide-react';
import { HUMBLE_TOKEN_ADDRESS, SEPOLIA_CHAIN_ID } from '../../config/contracts';
import { useTimelock } from '../../context/TimelockContext';
import { addTokenToWallet } from '../../utils/metamask';
import { getWalletProvider } from '../../utils/walletProvider';
import { readableError } from '../../utils/readableError';

export const TestTokensView: React.FC = () => {
  const { wallet, addToast, claimFaucet, connectWallet, tokens, txState, currentTime, faucetNextAvailableAt, faucetCooldownSeconds, chainTimeOffset } = useTimelock();
  const [copied, setCopied] = useState(false);
  const [watchingAsset, setWatchingAsset] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [txHash, setTxHash] = useState('');

  const hmtBalance = useMemo(() => {
    return tokens.find((token) => token.symbol === 'HMT')?.userBalance ?? '0';
  }, [tokens]);

  const isSepolia = wallet.isConnected && wallet.network.chainId === SEPOLIA_CHAIN_ID;
  const chainNow = Math.floor((currentTime + chainTimeOffset) / 1000);
  const remainingSeconds = faucetNextAvailableAt === null ? 0 : Math.max(0, faucetNextAvailableAt - chainNow);
  const canClaim = wallet.isConnected && isSepolia && !claiming && !!HUMBLE_TOKEN_ADDRESS && remainingSeconds === 0;

  const formatRemaining = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  useEffect(() => {
    if (txState?.txHash) {
      setTxHash(txState.txHash);
    }
  }, [txState]);

  const handleCopyAddress = async () => {
    if (!HUMBLE_TOKEN_ADDRESS) {
      addToast({ type: 'error', title: 'Address unavailable', message: 'The Humble Token deployment address is not configured yet.' });
      return;
    }

    await navigator.clipboard.writeText(HUMBLE_TOKEN_ADDRESS);
    setCopied(true);
    addToast({ type: 'info', title: 'Address copied', message: 'HMT contract address copied to your clipboard.' });
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToWallet = async () => {
    if (!getWalletProvider()) {
      addToast({ type: 'warning', title: 'Wallet unavailable', message: 'Connect a compatible wallet app or browser extension to add HMT.' });
      return;
    }

    if (!HUMBLE_TOKEN_ADDRESS) {
      addToast({ type: 'error', title: 'Missing address', message: 'No Humble Token address is set in the frontend configuration.' });
      return;
    }

    setWatchingAsset(true);
    try {
      const token = tokens.find(item => item.address.toLowerCase() === HUMBLE_TOKEN_ADDRESS.toLowerCase());
      const added = await addTokenToWallet(HUMBLE_TOKEN_ADDRESS, 'HMT', token?.decimals ?? 18);
      if (added) {
        addToast({ type: 'success', title: 'HMT added', message: 'Humble Token has been added to your wallet.' });
      } else {
        addToast({ type: 'error', title: 'Wallet rejected', message: 'The wallet request was rejected, so HMT was not added.' });
      }
    } catch (error) {
      addToast({ type: 'error', ...readableError(error, 'connect') });
    } finally {
      setWatchingAsset(false);
    }
  };

  const handleClaim = async () => {
    if (!wallet.isConnected) {
      await connectWallet();
      return;
    }

    if (!isSepolia) {
      addToast({ type: 'warning', title: 'Wrong network', message: 'Switch your wallet to Ethereum Sepolia before claiming HMT.' });
      return;
    }

    if (!HUMBLE_TOKEN_ADDRESS) {
      addToast({ type: 'error', title: 'Missing address', message: 'The HMT contract address is not configured.' });
      return;
    }

    setClaiming(true);
    try {
      await claimFaucet();
    } catch (error) {
      addToast({ type: 'error', ...readableError(error, 'faucet') });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto text-[#3A3D39]">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#2C332B]">Test Tokens</h1>
        <p className="text-sm text-[#7A7E78]">
          Onboard onto Sepolia with Humble Token (HMT), the primary demo token for Crypto-Vault. It is a test token with no real-world value.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl border border-[#E2E1D8] p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#7D8C7B] font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>HMT</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-xl font-bold text-[#2C332B]">Humble Token</div>
              <div className="font-mono-numbers text-sm text-[#7A7E78]">Symbol: HMT</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#F0F1ED] border border-[#E2E1D8] flex items-center justify-center text-lg font-bold text-[#2C332B]">H</div>
          </div>
          <p className="text-sm text-[#7A7E78] leading-relaxed">
            HMT is the primary Sepolia demo token for Crypto-Vault. It is not a real asset, not redeemable for cash, and has no monetary value.
          </p>
        </div>

        <div className="glass-card rounded-xl border border-[#E2E1D8] p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#7D8C7B] font-bold text-xs uppercase tracking-wider">
            <Wallet2 className="w-4 h-4" />
            <span>Contract Address</span>
          </div>

          <div className="flex items-center gap-2 bg-[#F9F9F7] border border-[#E2E1D8] rounded-xl p-3">
            <div className="font-mono-numbers text-xs text-[#2C332B] break-all flex-1">
              {HUMBLE_TOKEN_ADDRESS || 'Address not configured'}
            </div>
            <button
              type="button"
              onClick={handleCopyAddress}
              disabled={!HUMBLE_TOKEN_ADDRESS}
              className="inline-flex items-center gap-1.5 bg-[#F0F1ED] hover:bg-[#E2E1D8] border border-[#E2E1D8] text-[#2C332B] rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#558755]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToWallet}
            disabled={!getWalletProvider() || !HUMBLE_TOKEN_ADDRESS || watchingAsset}
            className="inline-flex items-center justify-center gap-2 bg-[#2C332B] hover:bg-black text-white text-sm font-semibold rounded-xl px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {watchingAsset ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {watchingAsset ? 'Adding...' : (getWalletProvider() ? 'Add HMT to Wallet' : 'Wallet unavailable')}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl border border-[#E2E1D8] p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-[#7A7E78]">Current HMT Balance</div>
            <div className="text-2xl font-display font-bold text-[#2C332B] mt-1">
              {wallet.isConnected ? `${hmtBalance} HMT` : 'Disconnected'}
            </div>
          </div>
          <div className="text-xs text-[#7A7E78]">
            {wallet.isConnected ? `Wallet: ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Connect a wallet to view your balance.'}
          </div>
        </div>

        <button
          type="button"
          onClick={handleClaim}
          disabled={!canClaim}
          className="inline-flex items-center justify-center gap-2 bg-[#EDF5ED] hover:bg-[#D2E8D2] text-[#2C332B] border border-[#CDE2CD] text-sm font-semibold rounded-xl px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {claiming ? 'Claiming...' : wallet.isConnected ? (isSepolia ? (remainingSeconds > 0 ? `Claim HMT (${formatRemaining(remainingSeconds)})` : 'Claim HMT') : 'Switch to Sepolia') : 'Connect wallet to claim'}
        </button>

        {!wallet.isConnected && (
          <div className="flex items-center gap-2 text-xs text-[#7A7E78]">
            <AlertCircle className="w-4 h-4 text-[#7D8C7B]" />
            <span>Connect your wallet first to claim HMT and view your balance.</span>
          </div>
        )}

        {wallet.isConnected && !isSepolia && (
          <div className="flex items-center gap-2 text-xs text-[#7A7E78]">
            <AlertCircle className="w-4 h-4 text-[#D97706]" />
            <span>You are on the wrong network. Please switch to Sepolia before claiming HMT.</span>
          </div>
        )}

        {txState && (
          <div className="rounded-xl border border-[#E2E1D8] bg-[#F9F9F7] p-3 text-xs text-[#2C332B] flex flex-col gap-1.5">
            <div className="font-semibold">{txState.title}</div>
            <div className="text-[#7A7E78]">{txState.description}</div>
            {txState.txHash && (
              <div className="flex items-center gap-2 text-[#7A7E78] break-all font-mono-numbers">
                <span>Tx:</span>
                <span>{txHash || txState.txHash}</span>
                <a href={`https://sepolia.etherscan.io/tx/${txState.txHash}`} target="_blank" rel="noreferrer" className="text-[#7D8C7B] inline-flex items-center gap-1">
                  <ExternalLink className="w-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl border border-[#E2E1D8] p-5 shadow-xs">
        <div className="text-xs uppercase tracking-wider font-bold text-[#7A7E78]">Useful Sepolia info</div>
        <ul className="mt-3 list-disc list-inside text-sm text-[#7A7E78] leading-relaxed space-y-2">
          <li>You still need Sepolia ETH in your wallet to pay gas.</li>
          <li>HMT is the primary demonstration token for testing Crypto-Vault only and has no monetary value.</li>
          {faucetCooldownSeconds !== null && <li>Faucet cooldown: {Math.floor(faucetCooldownSeconds / 3600)} hours, read from the HMT contract.</li>}
          <li>Claiming is intended for the Sepolia test network and should not be treated as a real asset.</li>
        </ul>
      </div>
    </div>
  );
};
