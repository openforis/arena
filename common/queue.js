class Queue {

  constructor () {
    this.data = []
  }

  enqueue (item) {
    this.data.unshift(item)
  }

  dequeue () {
    return this.data.pop()
  }

  first () {
    return this.data[this.size() - 1]
  }

  last () {
    return this.data[0]
  }

  size () {
    return this.data.length
  }

  isEmpty () {
    return this.size() === 0
  }

}

module.exports = Queue