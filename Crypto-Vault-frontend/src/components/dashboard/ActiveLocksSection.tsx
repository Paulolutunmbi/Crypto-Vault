import React from 'react';
import { Plus, ArrowRight, Lock } from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';
import { VaultCard } from './VaultCard';

export const ActiveLocksSection: React.FC = () => {
  const { activeLocks, setActiveTab, setIsCreateModalOpen } = useTimelock();

  return (
    <section className="flex flex-col gap-5 mt-2 w-full">
      {/* Section Header */}
      <div className="flex justify-between items-end border-b border-[#E2E1D8] pb-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#2C332B]">Active Locks</h2>
          <span className="text-xs font-mono-numbers px-2.5 py-0.5 rounded-full bg-[#F0F1ED] text-[#7A7E78] border border-[#E2E1D8]">
            {activeLocks.length} Active
          </span>
        </div>
        <button
          id="view-all-active-locks-btn"
          onClick={() => setActiveTab('vaults')}
          className="text-[#7D8C7B] hover:text-[#2C332B] text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1 group"
        >
          <span>View All Vaults</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid of Active Vaults */}
      {activeLocks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeLocks.map(lock => (
            <VaultCard key={lock.id} lock={lock} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 rounded-xl text-center flex flex-col items-center justify-center gap-3 border-dashed border-[#E2E1D8]">
          <div className="w-12 h-12 rounded-full bg-[#F0F1ED] flex items-center justify-center text-[#7D8C7B]">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-base font-bold text-[#2C332B]">No Active Time-Locks</div>
          <p className="text-xs text-[#7A7E78] max-w-md">
            Lock tokens into immutable on-chain vaults with customizable timelock expiration schedules.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-2 bg-[#2C332B] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#86B086]" /> Create Time-Lock
          </button>
        </div>
      )}
    </section>
  );
};
