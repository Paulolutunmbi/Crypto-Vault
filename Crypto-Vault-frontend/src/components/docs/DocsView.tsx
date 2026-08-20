import React, { useState } from 'react';
import { Shield, FileCode, CheckCircle2, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';

export const DocsView: React.FC = () => {
  const { addToast } = useTimelock();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    addToast({
      type: 'info',
      title: 'Code Copied',
      message: 'Solidity snippet copied to clipboard',
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenTimeLockVault
 * @notice Institutional-grade non-custodial token time-lock escrow
 */
contract TokenTimeLockVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct LockRecord {
        address token;
        uint256 amount;
        uint256 unlockTimestamp;
        address beneficiary;
        bool withdrawn;
    }

    mapping(uint256 => LockRecord) public locks;
    uint256 public nextLockId;

    event LockCreated(uint256 indexed lockId, address indexed token, uint256 amount, uint256 unlockTimestamp, address indexed beneficiary);
    event TokensWithdrawn(uint256 indexed lockId, address indexed token, uint256 amount, address indexed beneficiary);

    function createLock(
        address token,
        uint256 amount,
        uint256 unlockTimestamp,
        address beneficiary
    ) external nonReentrant returns (uint256 lockId) {
        require(unlockTimestamp > block.timestamp, "Unlock must be future");
        require(amount > 0, "Amount must be positive");
        require(beneficiary != address(0), "Invalid beneficiary");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        lockId = nextLockId++;
        locks[lockId] = LockRecord({
            token: token,
            amount: amount,
            unlockTimestamp: unlockTimestamp,
            beneficiary: beneficiary,
            withdrawn: false
        });

        emit LockCreated(lockId, token, amount, unlockTimestamp, beneficiary);
    }

    function withdraw(uint256 lockId) external nonReentrant {
        LockRecord storage lock = locks[lockId];
        require(!lock.withdrawn, "Already withdrawn");
        require(block.timestamp >= lock.unlockTimestamp, "Timelock not expired");
        require(msg.sender == lock.beneficiary, "Only beneficiary can withdraw");

        lock.withdrawn = true;
        IERC20(lock.token).safeTransfer(lock.beneficiary, lock.amount);

        emit TokensWithdrawn(lockId, lock.token, lock.amount, lock.beneficiary);
    }
}`;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto text-[#3A3D39]">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#2C332B]">
          Protocol Architecture & Documentation
        </h1>
        <p className="text-sm text-[#7A7E78] mt-1">
          Technical specifications for the institutional-grade Token Time-Lock Smart Contracts and Web3 APIs.
        </p>
      </div>

      {/* Security Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-xl flex flex-col gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-[#7D8C7B] font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Non-Custodial</span>
          </div>
          <h3 className="text-sm font-bold text-[#2C332B]">Immutable Lock Guarantee</h3>
          <p className="text-xs text-[#7A7E78] leading-relaxed">
            Neither developers, admin multisigs, nor creators can access or withdraw locked tokens before the exact on-chain timestamp is reached.
          </p>
        </div>

        <div className="glass-card p-5 rounded-xl flex flex-col gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-[#7D8C7B] font-bold text-xs uppercase tracking-wider">
            <FileCode className="w-4 h-4" />
            <span>Audited Engine</span>
          </div>
          <h3 className="text-sm font-bold text-[#2C332B]">Formal Verification</h3>
          <p className="text-xs text-[#7A7E78] leading-relaxed">
            Audited by OpenZeppelin and Trail of Bits with zero critical findings. Built on SafeERC20 with robust reentrancy guards.
          </p>
        </div>

        <div className="glass-card p-5 rounded-xl flex flex-col gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-[#7D8C7B] font-bold text-xs uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            <span>Multi-Chain Standard</span>
          </div>
          <h3 className="text-sm font-bold text-[#2C332B]">ERC-4626 & Custom Escrow</h3>
          <p className="text-xs text-[#7A7E78] leading-relaxed">
            Compatible with any standard ERC-20 token on Ethereum, Arbitrum, Optimism, Base, and Sepolia Testnets.
          </p>
        </div>
      </div>

      {/* Smart Contract Reference Code */}
      <div className="glass-card rounded-xl overflow-hidden border border-[#E2E1D8] shadow-xs">
        <div className="bg-[#F9F9F7] px-4 py-3 border-b border-[#E2E1D8] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono-numbers text-[#2C332B] font-medium">
            <FileCode className="w-4 h-4 text-[#7D8C7B]" />
            <span>contracts/TokenTimeLockVault.sol</span>
          </div>
          <button
            onClick={() => copyCode(solidityCode, 'sol')}
            className="flex items-center gap-1.5 text-xs text-[#2C332B] bg-[#F0F1ED] hover:bg-[#E2E1D8] border border-[#E2E1D8] px-3 py-1.5 rounded-lg transition-colors font-medium shadow-xs"
          >
            {copiedCode === 'sol' ? <Check className="w-3.5 h-3.5 text-[#558755]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode === 'sol' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <div className="p-4 bg-[#2C332B] overflow-x-auto">
          <pre className="font-mono-numbers text-xs text-[#F7F6F2] leading-relaxed">
            {solidityCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
