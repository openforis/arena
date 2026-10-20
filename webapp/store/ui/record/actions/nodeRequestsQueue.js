// Node persist/delete requests are sent one at a time, in the order they have been generated.
// Sent concurrently, they could reach the server in a different order: e.g. the update of an attribute
// of an entity just added could be processed before the entity itself (which does not exist yet).
let queueTail = Promise.resolve()

/**
 * Enqueues a node request: it will be sent once all the previously enqueued requests have completed.
 * @param {function(): Promise<object>} sendRequest - Function sending the request.
 * @returns {Promise<object>} - The response of the request.
 */
export const enqueueNodeRequest = (sendRequest) => {
  // run the request even if the previous one failed
  const request = queueTail.then(sendRequest, sendRequest)
  // don't let a failed request block the next ones
  queueTail = request.catch(() => {})
  return request
}
