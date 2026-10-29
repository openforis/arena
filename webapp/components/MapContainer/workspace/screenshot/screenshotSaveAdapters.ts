import axios from 'axios'
import { Dates } from '@openforis/arena-core'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

import * as AppWebSocket from '@webapp/app/appWebSocket'

import {
  buildNodePersistFields,
  fieldsToFormData,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotNode'
import type { NodeSaveSubscribe } from '@webapp/components/MapContainer/workspace/screenshot/screenshotSave'

const UPLOAD_TIMEOUT_MS = 120000

/**
 * Listens to the socket events that end a record update.
 * @param {object} handlers - The handlers for the nodes update, completion and error.
 * @returns {Function} Stops listening.
 */
export const subscribeToNodeSaveEvents: NodeSaveSubscribe = ({ onNodesUpdate, onCompleted, onError }) => {
  AppWebSocket.on(WebSocketEvents.nodesUpdate, onNodesUpdate)
  AppWebSocket.on(WebSocketEvents.nodesUpdateCompleted, onCompleted)
  AppWebSocket.on(WebSocketEvents.applicationError, onError)
  return () => {
    AppWebSocket.off(WebSocketEvents.nodesUpdate, onNodesUpdate)
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
  async (recordUuid: string): Promise<unknown> => {
    const { data } = await axios.get(`/api/survey/${surveyId}/record`, {
      params: { recordUuid },
      errorHandledLocally: true,
    } as object)
    return data
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
    const fields = buildNodePersistFields({
      node,
      cycle: Record.getCycle(record) ?? fallbackCycle,
      timezoneOffset: Dates.getTimezoneOffset(),
      lang,
      file: blob,
      fileName,
    })
    // errors are shown in the dialog, not by the global service error handler
    const requestConfig = { errorHandledLocally: true, timeout: UPLOAD_TIMEOUT_MS }
    await axios.post(
      `/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/node`,
      fieldsToFormData(fields, new FormData()),
      requestConfig
    )
  }
