import React, { useState } from 'react';
import {
  X,
  Lock,
  Key,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Clock,
  Shield,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';
import { formatAddress, formatCountdown, calculateProgress, formatTokenAmount } from '../../utils/formatters';

export const LockDetailModal: React.FC = () => {
  const {
    detailTargetLock,
    setDetailTargetLock,
    setWithdrawTargetLock,
    extendLock,
    currentTime,
    wallet,
    addToast,
  } = useTimelock();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isExtending, setIsExtending] = useState(false);
  const [extendDays, setExtendDays] = useState(30);

  if (!detailTargetLock) return null;

  const countdown = formatCountdown(detailTargetLock.unlocksAtTimestamp, currentTime);
  const progressPercent = calculateProgress(
    detailTargetLock.lockedAtTimestamp,
    detailTargetLock.unlocksAtTimestamp,
    currentTime
  );

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: `${fieldName} copied`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExtendSubmit = async () => {
    const additionalMs = extendDays * 24 * 60 * 60 * 1000;
    await extendLock(detailTargetLock.id, additionalMs);
    setIsExtending(false);
  };

  const handleClose = () => {
    setDetailTargetLock(null);
    setIsExtending(false);
  };

  const isLocked = detailTargetLock.status === 'LOCKED';
  const isReady = detailTargetLock.status === 'READY';
  const isWithdrawn = detailTargetLock.status === 'WITHDRAWN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-[#E2E1D8] shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto flex flex-col gap-5 text-[#3A3D39]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E1D8] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F0F1ED] flex items-center justify-center border border-[#E2E1D8]">
              <span className="font-mono-numbers font-bold text-[#7D8C7B] text-lg">
                {detailTargetLock.tokenSymbol.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-[#2C332B]">
                  {detailTargetLock.tokenName}
                </h2>
                {isLocked && <span className="badge-locked px-2 py-0.5 rounded-md text-[11px] font-bold">LOCKED</span>}
                {isReady && <span className="badge-ready px-2 py-0.5 rounded-md text-[11px] font-bold">READY</span>}
                {isWithdrawn && <span className="badge-completed px-2 py-0.5 rounded-md text-[11px] font-bold">WITHDRAWN</span>}
              </div>
              <p className="text-xs text-[#7A7E78] font-mono-numbers mt-0.5">
                Vault ID: {detailTargetLock.id}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-[#7A7E78] hover:text-[#2C332B] p-1.5 rounded-lg hover:bg-[#F0F1ED] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lock Value & Countdown Highlight */}
        <div className="bg-[#F9F9F7] border border-[#E2E1D8] rounded-xl p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-[#7A7E78] font-semibold uppercase tracking-wider">Total Locked</span>
              <div className="font-mono-numbers text-xl font-bold text-[#2C332B] mt-0.5">
                {formatTokenAmount(detailTargetLock.amount)} {detailTargetLock.tokenSymbol}
              </div>
              <div className="text-xs text-[#7A7E78]">
                ≈ ${(detailTargetLock.amountUsd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#7A7E78] font-semibold uppercase tracking-wider">
                {isLocked ? 'Remaining Time' : isReady ? 'Status' : 'Withdrawal Completed'}
              </span>
              <div
                className={`font-mono-numbers text-xl font-bold mt-0.5 ${
                  isLocked ? 'text-[#7D8C7B]' : isReady ? 'text-[#558755]' : 'text-[#7A7E78]'
                }`}
              >
                {isLocked ? countdown.text : isReady ? 'Unlocked & Ready' : 'Withdrawn'}
              </div>
              <div className="text-xs text-[#7A7E78]">
                {isLocked ? `Unlocks on ${detailTargetLock.unlockDateFormatted}` : detailTargetLock.unlockDateFormatted}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="pt-2 border-t border-[#E2E1D8]">
            <div className="flex justify-between text-xs text-[#7A7E78] mb-1.5 font-mono-numbers">
              <span>Deposit: {detailTargetLock.lockedDateFormatted}</span>
              <span>{progressPercent}% Elapsed</span>
            </div>
            <div className="w-full h-2 bg-[#E2E1D8] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isReady ? 'bg-[#558755]' : 'bg-[#7D8C7B]'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Technical Smart Contract Parameters */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-[#7A7E78] uppercase tracking-wider">
            Smart Contract Parameters
          </h3>
          <div className="bg-[#F9F9F7] border border-[#E2E1D8] rounded-xl divide-y divide-[#E2E1D8] text-xs font-mono-numbers">
            {/* Vault Address */}
            <div className="p-3 flex items-center justify-between">
              <span className="text-[#7A7E78]">Vault Contract:</span>
              <div className="flex items-center gap-1.5 text-[#2C332B]">
                <span className="font-semibold">{formatAddress(detailTargetLock.vaultAddress, 8, 6)}</span>
                <button
                  onClick={() => handleCopy(detailTargetLock.vaultAddress, 'Vault Address')}
                  className="text-[#7A7E78] hover:text-[#2C332B] p-0.5"
                >
                  {copiedField === 'Vault Address' ? <Check className="w-3.5 h-3.5 text-[#558755]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Beneficiary */}
            <div className="p-3 flex items-center justify-between">
              <span className="text-[#7A7E78]">Beneficiary:</span>
              <div className="flex items-center gap-1.5 text-[#2C332B]">
                <span className="font-semibold">{formatAddress(detailTargetLock.beneficiary, 8, 6)}</span>
                <button
                  onClick={() => handleCopy(detailTargetLock.beneficiary, 'Beneficiary')}
                  className="text-[#7A7E78] hover:text-[#2C332B] p-0.5"
                >
                  {copiedField === 'Beneficiary' ? <Check className="w-3.5 h-3.5 text-[#558755]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Transaction Hash */}
            <div className="p-3 flex items-center justify-between">
              <span className="text-[#7A7E78]">Creation Tx:</span>
              <a
                href={`${wallet.network.explorerUrl}/tx/${detailTargetLock.transactionHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#7D8C7B] hover:underline font-semibold"
              >
                <span>{formatAddress(detailTargetLock.transactionHash, 6, 4)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Block Number */}
            <div className="p-3 flex items-center justify-between">
              <span className="text-[#7A7E78]">Block Number:</span>
              <span className="text-[#2C332B] font-semibold">#{detailTargetLock.blockNumber}</span>
            </div>

            {/* Memo */}
            {detailTargetLock.memo && (
              <div className="p-3 flex items-center justify-between">
                <span className="text-[#7A7E78]">Schedule Memo:</span>
                <span className="text-[#2C332B] font-body">{detailTargetLock.memo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Security & Audit Assurance */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#EDF5ED] border border-[#CDE2CD] text-xs">
          <div className="flex items-center gap-2 text-[#558755]">
            <Shield className="w-4 h-4" />
            <span className="font-bold">OpenZeppelin Timelock Security Verified</span>
          </div>
          <span className="text-[#7A7E78] font-medium">Non-Custodial</span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#E2E1D8]">
          {isReady && (
            <button
              onClick={() => {
                setDetailTargetLock(null);
                setWithdrawTargetLock(detailTargetLock);
              }}
              className="w-full bg-[#2C332B] hover:bg-black text-white font-bold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Key className="w-4 h-4 text-[#86B086]" />
              <span>Withdraw {formatTokenAmount(detailTargetLock.amount)} {detailTargetLock.tokenSymbol} Now</span>
            </button>
          )}

          {isLocked && !isExtending && (
            <button
              onClick={() => setIsExtending(true)}
              className="w-full bg-[#F0F1ED] hover:bg-[#E2E1D8] text-[#2C332B] border border-[#E2E1D8] font-semibold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-[#7D8C7B]" />
              <span>Extend Timelock Duration</span>
            </button>
          )}

          {isExtending && (
            <div className="p-3.5 rounded-xl bg-[#F9F9F7] border border-[#E2E1D8] flex flex-col gap-3">
              <span className="text-xs font-bold text-[#2C332B]">Add Extension Period</span>
              <div className="grid grid-cols-3 gap-2">
                {[30, 90, 180].map(days => (
                  <button
                    key={days}
                    onClick={() => setExtendDays(days)}
                    className={`py-1.5 rounded-lg text-xs font-mono-numbers border transition-all ${
                      extendDays === days
                        ? 'bg-[#2C332B] text-white border-[#2C332B] shadow-xs'
                        : 'bg-white border-[#E2E1D8] text-[#7A7E78] hover:border-[#7D8C7B]'
                    }`}
                  >
                    +{days} Days
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleExtendSubmit}
                  className="flex-1 bg-[#2C332B] hover:bg-black text-white text-xs font-semibold py-2 rounded-lg transition-colors shadow-xs"
                >
                  Confirm Extension (+{extendDays}d)
                </button>
                <button
                  onClick={() => setIsExtending(false)}
                  className="px-3 bg-[#F0F1ED] text-[#7A7E78] hover:text-[#2C332B] text-xs rounded-lg transition-colors border border-[#E2E1D8]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
