export default class ThreadsCache {

  constructor () {
    this.threads = new Map()
  }

  getThread (key) {
    return this.threads.get(key)
  }

  putThread (key, worker) {
    this.threads.set(key, worker)
    return worker
  }

  removeThread (key) {
    this.threads.delete(key)
  }

}
