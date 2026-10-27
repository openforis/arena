import { Requests } from '@openforis/arena-server'

import * as Record from '@core/record/record'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import { Authorizer } from '@openforis/arena-core'
import { StatusCodes } from '@core/systemError'

import * as Request from '@server/utils/request'
import UnauthorizedError from '@server/utils/unauthorizedError'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

const sendForbiddenError = (req, res) => {
  const error = new UnauthorizedError(User.getName(Request.getUser(req)))
  res.status(StatusCodes.FORBIDDEN).send(JSON.stringify(error))
}

// Survey (with node defs), keyed by cycle, cached for the lifetime of a single request:
// avoids refetching it once per record uuid when checking a batch of records in the same cycle.
const _fetchSurveyByCycleCached =
  ({ surveyId, surveysByCycle }) =>
  async (cycle) => {
    if (!surveysByCycle.has(cycle)) {
      surveysByCycle.set(cycle, await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle }))
    }
    return surveysByCycle.get(cycle)
  }

// whether the record can be read and edited by the user, according to the user's group qualifiers
const _determineRecordAccessByUserGroup = async ({ user, surveyId, recordUuid, pendingNode, fetchSurveyByCycle }) => {
  const record = await RecordManager.fetchRecordAndNodesByUuid({
    surveyId,
    recordUuid,
    fetchForUpdate: false,
    includeRefData: false,
  })
  // let the actual route handler deal with a missing record (e.g. respond with 404)
  if (!record) return { readable: true, editable: true }

  const survey = await fetchSurveyByCycle(Record.getCycle(record))

  const { own, readable } = await SurveyManager.fetchUserGroupAccessFilters({ user, survey })

  const canEditQualifierValue = Authorizer.canEditQualifierAttributeValue(user, Survey.getSurveyInfo(survey))

  // pendingNode is passed through rather than merged into the record via Record.assocNode: the record
  // was fetched with fetchForUpdate: false, so its _nodesIndex hasn't been built, and assocNode would
  // initialize one containing only pendingNode, shadowing every other already-persisted node (see
  // recordMatchesQualifierFilters' jsdoc for details)
  const editable = RecordManager.recordMatchesQualifierFilters({
    survey,
    record,
    qualifierFilters: own,
    pendingNode,
    canEditQualifierValue,
  })
  return {
    editable,
    readable:
      editable ||
      readable.some((qualifierFilters) =>
        RecordManager.recordMatchesQualifierFilters({ survey, record, qualifierFilters })
      ),
  }
}

const _requireRecordAccess =
  ({ accessType }) =>
  async (req, res, next) => {
    try {
      const { surveyId, recordUuid } = Request.getParams(req)
      const user = Request.getUser(req)
      const pendingNode = accessType === 'editable' ? Request.getJsonParam(req, 'node') : null

      const surveysByCycle = new Map()
      const access = await _determineRecordAccessByUserGroup({
        user,
        surveyId,
        recordUuid,
        pendingNode,
        fetchSurveyByCycle: _fetchSurveyByCycleCached({ surveyId, surveysByCycle }),
      })
      if (access[accessType]) {
        next()
        return
      }
      sendForbiddenError(req, res)
    } catch (error) {
      next(error)
    }
  }

const _requireRecordsAccess =
  ({ accessType }) =>
  async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)
      const recordUuids = Requests.getArrayParam('recordUuids')(req)

      if (recordUuids.length === 0) {
        next()
        return
      }

      const user = Request.getUser(req)

      const surveysByCycle = new Map()
      const fetchSurveyByCycle = _fetchSurveyByCycleCached({ surveyId, surveysByCycle })

      for (const recordUuid of recordUuids) {
        const access = await _determineRecordAccessByUserGroup({ user, surveyId, recordUuid, fetchSurveyByCycle })
        if (!access[accessType]) {
          sendForbiddenError(req, res)
          return
        }
      }
      next()
    } catch (error) {
      next(error)
    }
  }

/**
 * Rejects requests modifying a single record that doesn't belong to the current user's group
 * (based on the record's qualifier attribute values), when the user belongs to a UserGroup with qualifiers.
 * If the request carries a node to be created/updated (e.g. a node edit request), the node's value is
 * applied to the record before checking, so an edit setting a qualifier attribute to a value outside the
 * user's group qualifiers is rejected too.
 * @param {object} req - Express request.
 * @param {object} res - Express response.
 * @param {Function} next - Express next middleware.
 * @returns {Promise<void>} - Resolves when the request has been passed on or rejected.
 */
export const requireRecordMatchesUserGroupQualifiers = _requireRecordAccess({ accessType: 'editable' })

/**
 * Plural variant of requireRecordMatchesUserGroupQualifiers, for batch endpoints:
 * rejects the request if any of the target records doesn't belong to the current user's group.
 * @param {object} req - Express request.
 * @param {object} res - Express response.
 * @param {Function} next - Express next middleware.
 * @returns {Promise<void>} - Resolves when the request has been passed on or rejected.
 */
export const requireRecordsMatchUserGroupQualifiers = _requireRecordsAccess({ accessType: 'editable' })

/**
 * Rejects requests reading a single record that belongs neither to the current user's group
 * nor to one of the groups whose records the user's group can read (UserGroup readableGroupUuids).
 * @param {object} req - Express request.
 * @param {object} res - Express response.
 * @param {Function} next - Express next middleware.
 * @returns {Promise<void>} - Resolves when the request has been passed on or rejected.
 */
export const requireRecordReadableByUserGroup = _requireRecordAccess({ accessType: 'readable' })

/**
 * Plural variant of requireRecordReadableByUserGroup, for batch endpoints.
 * @param {object} req - Express request.
 * @param {object} res - Express response.
 * @param {Function} next - Express next middleware.
 * @returns {Promise<void>} - Resolves when the request has been passed on or rejected.
 */
export const requireRecordsReadableByUserGroup = _requireRecordsAccess({ accessType: 'readable' })
