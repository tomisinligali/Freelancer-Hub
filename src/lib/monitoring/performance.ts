/**
 * Lightweight performance & request-duration monitoring utility (PRD §7.6 / Phase 7).
 * Tracks operation latency and logs warnings/alerts if latency exceeds standard 500ms target.
 */

const LATENCY_THRESHOLD_MS = 500;

export async function measurePerformance<T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;

    if (duration > LATENCY_THRESHOLD_MS) {
      console.warn(
        `[PERF ALERT] ${operationName} took ${duration.toFixed(2)}ms (exceeded ${LATENCY_THRESHOLD_MS}ms target threshold)`
      );
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(
      `[PERF ERROR] ${operationName} failed after ${duration.toFixed(2)}ms:`,
      error
    );
    throw error;
  }
}
