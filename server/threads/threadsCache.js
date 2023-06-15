export default class ThreadsCache {
  constructor() {
    this.threads = new Map()
  }

  getThread(key) {
    return this.threads.get(key)
  }

  findThreadsKeys(keyFilterFunction) {
    const result = []
    for (let key of this.threads.keys()) {
      if (keyFilterFunction(key)) {
        result.push(key)
      }
    }
    return result
  }

  putThread(key, worker) {
    this.threads.set(key, worker)
    return worker
  }

  removeThread(key) {
    this.threads.delete(key)
  }
}
