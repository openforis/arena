import { NodeValueFormatter as CoreNodeValueFormatter, Objects } from '@openforis/arena-core'

const format = ({ survey, nodeDef, value, showLabel = false, lang = null }) => {
  const valueFormatted = CoreNodeValueFormatter.format({ survey, nodeDef, value, showLabel, lang })
  if (Objects.isEmpty(valueFormatted)) {
    return Objects.isEmpty(value) ? null : String(value)
  }
  return valueFormatted
}

export const NodeValueFormatter = {
  format,
}
