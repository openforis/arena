import { useCallback, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'
import { Query } from '@common/model/query'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as AppWebSocket from '@webapp/app/appWebSocket'

import { AppSavingActions } from '@webapp/store/app'

const updateValues = ({ data, nodes }) =>
  Object.values(nodes).reduce(
    (dataAccumulator, node) =>
      dataAccumulator.map((row) => {
        const rowClone = { ...row }
        const nodeDefUuid = Node.getNodeDefUuid(node)
        const colNodeDef = row.cols[nodeDefUuid]
        if (colNodeDef && Node.isEqual(colNodeDef.node)(node)) {
          rowClone.cols[nodeDefUuid] = {
            ...colNodeDef,
            node: Node.isDeleted(node) ? null : node,
          }
        }
        return rowClone
      }),
    data
  )

const updateValidations = ({ data, recordUuid, validations }) =>
  data.map((row) => {
    const { record } = row
    if (Record.getUuid(record) === recordUuid) {
      const validation = Validation.getValidation(record)
      return {
        ...row,
        record: {
          ...record,
          [Validation.keys.validation]: Validation.mergeValidation(validations)(validation),
        },
      }
    }
    return row
  })

export const useListenOnNodeUpdates = ({ data, query, setData }) => {
  const dispatch = useDispatch()
  const dataClone = useRef([])
  const modeEdit = Query.isModeRawEdit(query)

  // listening to websocket events when data is loaded in edit mode and rows have record property
  const listeningToWebSocket = modeEdit && data?.length > 0 && Object.prototype.hasOwnProperty.call(data[0], 'record')

  const onNodesUpdate = useCallback(({ updatedNodes }) => {
    dataClone.current = updateValues({ data: dataClone.current, nodes: updatedNodes })
  }, [])

  const onNodeValidationsUpdate = useCallback(
    ({ recordUuid, validations }) => {
      dataClone.current = updateValidations({ data, recordUuid, validations })
    },
    [data]
  )

  const onNodesUpdateCompleted = useCallback(() => {
    setData(dataClone.current)
    dispatch(AppSavingActions.hideAppSaving())
  }, [])

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (listeningToWebSocket) {
      // when start editing, create a clone of the data
      dataClone.current = [...data]

      AppWebSocket.on(WebSocketEvents.nodesUpdate, onNodesUpdate)
      AppWebSocket.on(WebSocketEvents.nodeValidationsUpdate, onNodeValidationsUpdate)
      AppWebSocket.on(WebSocketEvents.nodesUpdateCompleted, onNodesUpdateCompleted)

      return () => {
        dataClone.current = []
        AppWebSocket.off(WebSocketEvents.nodesUpdate, onNodesUpdate)
        AppWebSocket.off(WebSocketEvents.nodeValidationsUpdate, onNodeValidationsUpdate)
        AppWebSocket.off(WebSocketEvents.nodesUpdateCompleted, onNodesUpdateCompleted)
      }
    }
  }, [listeningToWebSocket, onNodesUpdate, onNodeValidationsUpdate, onNodesUpdateCompleted, data])
}
