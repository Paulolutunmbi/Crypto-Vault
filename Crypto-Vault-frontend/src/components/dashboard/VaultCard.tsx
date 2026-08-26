import React from 'react';
import { Lock, ExternalLink, ChevronRight, Clock } from 'lucide-react';
import { TimeLock } from '../../types/timelock';
import { formatCountdown, calculateProgress, formatAddress, formatTokenAmount } from '../../utils/formatters';
import { useTimelock } from '../../context/TimelockContext';

interface VaultCardProps {
  lock: TimeLock;
}

export const VaultCard: React.FC<VaultCardProps> = ({ lock }) => {
  const { currentTime, setDetailTargetLock } = useTimelock();
  const countdown = formatCountdown(lock.unlocksAtTimestamp, currentTime);
  const progressPercent = calculateProgress(lock.lockedAtTimestamp, lock.unlocksAtTimestamp, currentTime);

  return (
    <div
      id={`vault-card-${lock.id}`}
      onClick={() => setDetailTargetLock(lock)}
      className="glass-card p-6 rounded-xl flex flex-col gap-4 cursor-pointer transition-all group"
    >
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {/* Avatar Icon */}
          <div className="w-10 h-10 rounded-full bg-[#F0F1ED] flex items-center justify-center border border-[#E2E1D8] group-hover:border-[#7D8C7B] transition-colors">
            <span className="font-mono-numbers font-bold text-[#7D8C7B] text-base">
              {lock.tokenSymbol.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2C332B] group-hover:text-[#7D8C7B] transition-colors">
              {lock.tokenName}
            </h3>
            <div className="text-[#7A7E78] text-xs font-mono-numbers mt-0.5 flex items-center gap-1">
              <span>Lock #{lock.id}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="badge-locked px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider flex items-center gap-1">
          <Lock className="w-3 h-3 text-[#7D8C7B]" />
          <span>LOCKED</span>
        </div>
      </div>

      {/* Numerical Stats: Total Locked vs Countdown */}
      <div className="grid grid-cols-2 gap-4 mt-1">
        <div>
          <div className="text-[#7A7E78] text-xs font-medium mb-1">Total Locked</div>
          <div className="font-mono-numbers text-lg font-bold text-[#2C332B]">
            {formatTokenAmount(lock.amount)} {lock.tokenSymbol}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[#7A7E78] text-xs font-medium mb-1">Unlocks In</div>
          <div className="font-mono-numbers text-lg font-bold text-[#7D8C7B] flex items-center justify-end gap-1">
            <Clock className="w-3.5 h-3.5 opacity-75" />
            <span>{countdown.text}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Timestamps */}
      <div className="mt-1">
        <div className="flex justify-between text-xs text-[#7A7E78] mb-1.5 font-mono-numbers">
          <span>Locked: {lock.lockedDateFormatted}</span>
          <span>Unlocks: {lock.unlockDateFormatted}</span>
        </div>
        <div className="w-full h-2 bg-[#F0F1ED] rounded-full overflow-hidden border border-[#E2E1D8]/60">
          <div
            className="h-full bg-[#7D8C7B] rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Hover action hint */}
      <div className="flex items-center justify-between pt-1 text-xs text-[#7A7E78] opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[11px] text-[#7A7E78]">Click for vault contract parameters</span>
        <span className="text-[#7D8C7B] flex items-center gap-0.5 text-xs font-semibold">
          Inspect <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
