/**
 * Formats a target unlock timestamp into a live countdown string: "14d 08h 22m" or "00h 14m 32s"
 */
export function formatCountdown(unlockTimestamp: number, now: number = Date.now()): {
  text: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUnlocked: boolean;
} {
  const diff = unlockTimestamp - now;

  if (diff <= 0) {
    return {
      text: '00d 00h 00m 00s',
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isUnlocked: true,
    };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Format as shown in mock: "14d 08h 22m" (or with seconds if under 1 day)
  const text = days > 0
    ? `${days}d ${pad(hours)}h ${pad(minutes)}m`
    : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

  return {
    text,
    days,
    hours,
    minutes,
    seconds,
    isUnlocked: false,
  };
}

/**
 * Calculates progress percentage between lock time and unlock time (0 to 100)
 */
export function calculateProgress(lockedAt: number, unlocksAt: number, now: number = Date.now()): number {
  if (now >= unlocksAt) return 100;
  if (now <= lockedAt) return 0;

  const totalDuration = unlocksAt - lockedAt;
  const elapsed = now - lockedAt;

  if (totalDuration <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
}

/**
 * Truncates an Ethereum address or hash: 0x7a2...4f9c
 */
export function formatAddress(address: string, startChars = 5, endChars = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats USD currency values with compact suffix ($1.24M, $45.2K) or full currency
 */
export function formatUsdCompact(val: number): string {
  if (val >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(2)}M`;
  }
  if (val >= 1_000) {
    return `$${(val / 1_000).toFixed(1)}K`;
  }
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats token amount with commas
 */
export function formatTokenAmount(amount: number | string, maxDecimals = 2): string {
  const value = String(amount);
  const [integerPart, fractionPart = ''] = value.split('.');
  const groupedInteger = (integerPart || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = fractionPart.slice(0, maxDecimals).padEnd(maxDecimals, '0');
  return `${groupedInteger}.${fraction}`;
}
