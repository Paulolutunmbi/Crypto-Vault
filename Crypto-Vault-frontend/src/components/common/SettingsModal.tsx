import React from 'react';
import { X, Settings, Globe, Check } from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';
import { SEPOLIA_NETWORK } from '../../config/contracts';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    wallet,
    switchNetwork,
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
              <p className="text-xs text-[#7A7E78]">Connect to the deployed Sepolia contracts</p>
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
            {[SEPOLIA_NETWORK].map(net => {
              const isSelected = wallet.network.id === net.id;
              return (
                <button
                  key={net.id}
                  onClick={() => void switchNetwork(net)}
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
