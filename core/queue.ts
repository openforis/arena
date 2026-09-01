export default class Queue<T = unknown> {
  private data: T[] = []

  constructor(items: T[] = []) {
    this.enqueueItems(items)
  }

  enqueue(item: T): void {
    this.data.unshift(item)
  }

  enqueueItems(items: T[]): void {
    for (const item of items) {
      this.enqueue(item)
    }
  }

  dequeue(): T | undefined {
    return this.data.pop()
  }

  first(): T | undefined {
    return this.data[this.size() - 1]
  }

  last(): T | undefined {
    return this.data[0]
  }

  size(): number {
    return this.data.length
  }

  isEmpty(): boolean {
    return this.size() === 0
  }
}
