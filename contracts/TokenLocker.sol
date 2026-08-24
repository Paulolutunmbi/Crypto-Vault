// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenLocker is ReentrancyGuard {
	using SafeERC20 for IERC20;

	uint256 public constant PROTOCOL_FEE = 0.0001 ether;

	error ZeroToken();
	error ZeroAmount();
	error InvalidUnlockTime();
	error ZeroFeeRecipient();
	error UnauthorizedWithdrawal();
	error AlreadyWithdrawn();
	error LockStillActive();
	error IncorrectProtocolFee(uint256 sent, uint256 required);
	error TokenTransferFailed();
	error FeeTransferFailed();

	struct Lock {
		uint256 id;
		address token;
		address owner;
		uint256 amount;
		uint256 unlockTime;
		bool withdrawn;
	}

	address public immutable feeRecipient;

	uint256 private _nextLockId = 1;
	mapping(uint256 lockId => Lock lock) private _locks;
	mapping(address user => uint256[] lockIds) private _userLocks;

	event LockCreated(
		uint256 indexed lockId,
		address indexed token,
		address indexed owner,
		uint256 amount,
		uint256 unlockTime
	);
	event LockWithdrawn(
		uint256 indexed lockId,
		address indexed token,
		address indexed owner,
		uint256 amount
	);

	constructor(address feeRecipient_) {
		if (feeRecipient_ == address(0)) revert ZeroFeeRecipient();
		feeRecipient = feeRecipient_;
	}

	function createLock(
		address token,
		uint256 amount,
		uint256 unlockTime
	) external payable nonReentrant returns (uint256 lockId) {
		if (msg.value != PROTOCOL_FEE) {
			revert IncorrectProtocolFee(msg.value, PROTOCOL_FEE);
		}
		if (token == address(0)) revert ZeroToken();
		if (amount == 0) revert ZeroAmount();
		if (unlockTime <= block.timestamp) revert InvalidUnlockTime();

		lockId = _nextLockId++;
		_locks[lockId] = Lock({
			id: lockId,
			token: token,
			owner: msg.sender,
			amount: amount,
			unlockTime: unlockTime,
			withdrawn: false
		});
		_userLocks[msg.sender].push(lockId);

		IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

		(bool feeSent, ) = feeRecipient.call{value: msg.value}("");
		if (!feeSent) revert FeeTransferFailed();

		emit LockCreated(lockId, token, msg.sender, amount, unlockTime);
	}

	function withdraw(uint256 lockId) external nonReentrant {
		Lock storage userLock = _locks[lockId];
		if (userLock.owner != msg.sender) revert UnauthorizedWithdrawal();
		if (userLock.withdrawn) revert AlreadyWithdrawn();
		if (block.timestamp < userLock.unlockTime) revert LockStillActive();

		userLock.withdrawn = true;
		IERC20(userLock.token).safeTransfer(userLock.owner, userLock.amount);

		emit LockWithdrawn(lockId, userLock.token, userLock.owner, userLock.amount);
	}

	function getUserLocks(address user) external view returns (uint256[] memory) {
		return _userLocks[user];
	}

	function getLock(uint256 lockId) external view returns (Lock memory) {
		return _locks[lockId];
	}

	function getUserLockCount(address user) external view returns (uint256) {
		return _userLocks[user].length;
	}
}
