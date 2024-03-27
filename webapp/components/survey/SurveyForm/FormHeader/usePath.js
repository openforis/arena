import { NodeValueFormatter } from '@openforis/arena-core'

import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useRecord } from '@webapp/store/ui/record'
import { useNodeDefLabelType, useNodeDefPage, usePagesUuidMap } from '@webapp/store/ui/surveyForm'

const getNodeValue = ({ survey, cycle, nodeDef, node, lang }) =>
  NodeValueFormatter.format({
    survey,
    cycle,
    nodeDef,
    node,
    value: Node.getValue(node),
    showLabel: true,
    quoteLabels: true,
    lang,
  })

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
