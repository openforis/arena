import { useSelector } from 'react-redux'

import { NodeDefs, Nodes, Objects, Records, Surveys } from '@openforis/arena-core'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import { SurveyState } from '@webapp/store/survey'
import * as RecordState from '../state'

export const useRecord = () => useSelector(RecordState.getRecord)

export const useRecordNode = ({ nodeIId }) => {
  const record = useSelector(RecordState.getRecord)
  return nodeIId && record ? Record.getNodeByInternalId(nodeIId)(record) : null
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
    return parentCodeAttribute ? [...Node.getHierarchyCode(parentCodeAttribute), Node.getIId(parentCodeAttribute)] : []
  }, Objects.isEqual)

export const useIsRecordViewWithoutHeader = () => useSelector(RecordState.hasNoHeader)

const useNodesCount = ({ parentNodeIId, nodeDefUuid, countType }) =>
  useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefUuid })
    const count = NodeDefs.getCount(nodeDef, countType)
    if (Objects.isEmpty(count)) return undefined
    if (Array.isArray(count)) {
      // count is an array of expressions
      const record = RecordState.getRecord(state)
      if (!record) return undefined
      const parentNode = Records.getNodeByInternalId(parentNodeIId)(record)
      return Nodes.getChildrenMinOrMaxCount({ parentNode, nodeDef, countType })
    }
    // count is constant value (backward compatibility)
    return Number(count)
  })

export const useNodesMaxCount = ({ parentNodeIId, nodeDefUuid }) =>
  useNodesCount({ parentNodeIId, nodeDefUuid, countType: NodeDefValidations.keys.max })

export const useNodesMinCount = ({ parentNodeIId, nodeDefUuid }) =>
  useNodesCount({ parentNodeIId, nodeDefUuid, countType: NodeDefValidations.keys.min })
