/**
 * Simple async rate limiter
 * Ensures we don't exceed API rate limits
 */

export class RateLimiter {
  private queue: Array<() => void> = [];
  private processing = false;
  private lastExecutionTime = 0;

  constructor(private delayMs: number) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    // Ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastExecution = now - this.lastExecutionTime;
    if (timeSinceLastExecution < this.delayMs) {
      await this.sleep(this.delayMs - timeSinceLastExecution);
    }

    const task = this.queue.shift();
    if (task) {
      this.lastExecutionTime = Date.now();
      await task();
    }

    // Process next
    this.processQueue();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
