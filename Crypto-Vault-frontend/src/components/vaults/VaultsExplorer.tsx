import React, { useState } from 'react';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Plus,
  Lock,
  Key,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownUp,
} from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';
import { VaultCard } from '../dashboard/VaultCard';
import { formatAddress, formatTokenAmount, formatCountdown } from '../../utils/formatters';
import { LockStatus, TimeLock } from '../../types/timelock';

export const VaultsExplorer: React.FC = () => {
  const {
    allLocks,
    tokens,
    currentTime,
    setIsCreateModalOpen,
    setDetailTargetLock,
    setWithdrawTargetLock,
  } = useTimelock();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | LockStatus>('ALL');
  const [selectedToken, setSelectedToken] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'unlock' | 'amount' | 'locked'>('unlock');

  // Filtering
  const filteredLocks = allLocks.filter(lock => {
    if (selectedStatus !== 'ALL' && lock.status !== selectedStatus) return false;
    if (selectedToken !== 'ALL' && lock.tokenSymbol !== selectedToken) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSymbol = lock.tokenSymbol.toLowerCase().includes(q);
      const matchName = lock.tokenName.toLowerCase().includes(q);
      const matchAddr = lock.tokenAddress.toLowerCase().includes(q) || lock.owner.toLowerCase().includes(q);
      return matchSymbol || matchName || matchAddr || lock.id.includes(q);
    }
    return true;
  });

  // Sorting
  const sortedLocks = [...filteredLocks].sort((a, b) => {
    if (sortBy === 'unlock') return a.unlocksAtTimestamp - b.unlocksAtTimestamp;
    if (sortBy === 'amount') return b.amountUsd - a.amountUsd;
    if (sortBy === 'locked') return b.lockedAtTimestamp - a.lockedAtTimestamp;
    return 0;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header with Title & Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#2C332B]">
            Timelock Vault Explorer
          </h1>
          <p className="text-sm text-[#7A7E78] mt-0.5">
            Explore, inspect, and manage all active, mature, and historical vaults.
          </p>
        </div>

        <button
          id="vaults-create-lock-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#2C332B] hover:bg-black text-white font-medium text-xs px-4 py-2.5 rounded-lg active:scale-95 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#86B086]" />
          <span>New Time-Lock</span>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by asset, address, or memo..."
            className="w-full bg-[#F9F9F7] border border-[#E2E1D8] focus:border-[#7D8C7B] rounded-lg pl-9 pr-3 py-2 text-xs text-[#2C332B] placeholder-[#9CA3AF] outline-none"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center rounded-lg bg-[#F9F9F7] border border-[#E2E1D8] p-0.5">
            {(['ALL', 'LOCKED', 'READY', 'WITHDRAWN'] as const).map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  selectedStatus === status
                    ? 'bg-[#2C332B] text-white shadow-xs'
                    : 'text-[#7A7E78] hover:text-[#2C332B]'
                }`}
              >
                {status === 'ALL' ? 'All' : status === 'LOCKED' ? 'Active' : status === 'READY' ? 'Ready' : 'Completed'}
              </button>
            ))}
          </div>

          {/* Token Filter */}
          <select
            value={selectedToken}
            onChange={e => setSelectedToken(e.target.value)}
            className="bg-[#F9F9F7] border border-[#E2E1D8] text-[#2C332B] text-xs font-medium rounded-lg px-3 py-2 outline-none focus:border-[#7D8C7B]"
          >
            <option value="ALL">All Tokens</option>
            {tokens.map(t => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-[#F9F9F7] border border-[#E2E1D8] text-[#2C332B] text-xs font-medium rounded-lg px-3 py-2 outline-none focus:border-[#7D8C7B]"
          >
            <option value="unlock">Sort: Unlock Date</option>
            <option value="amount">Sort: Value (High to Low)</option>
            <option value="locked">Sort: Lock Date</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-lg bg-[#F9F9F7] border border-[#E2E1D8] p-0.5 ml-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-[#2C332B] text-white shadow-xs' : 'text-[#7A7E78] hover:text-[#2C332B]'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#2C332B] text-white shadow-xs' : 'text-[#7A7E78] hover:text-[#2C332B]'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering: Grid vs Table */}
      {sortedLocks.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl flex flex-col items-center gap-2">
          <p className="text-sm text-[#7A7E78]">No vaults found matching the selected filters.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedLocks.map(lock => (
            <VaultCard key={lock.id} lock={lock} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E2E1D8] bg-white shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E1D8] text-[#7A7E78] text-xs uppercase font-semibold bg-[#F9F9F7]">
                <th className="py-3.5 px-4">Asset & Vault</th>
                <th className="py-3.5 px-4">Locked Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Unlocks In / On</th>
                <th className="py-3.5 px-4">Owner</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="font-mono-numbers text-xs divide-y divide-[#F0F1ED]">
              {sortedLocks.map(lock => {
                const countdown = formatCountdown(lock.unlocksAtTimestamp, currentTime);
                return (
                  <tr
                    key={lock.id}
                    onClick={() => setDetailTargetLock(lock)}
                    className="hover:bg-[#FDFCFB] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#F0F1ED] flex items-center justify-center text-xs font-bold text-[#7D8C7B] border border-[#E2E1D8]">
                          {lock.tokenSymbol.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#2C332B] text-xs">{lock.tokenName}</div>
                          <div className="text-[11px] text-[#7A7E78] font-normal font-body">
                            Lock #{lock.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#2C332B] font-semibold">
                      <div>{formatTokenAmount(lock.amount)} {lock.tokenSymbol}</div>
                      <div className="text-[11px] text-[#7A7E78] font-normal font-body">
                        On-chain balance
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {lock.status === 'LOCKED' && (
                        <span className="badge-locked px-2 py-0.5 rounded-md text-[11px] font-bold">LOCKED</span>
                      )}
                      {lock.status === 'READY' && (
                        <span className="badge-ready px-2 py-0.5 rounded-md text-[11px] font-bold">READY</span>
                      )}
                      {lock.status === 'WITHDRAWN' && (
                        <span className="badge-completed px-2 py-0.5 rounded-md text-[11px] font-bold">WITHDRAWN</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {lock.status === 'LOCKED' ? (
                        <div className="text-[#7D8C7B] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{countdown.text}</span>
                        </div>
                      ) : (
                        <span className="text-[#7A7E78]">{lock.unlockDateFormatted}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#7A7E78]">
                      {formatAddress(lock.owner, 6, 4)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {lock.status === 'READY' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWithdrawTargetLock(lock);
                          }}
                          className="bg-[#7D8C7B] hover:bg-[#687666] text-white text-xs px-2.5 py-1 rounded-md font-semibold transition-colors shadow-xs"
                        >
                          Withdraw
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailTargetLock(lock);
                          }}
                          className="text-[#7D8C7B] hover:text-[#2C332B] text-xs font-semibold hover:underline"
                        >
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
