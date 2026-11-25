import { createNodesBatchReplyRegistry } from '@server/modules/record/service/update/nodesBatch/nodesBatchReplies'
import { createDefaultNodesBatchServiceDeps } from '@server/modules/record/service/update/nodesBatch/nodesBatchService'
import { RecordsUpdateThreadMessageTypes } from '@server/modules/record/service/update/thread/recordsThreadMessageTypes'
import { RecordsUpdateThread } from '@server/modules/record/service/update/thread/recordsUpdateThread'

const replies = createNodesBatchReplyRegistry()

// the worker thread doesn't run in the integration tests: process the messages in-process and route the replies
export class TestRecordsUpdateThread extends RecordsUpdateThread {
  messagesPosted: any[]

  constructor() {
    super({})
    this.messagesPosted = []
  }

  postMessage(msg: any) {
    this.messagesPosted.push(msg)
    if (msg.type === RecordsUpdateThreadMessageTypes.nodesBatchPersistResult) {
      replies.resolveReply(msg.content)
    }
  }
}

/**
 * Builds the dependencies of the nodes batch service that send the batch messages to an in-process thread.
 * @param {TestRecordsUpdateThread} thread - The thread.
 * @returns {object} The dependencies.
 */
export const createInProcessNodesBatchServiceDeps = (thread: TestRecordsUpdateThread) => ({
  ...createDefaultNodesBatchServiceDeps(),
  replies,
  postBatchMessage: (msg: any) => {
    void thread.onMessage(msg)
  },
})
