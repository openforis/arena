import { useSelector } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

import { SurveyState } from '@webapp/store/survey'

import * as RecordState from '../state'

export const useRecord = () => useSelector(RecordState.getRecord)
export const useRecordNode = ({ nodeUuid }) => {
  const record = useSelector(RecordState.getRecord)
  return nodeUuid && record ? Record.getNodeByUuid(nodeUuid)(record) : null
}
export const useRecordParentCategoryItemUuid = ({ nodeDef, parentNode }) =>
  useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const record = RecordState.getRecord(state)
    const nodeParentCode = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
    return Node.getCategoryItemUuid(nodeParentCode)
  })
export const useRecordCodeAttributesUuidsHierarchy = ({ nodeDef, parentNode }) =>
  useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const record = RecordState.getRecord(state)
    const parentCodeAttribute = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
    return parentCodeAttribute ? [...Node.getHierarchyCode(parentCodeAttribute), Node.getUuid(parentCodeAttribute)] : []
  }, Objects.isEqual)
export const useIsRecordViewWithoutHeader = () => useSelector(RecordState.hasNoHeader)
