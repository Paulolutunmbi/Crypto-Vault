export interface ReadableBlockchainError {
  title: string;
  message: string;
}

interface ErrorLike {
  code?: unknown;
  shortMessage?: unknown;
  message?: unknown;
  reason?: unknown;
  info?: { error?: { message?: unknown } };
}

const getErrorText = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (!error || typeof error !== 'object') return '';
  const candidate = error as ErrorLike;
  return [candidate.message, candidate.shortMessage, candidate.reason, candidate.info?.error?.message]
    .filter((value): value is string => typeof value === 'string')
    .join(' ');
};

const getErrorDetails = (error: unknown): string => {
  try {
    return JSON.stringify(error, (_, value) => typeof value === 'bigint' ? value.toString() : value);
  } catch {
    return '';
  }
};

export function readableError(error: unknown, operation: 'connect' | 'detect' | 'create' | 'withdraw' | 'faucet' | 'switch' = 'create'): ReadableBlockchainError {
  const candidate = (error && typeof error === 'object' ? error : {}) as ErrorLike;
  const text = getErrorText(error);
  const code = String(candidate.code ?? '');
  const details = `${text} ${getErrorDetails(error)}`;

  if (/user rejected|action rejected|user denied|denied|cancelled|canceled/i.test(text) || /4001|ACTION_REJECTED/i.test(code)) {
    return { title: 'Transaction cancelled', message: 'You cancelled the transaction in your wallet.' };
  }
  if (/insufficient funds|insufficient eth|not enough eth|gas required exceeds/i.test(text)) {
    return { title: 'Insufficient ETH', message: 'You need enough Sepolia ETH to pay the transaction fee.' };
  }
  if (/token approval/i.test(text)) {
    return { title: 'Token approval rejected', message: 'The wallet did not approve this token for the TokenLocker contract.' };
  }
  if (/allowance|approve|transfer amount exceeds allowance/i.test(text)) {
    return { title: 'Insufficient token allowance', message: 'Approve enough tokens for this lock, then try again.' };
  }
  if (/insufficient mtk|insufficient token|transfer amount exceeds balance|exceeds balance/i.test(text)) {
    return { title: 'Insufficient token balance', message: 'You do not have enough of this token for the transaction.' };
  }
  if (/wrong network|connect to sepolia|chain/i.test(text) || operation === 'switch') {
    return { title: 'Wrong network', message: 'Please switch your wallet back to Ethereum Sepolia.' };
  }
  if (/invalid token address|zero token/i.test(text)) {
    return { title: 'Invalid token address', message: 'Enter a valid, non-zero Ethereum address.' };
  }
  if (/no contract code/i.test(text)) {
    return { title: 'No contract found', message: 'That address is not a contract on Sepolia.' };
  }
  if (/metadata unavailable|invalid token decimals/i.test(text)) {
    return { title: 'Not an ERC-20 token', message: 'The contract does not implement the required ERC-20 metadata functions.' };
  }
  if (/balance read failed/i.test(text)) {
    return { title: 'Token balance unavailable', message: 'The token balance could not be read from Sepolia.' };
  }
  if (/allowance read failed/i.test(text)) {
    return { title: 'Token allowance unavailable', message: 'The token allowance could not be read from Sepolia.' };
  }
  if (operation === 'detect') {
    return { title: 'Token detection failed', message: 'The contract could not be verified as a usable ERC-20 token on Sepolia.' };
  }
  if (/rpc provider unavailable/i.test(text)) {
    return { title: 'Sepolia provider unavailable', message: 'Unable to reach the Sepolia RPC provider. Try again shortly.' };
  }
  if (/wallet not found|wallet not installed|metamask/i.test(text) && /not found|not installed|missing/i.test(text)) {
    return { title: 'Wallet unavailable', message: 'Connect a compatible wallet app or browser extension to continue.' };
  }
  if (/disconnected|no accounts|not connected/i.test(text)) {
    return { title: 'Wallet disconnected', message: 'Connect your wallet again to continue.' };
  }
  if (operation === 'faucet' && /faucetcooldown|faucet cooldown|cooldown|ec442f05/i.test(details)) {
    return { title: 'HMT claim unavailable', message: 'You have already claimed HMT recently. Please wait until the faucet cooldown expires.' };
  }
  if (/network|rpc|provider|timeout|could not detect network|failed to fetch/i.test(text)) {
    return { title: 'Blockchain unavailable', message: 'The network is temporarily unavailable. Check your wallet connection and try again.' };
  }
  if (/unlock.*(future|passed|close)|past|timelock.*(mature|unlock)|already withdrawn|withdrawn/i.test(text)) {
    return operation === 'withdraw'
      ? { title: 'Withdrawal unavailable', message: 'This lock is not ready for withdrawal, or it has already been withdrawn.' }
      : { title: 'Unlock time is too soon', message: 'Choose an unlock time at least two minutes in the future.' };
  }
  if (/invalid token|token decimals|token locker address/i.test(text)) {
    return { title: 'Invalid token', message: 'Enter an ERC-20 token contract address deployed on Ethereum Sepolia.' };
  }
  if (/invalid amount|valid amount|amount|too many decimals/i.test(text) && operation === 'create') {
    return { title: 'Invalid amount', message: 'Enter a token amount greater than zero.' };
  }
  if (/contract|revert|execution reverted|call exception/i.test(text)) {
    if (operation === 'faucet') return { title: 'HMT claim failed', message: 'The HMT faucet could not complete this request. Check your wallet and try again.' };
    return { title: operation === 'withdraw' ? 'Withdrawal failed' : 'Lock could not be created', message: 'The smart contract rejected this request. Check the details and try again.' };
  }

  if (operation === 'connect') return { title: 'Connection failed', message: 'We could not connect your wallet. Check your wallet app or browser extension and try again.' };
  if (operation === 'withdraw') return { title: 'Withdrawal failed', message: 'The withdrawal could not be completed. Check your wallet and try again.' };
  if (operation === 'faucet') return { title: 'HMT claim failed', message: 'The HMT faucet could not complete this request. Check your wallet and try again.' };
  return { title: 'Lock could not be created', message: 'The transaction could not be completed. Check your wallet and try again.' };
}
