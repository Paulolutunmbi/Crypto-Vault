import { network } from "hardhat";

const { ethers } = await network.create();

const INITIAL_SUPPLY = 1_000_000n;

const [deployer] = await ethers.getSigners();

if (!deployer) {
  throw new Error("No deployer account available");
}

const deployerAddress = await deployer.getAddress();

const mockToken = await ethers.deployContract(
  "MockToken",
  [INITIAL_SUPPLY],
  deployer
);

await mockToken.waitForDeployment();

const tokenLocker = await ethers.deployContract(
  "TokenLocker",
  [deployerAddress],
  deployer
);

await tokenLocker.waitForDeployment();

const protocolFee = await tokenLocker.PROTOCOL_FEE();
const mockTokenAddress = await mockToken.getAddress();
const tokenLockerAddress = await tokenLocker.getAddress();

console.log("Deployment complete");
console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
console.log(`Deployer: ${deployerAddress}`);
console.log(`Fee recipient: ${deployerAddress}`);
console.log(`MockToken contract address: ${mockTokenAddress}`);
console.log(`TokenLocker contract address: ${tokenLockerAddress}`);
console.log(
  `Protocol fee: ${ethers.formatEther(protocolFee)} ETH (${protocolFee} wei)`
);
console.log(
  `MockToken supply minted to deployer: ${ethers.formatUnits(
    await mockToken.balanceOf(deployerAddress),
    18
  )} MTK`
);

console.log("Frontend configuration update required:");
console.log(`VITE_MOCK_TOKEN_ADDRESS="${mockTokenAddress}"`);
console.log(`VITE_TOKEN_LOCKER_ADDRESS="${tokenLockerAddress}"`);