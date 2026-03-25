/**
 * Simple Mutex Implementation for preventing race conditions
 *
 * Story 6-4 Code Review Fix: Prevent dual-write race conditions
 */

export class Mutex {
  private queue: Array<() => void> = [];
  private locked = false;

  /**
   * Execute callback exclusively (one at a time)
   */
  async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
    // Wait for lock to be released
    await this.acquire();

    try {
      return await callback();
    } finally {
      this.release();
    }
  }

  private async acquire(): Promise<void> {
    return new Promise<void>(resolve => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  private release(): void {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift()!;
      resolve();
    } else {
      this.locked = false;
    }
  }
}

/**
 * Singleton mutex for study record operations
 * Prevents race conditions in dual-write (MySQL + AsyncStorage)
 */
export const studyRecordMutex = new Mutex();
