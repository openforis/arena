export default class ThreadsCache<T = any> {
  readonly threads: Map<string, T>

  constructor() {
    this.threads = new Map()
  }

  getThread(key: string): T | undefined {
    return this.threads.get(key)
  }

  findThreadsKeys(keyFilterFunction: (key: string) => boolean): string[] {
    const result: string[] = []
    for (const key of this.threads.keys()) {
      if (keyFilterFunction(key)) {
        result.push(key)
      }
    }
    return result
  }

  putThread(key: string, worker: T): T {
    this.threads.set(key, worker)
    return worker
  }

  removeThread(key: string): void {
    this.threads.delete(key)
  }
}
