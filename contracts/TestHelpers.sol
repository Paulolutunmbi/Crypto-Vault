// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FeeRejector {
    receive() external payable {
        revert("fee rejected");
    }
}

interface ITokenLocker {
    function createLock(address token, uint256 amount, uint256 unlockTime) external payable returns (uint256);
}

interface IERC20Approver {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract ReentrantFeeRecipient {
    address public locker;
    address public token;

    function configure(address locker_, address token_) external {
        locker = locker_;
        token = token_;
        IERC20Approver(token_).approve(locker_, 1);
    }

    receive() external payable {
        ITokenLocker(locker).createLock{value: msg.value}(token, 1, block.timestamp + 100);
    }
}