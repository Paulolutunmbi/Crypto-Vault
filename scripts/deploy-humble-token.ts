import { network } from "hardhat";

const { ethers } = await network.create();
const [deployer] = await ethers.getSigners();

if (!deployer) {
  throw new Error("No deployer account available");
}

const initialSupply = 1_000_000n;
const token = await ethers.deployContract("HumbleToken", [initialSupply], deployer);
await token.waitForDeployment();

const address = await token.getAddress();
const networkInfo = await ethers.provider.getNetwork();
const deployerAddress = await deployer.getAddress();
const decimals = await token.decimals();
const faucetAmount = await token.FAUCET_AMOUNT();
const faucetCooldown = await token.FAUCET_COOLDOWN();

console.log(`Network: ${networkInfo.name} (${networkInfo.chainId})`);
console.log(`Deployer: ${deployerAddress}`);
console.log(`Humble Token contract address: ${address}`);
console.log(`Token name: ${await token.name()}`);
console.log(`Symbol: ${await token.symbol()}`);
console.log(`Decimals: ${decimals}`);
console.log(`Total supply: ${ethers.formatUnits(await token.totalSupply(), decimals)} HMT`);
console.log(`Faucet amount: ${ethers.formatUnits(faucetAmount, decimals)} HMT`);
console.log(`Faucet cooldown: ${faucetCooldown} seconds`);
console.log(`VITE_HUMBLE_TOKEN_ADDRESS="${address}"`);