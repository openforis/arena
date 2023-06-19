import { useSelector } from 'react-redux'
import * as Record from '@core/record/record'

import * as RecordState from '../state'

export const useRecord = () => useSelector(RecordState.getRecord)
export const useRecordNode = ({ nodeUuid }) => {
  const record = useSelector(RecordState.getRecord)
  return nodeUuid && record ? Record.getNodeByUuid(nodeUuid)(record) : null
}
export const useIsRecordViewWithoutHeader = () => useSelector(RecordState.hasNoHeader)
