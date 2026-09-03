type RateLimitEntry = { count: number; resetAt: number };

export function createRateLimiter({ limit = 5, windowMs = 60_000 } = {}) {
  const entries = new Map<string, RateLimitEntry>();
  return (key: string, now = Date.now()): boolean => {
    const current = entries.get(key);
    if (!current || current.resetAt <= now) {
      entries.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (current.count >= limit) return false;
    current.count += 1;
    return true;
  };
}

export const allowInquiryRequest = createRateLimiter();
