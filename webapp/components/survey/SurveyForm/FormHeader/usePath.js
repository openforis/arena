import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useNodeDefLabelType, useNodeDefPage, usePagesUuidMap } from '@webapp/store/ui/surveyForm'
import { useRecord } from '@webapp/store/ui/record'

const getNodeValue = (nodeDef, node) => {
  if (NodeDef.isCode(nodeDef)) {
    const categoryItem = NodeRefData.getCategoryItem(node)
    return CategoryItem.getCode(categoryItem)
  }
  if (NodeDef.isTaxon(nodeDef)) {
    const taxon = NodeRefData.getTaxon(node)
    return Taxon.getCode(taxon)
  }
  return Node.getValue(node, null)
}

export const usePath = (entry) => {
  const survey = useSurvey()
  let nodeDefCurrent = useNodeDefPage()
  const pagesUuidMap = usePagesUuidMap()
  const lang = useSurveyPreferredLang()
  const labelType = useNodeDefLabelType()
  const record = useRecord()

  const labels = []
  while (nodeDefCurrent) {
    let label = NodeDef.getLabel(nodeDefCurrent, lang, labelType)

    // get page node
    const nodeDefUuidCurrent = NodeDef.getUuid(nodeDefCurrent)
    const nodeUuidCurrent = pagesUuidMap[nodeDefUuidCurrent]

    if (entry && record) {
      // if entry mode add node key values
      const nodeCurrent = NodeDef.isSingle(nodeDefCurrent)
        ? Record.getNodesByDefUuid(nodeDefUuidCurrent)(record)[0]
        : Record.getNodeByUuid(nodeUuidCurrent)(record)

      if (nodeCurrent) {
        const nodeDefKeys = Survey.getNodeDefKeys(nodeDefCurrent)(survey)
        const keys = nodeDefKeys.map((nodeDefKey) => {
          const nodeKeys = Record.getNodeChildrenByDefUuid(nodeCurrent, NodeDef.getUuid(nodeDefKey))(record)
          return nodeKeys.map((nodeKey) => getNodeValue(nodeDefKey, nodeKey))
        })
        label += `[${keys.flat().join(', ')}]`
      }
    }
    labels.unshift(label)

    nodeDefCurrent = Survey.getNodeDefParent(nodeDefCurrent)(survey)
  }
  return labels.join(' &#8594; ')
}
