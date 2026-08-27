// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Mock Token
 * @notice Sepolia-only test token used for Crypto-Vault onboarding demos.
 * @dev MTK is a mock asset with no real-world value and no claim on any protocol or treasury.
 */
contract MockToken is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 1_000 ether;
    uint256 public constant FAUCET_COOLDOWN = 24 hours;

    error FaucetCooldown(uint256 nextAvailableAt, uint256 currentTimestamp);

    event FaucetClaimed(address indexed claimant, uint256 amount, uint256 claimedAt);

    mapping(address user => uint256 lastClaimAt) private _lastClaimAt;

    constructor(uint256 initialSupply) ERC20("Mock Token", "MTK") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    function claimFaucet() external {
        uint256 lastClaimAt = _lastClaimAt[msg.sender];
        uint256 nextAvailableAt = lastClaimAt + FAUCET_COOLDOWN;

        if (block.timestamp < nextAvailableAt) {
            revert FaucetCooldown(nextAvailableAt, block.timestamp);
        }

        _lastClaimAt[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);

        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT, block.timestamp);
    }
}