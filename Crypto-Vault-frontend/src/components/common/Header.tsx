import React, { useState } from 'react';
import {
  Lock,
  Settings,
  Bell,
  Wallet,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';
import { formatAddress } from '../../utils/formatters';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    wallet,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    setIsCreateModalOpen,
    setIsSettingsModalOpen,
    setIsNotifOpen,
    unreadNotifCount,
    addToast,
  } = useTimelock();

  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (!wallet.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    addToast({
      type: 'info',
      title: 'Address Copied',
      message: 'Wallet address copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full top-0 sticky bg-white/95 backdrop-blur-md border-b border-[#E2E1D8] z-40 transition-colors shadow-xs">
      <div className="flex justify-between items-center h-16 px-4 md:px-12 max-w-[1200px] mx-auto w-full">
        {/* Brand & Navigation */}
        <div className="flex items-center gap-8 md:gap-12">
          {/* Logo / Brand Name */}
          <button
            id="brand-logo-btn"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#7D8C7B] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <div className="w-3.5 h-3.5 border-2 border-white rounded-xs rotate-45" />
            </div>
            <div className="font-display text-[19px] font-bold text-[#2C332B] tracking-tight group-hover:text-[#7D8C7B] transition-colors">
              Veridian Vault
            </div>
          </button>

          {/* Nav Links */}
          <nav className="hidden md:flex gap-8 items-center h-full">
            <button
              id="nav-dashboard-btn"
              onClick={() => setActiveTab('dashboard')}
              className={`h-16 flex items-center text-sm font-medium transition-colors duration-150 border-b-2 ${
                activeTab === 'dashboard'
                  ? 'text-[#2C332B] font-semibold border-[#7D8C7B]'
                  : 'text-[#7A7E78] hover:text-[#2C332B] border-transparent'
              }`}
            >
              Dashboard
            </button>
            <button
              id="nav-vaults-btn"
              onClick={() => setActiveTab('vaults')}
              className={`h-16 flex items-center text-sm font-medium transition-colors duration-150 border-b-2 ${
                activeTab === 'vaults'
                  ? 'text-[#2C332B] font-semibold border-[#7D8C7B]'
                  : 'text-[#7A7E78] hover:text-[#2C332B] border-transparent'
              }`}
            >
              Vaults
            </button>
            <button
              id="nav-governance-btn"
              onClick={() => setActiveTab('governance')}
              className={`h-16 flex items-center text-sm font-medium transition-colors duration-150 border-b-2 ${
                activeTab === 'governance'
                  ? 'text-[#2C332B] font-semibold border-[#7D8C7B]'
                  : 'text-[#7A7E78] hover:text-[#2C332B] border-transparent'
              }`}
            >
              Governance
            </button>
            <button
              id="nav-docs-btn"
              onClick={() => setActiveTab('docs')}
              className={`h-16 flex items-center text-sm font-medium transition-colors duration-150 border-b-2 ${
                activeTab === 'docs'
                  ? 'text-[#2C332B] font-semibold border-[#7D8C7B]'
                  : 'text-[#7A7E78] hover:text-[#2C332B] border-transparent'
              }`}
            >
              Docs
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Create Lock Button (Desktop) */}
          <button
            id="quick-create-lock-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 bg-[#F0F1ED] hover:bg-[#E2E1D8] text-[#2C332B] border border-[#E2E1D8] text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors active:scale-95 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#7D8C7B]" />
            <span>Lock Tokens</span>
          </button>

          {/* Settings & Notifications */}
          <div className="flex items-center gap-1 text-[#7A7E78]">
            <button
              id="header-settings-btn"
              aria-label="Settings"
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-full hover:bg-[#F0F1ED] transition-colors hover:text-[#2C332B] active:scale-95"
              title="Network & Vault Settings"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>

            <button
              id="header-notifications-btn"
              aria-label="Notifications"
              onClick={() => setIsNotifOpen(true)}
              className="p-2 rounded-full hover:bg-[#F0F1ED] transition-colors hover:text-[#2C332B] active:scale-95 relative"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7D8C7B] ring-2 ring-white" />
              )}
            </button>
          </div>

          {/* Connect Wallet / Connected State */}
          <div className="relative">
            {wallet.isConnected ? (
              <div>
                <button
                  id="wallet-user-menu-btn"
                  onClick={() => setIsWalletMenuOpen(!isWalletMenuOpen)}
                  className="flex items-center gap-2 bg-[#F0F1ED] hover:bg-[#E2E1D8] border border-[#E2E1D8] text-[#2C332B] px-3.5 py-1.5 rounded-full text-xs font-mono-numbers transition-all active:scale-95 shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-[#86B086] shadow-[0_0_6px_#86B086]" />
                  <span className="font-medium text-xs">{formatAddress(wallet.address, 6, 4)}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7A7E78]" />
                </button>

                {/* Dropdown Menu */}
                {isWalletMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsWalletMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-[#E2E1D8] shadow-xl p-4 z-50 flex flex-col gap-3 font-body text-[#3A3D39]">
                      {/* Network badge */}
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E2E1D8]">
                        <span className="text-[#7A7E78]">Connected Network</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F0F1ED] text-[#2C332B] border border-[#E2E1D8] flex items-center gap-1.5 font-medium text-xs">
                          <span>{wallet.network.icon}</span>
                          <span>{wallet.network.name}</span>
                        </span>
                      </div>

                      {/* Account address & balance */}
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-[#7A7E78]">Address</span>
                        <div className="flex items-center justify-between bg-[#F9F9F7] p-2.5 rounded-lg border border-[#E2E1D8] font-mono-numbers text-xs">
                          <span className="text-[#2C332B]">{formatAddress(wallet.address, 10, 8)}</span>
                          <button
                            id="copy-address-btn"
                            onClick={handleCopyAddress}
                            className="text-[#7A7E78] hover:text-[#2C332B] p-1 rounded hover:bg-[#E2E1D8]"
                            title="Copy Address"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-[#86B086]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="text-[#7A7E78]">Wallet Balance</span>
                        <span className="font-mono-numbers font-semibold text-[#2C332B]">
                          {wallet.ethBalance.toFixed(3)} ETH
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#E2E1D8] flex flex-col gap-2">
                        <a
                          href={`${wallet.network.explorerUrl}/address/${wallet.address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between text-xs text-[#7A7E78] hover:text-[#2C332B] transition-colors py-1"
                        >
                          <span className="flex items-center gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5" /> View on Explorer
                          </span>
                        </a>

                        <button
                          id="disconnect-wallet-btn"
                          onClick={() => {
                            disconnectWallet();
                            setIsWalletMenuOpen(false);
                          }}
                          className="w-full text-center text-xs py-2 rounded-lg bg-[#F0F1ED] hover:bg-[#E2E1D8] text-[#7A7E78] hover:text-[#2C332B] border border-[#E2E1D8] font-medium transition-colors"
                        >
                          Disconnect Wallet
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                id="connect-wallet-btn"
                onClick={connectWallet}
                className="bg-[#2C332B] hover:bg-black text-white font-medium text-xs px-4 py-2 rounded-lg active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="flex md:hidden border-t border-[#E2E1D8] px-4 overflow-x-auto bg-[#F9F9F7]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'text-[#2C332B] border-[#7D8C7B]'
              : 'text-[#7A7E78] border-transparent'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('vaults')}
          className={`py-2.5 px-3 text-xs font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'vaults'
              ? 'text-[#2C332B] border-[#7D8C7B]'
              : 'text-[#7A7E78] border-transparent'
          }`}
        >
          Vaults
        </button>
        <button
          onClick={() => setActiveTab('governance')}
          className={`py-2.5 px-3 text-xs font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'governance'
              ? 'text-[#2C332B] border-[#7D8C7B]'
              : 'text-[#7A7E78] border-transparent'
          }`}
        >
          Governance
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`py-2.5 px-3 text-xs font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'docs'
              ? 'text-[#2C332B] border-[#7D8C7B]'
              : 'text-[#7A7E78] border-transparent'
          }`}
        >
          Docs
        </button>
      </div>
    </header>
  );
};
