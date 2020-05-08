import * as ProcessingChain from '@common/analysis/processingChain'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import { getSurveyDBSchema, dbTransformCallback } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

const selectFields = `uuid, props, validation, status_exec, ${DbUtils.selectDate('date_created')}, ${DbUtils.selectDate(
  'date_modified'
)}, ${DbUtils.selectDate('date_executed')}`

// ====== UPDATE

export const removeCyclesFromChains = async (surveyId, cycles, client = db) =>
  client.query(
    `UPDATE ${getSurveyDBSchema(surveyId)}.processing_chain
    SET props = jsonb_set(props, '{${ProcessingChain.keysProps.cycles}}',
      (props->'${ProcessingChain.keysProps.cycles}') ${cycles.map((cycle) => `- '${cycle}'`).join(' ')}
    )`
  )

// ====== DELETE

export const deleteChain = async (surveyId, processingChainUuid, client = db) =>
  client.one(
    `DELETE FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    WHERE uuid = $1
    RETURNING ${selectFields}`,
    [processingChainUuid],
    dbTransformCallback
  )

export const deleteChainsWithoutCycles = async (surveyId, client = db) =>
  client.query(
    `DELETE FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    WHERE jsonb_array_length(props->'${ProcessingChain.keysProps.cycles}') = 0`
  )
