import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import { useSurvey, useSurveyLang } from '@webapp/store/survey'
import { useNodeDefLabelType, useNodeDefPage, usePagesUuidMap } from '@webapp/store/ui/surveyForm'
import { useRecord } from '@webapp/store/ui/record'

export const usePath = (entry) => {
  const survey = useSurvey()
  let nodeDefCurrent = useNodeDefPage()
  const pagesUuidMap = usePagesUuidMap()
  const lang = useSurveyLang()
  const labelType = useNodeDefLabelType()
  const record = useRecord()

  const labels = []
  while (nodeDefCurrent) {
    let label = NodeDef.getLabel(nodeDefCurrent, lang, labelType)

    // get page node
    const nodeDefUuidCurrent = NodeDef.getUuid(nodeDefCurrent)
    const nodeUuidCurrent = pagesUuidMap[nodeDefUuidCurrent]
    const nodeCurrent = NodeDef.isSingle(nodeDefCurrent)
      ? Record.getNodesByDefUuid(nodeDefUuidCurrent)(record)[0]
      : Record.getNodeByUuid(nodeUuidCurrent)(record)

    // if entry mode add node key values
    if (entry && nodeCurrent) {
      const nodeDefKeys = Survey.getNodeDefKeys(nodeDefCurrent)(survey)
      const keys = nodeDefKeys.map((nodeDefKey) => {
        const nodeKeys = Record.getNodeChildrenByDefUuid(nodeCurrent, NodeDef.getUuid(nodeDefKey))(record)
        return nodeKeys.map((nodeKey) => Node.getValue(nodeKey, null))
      })
      label += `[${keys.flat().join(', ')}]`
    }

    labels.unshift(label)

    nodeDefCurrent = Survey.getNodeDefParent(nodeDefCurrent)(survey)
  }
  return labels.join(' &#8594; ')
}
