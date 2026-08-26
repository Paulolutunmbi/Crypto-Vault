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

export function readableError(error: unknown, operation: 'connect' | 'create' | 'withdraw' | 'switch' = 'create'): ReadableBlockchainError {
  const candidate = (error && typeof error === 'object' ? error : {}) as ErrorLike;
  const text = getErrorText(error);
  const code = String(candidate.code ?? '');

  if (/user rejected|action rejected|user denied|denied|cancelled|canceled/i.test(text) || /4001|ACTION_REJECTED/i.test(code)) {
    return { title: 'Transaction cancelled', message: 'You cancelled the transaction in your wallet.' };
  }
  if (/insufficient funds|insufficient eth|not enough eth|gas required exceeds/i.test(text)) {
    return { title: 'Insufficient ETH', message: 'You need enough Sepolia ETH to pay the transaction fee.' };
  }
  if (/allowance|approve|transfer amount exceeds allowance/i.test(text)) {
    return { title: 'Insufficient token allowance', message: 'Approve enough MTK for this lock, then try again.' };
  }
  if (/insufficient mtk|insufficient token|transfer amount exceeds balance|exceeds balance/i.test(text)) {
    return { title: 'Insufficient MTK', message: 'You do not have enough MTK for this transaction.' };
  }
  if (/wrong network|connect to sepolia|chain/i.test(text) || operation === 'switch') {
    return { title: 'Wrong network', message: 'Please switch your wallet back to Ethereum Sepolia.' };
  }
  if (/wallet not found|wallet not installed|metamask/i.test(text) && /not found|not installed|missing/i.test(text)) {
    return { title: 'Wallet not installed', message: 'Install MetaMask or another browser wallet to continue.' };
  }
  if (/disconnected|no accounts|not connected/i.test(text)) {
    return { title: 'Wallet disconnected', message: 'Connect your wallet again to continue.' };
  }
  if (/network|rpc|provider|timeout|could not detect network|failed to fetch/i.test(text)) {
    return { title: 'Blockchain unavailable', message: 'The network is temporarily unavailable. Check your wallet connection and try again.' };
  }
  if (/unlock.*(future|passed|close)|past|timelock.*(mature|unlock)|already withdrawn|withdrawn/i.test(text)) {
    return operation === 'withdraw'
      ? { title: 'Withdrawal unavailable', message: 'This lock is not ready for withdrawal, or it has already been withdrawn.' }
      : { title: 'Lock could not be created', message: 'The unlock time is no longer sufficiently in the future. Please choose a later time.' };
  }
  if (/invalid token|only mtk/i.test(text)) {
    return { title: 'Invalid token', message: 'Only MTK is currently supported by this frontend.' };
  }
  if (/invalid amount|valid amount|amount/i.test(text) && operation === 'create') {
    return { title: 'Invalid amount', message: 'Enter an MTK amount greater than zero.' };
  }
  if (/contract|revert|execution reverted|call exception/i.test(text)) {
    return { title: operation === 'withdraw' ? 'Withdrawal failed' : 'Lock could not be created', message: 'The smart contract rejected this request. Check the details and try again.' };
  }

  if (operation === 'connect') return { title: 'Connection failed', message: 'We could not connect your wallet. Try again from MetaMask.' };
  if (operation === 'withdraw') return { title: 'Withdrawal failed', message: 'The withdrawal could not be completed. Check your wallet and try again.' };
  return { title: 'Lock could not be created', message: 'The transaction could not be completed. Check your wallet and try again.' };
}
