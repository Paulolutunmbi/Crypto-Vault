import React, { useState } from 'react';
import {
  X,
  Lock,
  Calendar,
  Clock,
  Shield,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';
import { formatAddress } from '../../utils/formatters';
import { readableError } from '../../utils/readableError';
import { addTokenToWallet } from '../../utils/metamask';

export const CreateLockModal: React.FC = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    tokens,
    wallet,
    createLock,
    detectToken,
    addToast,
    resetTxState,
  } = useTimelock();

  const [selectedTokenAddress, setSelectedTokenAddress] = useState(tokens.find(token => token.symbol === 'HMT')?.address ?? '');
  const [customAddress, setCustomAddress] = useState('');
  const [isAddingCustomToken, setIsAddingCustomToken] = useState(false);
  const [isDetectingToken, setIsDetectingToken] = useState(false);
  const [amount, setAmount] = useState('');
  const [durationPreset, setDurationPreset] = useState<'30d' | '90d' | '180d' | '1y' | 'custom'>('90d');
  const [customDate, setCustomDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStep, setTxStep] = useState<'form' | 'approving' | 'locking' | 'success'>('form');
  const [createdTxHash, setCreatedTxHash] = useState('');
  const [isWatchingToken, setIsWatchingToken] = useState(false);

  if (!isCreateModalOpen) return null;

  const currentToken = tokens.find(t => t.address.toLowerCase() === selectedTokenAddress.toLowerCase()) || tokens[0];
  const numAmount = parseFloat(amount) || 0;
  const totalUsd = currentToken.priceUsd === undefined ? undefined : numAmount * currentToken.priceUsd;

  // Calculate unlock timestamp based on duration
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let targetUnlockMs = now + 90 * dayMs;
  if (durationPreset === '30d') targetUnlockMs = now + 30 * dayMs;
  else if (durationPreset === '90d') targetUnlockMs = now + 90 * dayMs;
  else if (durationPreset === '180d') targetUnlockMs = now + 180 * dayMs;
  else if (durationPreset === '1y') targetUnlockMs = now + 365 * dayMs;
  else if (durationPreset === 'custom' && customDate) {
    targetUnlockMs = new Date(customDate).getTime();
  }

  const unlockDate = new Date(targetUnlockMs);
  const formattedUnlockDate = unlockDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleMaxClick = () => {
    setAmount(currentToken.userBalance);
  };

  const handleDetectToken = async () => {
    try {
      setIsDetectingToken(true);
      const token = await detectToken(customAddress);
      setSelectedTokenAddress(token.address);
      setIsAddingCustomToken(false);
      setCustomAddress('');
      setAmount('');
      addToast({ type: 'success', title: 'Token detected', message: `${token.name} (${token.symbol}), ${token.decimals} decimals.` });
    } catch (error) {
      addToast({ type: 'error', ...readableError(error, 'detect') });
    } finally {
      setIsDetectingToken(false);
    }
  };

  const handlePresetSelect = (preset: '30d' | '90d' | '180d' | '1y' | 'custom') => {
    setDurationPreset(preset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentToken.address) {
      addToast({ type: 'error', title: 'Token required', message: 'Load an ERC-20 token before creating a lock.' });
      return;
    }
    if (numAmount <= 0) {
      addToast({ type: 'error', title: 'Invalid amount', message: 'Enter a token amount greater than zero.' });
      return;
    }

    try {
      setIsSubmitting(true);

      setTxStep('locking');
      const newLock = await createLock({
        tokenAddress: currentToken.address,
        amount,
        unlockTimestamp: targetUnlockMs,
      });

      setCreatedTxHash(newLock.creationTxHash || '');
      setTxStep('success');
    } catch (err) {
      resetTxState();
      addToast({ type: 'error', ...readableError(err, 'create') });
      setTxStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTokenToMetaMask = async () => {
    if (!window.ethereum) {
      addToast({ type: 'warning', title: 'Wallet feature unavailable', message: 'This wallet does not support adding tokens automatically.' });
      return;
    }
    setIsWatchingToken(true);
    const added = await addTokenToWallet(currentToken.address, currentToken.symbol, currentToken.decimals);
    addToast(added
      ? { type: 'success', title: 'Token added', message: `${currentToken.symbol} was added to your wallet.` }
      : { type: 'info', title: 'Token not added', message: 'The wallet declined or does not support this request.' });
    setIsWatchingToken(false);
  };

  const handleClose = () => {
    setIsCreateModalOpen(false);
    setTxStep('form');
    setAmount('');
    setIsAddingCustomToken(false);
    setCustomAddress('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-[#E2E1D8] shadow-2xl p-6 z-10 max-h-[92vh] overflow-y-auto flex flex-col gap-5 text-[#3A3D39]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E1D8] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F0F1ED] border border-[#E2E1D8] flex items-center justify-center text-[#7D8C7B]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#2C332B]">Create Time-Lock</h2>
              <p className="text-xs text-[#7A7E78]">Deposit & lock tokens until an immutable maturity date</p>
            </div>
          </div>
          <button
            id="close-create-lock-modal-btn"
            onClick={handleClose}
            className="text-[#7A7E78] hover:text-[#2C332B] p-1.5 rounded-lg hover:bg-[#F0F1ED] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Stepper Content */}
        {txStep === 'form' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Token Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-[#7A7E78] font-bold uppercase tracking-wider">Select Asset</label>
                <span className="text-[#7A7E78]">
                  Available: <span className="text-[#2C332B] font-mono-numbers font-bold">{currentToken.userBalance} {currentToken.symbol}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {tokens.map(tok => (
                  <button
                    key={tok.address}
                    type="button"
                    onClick={() => setSelectedTokenAddress(tok.address)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      selectedTokenAddress.toLowerCase() === tok.address.toLowerCase()
                        ? 'bg-[#EDF5ED] border-[#7D8C7B] text-[#2C332B] ring-1 ring-[#7D8C7B]'
                        : 'bg-[#F9F9F7] border-[#E2E1D8] text-[#7A7E78] hover:border-[#7D8C7B]'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#F0F1ED] flex items-center justify-center text-xs font-bold text-[#7D8C7B] border border-[#E2E1D8]">
                      {tok.iconLetter}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold truncate text-[#2C332B]">{tok.symbol}</div>
                      <div className="text-[10px] text-[#7A7E78] truncate">On-chain asset</div>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsAddingCustomToken(value => !value)}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-[#7D8C7B] text-xs font-semibold text-[#558755] hover:bg-[#EDF5ED] transition-colors"
                >
                  + Add custom token
                </button>
              </div>
              {isAddingCustomToken && (
                <div className="mt-2 flex flex-col gap-2 rounded-xl border border-[#E2E1D8] bg-[#F9F9F7] p-3">
                  <label className="text-xs text-[#7A7E78] font-bold uppercase tracking-wider">Token Contract Address</label>
                  <div className="flex gap-2">
                    <input
                      value={customAddress}
                      onChange={event => setCustomAddress(event.target.value)}
                      placeholder="0x..."
                      className="min-w-0 flex-1 bg-white border border-[#E2E1D8] focus:border-[#7D8C7B] rounded-lg px-3 py-2 text-xs font-mono-numbers text-[#2C332B] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleDetectToken}
                      disabled={isDetectingToken || !customAddress.trim() || !wallet.isConnected}
                      className="shrink-0 rounded-lg bg-[#2C332B] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {isDetectingToken ? 'Detecting...' : 'Detect Token'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#7A7E78]">Only ERC-20 tokens on Ethereum Sepolia can be locked by this deployment.</p>
                </div>
              )}
              {currentToken && currentToken.address && (
                <div className="rounded-lg bg-[#EDF5ED] px-3 py-2 text-xs text-[#558755] flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <span className="font-semibold">Token</span><span>{currentToken.name}</span>
                    <span className="font-semibold">Symbol</span><span>{currentToken.symbol}</span>
                    <span className="font-semibold">Decimals</span><span>{currentToken.decimals}</span>
                    <span className="font-semibold">Balance</span><span>{currentToken.userBalance} {currentToken.symbol}</span>
                    <span className="font-semibold">Contract</span><span className="font-mono-numbers break-all">{formatAddress(currentToken.address, 8, 6)}</span>
                  </div>
                  <button type="button" onClick={() => void handleAddTokenToMetaMask()} disabled={isWatchingToken} className="self-start rounded-md border border-[#CDE2CD] bg-white px-2.5 py-1.5 font-semibold text-[#2C332B] disabled:opacity-50">
                    {isWatchingToken ? 'Adding...' : 'Add to MetaMask'}
                  </button>
                </div>
              )}
            </div>

            {/* Lock Amount Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#7A7E78] font-bold uppercase tracking-wider">Deposit Amount</label>
              <div className="relative flex items-center">
                <input
                  id="lock-amount-input"
                  type="number"
                  step="any"
                  min="0.0001"
                  max={currentToken.userBalance}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-[#F9F9F7] border border-[#E2E1D8] focus:border-[#7D8C7B] rounded-xl px-4 py-3 text-base font-mono-numbers text-[#2C332B] placeholder-[#9CA3AF] outline-none pr-28 transition-colors"
                />
                <div className="absolute right-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="text-[11px] font-bold uppercase tracking-wider text-[#7D8C7B] bg-[#EDF5ED] hover:bg-[#D2E8D2] px-2 py-1 rounded-md transition-colors"
                  >
                    MAX
                  </button>
                  <span className="text-xs font-semibold text-[#7A7E78] pr-2">
                    {currentToken.symbol}
                  </span>
                </div>
              </div>
              {numAmount > 0 && (
                <div className="flex justify-between text-xs text-[#7A7E78] px-1 font-mono-numbers">
                  <span>Estimated Value:</span>
                  <span className="text-[#2C332B] font-semibold">
                    {totalUsd === undefined ? 'Unavailable' : `$${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </div>
              )}
            </div>

            {/* Duration Presets */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#7A7E78] font-bold uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#7D8C7B]" /> Lock Duration
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['30d', '90d', '180d', '1y', 'custom'] as const).map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`py-2 rounded-lg text-xs font-semibold uppercase border transition-all ${
                      durationPreset === preset
                        ? 'bg-[#2C332B] text-white border-[#2C332B] shadow-xs'
                        : 'bg-[#F9F9F7] border-[#E2E1D8] text-[#7A7E78] hover:border-[#7D8C7B]'
                    }`}
                  >
                    {preset === '30d' ? '30 Days' : preset === '90d' ? '90 Days' : preset === '180d' ? '180 Days' : preset === '1y' ? '1 Year' : 'Custom'}
                  </button>
                ))}
              </div>

              {durationPreset === 'custom' && (
                <div className="mt-2">
                  <input
                    type="datetime-local"
                    value={customDate}
                    onChange={e => setCustomDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                    className="w-full bg-[#F9F9F7] border border-[#E2E1D8] focus:border-[#7D8C7B] rounded-xl px-3.5 py-2.5 text-xs font-mono-numbers text-[#2C332B] outline-none"
                  />
                </div>
              )}
            </div>

            {/* Summary Box */}
            <div className="bg-[#F9F9F7] border border-[#E2E1D8] rounded-xl p-3.5 flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-[#7A7E78]">
                <span>Unlock Date:</span>
                <span className="text-[#2C332B] font-mono-numbers font-bold">{formattedUnlockDate}</span>
              </div>
              <div className="flex justify-between text-[#7A7E78]">
                <span>Timelock Contract:</span>
                <span className="text-[#7D8C7B] font-mono-numbers font-medium">Immutable Timelock v2.4</span>
              </div>
              <div className="flex justify-between text-[#7A7E78]">
                <span>Estimated Gas:</span>
                <span className="text-[#2C332B] font-mono-numbers">Wallet estimate</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="confirm-create-lock-submit-btn"
              type="submit"
              disabled={isSubmitting || numAmount <= 0}
              className="mt-2 w-full bg-[#2C332B] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              <Lock className="w-4 h-4 text-[#86B086]" />
              <span>Lock {numAmount > 0 ? `${numAmount} ${currentToken.symbol}` : 'Tokens'}</span>
            </button>
          </form>
        )}

        {/* Transaction In-Flight Stages */}
        {(txStep === 'approving' || txStep === 'locking') && (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-[#7D8C7B] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#2C332B]">
                {txStep === 'approving' ? '1/2' : '2/2'}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-[#2C332B]">
                {txStep === 'approving' ? 'Approving Token Allowance...' : 'Broadcasting Timelock Deposit...'}
              </h3>
              <p className="text-xs text-[#7A7E78] max-w-xs">
                {txStep === 'approving'
                  ? `Authorizing the timelock contract to transfer ${numAmount} ${currentToken.symbol}`
                  : `Submitting transaction to ${wallet.network.name}. Waiting for block confirmation...`}
              </p>
            </div>
          </div>
        )}

        {/* Success Screen */}
        {txStep === 'success' && (
          <div className="py-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#EDF5ED] border border-[#CDE2CD] flex items-center justify-center text-[#558755]">
              <Check className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-[#2C332B]">Time-Lock Successfully Created!</h3>
              <p className="text-xs text-[#7A7E78] max-w-sm">
                Your <span className="text-[#2C332B] font-bold">{numAmount} {currentToken.symbol}</span> has been securely locked until{' '}
                <span className="text-[#7D8C7B] font-bold">{formattedUnlockDate}</span>.
              </p>
            </div>

            <div className="w-full bg-[#F9F9F7] border border-[#E2E1D8] rounded-xl p-3 text-xs font-mono-numbers flex flex-col gap-1.5 text-left">
              <div className="flex justify-between text-[#7A7E78]">
                <span>Tx Hash:</span>
                <a
                  href={`${wallet.network.explorerUrl}/tx/${createdTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#7D8C7B] hover:underline flex items-center gap-1 font-semibold"
                >
                  {formatAddress(createdTxHash, 8, 6)} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex justify-between text-[#7A7E78]">
                <span>Status:</span>
                <span className="text-[#558755] font-bold">1 Block Confirmation</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="mt-2 w-full bg-[#2C332B] hover:bg-black text-white font-semibold text-xs py-2.5 rounded-xl transition-colors shadow-xs"
            >
              Done & Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
