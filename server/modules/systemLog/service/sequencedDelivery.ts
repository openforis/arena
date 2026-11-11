// out of order items kept per stream before giving up on the missing ones
const maxBufferedItems = 100

/**
 * Delivers items in sequence order, per stream: cluster bus messages can arrive out of order
 * (they are published on different connections and big ones are relayed through a table).
 */
export class SequencedDelivery<T> {
  private readonly nextSeqByStream = new Map<string, number>()
  private readonly bufferByStream = new Map<string, Map<number, T>>()

  constructor(private readonly deliver: (item: T) => void) {}

  push({ streamId, seq, item }: { streamId: string; seq: number; item: T }): void {
    let nextSeq = this.nextSeqByStream.get(streamId) ?? 0
    // duplicate or already skipped
    if (seq < nextSeq) return

    let buffer = this.bufferByStream.get(streamId)
    if (!buffer) {
      buffer = new Map()
      this.bufferByStream.set(streamId, buffer)
    }
    buffer.set(seq, item)

    if (buffer.size > maxBufferedItems) {
      // a message has been lost: continue from the first buffered one
      nextSeq = Math.min(...buffer.keys())
    }
    while (buffer.has(nextSeq)) {
      const nextItem = buffer.get(nextSeq)
      buffer.delete(nextSeq)
      this.deliver(nextItem)
      nextSeq += 1
    }
    this.nextSeqByStream.set(streamId, nextSeq)
  }
}
