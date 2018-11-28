class ThreadsCache {

  constructor () {
    this.threads = {}
  }

  getThread (key) {
    return this.threads[key]
  }

  putThread (key, worker) {
    this.threads[key] = worker
  }

  removeThread (key) {
    delete this.threads[key]
  }

}

module.exports = ThreadsCache