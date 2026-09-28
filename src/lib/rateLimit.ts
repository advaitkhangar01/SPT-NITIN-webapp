interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const tracker = new Map<string, RateLimitRecord>();

// Periodic cleanup every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    tracker.forEach((value, key) => {
      if (now > value.resetTime) {
        tracker.delete(key);
      }
    });
  }, 5 * 60 * 1000);
  if (timer.unref) {
    timer.unref();
  }
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 15 * 60 * 1000, max: 10 }
): { success: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const record = tracker.get(identifier);

  if (!record || now > record.resetTime) {
    tracker.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      success: true,
      remaining: options.max - 1,
      resetInSec: Math.ceil(options.windowMs / 1000),
    };
  }

  record.count += 1;
  const remaining = Math.max(0, options.max - record.count);
  const resetInSec = Math.ceil((record.resetTime - now) / 1000);

  if (record.count > options.max) {
    return {
      success: false,
      remaining: 0,
      resetInSec,
    };
  }

  return {
    success: true,
    remaining,
    resetInSec,
  };
}

export function resetRateLimit(identifier: string): void {
  tracker.delete(identifier);
}
