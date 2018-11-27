class UserThreadsCache {

  constructor () {
    this.threadByUser = {}
  }

  getUserThread (userId) {
    return this.threadByUser[userId]
  }

  putUserThread (userId, worker) {
    this.threadByUser[userId] = worker
  }

  removeUserThread (userId) {
    delete this.threadByUser[userId]
  }

}

module.exports = UserThreadsCache