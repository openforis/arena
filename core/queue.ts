export default class Queue<T> {
	private data: T[] = [];

  constructor (items: T[] = []) {
    this.data = []
    this.enqueueItems(items)
  }

  enqueue (item: T) {
    this.data.unshift(item)
  }

  enqueueItems (items: T[]) {
    for (const item of items) {
      this.enqueue(item)
    }
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
