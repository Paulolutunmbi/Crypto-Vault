import React, { useState } from 'react';
import { X, Key, Check, Loader2, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';
import { formatAddress, formatTokenAmount } from '../../utils/formatters';

export const WithdrawModal: React.FC = () => {
  const {
    withdrawTargetLock,
    setWithdrawTargetLock,
    withdrawLock,
    wallet,
  } = useTimelock();

  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'confirm' | 'withdrawing' | 'success'>('confirm');
  const [txHash, setTxHash] = useState('');

  if (!withdrawTargetLock) return null;

  const handleConfirmWithdraw = async () => {
    try {
      setIsProcessing(true);
      setStep('withdrawing');
      
      // Simulate Web3 transaction delay
      await new Promise(r => setTimeout(r, 1500));
      
      await withdrawLock(withdrawTargetLock.id);
      
      const mockHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setTxHash(mockHash);
      setStep('success');
    } catch (err) {
      console.error(err);
      setStep('confirm');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setWithdrawTargetLock(null);
    setStep('confirm');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#E2E1D8] shadow-2xl p-6 z-10 flex flex-col gap-5 text-[#3A3D39]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#E2E1D8] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EDF5ED] border border-[#CDE2CD] flex items-center justify-center text-[#558755]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#2C332B]">Withdraw Mature Tokens</h2>
              <p className="text-xs text-[#7A7E78]">Transfer unlocked assets directly to your wallet</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-[#7A7E78] hover:text-[#2C332B] p-1.5 rounded-lg hover:bg-[#F0F1ED] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="flex flex-col gap-4">
            {/* Asset Details Box */}
            <div className="p-4 rounded-xl bg-[#F9F9F7] border border-[#E2E1D8] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#7A7E78] font-bold uppercase tracking-wider">Withdrawable Amount</span>
                <span className="badge-ready px-2.5 py-0.5 rounded-md text-[11px] font-bold">READY</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-numbers text-2xl font-bold text-[#2C332B]">
                  {formatTokenAmount(withdrawTargetLock.amount)}
                </span>
                <span className="text-sm font-bold text-[#7D8C7B]">
                  {withdrawTargetLock.tokenSymbol}
                </span>
              </div>
              <div className="text-xs text-[#7A7E78]">
                Est. Value: ${(withdrawTargetLock.amountUsd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Destination & Security Details */}
            <div className="flex flex-col gap-2 text-xs font-mono-numbers bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E2E1D8]">
              <div className="flex justify-between">
                <span className="text-[#7A7E78]">Beneficiary Address:</span>
                <span className="text-[#2C332B] font-semibold">{formatAddress(withdrawTargetLock.beneficiary || wallet.address, 6, 4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A7E78]">Vault Contract:</span>
                <span className="text-[#2C332B] font-semibold">{formatAddress(withdrawTargetLock.vaultAddress, 6, 4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A7E78]">Network Fee (Gas):</span>
                <span className="text-[#558755] font-semibold">~0.0009 ETH ($2.84)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#558755] bg-[#EDF5ED] p-3 rounded-xl border border-[#CDE2CD]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Timelock has matured. Assets will release instantly to your non-custodial address.</span>
            </div>

            {/* Action Button */}
            <button
              id="confirm-withdraw-submit-btn"
              onClick={handleConfirmWithdraw}
              disabled={isProcessing}
              className="mt-2 w-full bg-[#2C332B] hover:bg-black text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              <span>Execute Withdrawal</span>
              <ArrowRight className="w-4 h-4 text-[#86B086]" />
            </button>
          </div>
        )}

        {/* Step: Withdrawing in progress */}
        {step === 'withdrawing' && (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-4">
            <Loader2 className="w-12 h-12 text-[#7D8C7B] animate-spin" />
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-[#2C332B]">Broadcasting Withdrawal...</h3>
              <p className="text-xs text-[#7A7E78] max-w-xs">
                Executing smart contract release on {wallet.network.name}. Please confirm the prompt in your wallet.
              </p>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#EDF5ED] border border-[#CDE2CD] flex items-center justify-center text-[#558755]">
              <Check className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-[#2C332B]">Withdrawal Complete!</h3>
              <p className="text-xs text-[#7A7E78]">
                Transferred <span className="text-[#2C332B] font-bold">{formatTokenAmount(withdrawTargetLock.amount)} {withdrawTargetLock.tokenSymbol}</span> to your wallet.
              </p>
            </div>

            <div className="w-full bg-[#F9F9F7] border border-[#E2E1D8] rounded-xl p-3 text-xs font-mono-numbers flex flex-col gap-1 text-left">
              <div className="flex justify-between text-[#7A7E78]">
                <span>Tx Hash:</span>
                <span className="text-[#7D8C7B] font-bold">{formatAddress(txHash, 8, 6)}</span>
              </div>
              <div className="flex justify-between text-[#7A7E78]">
                <span>Status:</span>
                <span className="text-[#558755] font-bold">Confirmed</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="mt-2 w-full bg-[#2C332B] hover:bg-black text-white font-semibold text-xs py-2.5 rounded-xl transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
