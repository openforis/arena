import { RecordNodeValueFormatter as CoreNodeValueFormatter, Objects, Records, Surveys } from '@openforis/arena-core'
import type {
  ArenaRecord,
  ArenaRecordNode,
  LanguageCode,
  ArenaNodeDef,
  NodeDefType,
  ArenaSurvey,
} from '@openforis/arena-core'

import * as Node from '@core/record/node'

/**
 * Converts a value that could not be formatted to a string (objects as JSON, not as '[object Object]').
 * @param value - The value (not empty).
 * @returns The value as string.
 */
const _valueToString = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

type FormatParams = {
  survey: ArenaSurvey
  cycle?: string
  nodeDef: ArenaNodeDef<NodeDefType>
  value: unknown
  node?: ArenaRecordNode | null
  showLabel?: boolean
  lang?: string | null
}

/**
 * Formats a node value (falling back to its string conversion).
 * @param params - The parameters.
 * @param params.survey - The survey.
 * @param params.cycle - The survey cycle (used only when showing code labels).
 * @param params.nodeDef - The node definition.
 * @param params.value - The value to format.
 * @param params.node - The node.
 * @param params.showLabel - True to show the label of codes and taxa.
 * @param params.lang - The language of the labels.
 * @returns The formatted value.
 */
const format = ({
  survey,
  cycle = undefined,
  nodeDef,
  value,
  node = null,
  showLabel = false,
  lang = null,
}: FormatParams): string | null => {
  // lang is a language code string (e.g. i18n.language)
  const valueFormatted = CoreNodeValueFormatter.format({
    survey,
    cycle,
    nodeDef,
    node,
    value,
    showLabel,
    lang: lang as LanguageCode,
  })
  if (Objects.isEmpty(valueFormatted)) {
    return Objects.isEmpty(value) ? null : _valueToString(value)
  }
  return valueFormatted
}

const getFormattedRecordKeys = ({
  survey,
  cycle,
  record,
  lang = null,
  showLabel = false,
}: {
  survey: ArenaSurvey
  cycle?: string
  record: ArenaRecord
  lang?: string | null
  showLabel?: boolean
}): (string | null)[] => {
  const root = Records.getRoot(record)
  const keyNodes = Records.getEntityKeyNodes(survey, root)(record)
  return keyNodes.map((node) => {
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
}

export const NodeValueFormatter = {
  format,
  getFormattedRecordKeys,
}
