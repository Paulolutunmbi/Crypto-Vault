import React from 'react';
import { X, Settings, Globe, Droplets, Check, Shield, Zap } from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';
import { SUPPORTED_NETWORKS } from '../../data/mockData';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    wallet,
    switchNetwork,
    requestFaucet,
    tokens,
  } = useTimelock();

  if (!isSettingsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsSettingsModalOpen(false)}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#E2E1D8] shadow-2xl p-6 z-10 flex flex-col gap-5 text-[#3A3D39]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E1D8] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F0F1ED] border border-[#E2E1D8] flex items-center justify-center text-[#7D8C7B]">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#2C332B]">Vault & Network Settings</h2>
              <p className="text-xs text-[#7A7E78]">Configure chain connection & mock dev parameters</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="text-[#7A7E78] hover:text-[#2C332B] p-1.5 rounded-lg hover:bg-[#F0F1ED] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Network Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#7A7E78] uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#7D8C7B]" /> Select Network
          </label>
          <div className="flex flex-col gap-1.5">
            {SUPPORTED_NETWORKS.map(net => {
              const isSelected = wallet.network.id === net.id;
              return (
                <button
                  key={net.id}
                  onClick={() => switchNetwork(net)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-[#EDF5ED] border-[#7D8C7B] text-[#2C332B] ring-1 ring-[#7D8C7B]'
                      : 'bg-[#F9F9F7] border-[#E2E1D8] text-[#7A7E78] hover:border-[#7D8C7B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{net.icon}</span>
                    <div className="text-left">
                      <div className="text-[#2C332B] font-bold">{net.name}</div>
                      <div className="text-[10px] text-[#7A7E78]">Chain ID: {net.chainId}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#558755]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Faucet / Test Tokens Section */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#E2E1D8]">
          <label className="text-xs font-bold text-[#7A7E78] uppercase tracking-wider flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-[#7D8C7B]" /> Mock Testnet Faucet
          </label>
          <p className="text-[11px] text-[#7A7E78]">
            Need extra tokens to test creating time-locks? Mint test assets to your wallet balance instantly.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {tokens.slice(0, 3).map(tok => (
              <button
                key={tok.symbol}
                onClick={() => requestFaucet(tok.symbol)}
                className="bg-[#F9F9F7] hover:bg-[#F0F1ED] border border-[#E2E1D8] hover:border-[#7D8C7B] text-[#2C332B] text-xs font-semibold py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 shadow-xs"
              >
                <span>+ Faucet {tok.symbol}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsSettingsModalOpen(false)}
          className="mt-2 w-full bg-[#2C332B] hover:bg-black text-white text-xs font-semibold py-2.5 rounded-xl transition-colors shadow-xs"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
};
