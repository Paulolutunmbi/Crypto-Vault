import React from 'react';
import { Plus, Shield, ArrowUpRight } from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';

export const GreetingSection: React.FC = () => {
  const { setIsCreateModalOpen } = useTimelock();

  // Dynamic greeting based on current local time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';

  return (
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#2C332B] tracking-tight">
          {greeting}
        </h1>
        <p className="text-base md:text-lg text-[#7A7E78] max-w-2xl font-normal leading-relaxed">
          Manage your locked tokens and track your upcoming unlocks with institutional-grade precision.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          id="hero-create-timelock-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#2C332B] hover:bg-black text-white font-semibold text-sm px-5 py-2.5 rounded-lg active:scale-95 transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 text-[#86B086]" />
          <span>Create Time-Lock</span>
        </button>
      </div>
    </section>
  );
};
