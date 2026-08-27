# Veridian Token Time-Lock Vault

Crypto-Vault is a non-custodial Ethereum token time-lock application. Users connect their own EVM wallet, approve an ERC-20 transfer, and lock tokens until a chosen future timestamp. The connected wallet remains the user's blockchain identity; the project has no backend account registry or user-number system.

## Features

- Create ERC-20 token locks with a configurable unlock time.
- View active, ready, and completed locks for the connected wallet.
- Withdraw tokens after the lock has matured.
- Track chain time, unlock notifications, and transaction status.
- Detect compatible ERC-20 tokens deployed on Sepolia.
- Claim demo HMT tokens from the Humble Token faucet.
- Install the frontend as a PWA where the browser supports installation.

## Technology Stack

- Solidity `0.8.28` and OpenZeppelin Contracts `5.6.1`
- Hardhat `3.14.0` with the ethers/Mocha toolbox
- TypeScript, React `19`, Vite `6`, Tailwind CSS `4`, and ethers `6`
- `vite-plugin-pwa` for the production service worker and web manifest

## Architecture

```text
contracts/                 Solidity contracts
test/                      Hardhat TypeScript integration tests
scripts/                   Deployment scripts
hardhat.config.ts          Hardhat networks and compiler configuration
Crypto-Vault-frontend/
	src/context/             Wallet and vault state
	src/components/          Dashboard, vault, governance, docs, and settings UI
	src/config/               Contract ABIs, addresses, and Sepolia configuration
	src/utils/                Wallet, PWA, formatting, and error helpers
	vite.config.ts            Frontend build and PWA configuration
```

## Smart Contracts

### TokenLocker

`TokenLocker` stores ERC-20 locks by owner and lock ID. `createLock` requires exactly the `0.0001 ETH` protocol fee, transfers tokens with OpenZeppelin `SafeERC20`, and forwards the fee to the immutable fee recipient. Only the lock owner can withdraw, and withdrawal is allowed only after `unlockTime`. Reentrancy protection is applied to lock creation and withdrawal.

### Demo Tokens

`HumbleToken` (HMT) and `MockToken` (MTK) are ERC-20 demo assets. Each has a `1,000 HMT/MTK` faucet amount and a 24-hour per-wallet cooldown. They have no real-world value. HMT is the token configured by the current frontend deployment.

## Wallets and Network

The frontend uses ethers through the injected EIP-1193 provider supplied by the browser wallet. This supports compatible injected EVM wallets, including desktop extensions and in-wallet mobile browsers. Account changes and chain changes are handled by the provider event API. WalletConnect is not installed or configured in this repository, so external mobile browsers without an injected provider require a separately integrated WalletConnect-compatible connection flow.

The application targets **Ethereum Sepolia** (`chainId 11155111`). The frontend contract configuration reads `VITE_TOKEN_LOCKER_ADDRESS` and `VITE_HUMBLE_TOKEN_ADDRESS`. Do not commit private keys or secret RPC credentials.

## PWA

The frontend build generates a web manifest, service worker, and Veridian icon. On supported desktop and Android browsers, Settings exposes the native install prompt when `beforeinstallprompt` is available. Installed applications show `App Installed`. iOS and iPadOS show the manual `Share -> Add to Home Screen` instruction because those platforms do not expose the native prompt. Unsupported browsers show an unavailable status instead of a broken install action. PWA installation does not require a wallet connection.

## Environment Variables

Root deployment variables are documented in `.env.example`:

- `SEPOLIA_RPC_URL`: Sepolia RPC endpoint used by Hardhat deployments.
- `SEPOLIA_PRIVATE_KEY`: deployment wallet private key. Keep this secret.

Frontend variables are Vite build-time values:

- `VITE_TOKEN_LOCKER_ADDRESS`: deployed `TokenLocker` address.
- `VITE_HUMBLE_TOKEN_ADDRESS`: deployed `HumbleToken` address.
- `VITE_SEPOLIA_RPC_URL`: reserved frontend configuration value; the current browser flow uses the connected wallet provider.

## Local Development

Install dependencies in each package:

```powershell
npm install
cd Crypto-Vault-frontend
npm install
```

Compile and test the contracts from the repository root:

```powershell
npm run build
npm test
```

Run the frontend:

```powershell
cd Crypto-Vault-frontend
npm run dev
```

The Vite development server uses port `3000`. Use `npm run build` followed by `npm run preview` in the frontend directory to test the production frontend locally.

## Deployment

Set the root `SEPOLIA_RPC_URL` and `SEPOLIA_PRIVATE_KEY` variables, then run the existing scripts from the repository root:

```powershell
npx hardhat run scripts/deploy-humble-token.ts --network sepolia
npx hardhat run scripts/deploy-local.ts
```

The deployment scripts print the addresses needed for the frontend environment. After setting the frontend `VITE_*` values, build the frontend with `npm run build` in `Crypto-Vault-frontend` and deploy its generated `dist/` directory to a static HTTPS host. PWA service workers require HTTPS in production, except when testing on localhost.

## Security Considerations and Limitations

- This is a non-custodial frontend; users must review wallet prompts and token approvals themselves.
- Smart-contract tests cover the current `TokenLocker` behavior, but this project is not a substitute for an independent security audit.
- The frontend depends on an injected wallet provider and the configured Sepolia deployments.
- The demo faucet tokens are for testing only and have no monetary value.
- There is no backend, database, account registry, user numbering, or server-side recovery mechanism.
- WalletConnect and a production token-price/oracle service are not part of the current repository.

## Project Status

The core contracts and frontend are implemented for Sepolia testing and local development. Production use requires independently verifying deployments, configuring an HTTPS host, protecting deployment credentials, and completing an external security review.
