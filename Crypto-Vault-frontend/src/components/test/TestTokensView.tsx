import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Copy, ExternalLink, Loader2, Shield, Sparkles, Wallet2 } from 'lucide-react';
import { MOCK_TOKEN_ADDRESS, SEPOLIA_CHAIN_ID } from '../../config/contracts';
import { useTimelock } from '../../context/TimelockContext';
import { addMockTokenToWallet } from '../../utils/metamask';
import { readableError } from '../../utils/readableError';

export const TestTokensView: React.FC = () => {
  const { wallet, addToast, claimFaucet, connectWallet, tokens, txState } = useTimelock();
  const [copied, setCopied] = useState(false);
  const [watchingAsset, setWatchingAsset] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [txHash, setTxHash] = useState('');

  const mtkBalance = useMemo(() => {
    return tokens.find((token) => token.symbol === 'MTK')?.userBalance ?? '0';
  }, [tokens]);

  const isSepolia = wallet.isConnected && wallet.network.chainId === SEPOLIA_CHAIN_ID;
  const canClaim = wallet.isConnected && isSepolia && !claiming && !!MOCK_TOKEN_ADDRESS;

  useEffect(() => {
    if (txState?.txHash) {
      setTxHash(txState.txHash);
    }
  }, [txState]);

  const handleCopyAddress = async () => {
    if (!MOCK_TOKEN_ADDRESS) {
      addToast({ type: 'error', title: 'Address unavailable', message: 'The MockToken deployment address is not configured yet.' });
      return;
    }

    await navigator.clipboard.writeText(MOCK_TOKEN_ADDRESS);
    setCopied(true);
    addToast({ type: 'info', title: 'Address copied', message: 'MTK contract address copied to your clipboard.' });
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToMetaMask = async () => {
    if (!window.ethereum) {
      addToast({ type: 'warning', title: 'MetaMask unavailable', message: 'Install MetaMask in your browser to add MTK to your wallet.' });
      return;
    }

    if (!MOCK_TOKEN_ADDRESS) {
      addToast({ type: 'error', title: 'Missing address', message: 'No MockToken address is set in the frontend configuration.' });
      return;
    }

    setWatchingAsset(true);
    try {
      const added = await addMockTokenToWallet();
      if (added) {
        addToast({ type: 'success', title: 'MTK added', message: 'Mock Token has been added to MetaMask.' });
      } else {
        addToast({ type: 'error', title: 'MetaMask rejected', message: 'The wallet request was rejected, so MTK was not added.' });
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
      addToast({ type: 'warning', title: 'Wrong network', message: 'Switch your wallet to Ethereum Sepolia before claiming MTK.' });
      return;
    }

    if (!MOCK_TOKEN_ADDRESS) {
      addToast({ type: 'error', title: 'Missing address', message: 'The MTK contract address is not configured.' });
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
          Onboard onto Sepolia with the mock MTK token used for testing Crypto-Vault. This is a demo test token only and has no real-world value.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl border border-[#E2E1D8] p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#7D8C7B] font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>MTK</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-xl font-bold text-[#2C332B]">Mock Token</div>
              <div className="font-mono-numbers text-sm text-[#7A7E78]">Symbol: MTK</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#F0F1ED] border border-[#E2E1D8] flex items-center justify-center text-lg font-bold text-[#2C332B]">M</div>
          </div>
          <p className="text-sm text-[#7A7E78] leading-relaxed">
            MTK is a Sepolia test token for Crypto-Vault demos. It is not a real asset, not redeemable for cash, and has no monetary value.
          </p>
        </div>

        <div className="glass-card rounded-xl border border-[#E2E1D8] p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#7D8C7B] font-bold text-xs uppercase tracking-wider">
            <Wallet2 className="w-4 h-4" />
            <span>Contract Address</span>
          </div>

          <div className="flex items-center gap-2 bg-[#F9F9F7] border border-[#E2E1D8] rounded-xl p-3">
            <div className="font-mono-numbers text-xs text-[#2C332B] break-all flex-1">
              {MOCK_TOKEN_ADDRESS || 'Address not configured'}
            </div>
            <button
              type="button"
              onClick={handleCopyAddress}
              disabled={!MOCK_TOKEN_ADDRESS}
              className="inline-flex items-center gap-1.5 bg-[#F0F1ED] hover:bg-[#E2E1D8] border border-[#E2E1D8] text-[#2C332B] rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#558755]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToMetaMask}
            disabled={!window.ethereum || !MOCK_TOKEN_ADDRESS || watchingAsset}
            className="inline-flex items-center justify-center gap-2 bg-[#2C332B] hover:bg-black text-white text-sm font-semibold rounded-xl px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {watchingAsset ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {watchingAsset ? 'Adding...' : (window.ethereum ? 'Add MTK to MetaMask' : 'MetaMask unavailable')}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl border border-[#E2E1D8] p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-[#7A7E78]">Current MTK Balance</div>
            <div className="text-2xl font-display font-bold text-[#2C332B] mt-1">
              {wallet.isConnected ? `${mtkBalance.toLocaleString()} MTK` : 'Disconnected'}
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
          {claiming ? 'Claiming...' : wallet.isConnected ? (isSepolia ? 'Claim MTK' : 'Switch to Sepolia') : 'Connect wallet to claim'}
        </button>

        {!wallet.isConnected && (
          <div className="flex items-center gap-2 text-xs text-[#7A7E78]">
            <AlertCircle className="w-4 h-4 text-[#7D8C7B]" />
            <span>Connect your wallet first to claim MTK and view your balance.</span>
          </div>
        )}

        {wallet.isConnected && !isSepolia && (
          <div className="flex items-center gap-2 text-xs text-[#7A7E78]">
            <AlertCircle className="w-4 h-4 text-[#D97706]" />
            <span>You are on the wrong network. Please switch to Sepolia before claiming MTK.</span>
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
          <li>MTK is a demonstration token for testing Crypto-Vault only and has no monetary value.</li>
          <li>Claiming is intended for the Sepolia test network and should not be treated as a real asset.</li>
        </ul>
      </div>
    </div>
  );
};
