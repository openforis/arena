import { useSelector } from 'react-redux'

import { Objects, Surveys } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'

import { TreeSelectViewMode } from '@webapp/model'
import { SurveyState } from '@webapp/store/survey'

import * as SurveyFormState from './state'
import { RecordState } from '../record'

export const useNodeDefLabelType = () => useSelector(SurveyFormState.getNodeDefLabelType)

export const useTreeSelectViewMode = () => useSelector(SurveyFormState.getGlobalStateTreeSelectViewMode)

export const useIsEditingNodeDefInFullScreen = () => useTreeSelectViewMode() === TreeSelectViewMode.onlyPages

export const useActiveNodeDefUuid = () => useSelector(SurveyFormState.getFormActiveNodeDefUuid)

export const useNodeDefPage = () => useSelector(SurveyFormState.getFormActivePageNodeDef)

export const useShowPageNavigation = () => useSelector(SurveyFormState.showPageNavigation)

export const usePagesUuidMap = () => useSelector(SurveyFormState.getPagesUuidMap)

const visitSurveyEntityDefsInOwnPage = ({ survey, cycle, visitor }) => {
  const nodeDefRoot = Survey.getNodeDefRoot(survey)
  const stack = [nodeDefRoot]
  while (stack.length > 0) {
    const currentEntityDef = stack.pop()
    visitor(currentEntityDef)
    const childrenInOwnPage = Survey.getNodeDefChildrenInOwnPage({ nodeDef: currentEntityDef, cycle })(survey)
    stack.push(...childrenInOwnPage)
  }
}

export const useNotAvailableEntityPageUuids = ({ edit }) =>
  useSelector((state) => {
    const result = []
    const survey = SurveyState.getSurvey(state)
    const cycle = SurveyState.getSurveyCycleKey(state)
    const nodeDefRoot = Survey.getNodeDefRoot(survey)

    visitSurveyEntityDefsInOwnPage({
      survey,
      cycle,
      visitor: (currentEntityDef) => {
        const parentNodeArg = SurveyFormState.getFormPageParentNode(currentEntityDef)(state)
        if (
          !edit &&
          !parentNodeArg &&
          !NodeDef.isRoot(currentEntityDef) &&
          NodeDef.getParentUuid(currentEntityDef) !== NodeDef.getUuid(nodeDefRoot)
        ) {
          result.push(currentEntityDef)
        }
      },
    })

    return result.map(NodeDef.getUuid)
  }, Objects.isEqual)

export const useDependentEnumeratedEntityDefs = ({ nodeDef }) =>
  useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    return Surveys.getDependentEnumeratedEntityDefs({ survey, nodeDef })
  })

const _getNodeValueString = ({ nodeDef, node, lang }) => {
  if (NodeDef.isCode(nodeDef)) {
    const categoryItem = NodeRefData.getCategoryItem(node)
    return categoryItem ? CategoryItem.getLabel(lang)(categoryItem) : ''
  }
  if (NodeDef.isTaxon(nodeDef)) {
    const taxon = NodeRefData.getTaxon(node)
    return taxon ? Taxon.getCode(taxon) : ''
  }
  return Node.getValue(node, '')
}

export const useNodeKeysLabelValues = (nodeDef, nodeEntities) =>
  useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const lang = SurveyState.getSurveyPreferredLang(state)
    const record = RecordState.getRecord(state)
    const nodeDefKeys = Survey.getNodeDefKeys(nodeDef)(survey)

    const getNodeDefKeyLabelValue = (nodeEntity) => (nodeDefKey) => {
      const label = NodeDef.getLabel(nodeDefKey, lang)
      const nodeKey = Record.getNodeChildByDefUuid(nodeEntity, NodeDef.getUuid(nodeDefKey))(record)
      const value = _getNodeValueString({ nodeDef: nodeDefKey, node: nodeKey, lang })
      return `${label}: ${value}`
    }

    return nodeEntities.map((nodeEntity) => nodeDefKeys.map(getNodeDefKeyLabelValue(nodeEntity)).join(', '))
  })

export const useNodeKeyLabelValues = (nodeDef, nodeEntity) => useNodeKeysLabelValues(nodeDef, [nodeEntity])
