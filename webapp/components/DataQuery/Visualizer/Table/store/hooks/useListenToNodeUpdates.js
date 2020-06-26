import { useDispatch } from 'react-redux'

import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import { Query } from '@common/model/query'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as AppWebSocket from '@webapp/app/appWebSocket'

import { AppSavingActions } from '@webapp/store/app'

import { useOnUpdate } from '@webapp/components/hooks'

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
  const modeEdit = Query.isModeRawEdit(query)

  useOnUpdate(() => {
    if (modeEdit) {
      AppWebSocket.on(WebSocketEvents.nodesUpdateCompleted, () => dispatch(AppSavingActions.hideAppSaving()))
      AppWebSocket.on(WebSocketEvents.nodeValidationsUpdate, ({ recordUuid, validations }) => {
        // updating data if data is loaded in edit mode (rows have record property)
        if (data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], 'record')) {
          const dataUpdated = updateValidations({ data, recordUuid, validations })
          setData(dataUpdated)
        }
      })
    }

    return () => {
      AppWebSocket.off(WebSocketEvents.nodesUpdateCompleted)
      AppWebSocket.off(WebSocketEvents.nodeValidationsUpdate)
    }
  }, [modeEdit, data])
}
