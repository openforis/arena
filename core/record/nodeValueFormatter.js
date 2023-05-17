import { NodeValueFormatter as CoreNodeValueFormatter } from '@openforis/arena-core'

const format = ({ survey, nodeDef, value, showLabel = false, lang = null }) =>
  CoreNodeValueFormatter.format({ survey, nodeDef, value, showLabel, lang })

export const NodeValueFormatter = {
  format,
}
