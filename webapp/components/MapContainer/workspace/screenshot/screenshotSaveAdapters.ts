import axios from 'axios'
import { Dates } from '@openforis/arena-core'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

import * as AppWebSocket from '@webapp/app/appWebSocket'

import * as API from '@webapp/service/api'

import { buildNodeFormData } from '@webapp/components/MapContainer/workspace/screenshot/screenshotNode'
import type { NodeSaveSubscribe } from '@webapp/components/MapContainer/workspace/screenshot/screenshotSave'

const UPLOAD_TIMEOUT_MS = 120000

/**
 * Listens to the socket events that end a record update.
 * @param {object} handlers - The handlers for the nodes update, completion and error.
 * @returns {Function} Stops listening.
 */
export const subscribeToNodeSaveEvents: NodeSaveSubscribe = ({
  onNodesUpdate,
  onCompleted,
  onError,
  onClearNonApplicableConfirm,
}) => {
  AppWebSocket.on(WebSocketEvents.nodesUpdate, onNodesUpdate)
  AppWebSocket.on(WebSocketEvents.nodesUpdateClearNonApplicableValuesConfirm, onClearNonApplicableConfirm)
  AppWebSocket.on(WebSocketEvents.nodesUpdateCompleted, onCompleted)
  AppWebSocket.on(WebSocketEvents.applicationError, onError)
  return () => {
    AppWebSocket.off(WebSocketEvents.nodesUpdate, onNodesUpdate)
    AppWebSocket.off(WebSocketEvents.nodesUpdateClearNonApplicableValuesConfirm, onClearNonApplicableConfirm)
    AppWebSocket.off(WebSocketEvents.nodesUpdateCompleted, onCompleted)
    AppWebSocket.off(WebSocketEvents.applicationError, onError)
  }
}

/**
 * Creates the function fetching a record with its nodes. The request error is handled locally (it is shown in the
 * dialog): the global error notification would be hidden behind the full screen map.
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - The survey id.
 * @returns {Function} The record fetcher.
 */
export const createRecordFetcher =
  ({ surveyId }: { surveyId: number }) =>
  async (recordUuid: string): Promise<unknown> =>
    API.fetchRecordAndNodes({ surveyId, recordUuid, errorHandledLocally: true })

/**
 * Creates the function checking the record out: the node requests associate this browser socket with the record, and
 * only the checkout dissociates it (the record editor does the same on exit).
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - The survey id.
 * @returns {Function} The checkout function.
 */
export const createRecordCheckOut =
  ({ surveyId }: { surveyId: number }) =>
  async (recordUuid: string): Promise<void> => {
    await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/checkout`, undefined, {
      errorHandledLocally: true,
    } as object)
  }

/**
 * Creates the function deleting a node (the empty entity row left by a failed save).
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - The survey id.
 * @param {string} params.lang - The UI language.
 * @param {string} params.fallbackCycle - Cycle used when the record has none.
 * @returns {Function} The node deleter.
 */
export const createNodeDeleter =
  ({ surveyId, lang, fallbackCycle }: { surveyId: number; lang: string; fallbackCycle: string }) =>
  async ({ record, nodeUuid }: { record: unknown; nodeUuid: string }): Promise<void> => {
    await axios.delete(`/api/survey/${surveyId}/record/${Record.getUuid(record)}/node/${nodeUuid}`, {
      data: {
        cycle: Record.getCycle(record) ?? fallbackCycle,
        draft: false,
        timezoneOffset: Dates.getTimezoneOffset(),
        lang,
      },
      errorHandledLocally: true,
    } as object)
  }

/**
 * Creates the function posting a node, with its file if any, to the node endpoint (the socket id header is added by the
 * axios interceptor of appWebSocket).
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - The survey id.
 * @param {string} params.lang - The UI language.
 * @param {string} params.fallbackCycle - Cycle used when the record has none.
 * @returns {Function} The poster.
 */
export const createNodePoster =
  ({ surveyId, lang, fallbackCycle }: { surveyId: number; lang: string; fallbackCycle: string }) =>
  async ({
    record,
    node,
    blob,
    fileName,
  }: {
    record: unknown
    node: unknown
    blob?: Blob | null
    fileName?: string
  }) => {
    const formData = buildNodeFormData({
      node,
      cycle: Record.getCycle(record) ?? fallbackCycle,
      timezoneOffset: Dates.getTimezoneOffset(),
      lang,
      file: blob,
      fileName,
    })
    // errors are shown in the dialog, not by the global service error handler
    const requestConfig = { errorHandledLocally: true, timeout: UPLOAD_TIMEOUT_MS }
    await axios.post(`/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/node`, formData, requestConfig)
  }
