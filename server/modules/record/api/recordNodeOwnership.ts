import type { Request as ExpressRequest, Response as ExpressResponse } from 'express'

import SystemError, { StatusCodes } from '@core/systemError'
import { isUuid } from '@core/uuid'
import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as NodeRepository from '../repository/nodeRepository'
import { NodesBatchMessageKeys } from '../service/update/nodesBatch/nodesBatchTypes'

type FetchNodeRecordUuid = (surveyId: number, nodeUuid: string) => Promise<string | null>

/**
 * Creates the middleware refusing a node deletion whose :nodeUuid belongs to another record than :recordUuid
 * (the delete query only filters by node uuid).
 * @param {Function} fetchNodeRecordUuid - Returns the record uuid of a node, or null (injectable for tests).
 * @returns {Function} The Express middleware.
 */
export const createRequireNodeUuidBelongsToRecord =
  (fetchNodeRecordUuid: FetchNodeRecordUuid) =>
  async (req: ExpressRequest, res: ExpressResponse, next: (error?: unknown) => void): Promise<void> => {
    const { surveyId, recordUuid, nodeUuid } = Request.getParams(req)
    // a malformed uuid is refused before querying the database
    const validUuid = isUuid(String(nodeUuid))
    const nodeRecordUuid = validUuid ? await fetchNodeRecordUuid(surveyId, nodeUuid) : null
    // a node not found is let through: its create may still be queued in the records thread
    if (!validUuid || (nodeRecordUuid && nodeRecordUuid !== recordUuid)) {
      Response.sendErr(
        res,
        new SystemError(NodesBatchMessageKeys.nodeNotInRecord, { recordUuid }, StatusCodes.BAD_REQUEST)
      )
      return
    }
    next()
  }

export const requireNodeUuidBelongsToRecord = createRequireNodeUuidBelongsToRecord((surveyId, nodeUuid) =>
  NodeRepository.fetchNodeRecordUuid(surveyId, nodeUuid)
)
