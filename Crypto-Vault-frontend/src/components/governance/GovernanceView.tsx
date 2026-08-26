import React from 'react';
import { Shield, Clock, CheckCircle2, AlertTriangle, ExternalLink, Vote, ArrowRight } from 'lucide-react';
import { formatAddress } from '../../utils/formatters';
import { useTimelock } from '../../context/TimelockContext';

export const GovernanceView: React.FC = () => {
  const { wallet, addToast } = useTimelock();
  const GOVERNANCE_PROPOSALS = [];

  const handleVote = (propId: string, choice: 'FOR' | 'AGAINST') => {
    addToast({
      type: 'success',
      title: 'Vote Cast via Timelock',
      message: `Successfully voted ${choice} on ${propId}`,
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#2C332B]">
            Timelock Governance & Delay Controls
          </h1>
          <p className="text-sm text-[#7A7E78] mt-0.5">
            All protocol upgrades and parameter alterations are subject to mandatory on-chain timelock delays.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[#E2E1D8] px-3.5 py-2 rounded-xl text-xs shadow-xs">
          <Clock className="w-4 h-4 text-[#7D8C7B]" />
          <span className="text-[#7A7E78]">Default Security Delay:</span>
          <span className="font-bold text-[#2C332B] font-mono-numbers">48 Hours</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-xl flex flex-col gap-1.5 shadow-xs">
          <div className="text-xs text-[#7A7E78] font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[#7D8C7B]" />
            <span>Timelock MultiSig Controller</span>
          </div>
          <div className="font-mono-numbers text-xl font-bold text-[#2C332B] mt-1">Not configured</div>
          <div className="text-xs text-[#7A7E78]">No governance contract is deployed for this frontend.</div>
        </div>

        <div className="glass-card p-5 rounded-xl flex flex-col gap-1.5 shadow-xs">
          <div className="text-xs text-[#7A7E78] font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#7D8C7B]" />
            <span>Queued Actions</span>
          </div>
          <div className="font-mono-numbers text-xl font-bold text-[#7D8C7B] mt-1">0 Proposals</div>
          <div className="text-xs text-[#7A7E78]">No governance data available.</div>
        </div>

        <div className="glass-card p-5 rounded-xl flex flex-col gap-1.5 shadow-xs">
          <div className="text-xs text-[#7A7E78] font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#86B086]" />
            <span>Executed Historic Upgrades</span>
          </div>
          <div className="font-mono-numbers text-xl font-bold text-[#2C332B] mt-1">0 Transactions</div>
          <div className="text-xs text-[#7A7E78]">No governance data available.</div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="flex flex-col gap-4 mt-2">
        <h2 className="font-display text-xl font-bold text-[#2C332B]">
          On-Chain Timelock Queue
        </h2>

        <div className="flex flex-col gap-4">
          {GOVERNANCE_PROPOSALS.map(prop => (
            <div
              key={prop.id}
              className="glass-card p-6 rounded-xl flex flex-col gap-4 border border-[#E2E1D8] hover:border-[#7D8C7B] shadow-xs"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono-numbers text-xs font-bold px-2 py-1 rounded-md bg-[#F0F1ED] text-[#2C332B] border border-[#E2E1D8]">
                    {prop.id}
                  </span>
                  <h3 className="text-base font-bold text-[#2C332B]">{prop.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {prop.status === 'QUEUED' && (
                    <span className="badge-locked px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#7D8C7B]" /> QUEUED (48h DELAY)
                    </span>
                  )}
                  {prop.status === 'EXECUTABLE' && (
                    <span className="badge-ready px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#558755]" /> EXECUTABLE NOW
                    </span>
                  )}
                  {prop.status === 'EXECUTED' && (
                    <span className="badge-completed px-2.5 py-1 rounded-md text-xs font-bold">
                      EXECUTED
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-[#3A3D39] leading-relaxed">{prop.description}</p>

              {/* Parameters Box */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E2E1D8] text-xs font-mono-numbers">
                <div>
                  <div className="text-[#7A7E78]">Timelock Delay</div>
                  <div className="text-[#2C332B] font-semibold mt-0.5">{prop.timelockDelay}</div>
                </div>
                <div>
                  <div className="text-[#7A7E78]">Execution ETA</div>
                  <div className="text-[#7D8C7B] font-semibold mt-0.5">{prop.eta}</div>
                </div>
                <div>
                  <div className="text-[#7A7E78]">Target Contract</div>
                  <div className="text-[#2C332B] font-semibold mt-0.5">{prop.targetContract}</div>
                </div>
                <div>
                  <div className="text-[#7A7E78]">Proposer</div>
                  <div className="text-[#2C332B] font-semibold mt-0.5">{prop.proposer}</div>
                </div>
              </div>

              {/* Votes & Actions */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-2 border-t border-[#E2E1D8]">
                <div className="text-xs flex items-center gap-4 text-[#7A7E78]">
                  <span>For: <strong className="text-[#558755]">{prop.forVotes}</strong></span>
                  <span>Against: <strong className="text-[#7A7E78]">{prop.againstVotes}</strong></span>
                </div>

                {prop.status === 'QUEUED' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(prop.id, 'FOR')}
                      className="bg-[#EDF5ED] hover:bg-[#D2E8D2] text-[#558755] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-[#CDE2CD]"
                    >
                      Vote For
                    </button>
                    <button
                      onClick={() => handleVote(prop.id, 'AGAINST')}
                      className="bg-[#F0F1ED] hover:bg-[#E2E1D8] text-[#7A7E78] hover:text-[#2C332B] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-[#E2E1D8]"
                    >
                      Vote Against
                    </button>
                  </div>
                )}

                {prop.status === 'EXECUTABLE' && (
                  <button
                    onClick={() => addToast({ type: 'success', title: 'Execution Triggered', message: `Executing transaction ${prop.id}` })}
                    className="bg-[#2C332B] hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 shadow-xs"
                  >
                    Execute Queued Call
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
