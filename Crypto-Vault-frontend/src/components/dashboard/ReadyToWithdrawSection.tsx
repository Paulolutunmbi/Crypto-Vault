import React from 'react';
import { Key, ArrowUpRight } from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';
import { formatTokenAmount } from '../../utils/formatters';
import { TimeLock } from '../../types/timelock';

export const ReadyToWithdrawSection: React.FC = () => {
  const { readyLocks, setWithdrawTargetLock, setDetailTargetLock } = useTimelock();

  const handleWithdrawClick = (e: React.MouseEvent, lock: TimeLock) => {
    e.stopPropagation();
    setWithdrawTargetLock(lock);
  };

  return (
    <section className="flex flex-col gap-4 mt-4 mb-10 w-full">
      {/* Section Title with Sage Count Badge */}
      <div className="flex items-end border-b border-[#E2E1D8] pb-3">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#2C332B] flex items-center gap-2">
          <span>Ready to Withdraw</span>
          <span
            id="ready-withdraw-badge-count"
            className="bg-[#EDF5ED] text-[#558755] border border-[#CDE2CD] text-xs font-bold px-2.5 py-0.5 rounded-full ml-1"
          >
            {readyLocks.length}
          </span>
        </h2>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-[#E2E1D8] bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E1D8] text-[#7A7E78] text-xs font-semibold uppercase tracking-wider bg-[#F9F9F7]">
              <th className="py-3.5 px-4 font-semibold">Asset</th>
              <th className="py-3.5 px-4 font-semibold">Amount</th>
              <th className="py-3.5 px-4 font-semibold">Unlocked On</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="font-mono-numbers text-xs divide-y divide-[#F0F1ED]">
            {readyLocks.length > 0 ? (
              readyLocks.map(lock => (
                <tr
                  key={lock.id}
                  id={`ready-row-${lock.id}`}
                  onClick={() => setDetailTargetLock(lock)}
                  className="hover:bg-[#FDFCFB] transition-colors cursor-pointer group"
                >
                  {/* Asset */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#F0F1ED] flex items-center justify-center text-xs font-bold text-[#7D8C7B] border border-[#E2E1D8]">
                        {lock.tokenSymbol.charAt(0)}
                      </div>
                      <div>
                        <span className="text-[#2C332B] font-bold block text-xs">
                          {lock.tokenSymbol}
                        </span>
                        <span className="text-[11px] text-[#7A7E78] font-normal block font-body">
                          Lock #{lock.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-4 text-[#2C332B] font-semibold">
                    <div>{formatTokenAmount(lock.amount)} {lock.tokenSymbol}</div>
                    <div className="text-[11px] text-[#7A7E78] font-normal font-body">
                      On-chain balance
                    </div>
                  </td>

                  {/* Unlocked On */}
                  <td className="py-4 px-4 text-[#7A7E78]">
                    {lock.unlockDateFormatted}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <span className="badge-ready px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider inline-flex items-center gap-1">
                      READY
                    </span>
                  </td>

                  {/* Action Button */}
                  <td className="py-4 px-4 text-right">
                    <button
                      id={`withdraw-btn-${lock.id}`}
                      onClick={(e) => handleWithdrawClick(e, lock)}
                      className="bg-[#7D8C7B] hover:bg-[#687666] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all active:scale-95 inline-flex items-center gap-1 shadow-xs"
                    >
                      <span>Withdraw</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-[#7A7E78] font-body">
                  No assets currently ready for withdrawal. Check upcoming locks above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
