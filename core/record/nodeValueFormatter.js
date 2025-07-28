import { NodeValueFormatter as CoreNodeValueFormatter, Objects, Records, Surveys } from '@openforis/arena-core'
import * as Node from '@core/record/node'

const format = ({ survey, cycle, nodeDef, value, node = null, showLabel = false, lang = null }) => {
  const valueFormatted = CoreNodeValueFormatter.format({ survey, cycle, nodeDef, node, value, showLabel, lang })
  if (Objects.isEmpty(valueFormatted)) {
    return Objects.isEmpty(value) ? null : String(value)
  }
  return valueFormatted
}

const getFormattedRecordKeys = ({ survey, cycle, record, lang = null, showLabel = false }) => {
  const root = Records.getRoot(record)
  const keyNodes = Records.getEntityKeyNodes({ survey, record, entity: root })
  const formattedKeyValues = keyNodes.map((node) => {
    const keyNodeDef = Surveys.getNodeDefByUuid({ survey, uuid: Node.getNodeDefUuid(node) })
    return NodeValueFormatter.format({
      survey,
      cycle,
      nodeDef: keyNodeDef,
      node,
      value: Node.getValue(node),
      showLabel,
      lang,
    })
  })
  return formattedKeyValues
}

export const NodeValueFormatter = {
  format,
  getFormattedRecordKeys,
}
