import { useSelector } from 'react-redux'

import * as RecordState from '../state'

export const useRecord = () => useSelector(RecordState.getRecord)
export const useIsRecordViewWithoutHeader = () => useSelector(RecordState.hasNoHeader)
