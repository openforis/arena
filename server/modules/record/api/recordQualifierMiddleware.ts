import type { NextFunction, Request as ExpressRequest, Response } from 'express'

import { ArenaRecord, ArenaRecordNode, Authorizer, NodeDef, NodeDefType, Survey, User } from '@openforis/arena-core'
import { Requests } from '@openforis/arena-server'

import * as Record from '@core/record/record'
import * as SurveyUtils from '@core/survey/survey'
import * as UserUtils from '@core/user/user'
import { StatusCodes } from '@core/systemError'

import * as Request from '@server/utils/request'
import UnauthorizedError from '@server/utils/unauthorizedError'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

type QualifierFilter = { nodeDef: NodeDef<NodeDefType>; value: unknown }

// see SurveyManager.fetchUserGroupAccessFilters
type UserGroupAccessFilters = {
  own: QualifierFilter[]
  readable: QualifierFilter[][]
}

type SurveyAndAccessFilters = { survey: Survey; accessFilters: UserGroupAccessFilters }

type FetchSurveyAndAccessFiltersByCycle = (cycle: string) => Promise<SurveyAndAccessFilters>

// editable: the record belongs to the user's own group; readable: it belongs to the own group or to a readable one
type RecordAccessType = 'editable' | 'readable'

type RecordAccess = { [key in RecordAccessType]: boolean }

const sendForbiddenError = (req: ExpressRequest, res: Response): void => {
  const error = new UnauthorizedError(UserUtils.getName(Request.getUser(req)))
  res.status(StatusCodes.FORBIDDEN).send(JSON.stringify(error))
}

// Survey (with node defs) and user group access filters, keyed by cycle, cached for the lifetime of a single
// request: avoids refetching them once per record uuid when checking a batch of records in the same cycle.
const _fetchSurveyAndAccessFiltersByCycleCached = ({
  surveyId,
  user,
}: {
  surveyId: number
  user: User
}): FetchSurveyAndAccessFiltersByCycle => {
  const cacheByCycle = new Map<string, SurveyAndAccessFilters>()
  return async (cycle) => {
    let cached = cacheByCycle.get(cycle)
    if (!cached) {
      const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })
      const accessFilters = await SurveyManager.fetchUserGroupAccessFilters({ user, survey })
      cached = { survey, accessFilters }
      cacheByCycle.set(cycle, cached)
    }
    return cached
  }
}

const _determineRecordAccessByUserGroup = async ({
  user,
  surveyId,
  recordUuid,
  pendingNode = null,
  fetchSurveyAndAccessFiltersByCycle,
}: {
  user: User
  surveyId: number
  recordUuid: string
  pendingNode?: ArenaRecordNode | null
  fetchSurveyAndAccessFiltersByCycle: FetchSurveyAndAccessFiltersByCycle
}): Promise<RecordAccess> => {
  const record: ArenaRecord | null = await RecordManager.fetchRecordAndNodesByUuid({
    surveyId,
    recordUuid,
    fetchForUpdate: false,
    includeRefData: false,
  })
  // let the actual route handler deal with a missing record (e.g. respond with 404)
  if (!record) return { readable: true, editable: true }

  const { survey, accessFilters } = await fetchSurveyAndAccessFiltersByCycle(Record.getCycle(record))
  const { own, readable } = accessFilters

  const canEditQualifierValue = Authorizer.canEditQualifierAttributeValue(user, SurveyUtils.getSurveyInfo(survey))

  // pendingNode is passed through rather than merged into the record via Record.assocNode: the record
  // was fetched with fetchForUpdate: false, so its _nodesIndex hasn't been built, and assocNode would
  // initialize one containing only pendingNode, shadowing every other already-persisted node (see
  // recordMatchesQualifierFilters' jsdoc for details)
  const editable: boolean = RecordManager.recordMatchesQualifierFilters({
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
  (accessType: RecordAccessType) =>
  async (req: ExpressRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { surveyId, recordUuid } = Request.getParams(req)
      const user = Request.getUser(req)
      // a node to be created/updated is checked too, so an edit can't move the record out of the user's group
      const pendingNode = accessType === 'editable' ? Request.getJsonParam(req, 'node') : null

      const access = await _determineRecordAccessByUserGroup({
        user,
        surveyId,
        recordUuid,
        pendingNode,
        fetchSurveyAndAccessFiltersByCycle: _fetchSurveyAndAccessFiltersByCycleCached({ surveyId, user }),
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

const _getRecordUuidsParam = (req: ExpressRequest): string[] => Requests.getArrayParam('recordUuids')(req) as string[]

const _getMergeRecordUuidsParams = (req: ExpressRequest): string[] => {
  const { sourceRecordUuid, targetRecordUuid } = Request.getParams(req)
  return [sourceRecordUuid, targetRecordUuid]
}

const _requireRecordsAccess =
  (accessType: RecordAccessType, getRecordUuids: (req: ExpressRequest) => string[] = _getRecordUuidsParam) =>
  async (req: ExpressRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { surveyId } = Request.getParams(req)
      const recordUuids = getRecordUuids(req)

      if (recordUuids.length === 0) {
        next()
        return
      }

      const user = Request.getUser(req)
      const fetchSurveyAndAccessFiltersByCycle = _fetchSurveyAndAccessFiltersByCycleCached({ surveyId, user })

      for (const recordUuid of recordUuids) {
        const access = await _determineRecordAccessByUserGroup({
          user,
          surveyId,
          recordUuid,
          fetchSurveyAndAccessFiltersByCycle,
        })
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
 * Rejects requests modifying a record that doesn't belong to the current user's group (based on the record's
 * qualifier attribute values), when the user belongs to a UserGroup with qualifiers.
 */
export const requireRecordMatchesUserGroupQualifiers = _requireRecordAccess('editable')

/**
 * Plural variant of requireRecordMatchesUserGroupQualifiers, for batch endpoints (`recordUuids` param).
 */
export const requireRecordsMatchUserGroupQualifiers = _requireRecordsAccess('editable')

/**
 * Rejects requests reading a record that belongs neither to the current user's group
 * nor to one of the groups whose records the user's group can read (UserGroup readableGroupUuids).
 */
export const requireRecordReadableByUserGroup = _requireRecordAccess('readable')

/**
 * Plural variant of requireRecordReadableByUserGroup, for batch endpoints (`recordUuids` param).
 */
export const requireRecordsReadableByUserGroup = _requireRecordsAccess('readable')

/**
 * Variant of requireRecordsMatchUserGroupQualifiers for the records merge endpoint (source and target record params).
 */
export const requireMergeRecordsMatchUserGroupQualifiers = _requireRecordsAccess('editable', _getMergeRecordUuidsParams)
