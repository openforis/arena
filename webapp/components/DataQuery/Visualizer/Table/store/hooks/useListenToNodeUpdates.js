import { useEffect, useRef } from 'react'
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

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    // listening to websocket node update events when data is loaded in edit mode (rows have record property)
    if (modeEdit && Object.prototype.hasOwnProperty.call(data[0], 'record')) {
      // when start editing, create a clone of the data
      dataClone.current = [...data]

      AppWebSocket.on(WebSocketEvents.nodesUpdate, (nodes) => {
        dataClone.current = updateValues({ data: dataClone.current, nodes })
      })
      AppWebSocket.on(WebSocketEvents.nodeValidationsUpdate, ({ recordUuid, validations }) => {
        dataClone.current = updateValidations({ data, recordUuid, validations })
      })
      AppWebSocket.on(WebSocketEvents.nodesUpdateCompleted, () => {
        setData(dataClone.current)
        dispatch(AppSavingActions.hideAppSaving())
      })

      return () => {
        dataClone.current = []
        AppWebSocket.off(WebSocketEvents.nodesUpdate)
        AppWebSocket.off(WebSocketEvents.nodesUpdateCompleted)
        AppWebSocket.off(WebSocketEvents.nodeValidationsUpdate)
      }
    }
  }, [modeEdit, data])
}
