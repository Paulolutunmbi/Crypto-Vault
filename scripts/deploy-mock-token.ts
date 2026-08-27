import { network } from "hardhat";

const { ethers } = await network.create();
const [deployer] = await ethers.getSigners();

if (!deployer) {
  throw new Error("No deployer account available");
}

const initialSupply = 1_000_000n;
const token = await ethers.deployContract("MockToken", [initialSupply], deployer);
await token.waitForDeployment();

const address = await token.getAddress();
console.log(`MockToken deployed at: ${address}`);
console.log(`Network chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
console.log(`Initial supply: ${initialSupply} MTK`);
console.log(`Faucet amount: ${ethers.formatUnits(await token.FAUCET_AMOUNT(), 18)} MTK`);
console.log(`Faucet cooldown: ${await token.FAUCET_COOLDOWN()} seconds`);