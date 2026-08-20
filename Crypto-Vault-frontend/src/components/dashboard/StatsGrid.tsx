import React from 'react';
import { Landmark, Lock, Key, CheckCircle2, TrendingUp } from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';
import { formatUsdCompact } from '../../utils/formatters';

export const StatsGrid: React.FC = () => {
  const { stats, readyLocks } = useTimelock();

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* Stat Card 1: Total Locked */}
      <div
        id="stat-card-total-locked"
        className="stat-card p-5 md:p-6 rounded-xl flex flex-col gap-2 relative overflow-hidden group"
      >
        <div className="flex items-center gap-2 text-[#7A7E78] text-xs uppercase tracking-wider font-semibold">
          <Landmark className="w-4 h-4 text-[#7D8C7B]" />
          <span>Total Locked</span>
        </div>
        <div className="font-mono-numbers text-3xl font-bold text-[#2C332B] mt-1 tracking-tight">
          {formatUsdCompact(stats.totalLockedUsd)}
        </div>
        <div className="text-[#558755] text-xs font-semibold mt-auto flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+{stats.totalLockedChangeWeek}% this week</span>
        </div>
      </div>

      {/* Stat Card 2: Active Locks */}
      <div
        id="stat-card-active-locks"
        className="stat-card p-5 md:p-6 rounded-xl flex flex-col gap-2 group"
      >
        <div className="flex items-center gap-2 text-[#7A7E78] text-xs uppercase tracking-wider font-semibold">
          <Lock className="w-4 h-4 text-[#7D8C7B]" />
          <span>Active Locks</span>
        </div>
        <div className="font-mono-numbers text-3xl font-bold text-[#2C332B] mt-1">
          {stats.activeLocksCount}
        </div>
        <div className="text-[#7A7E78] text-xs font-medium mt-auto">
          Across {stats.assetsCount} assets
        </div>
      </div>

      {/* Stat Card 3: Ready to Withdraw */}
      <div
        id="stat-card-ready-withdraw"
        className="stat-card p-5 md:p-6 rounded-xl flex flex-col gap-2 group hover:border-[#86B086]"
      >
        <div className="flex items-center gap-2 text-[#7A7E78] text-xs uppercase tracking-wider font-semibold">
          <Key className="w-4 h-4 text-[#558755]" />
          <span>Ready to Withdraw</span>
        </div>
        <div className="font-mono-numbers text-3xl font-bold text-[#558755] mt-1">
          {formatUsdCompact(stats.readyToWithdrawUsd)}
        </div>
        <div className="text-[#558755] text-xs font-semibold mt-auto flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#86B086]" />
          <span>{readyLocks.length} {readyLocks.length === 1 ? 'vault ready' : 'vaults ready'}</span>
        </div>
      </div>

      {/* Stat Card 4: Completed Locks */}
      <div
        id="stat-card-completed-locks"
        className="stat-card p-5 md:p-6 rounded-xl flex flex-col gap-2 group"
      >
        <div className="flex items-center gap-2 text-[#7A7E78] text-xs uppercase tracking-wider font-semibold">
          <CheckCircle2 className="w-4 h-4 text-[#7D8C7B]" />
          <span>Completed Locks</span>
        </div>
        <div className="font-mono-numbers text-3xl font-bold text-[#2C332B] mt-1">
          {stats.completedLocksCount}
        </div>
        <div className="text-[#7A7E78] text-xs font-medium mt-auto">
          Historical records
        </div>
      </div>
    </section>
  );
};
