export default class ThreadsCache {
	private threads: {};

  constructor () {
    this.threads = {}
  }

  getThread (key) {
    return this.threads[key]
  }

  putThread (key, worker) {
    this.threads[key] = worker
    return worker
  }

  removeThread (key) {
    delete this.threads[key]
  }

}
