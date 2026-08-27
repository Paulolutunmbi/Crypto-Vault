import React from 'react';
import { X, Settings, Globe, Check, Bell, Volume2, Download, Smartphone } from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';
import { SEPOLIA_NETWORK } from '../../config/contracts';
import { useInstallPrompt } from '../../utils/installPrompt';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    wallet,
    switchNetwork,
    notificationsEnabled,
    notificationSoundEnabled,
    setNotificationsEnabled,
    setNotificationSoundEnabled,
  } = useTimelock();
  const { canInstall, isInstalled, install, isIos, isUnavailable, installRequested } = useInstallPrompt();

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

        <div className="flex flex-col gap-3 border-t border-[#E2E1D8] pt-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#2C332B]">
            <span className="flex items-center gap-2"><Bell className="w-4 h-4 text-[#7D8C7B]" /> Notifications</span>
            <button aria-pressed={notificationsEnabled} onClick={() => setNotificationsEnabled(!notificationsEnabled)} className={`px-3 py-1 rounded-md text-[11px] font-bold ${notificationsEnabled ? 'bg-[#EDF5ED] text-[#558755]' : 'bg-[#F0F1ED] text-[#7A7E78]'}`}>{notificationsEnabled ? 'ON' : 'OFF'}</button>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-[#2C332B]">
            <span className="flex items-center gap-2"><Volume2 className="w-4 h-4 text-[#7D8C7B]" /> Notification sound</span>
            <button aria-pressed={notificationSoundEnabled} onClick={() => setNotificationSoundEnabled(!notificationSoundEnabled)} className={`px-3 py-1 rounded-md text-[11px] font-bold ${notificationSoundEnabled ? 'bg-[#EDF5ED] text-[#558755]' : 'bg-[#F0F1ED] text-[#7A7E78]'}`}>{notificationSoundEnabled ? 'ON' : 'OFF'}</button>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#E2E1D8] pt-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7A7E78]"><Smartphone className="w-4 h-4 text-[#7D8C7B]" /> App Installation</div>
          {isInstalled ? (
            <p className="text-xs font-semibold text-[#558755]">App Installed</p>
          ) : canInstall ? (
            <button type="button" onClick={() => void install()} className="flex items-center justify-center gap-2 rounded-xl bg-[#2C332B] px-4 py-2.5 text-xs font-semibold text-white hover:bg-black">
              <Download className="w-4 h-4" /> Install Veridian
            </button>
          ) : isIos ? (
            <p className="text-xs leading-relaxed text-[#7A7E78]">To install Veridian, use Share &rarr; Add to Home Screen.</p>
          ) : installRequested ? (
            <p className="text-xs leading-relaxed text-[#7A7E78]">Installation request sent. Complete the prompt to install Veridian.</p>
          ) : isUnavailable ? (
            <p className="text-xs leading-relaxed text-[#7A7E78]">Installation is not currently available in this browser.</p>
          ) : (
            <p className="text-xs leading-relaxed text-[#7A7E78]">Checking installation availability...</p>
          )}
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
