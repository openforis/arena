import { NodeValueFormatter as CoreNodeValueFormatter, Objects, Records, Surveys } from '@openforis/arena-core'
import * as Node from '@core/record/node'

/**
 * Converts a value that could not be formatted to a string (objects as JSON, not as '[object Object]').
 * @param {unknown} value - The value (not empty).
 * @returns {string} - The value as string.
 */
const _valueToString = (value) => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

/**
 * Formats a node value (falling back to its string conversion).
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {string} [params.cycle] - The survey cycle (used only when showing code labels).
 * @param {object} params.nodeDef - The node definition.
 * @param {unknown} params.value - The value to format.
 * @param {object} [params.node] - The node.
 * @param {boolean} [params.showLabel] - True to show the label of codes and taxa.
 * @param {string} [params.lang] - The language of the labels.
 * @returns {string|null} - The formatted value.
 */
const format = ({ survey, cycle = undefined, nodeDef, value, node = null, showLabel = false, lang = null }) => {
  const valueFormatted = CoreNodeValueFormatter.format({ survey, cycle, nodeDef, node, value, showLabel, lang })
  if (Objects.isEmpty(valueFormatted)) {
    return Objects.isEmpty(value) ? null : _valueToString(value)
  }
  return valueFormatted
}

const getFormattedRecordKeys = ({ survey, cycle, record, lang = null, showLabel = false }) => {
  const root = Records.getRoot(record)
  const keyNodes = Records.getEntityKeyNodes(survey, root)(record)
  const formattedKeyValues = keyNodes.map((node) => {
    const keyNodeDef = Surveys.findNodeDefByUuid({ survey, uuid: Node.getNodeDefUuid(node) })
    return keyNodeDef
      ? NodeValueFormatter.format({
          survey,
          cycle,
          nodeDef: keyNodeDef,
          node,
          value: Node.getValue(node),
          showLabel,
          lang,
        })
      : '---'
  })
  return formattedKeyValues
}

export const NodeValueFormatter = {
  format,
  getFormattedRecordKeys,
}
