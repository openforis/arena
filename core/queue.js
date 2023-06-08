export default class Queue {
  constructor(items = []) {
    this.data = []
    this.enqueueItems(items)
  }

  enqueue(item) {
    this.data.unshift(item)
  }

  enqueueItems(items) {
    items.forEach((item) => this.enqueue(item))
  }

  dequeue() {
    return this.data.pop()
  }

  first() {
    return this.data[this.size() - 1]
  }

  last() {
    return this.data[0]
  }

  size() {
    return this.data.length
  }

  isEmpty() {
    return this.size() === 0
  }
}
