import { NodeValueFormatter as CoreNodeValueFormatter, Objects, Records, Surveys } from '@openforis/arena-core'
import * as Node from '@core/record/node'

const format = ({ survey, nodeDef, value, showLabel = false, lang = null }) => {
  const valueFormatted = CoreNodeValueFormatter.format({ survey, nodeDef, value, showLabel, lang })
  if (Objects.isEmpty(valueFormatted)) {
    return Objects.isEmpty(value) ? null : String(value)
  }
  return valueFormatted
}

const getFormattedRecordKeys = ({ survey, record, lang = null, showLabel = false }) => {
  const root = Records.getRoot(record)
  const keyNodes = Records.getEntityKeyNodes({ survey, record, entity: root })
  const formattedKeyValues = keyNodes.map((keyNode) => {
    const keyNodeDef = Surveys.getNodeDefByUuid({ survey, uuid: Node.getNodeDefUuid(keyNode) })
    return NodeValueFormatter.format({
      survey,
      nodeDef: keyNodeDef,
      value: Node.getValue(keyNode),
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
