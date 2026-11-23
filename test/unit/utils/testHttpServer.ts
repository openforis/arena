import http from 'node:http'
import type { AddressInfo } from 'node:net'

export type TestHttpHandler = (request: http.IncomingMessage, response: http.ServerResponse) => void

/**
 * Creates a local HTTP server that answers with its `handler` and counts the connections closed by the client.
 * @returns {object} The server: start it in beforeAll and stop it in afterAll.
 */
export const createTestHttpServer = () => {
  let server: http.Server
  const testServer = {
    port: 0,
    handler: (() => undefined) as TestHttpHandler,
    closedRequests: 0,
    /**
     * Starts listening on a free local port.
     * @returns {Promise<void>} Resolves when the server listens.
     */
    start: async () => {
      server = http.createServer((request, response) => {
        response.on('close', () => {
          testServer.closedRequests += 1
        })
        testServer.handler(request, response)
      })
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
      testServer.port = (server.address() as AddressInfo).port
    },
    /**
     * Closes the open connections and stops the server.
     * @returns {Promise<void>} Resolves when the server is closed.
     */
    stop: async () => {
      server.closeAllConnections()
      await new Promise((resolve) => server.close(resolve))
    },
    /**
     * Waits until the client has closed the connection of a request, or fails.
     * @param {number} maxMs - The time the client has to close it.
     * @returns {Promise<void>} Resolves when a request was closed.
     */
    untilClientClosed: async (maxMs: number) => {
      const start = Date.now()
      await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          if (testServer.closedRequests > 0 || Date.now() - start >= maxMs) {
            clearInterval(timer)
            resolve()
          }
        }, 10)
      })
      expect(testServer.closedRequests).toBeGreaterThan(0)
    },
  }
  return testServer
}
