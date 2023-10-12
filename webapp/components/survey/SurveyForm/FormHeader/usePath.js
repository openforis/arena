import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useNodeDefLabelType, useNodeDefPage, usePagesUuidMap } from '@webapp/store/ui/surveyForm'
import { useRecord } from '@webapp/store/ui/record'

const getNodeValue = ({ survey, cycle, nodeDef, node, lang }) => {
  if (Node.isValueBlank(node)) return null

  if (NodeDef.isCode(nodeDef)) {
    const categoryItem =
      NodeRefData.getCategoryItem(node) ?? Survey.getCategoryItemByUuid(Node.getCategoryItemUuid(node))(survey)
    if (!categoryItem) return null

    const result = NodeDefLayout.isCodeShown(cycle)(nodeDef)
      ? CategoryItem.getLabelWithCode(lang)(categoryItem)
      : CategoryItem.getLabel(lang)(categoryItem)
    return result ?? CategoryItem.getCode(categoryItem)
  }
  if (NodeDef.isTaxon(nodeDef)) {
    const taxon = NodeRefData.getTaxon(node)
    return Taxon.getCode(taxon)
  }
  const value = Node.getValue(node, null)
  if (NodeDef.isText(nodeDef)) {
    // wrap text values in quotes
    return `'${value}'`
  }
  return value
}

export const usePath = (entry) => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  let nodeDefCurrent = useNodeDefPage()
  const pagesUuidMap = usePagesUuidMap()
  const lang = useSurveyPreferredLang()
  const labelType = useNodeDefLabelType()
  const record = useRecord()

  const labels = []
  while (nodeDefCurrent) {
    let label = NodeDef.getLabel(nodeDefCurrent, lang, labelType)

    if (entry && record && (NodeDef.isRoot(nodeDefCurrent) || NodeDef.isMultipleEntity(nodeDefCurrent))) {
      // get page node
      const nodeDefUuidCurrent = NodeDef.getUuid(nodeDefCurrent)
      const nodeUuidCurrent = pagesUuidMap[nodeDefUuidCurrent]

      // if entry mode add node key values
      const nodeCurrent = NodeDef.isSingle(nodeDefCurrent)
        ? Record.getNodesByDefUuid(nodeDefUuidCurrent)(record)[0]
        : Record.getNodeByUuid(nodeUuidCurrent)(record)

      if (nodeCurrent) {
        const nodeDefKeys = Survey.getNodeDefKeysSorted({ nodeDef: nodeDefCurrent, cycle })(survey)
        const keys = nodeDefKeys.map((nodeDefKey) => {
          const nodeKeys = Record.getNodeChildrenByDefUuid(nodeCurrent, NodeDef.getUuid(nodeDefKey))(record)
          return nodeKeys.map((nodeKey) => getNodeValue({ survey, cycle, nodeDef: nodeDefKey, node: nodeKey, lang }))
        })
        label += ` [${keys.flat().join(', ')}]`
      }
    }
    labels.unshift(label)

    nodeDefCurrent = Survey.getNodeDefParent(nodeDefCurrent)(survey)
  }
  return labels.join(' &#8594; ')
}
