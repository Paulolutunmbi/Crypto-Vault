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

console.log("Deployment complete");
console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
console.log(`Deployer: ${deployerAddress}`);
console.log(`Fee recipient: ${deployerAddress}`);
console.log(`MockToken: ${await mockToken.getAddress()}`);
console.log(`TokenLocker: ${await tokenLocker.getAddress()}`);
console.log(
  `Protocol fee: ${ethers.formatEther(protocolFee)} ETH (${protocolFee} wei)`
);
console.log(
  `MockToken supply minted to deployer: ${ethers.formatUnits(
    await mockToken.balanceOf(deployerAddress),
    18
  )} MTK`
);