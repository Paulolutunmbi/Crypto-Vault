/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TimelockProvider, useTimelock } from './context/TimelockContext';
import { Header } from './components/common/Header';
import { GreetingSection } from './components/dashboard/GreetingSection';
import { StatsGrid } from './components/dashboard/StatsGrid';
import { ActiveLocksSection } from './components/dashboard/ActiveLocksSection';
import { ReadyToWithdrawSection } from './components/dashboard/ReadyToWithdrawSection';
import { VaultsExplorer } from './components/vaults/VaultsExplorer';
import { GovernanceView } from './components/governance/GovernanceView';
import { DocsView } from './components/docs/DocsView';
import { CreateLockModal } from './components/vaults/CreateLockModal';
import { WithdrawModal } from './components/vaults/WithdrawModal';
import { LockDetailModal } from './components/vaults/LockDetailModal';
import { SettingsModal } from './components/common/SettingsModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ToastContainer } from './components/common/Toast';
import { Shield, Lock, Layers } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, wallet } = useTimelock();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F2] text-[#3A3D39]">
      {/* Top Sticky Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-12 py-8 md:py-10 flex flex-col gap-8">
        {activeTab === 'dashboard' && (
          <>
            <GreetingSection />
            <StatsGrid />
            <ActiveLocksSection />
            <ReadyToWithdrawSection />
          </>
        )}

        {activeTab === 'vaults' && <VaultsExplorer />}

        {activeTab === 'governance' && <GovernanceView />}

        {activeTab === 'docs' && <DocsView />}
      </main>

      {/* Institutional Footer */}
      <footer className="w-full border-t border-[#E2E1D8] bg-white py-6 px-4 md:px-12 text-xs text-[#7A7E78] font-body mt-auto">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[#2C332B] font-semibold">
              <div className="w-6 h-6 bg-[#7D8C7B] rounded-md flex items-center justify-center text-white">
                <div className="w-2.5 h-2.5 border border-white rounded-xs rotate-45" />
              </div>
              <span>Veridian Timelock Protocol v2.4</span>
            </div>
            <span className="text-[#E2E1D8]">|</span>
            <div className="flex items-center gap-1.5 text-[#7A7E78]">
              <Shield className="w-3.5 h-3.5 text-[#86B086]" />
              <span>Audited by OpenZeppelin</span>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono-numbers text-[11px] text-[#7A7E78]">
            <span>Active Chain: <strong className="text-[#2C332B]">{wallet.network.name}</strong></span>
            <span>Block: <strong className="text-[#2C332B]">Live Sepolia</strong></span>
          </div>
        </div>
      </footer>

      {/* Interactive Global Modals & Drawers */}
      <CreateLockModal />
      <WithdrawModal />
      <LockDetailModal />
      <SettingsModal />
      <NotificationDrawer />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <TimelockProvider>
      <MainContent />
    </TimelockProvider>
  );
}
