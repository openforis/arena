/**
 * The app side of Apply for the conversation controller: the designer's appliers on the redux store, and the batch
 * endpoint of record edits.
 */
import { Dates } from '@openforis/arena-core'

import { applierDepsReady, createApplierDeps } from '@webapp/ai/changeSets/applierDeps'
import { applyChangeSet } from '@webapp/ai/changeSets/applyChangeSet'
import { summarizeResults } from '@webapp/ai/changeSets/describeOperation'
import { summarizeRecordEditResults } from '@webapp/ai/changeSets/recordEdits/recordEditCardModel'
import {
  applyRecordEdits as applyRecordEditsRequest,
  toChunkErrorResult,
} from '@webapp/ai/changeSets/recordEdits/recordEditsApplier'
import type { OperationResult } from '@webapp/ai/changeSets/types'

import type { AssistantCardAppliers } from './assistantConversationController'

type ReduxStore = { dispatch: (action: any) => any; getState: () => any }

/**
 * Creates the card appliers of the conversation controller.
 * @param {ReduxStore} reduxStore - The app store.
 * @returns {AssistantCardAppliers} The appliers.
 */
export const createCardAppliers = (reduxStore: ReduxStore): AssistantCardAppliers => ({
  applyOperations: async ({ changeSet, operationIds }) => {
    const deps = createApplierDeps({ dispatch: reduxStore.dispatch, getState: reduxStore.getState })
    // the card disables Apply while the designer has an unsaved edit; checked again here
    if (!applierDepsReady(deps)) return null
    const results = await applyChangeSet({ changeSet, operationIds, deps })
    return { results, note: summarizeResults({ changeSet, results, survey: deps.getSurvey() }) }
  },
  applyRecordEdits: async ({ changeSet, operationIds, cycle, lang, onProgress }) => {
    let results: OperationResult[]
    try {
      results = await applyRecordEditsRequest({
        changeSet,
        operationIds,
        cycle,
        timezoneOffset: Dates.getTimezoneOffset(),
        lang,
        onProgress,
      })
    } catch (error) {
      // the card shows the edits as failed instead of an unhandled rejection
      results = operationIds.map((operationId) => toChunkErrorResult(operationId, error))
    }
    return { results, note: summarizeRecordEditResults({ changeSet, results }) }
  },
})
