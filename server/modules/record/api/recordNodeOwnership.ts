import SystemError, { StatusCodes } from '@core/systemError'
import * as Node from '@core/record/node'
import { isUuid } from '@core/uuid'

import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as NodeRepository from '../repository/nodeRepository'
import { NodesBatchMessageKeys } from '../service/update/nodesBatch/nodesBatchTypes'

/**
 * Returns the error to send when a node doesn't belong to the record whose permissions were checked.
 * @param {object} params - The parameters.
 * @param {object|null} params.node - The node sent by the client.
 * @param {string} params.recordUuid - The record of the URL.
 * @returns {SystemError|null} A 400 error, or null when the node belongs to the record (or there is no node).
 */
export const getNodeRecordMismatchError = ({
  node,
  recordUuid,
}: {
  node: any
  recordUuid: string
}): SystemError | null => {
  if (!node) return null
  if (Node.getRecordUuid(node) === recordUuid) return null
  return new SystemError(NodesBatchMessageKeys.nodeNotInRecord, { recordUuid }, StatusCodes.BAD_REQUEST)
}

/**
 * Refuses a node update whose node belongs to another record than the URL's :recordUuid
 * (the permissions are checked on the URL record, the thread writes to the node's record).
 * @param {object} req - Express request.
 * @param {object} res - Express response.
 * @param {Function} next - Next middleware.
 * @returns {void}
 */
export const requireNodeBelongsToRecord = (req: any, res: any, next: (error?: unknown) => void): void => {
  try {
    const { recordUuid } = Request.getParams(req)
    const node = Request.getJsonParam(req, 'node')
    const error = getNodeRecordMismatchError({ node, recordUuid })
    if (error) {
      Response.sendErr(res, error)
      return
    }
    next()
  } catch (error) {
    next(error)
  }
}

type FetchNodeRecordUuid = (surveyId: number, nodeUuid: string) => Promise<string | null>

/**
 * Creates the middleware refusing a node deletion whose :nodeUuid belongs to another record than :recordUuid
 * (the delete query only filters by node uuid).
 * @param {Function} fetchNodeRecordUuid - Returns the record uuid of a node, or null (injectable for tests).
 * @returns {Function} The Express middleware.
 */
export const createRequireNodeUuidBelongsToRecord =
  (fetchNodeRecordUuid: FetchNodeRecordUuid) =>
  async (req: any, res: any, next: (error?: unknown) => void): Promise<void> => {
    try {
      const { surveyId, recordUuid, nodeUuid } = Request.getParams(req)
      // a malformed uuid is refused before querying the database
      const nodeRecordUuid = isUuid(String(nodeUuid)) ? await fetchNodeRecordUuid(surveyId, nodeUuid) : null
      if (nodeRecordUuid !== recordUuid) {
        Response.sendErr(
          res,
          new SystemError(NodesBatchMessageKeys.nodeNotInRecord, { recordUuid }, StatusCodes.BAD_REQUEST)
        )
        return
      }
      next()
    } catch (error) {
      next(error)
    }
  }

export const requireNodeUuidBelongsToRecord = createRequireNodeUuidBelongsToRecord((surveyId, nodeUuid) =>
  NodeRepository.fetchNodeRecordUuid(surveyId, nodeUuid)
)
