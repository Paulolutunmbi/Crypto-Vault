import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

const PROTOCOL_FEE = ethers.parseEther("0.0001");
const LOCK_AMOUNT = ethers.parseUnits("100", 18);

async function deployFixture() {
  const [deployer, owner, other, feeRecipient] = await ethers.getSigners();
  const locker = await ethers.deployContract("TokenLocker", [feeRecipient.address]);
  const token = await ethers.deployContract("MockToken", [1_000_000n], owner);
  await token.connect(owner).approve(locker, LOCK_AMOUNT * 10n);
  return { deployer, owner, other, feeRecipient, locker, token };
}

async function futureTimestamp(seconds = 3600) {
  return BigInt(await networkHelpers.time.latest()) + BigInt(seconds);
}

describe("TokenLocker", function () {
  describe("deployment", function () {
    it("stores the fee recipient and protocol fee", async function () {
      const [, , , feeRecipient] = await ethers.getSigners();
      const locker = await ethers.deployContract("TokenLocker", [feeRecipient.address]);

      expect(await locker.feeRecipient()).to.equal(feeRecipient.address);
      expect(await locker.PROTOCOL_FEE()).to.equal(PROTOCOL_FEE);
    });

    it("rejects a zero fee recipient", async function () {
      const factory = await ethers.getContractFactory("TokenLocker");
      await expect(factory.deploy(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(factory, "ZeroFeeRecipient");
    });
  });

  describe("createLock", function () {
    it("creates a lock, transfers tokens, and emits its details", async function () {
      const { owner, locker, token } = await networkHelpers.loadFixture(deployFixture);
      const unlockTime = await futureTimestamp();
      const ownerBalanceBefore = await token.balanceOf(owner.address);

      await expect(locker.connect(owner).createLock(await token.getAddress(), LOCK_AMOUNT, unlockTime, { value: PROTOCOL_FEE }))
        .to.emit(locker, "LockCreated")
        .withArgs(1n, await token.getAddress(), owner.address, LOCK_AMOUNT, unlockTime);

      const lock = await locker.getLock(1n);
      expect(lock.id).to.equal(1n);
      expect(lock.owner).to.equal(owner.address);
      expect(lock.token).to.equal(await token.getAddress());
      expect(lock.amount).to.equal(LOCK_AMOUNT);
      expect(lock.unlockTime).to.equal(unlockTime);
      expect(lock.withdrawn).to.equal(false);
      expect(await token.balanceOf(await locker.getAddress())).to.equal(LOCK_AMOUNT);
      expect(await token.balanceOf(owner.address)).to.equal(ownerBalanceBefore - LOCK_AMOUNT);
    });

    it("requires exactly the protocol fee", async function () {
      const { owner, locker, token } = await networkHelpers.loadFixture(deployFixture);
      const unlockTime = await futureTimestamp();

      await expect(locker.connect(owner).createLock(await token.getAddress(), LOCK_AMOUNT, unlockTime, { value: 0n }))
        .to.be.revertedWithCustomError(locker, "IncorrectProtocolFee")
        .withArgs(0n, PROTOCOL_FEE);
      await expect(locker.connect(owner).createLock(await token.getAddress(), LOCK_AMOUNT, unlockTime, { value: PROTOCOL_FEE + 1n }))
        .to.be.revertedWithCustomError(locker, "IncorrectProtocolFee");
    });

    it("rejects invalid token, amount, and unlock time", async function () {
      const { owner, locker, token } = await networkHelpers.loadFixture(deployFixture);
      const now = BigInt(await networkHelpers.time.latest());

      await expect(locker.connect(owner).createLock(ethers.ZeroAddress, LOCK_AMOUNT, now + 1n, { value: PROTOCOL_FEE }))
        .to.be.revertedWithCustomError(locker, "ZeroToken");
      await expect(locker.connect(owner).createLock(await token.getAddress(), 0n, now + 1n, { value: PROTOCOL_FEE }))
        .to.be.revertedWithCustomError(locker, "ZeroAmount");

      await networkHelpers.time.setNextBlockTimestamp(now + 1n);
      await expect(locker.connect(owner).createLock(await token.getAddress(), LOCK_AMOUNT, now + 1n, { value: PROTOCOL_FEE }))
        .to.be.revertedWithCustomError(locker, "InvalidUnlockTime");
      await expect(locker.connect(owner).createLock(await token.getAddress(), LOCK_AMOUNT, now, { value: PROTOCOL_FEE }))
        .to.be.revertedWithCustomError(locker, "InvalidUnlockTime");
    });
  });

  describe("multiple locks", function () {
    it("assigns unique IDs and tracks every lock, including different tokens", async function () {
      const { owner, locker, token } = await networkHelpers.loadFixture(deployFixture);
      const secondToken = await ethers.deployContract("MockToken", [1_000_000n], owner);
      await secondToken.connect(owner).approve(locker, LOCK_AMOUNT);
      const firstUnlock = await futureTimestamp();
      const secondUnlock = firstUnlock + 1n;

      await locker.connect(owner).createLock(await token.getAddress(), LOCK_AMOUNT, firstUnlock, { value: PROTOCOL_FEE });
      await locker.connect(owner).createLock(await secondToken.getAddress(), LOCK_AMOUNT, secondUnlock, { value: PROTOCOL_FEE });

      expect([...await locker.getUserLocks(owner.address)]).to.deep.equal([1n, 2n]);
      expect(await locker.getUserLockCount(owner.address)).to.equal(2n);
      expect((await locker.getLock(1n)).id).to.equal(1n);
      expect((await locker.getLock(2n)).id).to.equal(2n);
      expect((await locker.getLock(2n)).token).to.equal(await secondToken.getAddress());
    });
  });

  describe("withdrawal and security", function () {
    async function createOneLock() {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      const unlockTime = await futureTimestamp();
      await fixture.locker.connect(fixture.owner).createLock(await fixture.token.getAddress(), LOCK_AMOUNT, unlockTime, { value: PROTOCOL_FEE });
      return { ...fixture, unlockTime };
    }

    it("rejects early, non-owner, and repeat withdrawals", async function () {
      const { locker, owner, other, unlockTime } = await createOneLock();
      await expect(locker.connect(owner).withdraw(1n)).to.be.revertedWithCustomError(locker, "LockStillActive");
      await networkHelpers.time.increaseTo(unlockTime);
      await expect(locker.connect(other).withdraw(1n)).to.be.revertedWithCustomError(locker, "UnauthorizedWithdrawal");
      await locker.connect(owner).withdraw(1n);
      await expect(locker.connect(owner).withdraw(1n)).to.be.revertedWithCustomError(locker, "AlreadyWithdrawn");
    });

    it("returns the exact amount, marks withdrawn, and emits the event", async function () {
      const { locker, owner, token, unlockTime } = await createOneLock();
      await networkHelpers.time.increaseTo(unlockTime);
      await expect(locker.connect(owner).withdraw(1n))
        .to.emit(locker, "LockWithdrawn")
        .withArgs(1n, await token.getAddress(), owner.address, LOCK_AMOUNT);
      expect(await token.balanceOf(owner.address)).to.equal(1_000_000n * 10n ** 18n);
      expect((await locker.getLock(1n)).withdrawn).to.equal(true);
    });

    it("prevents a user from withdrawing another user's lock", async function () {
      const { locker, other } = await createOneLock();
      await expect(locker.connect(other).withdraw(1n)).to.be.revertedWithCustomError(locker, "UnauthorizedWithdrawal");
    });
  });

  describe("fees and atomic failures", function () {
    it("sends exactly the protocol fee to the recipient", async function () {
      const { owner, locker, token, feeRecipient } = await networkHelpers.loadFixture(deployFixture);
      await expect(locker.connect(owner).createLock(await token.getAddress(), LOCK_AMOUNT, await futureTimestamp(), { value: PROTOCOL_FEE }))
        .to.changeEtherBalance(ethers, feeRecipient, PROTOCOL_FEE);
    });

    it("rolls back tokens, ETH, and lock state when the fee transfer fails", async function () {
      const { owner, token } = await networkHelpers.loadFixture(deployFixture);
      const rejector = await ethers.deployContract("FeeRejector");
      const locker = await ethers.deployContract("TokenLocker", [await rejector.getAddress()]);
      await token.connect(owner).approve(locker, LOCK_AMOUNT);
      const ownerTokensBefore = await token.balanceOf(owner.address);

      await expect(locker.connect(owner).createLock(await token.getAddress(), LOCK_AMOUNT, await futureTimestamp(), { value: PROTOCOL_FEE }))
        .to.be.revertedWithCustomError(locker, "FeeTransferFailed");
      expect(await token.balanceOf(owner.address)).to.equal(ownerTokensBefore);
      expect(await token.balanceOf(await locker.getAddress())).to.equal(0n);
      expect(await locker.getUserLockCount(owner.address)).to.equal(0n);
      expect(await ethers.provider.getBalance(await locker.getAddress())).to.equal(0n);
    });

    it("rolls back when token transferFrom fails", async function () {
      const { owner, locker, token } = await networkHelpers.loadFixture(deployFixture);
      await token.connect(owner).approve(locker, 0n);
      await expect(locker.connect(owner).createLock(await token.getAddress(), LOCK_AMOUNT, await futureTimestamp(), { value: PROTOCOL_FEE }))
        .to.revert(ethers);
      expect(await locker.getUserLockCount(owner.address)).to.equal(0n);
      expect(await ethers.provider.getBalance(await locker.getAddress())).to.equal(0n);
    });

    it("rejects reentrant fee-recipient callbacks atomically", async function () {
      const [owner] = await ethers.getSigners();
      const recipient = await ethers.deployContract("ReentrantFeeRecipient");
      const locker = await ethers.deployContract("TokenLocker", [await recipient.getAddress()]);
      const token = await ethers.deployContract("MockToken", [1_000_000n], owner);
      await token.transfer(await recipient.getAddress(), 1n);
      await recipient.configure(await locker.getAddress(), await token.getAddress());
      await token.connect(owner).approve(locker, LOCK_AMOUNT);

      await expect(locker.connect(owner).createLock(await token.getAddress(), LOCK_AMOUNT, await futureTimestamp(), { value: PROTOCOL_FEE }))
        .to.be.revertedWithCustomError(locker, "FeeTransferFailed");
      expect(await locker.getUserLockCount(owner.address)).to.equal(0n);
      expect(await token.balanceOf(await locker.getAddress())).to.equal(0n);
      expect(await ethers.provider.getBalance(await locker.getAddress())).to.equal(0n);
    });
  });
});